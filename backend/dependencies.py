import os
import logging
import jwt
from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")


class User:
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email


async def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.removeprefix("Bearer ").strip()
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return User(id=payload["sub"], email=payload.get("email", ""))
    except Exception as e:
        logger.error(f"Auth failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
