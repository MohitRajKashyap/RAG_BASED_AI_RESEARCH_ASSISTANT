import logging
import os
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.user import User
from app.rag.chain import generate_summary
from app.rag.chunker import chunk_documents
from app.rag.document_loader import load_document
from app.rag.vector_store import UserVectorStore
from app.utils.file_utils import save_upload

logger = logging.getLogger(__name__)


async def process_upload(db: Session, user: User, file: UploadFile) -> Document:
    file_path, stored_name, size = await save_upload(file, user.id)
    ext = Path(file.filename or "").suffix.lower()

    doc = Document(
        user_id=user.id,
        filename=stored_name,
        original_name=file.filename or stored_name,
        file_type=ext.lstrip("."),
        file_size=size,
        file_path=file_path,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        api_key = user.openai_api_key
        raw_docs = load_document(file_path, ext)
        if not raw_docs:
            doc.status = "failed"
            db.commit()
            return doc

        chunks = chunk_documents(raw_docs)
        vector_store = UserVectorStore(user.id, api_key)
        count = vector_store.add_documents(chunks, doc.id, doc.original_name)

        doc.chunk_count = count
        doc.status = "ready"
        combined = " ".join(d.page_content for d in raw_docs[:3])
        try:
            doc.summary = generate_summary(combined, api_key)
        except Exception as e:
            logger.warning("Summary generation failed: %s", e)

        db.commit()
        db.refresh(doc)
    except Exception as e:
        logger.exception("Document processing failed: %s", e)
        doc.status = "failed"
        db.commit()

    return doc


def delete_document(db: Session, user: User, document_id: int) -> bool:
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user.id).first()
    if not doc:
        return False
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    UserVectorStore(user.id, user.openai_api_key).delete_document(doc.id)
    db.delete(doc)
    db.commit()
    return True
