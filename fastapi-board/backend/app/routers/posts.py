from fastapi import APIRouter, Depends
from app.database import get_db
from app.schemas import PostCreate, PostResponse

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(post: PostCreate, pool=Depends(get_db)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *",
            post.title,
            post.content,
        )
    return dict(row)


@router.get("", response_model=list[PostResponse])
async def list_posts(pool=Depends(get_db)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM posts ORDER BY created_at DESC"
        )
    return [dict(row) for row in rows]
