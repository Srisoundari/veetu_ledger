import time
import json
import base64
import logging
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
_bearer = HTTPBearer()


class User:
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email


def _decode_jwt_payload(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError(f"Malformed JWT: expected 3 parts, got {len(parts)}")
    padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer)):
    try:
        payload = _decode_jwt_payload(creds.credentials)

        exp = payload.get("exp", 0)
        if exp < time.time():
            raise ValueError(f"Token expired at {exp}, now={int(time.time())}")

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Token missing 'sub' claim")

        return User(id=user_id, email=payload.get("email", ""))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail=str(e))
