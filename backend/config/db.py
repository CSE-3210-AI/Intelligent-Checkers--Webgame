from typing import Optional
import asyncpg

from config.env import DATABASE_URL

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        if not DATABASE_URL:
            raise RuntimeError("Missing DATABASE_URL in environment variables.")

        _pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            ssl="require",
        )
    return _pool
