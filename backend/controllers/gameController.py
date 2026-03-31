"""
gameController.py – FastAPI route handlers for /api/game.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, ValidationError

from game.board import initializeBoard
from game.gameState import executeTurn
from game.moveGenerator import getLegalMoves
from services.agentAdiba.agent_adiba import get_agent_adiba_move
from services.agentMegha.agent_megha import get_agent_megha_move
from services.externalAgent.external_agent import ExternalAgent


class LegalMovesRequest(BaseModel):
    board: list[list[Any | None]]
    player: str


class MoveModel(BaseModel):
    from_: list[int] = Field(alias="from")
    to: list[list[int]]
    isJump: bool
    captures: list[list[int]] = Field(default_factory=list)


class CapturesModel(BaseModel):
    blue: int = 0
    red: int = 0


class MoveRequest(BaseModel):
    board: list[list[Any | None]]
    move: MoveModel
    currentPlayer: str
    captures: CapturesModel = Field(default_factory=CapturesModel)
    moveCount: int = 0


class AgentAdibaRequest(BaseModel):
    board: list[list[Any | None]]
    player: str = "red"


class AgentMeghaRequest(BaseModel):
    board: list[list[Any | None]]
    player: str = "red"


class ExternalAgentRequest(BaseModel):
    board: list[list[Any | None]]
    player: str = "red"


_external_agent = ExternalAgent()


async def initGame():
    try:
        board = initializeBoard()
        return {
            "board": board,
            "currentPlayer": "blue",
            "moveCount": 0,
            "captures": {"blue": 0, "red": 0},
            "winner": None,
        }
    except Exception as err:
        return {"error": str(err)}, 500


async def legalMovesHandler(payload: LegalMovesRequest | dict[str, Any]):
    try:
        if not isinstance(payload, LegalMovesRequest):
            try:
                payload = LegalMovesRequest.model_validate(payload)
            except ValidationError:
                return {"error": '"board" and "player" are required.'}, 400

        board = payload.board
        player = payload.player
        if not board or not player:
            return {"error": '"board" and "player" are required.'}, 400

        moves = getLegalMoves(board, player)

        destination_map: dict[str, list[list[int]]] = {}
        for m in moves:
            from_key = f"{m['from'][0]},{m['from'][1]}"
            dest = m["to"][0]
            if from_key not in destination_map:
                destination_map[from_key] = []
            if not any(d[0] == dest[0] and d[1] == dest[1] for d in destination_map[from_key]):
                destination_map[from_key].append(dest)

        moveable_squares = list({f"{m['from'][0]},{m['from'][1]}" for m in moves})

        return {
            "moves": moves,
            "destinationMap": destination_map,
            "moveableSquares": moveable_squares,
        }
    except Exception as err:
        return {"error": str(err)}, 500


async def makeMoveHandler(payload: MoveRequest | dict[str, Any]):
    try:
        if not isinstance(payload, MoveRequest):
            try:
                payload = MoveRequest.model_validate(payload)
            except ValidationError:
                return {"error": '"board", "move", and "currentPlayer" are required.'}, 400

        board = payload.board
        move = {
            "from": payload.move.from_,
            "to": payload.move.to,
            "isJump": payload.move.isJump,
            "captures": payload.move.captures,
        }
        current_player = payload.currentPlayer
        captures = {"blue": payload.captures.blue, "red": payload.captures.red}
        move_count = payload.moveCount

        if not board or not move or not current_player:
            return {"error": '"board", "move", and "currentPlayer" are required.'}, 400

        result = executeTurn(board, move, current_player)

        new_captures = {
            "blue": captures["blue"] + (result["captureCount"] if current_player == "blue" else 0),
            "red": captures["red"] + (result["captureCount"] if current_player == "red" else 0),
        }

        return {
            "board": result["newBoard"],
            "currentPlayer": result["nextPlayer"],
            "winner": result["winner"],
            "captures": new_captures,
            "captureCount": result["captureCount"],
            "moveCount": move_count + 1,
        }
    except Exception as err:
        return {"error": str(err)}, 500


async def getStateHandler():
    return {
        "engine": "checkers-game-engine",
        "version": "1.0.0",
        "endpoints": {
            "init": "POST /api/game/init",
            "legalMoves": "POST /api/game/legal-moves",
            "move": "POST /api/game/move",
            "state": "GET  /api/game/state",
        },
        "rules": [
            "Standard American checkers (8×8 board)",
            "Mandatory captures – if a jump exists, only jumps are legal",
            "Multi-jump captures – full chain expanded in one turn",
            "King promotion at back row (row 7 for blue, row 0 for red)",
            "Win: opponent has no pieces OR no legal moves",
        ],
        "aiFunctions": [
            "getLegalMoves(board, player)",
            "applyMove(board, move)",
            "checkWin(board, currentPlayer)",
            "evaluateBoard(board)",
            "getAgentAdibaMove(board, player)",
            "getAgentMeghaMove(board, player)",
        ],
    }


async def getAgentAdibaMove(payload: AgentAdibaRequest | dict[str, Any]):
    try:
        if not isinstance(payload, AgentAdibaRequest):
            try:
                payload = AgentAdibaRequest.model_validate(payload)
            except ValidationError:
                return {"error": '"board" is required and "player" is optional.'}, 400

        board = payload.board
        player = payload.player or "red"

        if not board:
            return {"error": '"board" is required.'}, 400

        if player not in ("blue", "red"):
            return {"error": '"player" must be "blue" or "red".'}, 400

        result = get_agent_adiba_move(board, player)

        return {
            "move": result.get("move"),
            "phase": result.get("phase"),
            "win_probability": result.get("win_probability"),
            "explanation": result.get("explanation"),
        }
    except Exception as err:
        return {"error": str(err)}, 500


async def getAgentMeghaMove(payload: AgentMeghaRequest | dict[str, Any]):
    try:
        if not isinstance(payload, AgentMeghaRequest):
            try:
                payload = AgentMeghaRequest.model_validate(payload)
            except ValidationError:
                return {"error": '"board" is required and "player" is optional.'}, 400

        board = payload.board
        player = payload.player or "red"

        if not board:
            return {"error": '"board" is required.'}, 400

        if player not in ("blue", "red"):
            return {"error": '"player" must be "blue" or "red".'}, 400

        result = get_agent_megha_move(board, player)

        return {
            "move": result.get("move"),
            "phase": result.get("phase"),
            "win_probability": result.get("win_probability"),
            "explanation": result.get("explanation"),
            "searched_depth": result.get("searched_depth"),
        }
    except Exception as err:
        return {"error": str(err)}, 500


async def getExternalAgentMove(payload: ExternalAgentRequest | dict[str, Any]):
    try:
        if not isinstance(payload, ExternalAgentRequest):
            try:
                payload = ExternalAgentRequest.model_validate(payload)
            except ValidationError:
                return {"error": '"board" is required and "player" is optional.'}, 400

        board = payload.board
        player = payload.player or "red"

        if not board:
            return {"error": '"board" is required.'}, 400

        if player not in ("blue", "red"):
            return {"error": '"player" must be "blue" or "red".'}, 400

        move = _external_agent.get_move({"board": board, "currentPlayer": player})
        return {
            "move": move,
            "agent": "external",
        }
    except Exception as err:
        return {"error": str(err)}, 500
