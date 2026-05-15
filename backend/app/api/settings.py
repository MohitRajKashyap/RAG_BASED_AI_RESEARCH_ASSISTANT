from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.rag.vector_store import UserVectorStore
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=SettingsResponse)
def get_user_settings(current_user: User = Depends(get_current_user)):
    settings = get_settings()
    return SettingsResponse(
        openai_api_key_set=bool(current_user.openai_api_key or settings.OPENAI_API_KEY),
        model=settings.OPENAI_MODEL,
        embedding_model=settings.OPENAI_EMBEDDING_MODEL,
    )


@router.put("", response_model=SettingsResponse)
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.openai_api_key is not None:
        current_user.openai_api_key = data.openai_api_key or None
        db.commit()
    settings = get_settings()
    return SettingsResponse(
        openai_api_key_set=bool(current_user.openai_api_key or settings.OPENAI_API_KEY),
        model=settings.OPENAI_MODEL,
        embedding_model=settings.OPENAI_EMBEDDING_MODEL,
    )


@router.delete("/vector-store", status_code=status.HTTP_204_NO_CONTENT)
def clear_vector_store(current_user: User = Depends(get_current_user)):
    UserVectorStore(current_user.id, current_user.openai_api_key).clear()
