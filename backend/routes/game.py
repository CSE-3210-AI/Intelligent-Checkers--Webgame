"""
game.py – FastAPI router for /api/game endpoints.
"""

from typing import Any

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from controllers.gameController import (
    getStateHandler,
    initGame,
    legalMovesHandler,
    makeMoveHandler,
)

router = APIRouter()


@router.post("/init")
async def init_game_route(_payload: dict[str, Any] | None = Body(default=None)):
    result = await initGame()
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result


@router.post("/legal-moves")
async def legal_moves_route(payload: dict[str, Any] | None = Body(default=None)):
    result = await legalMovesHandler(payload)
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result


@router.post("/move")
async def move_route(payload: dict[str, Any] | None = Body(default=None)):
    result = await makeMoveHandler(payload)
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result


@router.get("/state")
async def state_route():
    result = await getStateHandler()
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result
