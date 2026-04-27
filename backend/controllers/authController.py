from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field, ValidationError
from starlette.concurrency import run_in_threadpool

from config.supabase import supabase_admin


class SignupRequest(BaseModel):
    username: str = Field(min_length=3)
    email: EmailStr
    password: str = Field(min_length=6)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


def _validation_error(message: str, path: str, value: Any) -> dict[str, Any]:
    return {
        "type": "field",
        "value": value,
        "msg": message,
        "path": path,
        "location": "body",
    }


def _extract_user(auth_response: Any):
    if hasattr(auth_response, "user"):
        return auth_response.user
    if isinstance(auth_response, dict):
        return auth_response.get("user")
    return None


def _extract_session(auth_response: Any):
    if hasattr(auth_response, "session"):
        return auth_response.session
    if isinstance(auth_response, dict):
        return auth_response.get("session")
    return None


def _safe_get(obj: Any, key: str, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


async def signup(payload: SignupRequest | dict[str, Any] | None = None):
    if payload is None:
        return {"errors": [_validation_error("Invalid value", "body", None)]}, 400

    if not isinstance(payload, SignupRequest):
        try:
            payload = SignupRequest.model_validate(payload)
        except ValidationError as exc:
            errors = []
            for err in exc.errors():
                loc = err.get("loc", ["body"])
                path = str(loc[-1])
                errors.append(_validation_error(err.get("msg", "Invalid value"), path, None))
            return {"errors": errors}, 400

    username = payload.username
    email = str(payload.email)
    password = payload.password

    try:
        result = await run_in_threadpool(
            lambda: supabase_admin.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "user_metadata": {"username": username},
                    "email_confirm": True,
                }
            )
        )

        error = _safe_get(result, "error")
        if error:
            status = _safe_get(error, "status", 400)
            message = _safe_get(error, "message", "Unknown error")
            return {"error": message}, status

        data = _safe_get(result, "data", result)
        user = _extract_user(data)

        return {
            "user": {
                "id": _safe_get(user, "id"),
                "email": _safe_get(user, "email"),
                "username": _safe_get(_safe_get(user, "user_metadata", {}), "username"),
                "created_at": _safe_get(user, "created_at"),
            }
        }
    except Exception as exc:
        import traceback
        error_msg = str(exc)
        tb = traceback.format_exc()
        print(f"Signup error: {error_msg}\n{tb}", flush=True)
        return {"error": f"Server error: {error_msg[:100]}"}, 500


async def signin(payload: SigninRequest | dict[str, Any] | None = None):
    if payload is None:
        return {"errors": [_validation_error("Invalid value", "body", None)]}, 400

    if not isinstance(payload, SigninRequest):
        try:
            payload = SigninRequest.model_validate(payload)
        except ValidationError as exc:
            errors = []
            for err in exc.errors():
                loc = err.get("loc", ["body"])
                path = str(loc[-1])
                errors.append(_validation_error(err.get("msg", "Invalid value"), path, None))
            return {"errors": errors}, 400

    email = str(payload.email)
    password = payload.password

    try:
        result = await run_in_threadpool(
            lambda: supabase_admin.auth.sign_in_with_password(
                {
                    "email": email,
                    "password": password,
                }
            )
        )

        error = _safe_get(result, "error")
        if error:
            return {"error": _safe_get(error, "message", "Unauthorized")}, 401

        data = _safe_get(result, "data", result)
        user = _extract_user(data)
        session = _extract_session(data)

        username = _safe_get(_safe_get(user, "user_metadata", {}), "username") or _safe_get(user, "email")

        return {
            "user": {
                "id": _safe_get(user, "id"),
                "email": _safe_get(user, "email"),
                "username": username,
                "created_at": _safe_get(user, "created_at"),
            },
            "session": session,
        }
    except Exception:
        return {"error": "Server error"}, 500
