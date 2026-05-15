import json
import logging
from typing import AsyncGenerator, List, Optional

from langchain_core.documents import Document
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.schemas.chat import Citation

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert AI research assistant. Answer questions using ONLY the provided context.
If the context does not contain enough information, say so clearly.
Always cite sources using [1], [2] notation matching the source numbers provided.
Be concise, accurate, and well-structured. Use markdown for formatting when helpful."""


def build_context(docs: List[tuple[Document, float]]) -> tuple[str, List[Citation]]:
    citations: List[Citation] = []
    parts: List[str] = []
    for i, (doc, score) in enumerate(docs, 1):
        meta = doc.metadata
        citation = Citation(
            document_id=meta.get("document_id", 0),
            document_name=meta.get("document_name", "Unknown"),
            chunk_index=meta.get("chunk_index", 0),
            page=meta.get("page"),
            content=doc.page_content[:500],
            score=round(score, 4),
        )
        citations.append(citation)
        page_info = f", page {meta.get('page')}" if meta.get("page") else ""
        parts.append(
            f"[{i}] Source: {citation.document_name}{page_info}\n{citation.content}"
        )
    return "\n\n---\n\n".join(parts), citations


def get_llm(api_key: str | None = None, streaming: bool = True) -> ChatOpenAI:
    settings = get_settings()
    key = api_key or settings.OPENAI_API_KEY
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        openai_api_key=key,
        temperature=0.2,
        streaming=streaming,
    )


async def stream_rag_response(
    query: str,
    context_docs: List[tuple[Document, float]],
    chat_history: List[dict],
    api_key: str | None = None,
) -> AsyncGenerator[str, None]:
    context, citations = build_context(context_docs)
    llm = get_llm(api_key, streaming=True)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]
    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append(
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {query}",
        }
    )

    # Send citations first as metadata event
    yield f"data: {json.dumps({'type': 'citations', 'citations': [c.model_dump() for c in citations]})}\n\n"

    async for chunk in llm.astream(messages):
        content = chunk.content if hasattr(chunk, "content") else str(chunk)
        if content:
            yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


def generate_summary(text: str, api_key: str | None = None) -> str:
    settings = get_settings()
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        openai_api_key=api_key or settings.OPENAI_API_KEY,
        temperature=0.3,
    )
    prompt = f"Summarize the following document in 2-3 sentences:\n\n{text[:4000]}"
    response = llm.invoke(prompt)
    return response.content if hasattr(response, "content") else str(response)
