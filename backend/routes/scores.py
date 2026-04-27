from typing import Any, Optional

from fastapi import APIRouter, Body, Query
from fastapi.responses import JSONResponse

from controllers.scoresController import list_scores, upsert_score

router = APIRouter()


@router.post("/upsert")
async def upsert_score_route(payload: dict[str, Any] | None = Body(default=None)):
    result = await upsert_score(payload)
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result


@router.get("")
async def list_scores_route(
    userEmail: Optional[str] = Query(default=None),
    gameMode: Optional[str] = Query(default=None),
):
    result = await list_scores(userEmail, gameMode)
    if isinstance(result, tuple):
        body, status = result
        return JSONResponse(status_code=status, content=body)
    return result
