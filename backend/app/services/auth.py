from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _encode(data: dict, expires_at: datetime, token_type: str) -> str:
    payload = data.copy()
    payload["exp"] = expires_at
    payload["type"] = token_type
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    expires_at = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return _encode(data, expires_at, "access")


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    expires_at = datetime.utcnow() + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    return _encode(data, expires_at, "refresh")


def decode_token(token: str, expected_type: str) -> Optional[dict]:
    """Decode a JWT and ensure it's the right kind (access vs refresh)."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    return payload


# Back-compat shim — existing code paths use this name
def decode_access_token(token: str) -> Optional[dict]:
    return decode_token(token, "access")
