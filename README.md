# RAG-Based AI Research Assistant

A production-style full-stack application for uploading research documents (PDF, DOCX, TXT), performing semantic search with FAISS, and chatting with GPT-4o using citation-backed answers.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, ShadCN-style UI, React Query, Axios |
| Backend | FastAPI, LangChain, FAISS, SQLAlchemy, OpenAI |
| Database | PostgreSQL (users, chats, documents metadata) |
| Vector DB | FAISS (per-user indexes) |
| Deployment | Docker Compose, Nginx |

## Features

- JWT authentication (register / login)
- PDF, DOCX, TXT upload with drag-and-drop
- Intelligent chunking and OpenAI embeddings
- RAG chat with **streaming** responses
- **Citation cards** with document name, page, and chunk preview
- Chat history persisted in PostgreSQL
- Document library with summaries
- Settings: personal OpenAI API key, clear vector store
- Dark mode, responsive UI

## Project Structure

```
rag/
├── frontend/          # Next.js 14 app
├── backend/           # FastAPI + LangChain RAG
├── nginx/             # Reverse proxy config
└── docker-compose.yml
```

## Quick Start (Docker)

1. **Clone and configure environment**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY and OPENAI_API_KEY
```

2. **Start all services**

```bash
docker compose up --build
```

3. **Open the app**

- App (via Nginx): http://localhost
- Frontend direct: http://localhost:3000
- API docs: http://localhost:8000/docs

## Local Development

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Start PostgreSQL locally or use Docker for postgres only
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` in `.env.local`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/documents/upload` | Upload files (multipart) |
| GET | `/api/documents` | List documents |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/chat` | Stream RAG chat (SSE) |
| GET | `/api/history` | List chats |
| GET | `/api/history/{id}` | Get chat with messages |
| DELETE | `/api/history/{id}` | Delete chat |
| GET/PUT | `/api/settings` | User settings |
| DELETE | `/api/settings/vector-store` | Clear FAISS index |

Interactive docs: `http://localhost:8000/docs`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Default: `gpt-4o` |
| `OPENAI_EMBEDDING_MODEL` | Default: `text-embedding-3-small` |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | RAG chunking |
| `TOP_K` | Retrieved chunks per query |
| `CORS_ORIGINS` | Comma-separated frontend URLs |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

## Database Schema

- **users** — email, hashed password, optional OpenAI key
- **documents** — file metadata, chunk count, status, summary
- **chats** — conversation threads per user
- **messages** — role, content, citations (JSONB)

Tables are created automatically on backend startup.

## RAG Pipeline

1. Parse PDF (pdfplumber/PyPDF2), DOCX (python-docx), or TXT
2. Split with `RecursiveCharacterTextSplitter`
3. Embed with OpenAI `text-embedding-3-small`
4. Store in per-user FAISS index with metadata (document_id, page, chunk_index)
5. On chat: similarity search → top-k chunks → GPT-4o with citation prompt → SSE stream

## License

MIT — built for portfolio and learning purposes.
