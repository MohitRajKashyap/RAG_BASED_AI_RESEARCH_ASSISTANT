import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.chat import Chat, Message
from app.models.user import User
from app.rag.chain import stream_rag_response
from app.schemas.chat import ChatRequest, ChatResponse, MessageResponse
from app.services.chat_service import (
    get_chat_history,
    get_or_create_chat,
    retrieve_context,
    save_message,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("")
async def chat_stream(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = get_settings()
    api_key = current_user.openai_api_key or settings.OPENAI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OpenAI API key required. Set in settings or environment.",
        )

    chat = get_or_create_chat(db, current_user, request.chat_id, request.message)
    save_message(db, chat, "user", request.message)

    context_docs = retrieve_context(current_user, request.message, request.document_ids)
    history = get_chat_history(db, chat)

    async def event_generator():
        full_response = ""
        citations_data = None
        try:
            async for event in stream_rag_response(
                request.message, context_docs, history, api_key
            ):
                yield event
                if event.startswith("data: "):
                    payload = json.loads(event[6:].strip())
                    if payload.get("type") == "token":
                        full_response += payload.get("content", "")
                    elif payload.get("type") == "citations":
                        citations_data = payload.get("citations")
        except Exception as e:
            logger.exception("Streaming error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            return

        if full_response:
            save_message(db, chat, "assistant", full_response, citations_data)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat
