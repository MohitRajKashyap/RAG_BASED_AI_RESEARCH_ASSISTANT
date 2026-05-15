from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class Citation(BaseModel):
    document_id: int
    document_name: str
    chunk_index: int
    page: Optional[int] = None
    content: str
    score: float


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    chat_id: Optional[int] = None
    document_ids: Optional[list[int]] = None


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    citations: Optional[list[Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ChatListItem(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatListResponse(BaseModel):
    chats: list[ChatListItem]
    total: int
