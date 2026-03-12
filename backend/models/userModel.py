from __future__ import annotations

from config.db import get_pool


async def createUser(*, username: str, email: str, hashedPassword: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (username, email, password, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, username, email, created_at
            """,
            username,
            email,
            hashedPassword,
        )
    return dict(row) if row else None


async def findUserByEmail(email: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT * FROM users WHERE email = $1
            """,
            email,
        )
    return dict(row) if row else None
