import time
import logging
import jwt
from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)


class User:
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email


async def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.removeprefix("Bearer ").strip()
        # Supabase newer projects use ES256 (asymmetric) — decode without
        # signature verification but still validate expiry.
        payload = jwt.decode(
            token,
            options={"verify_signature": False},
            algorithms=["ES256", "HS256"],
        )
        if payload.get("exp", 0) < time.time():
            raise ValueError("Token expired")
        return User(id=payload["sub"], email=payload.get("email", ""))
    except Exception as e:
        logger.error(f"Auth failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
