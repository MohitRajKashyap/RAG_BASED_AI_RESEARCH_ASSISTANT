from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.chat import Chat, Message
from app.models.user import User
from app.rag.vector_store import UserVectorStore


def get_or_create_chat(db: Session, user: User, chat_id: Optional[int], first_message: str) -> Chat:
    if chat_id:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user.id).first()
        if chat:
            return chat
    title = first_message[:60] + ("..." if len(first_message) > 60 else "")
    chat = Chat(user_id=user.id, title=title)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


def save_message(
    db: Session,
    chat: Chat,
    role: str,
    content: str,
    citations: Optional[list] = None,
) -> Message:
    msg = Message(chat_id=chat.id, role=role, content=content, citations=citations)
    db.add(msg)
    chat.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)
    return msg


def get_chat_history(db: Session, chat: Chat, limit: int = 20) -> List[dict]:
    messages = (
        db.query(Message)
        .filter(Message.chat_id == chat.id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in reversed(messages)]


def retrieve_context(
    user: User,
    query: str,
    document_ids: Optional[List[int]] = None,
):
    store = UserVectorStore(user.id, user.openai_api_key)
    return store.similarity_search(query, document_ids=document_ids)
