from typing import Optional

from pydantic import BaseModel, Field


class SettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = Field(default=None, max_length=512)


class SettingsResponse(BaseModel):
    openai_api_key_set: bool
    model: str
    embedding_model: str
