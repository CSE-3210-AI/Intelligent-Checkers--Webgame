from typing import Any

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from controllers.authController import signin, signup

router = APIRouter()


@router.post("/signup")
async def signup_route(payload: dict[str, Any] | None = Body(default=None)):
    result = await signup(payload)
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result


@router.post("/signin")
async def signin_route(payload: dict[str, Any] | None = Body(default=None)):
    result = await signin(payload)
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result
