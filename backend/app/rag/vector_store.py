import json
import logging
import os
from pathlib import Path
from typing import List, Optional

import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.core.config import get_settings
from app.rag.embeddings import get_embeddings

logger = logging.getLogger(__name__)


class UserVectorStore:
    """Per-user FAISS index with metadata persistence."""

    def __init__(self, user_id: int, api_key: str | None = None):
        self.user_id = user_id
        self.api_key = api_key
        settings = get_settings()
        self.base_path = Path(settings.FAISS_INDEX_PATH) / str(user_id)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.index_path = self.base_path / "index.faiss"
        self.pkl_path = self.base_path / "index.pkl"
        self.meta_path = self.base_path / "metadata.json"
        self._store: Optional[FAISS] = None

    def _load_metadata(self) -> dict:
        if self.meta_path.exists():
            with open(self.meta_path, "r") as f:
                return json.load(f)
        return {"documents": {}}

    def _save_metadata(self, meta: dict) -> None:
        with open(self.meta_path, "w") as f:
            json.dump(meta, f, indent=2)

    def load(self) -> FAISS:
        if self._store is not None:
            return self._store
        embeddings = get_embeddings(self.api_key)
        if self.index_path.exists() and self.pkl_path.exists():
            self._store = FAISS.load_local(
                str(self.base_path),
                embeddings,
                allow_dangerous_deserialization=True,
            )
        else:
            index = faiss.IndexFlatL2(len(embeddings.embed_query("test")))
            self._store = FAISS(
                embedding_function=embeddings,
                index=index,
                docstore=InMemoryDocstore({}),
                index_to_docstore_id={},
            )
        return self._store

    def add_documents(
        self,
        chunks: List[Document],
        document_id: int,
        document_name: str,
    ) -> int:
        store = self.load()
        for chunk in chunks:
            chunk.metadata["document_id"] = document_id
            chunk.metadata["document_name"] = document_name
            chunk.metadata["user_id"] = self.user_id

        if store.index.ntotal == 0 and len(chunks) > 0:
            self._store = FAISS.from_documents(chunks, get_embeddings(self.api_key))
        else:
            store.add_documents(chunks)
            self._store = store

        self.save()
        meta = self._load_metadata()
        meta["documents"][str(document_id)] = {
            "name": document_name,
            "chunk_count": len(chunks),
        }
        self._save_metadata(meta)
        return len(chunks)

    def save(self) -> None:
        if self._store:
            self._store.save_local(str(self.base_path))

    def similarity_search(
        self,
        query: str,
        k: int | None = None,
        document_ids: Optional[List[int]] = None,
    ) -> List[tuple[Document, float]]:
        settings = get_settings()
        k = k or settings.TOP_K
        store = self.load()
        if store.index.ntotal == 0:
            return []

        results = store.similarity_search_with_score(query, k=k * 3)
        filtered: List[tuple[Document, float]] = []
        for doc, score in results:
            if document_ids:
                doc_id = doc.metadata.get("document_id")
                if doc_id not in document_ids:
                    continue
            filtered.append((doc, float(score)))
            if len(filtered) >= k:
                break
        return filtered

    def delete_document(self, document_id: int) -> None:
        """Rebuild index excluding document chunks."""
        store = self.load()
        if store.index.ntotal == 0:
            return
        all_docs = list(store.docstore._dict.values())
        remaining = [d for d in all_docs if d.metadata.get("document_id") != document_id]
        meta = self._load_metadata()
        meta["documents"].pop(str(document_id), None)
        self._save_metadata(meta)
        if remaining:
            self._store = FAISS.from_documents(remaining, get_embeddings(self.api_key))
            self.save()
        else:
            self.clear()

    def clear(self) -> None:
        for p in [self.index_path, self.pkl_path, self.meta_path]:
            if p.exists():
                os.remove(p)
        self._store = None
