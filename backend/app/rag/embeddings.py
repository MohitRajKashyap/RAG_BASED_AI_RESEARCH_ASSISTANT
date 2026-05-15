from langchain_openai import OpenAIEmbeddings

from app.core.config import get_settings


def get_embeddings(api_key: str | None = None) -> OpenAIEmbeddings:
    settings = get_settings()
    key = api_key or settings.OPENAI_API_KEY
    if not key:
        raise ValueError("OpenAI API key is required for embeddings")
    return OpenAIEmbeddings(model=settings.OPENAI_EMBEDDING_MODEL, openai_api_key=key)
