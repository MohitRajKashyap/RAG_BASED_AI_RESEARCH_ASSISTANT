import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


def ensure_upload_dir(user_id: int) -> Path:
    settings = get_settings()
    path = Path(settings.UPLOAD_DIR) / str(user_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def validate_upload(file: UploadFile) -> str:
    settings = get_settings()
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename required")
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )
    return ext


async def save_upload(file: UploadFile, user_id: int) -> tuple[str, str, int]:
    ext = validate_upload(file)
    upload_dir = ensure_upload_dir(user_id)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / stored_name
    content = await file.read()
    size = len(content)
    max_bytes = get_settings().MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds {get_settings().MAX_UPLOAD_SIZE_MB}MB limit",
        )
    with open(file_path, "wb") as f:
        f.write(content)
    return str(file_path), stored_name, size
