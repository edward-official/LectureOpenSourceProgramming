# fastapi-board

게시글 생성/목록 기능을 가진 미니멀 게시판 프로젝트.

## 기술 스택

- **Backend**: FastAPI + PostgreSQL (raw SQL via asyncpg)
- **Frontend**: Next.js 14 (App Router) + TailwindCSS + TypeScript
- **Infra**: Docker Compose

## 실행 방법

```bash
docker compose up --build
```

- 프론트엔드: http://localhost:3000
- 백엔드 API 문서: http://localhost:8000/docs

## 로컬 개발

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # 환경변수 설정
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # 환경변수 설정
npm run dev
```

## API

| Method | Endpoint    | Description  |
|--------|-------------|--------------|
| GET    | /api/posts  | 게시글 목록 조회 |
| POST   | /api/posts  | 게시글 생성    |
