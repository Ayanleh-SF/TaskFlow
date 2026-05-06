from jose import jwt
from datetime import datetime, timedelta
import hashlib
import hmac
import os
import uuid
from core.config import settings


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100_000
    )
    return f"{salt.hex()}:{password_hash.hex()}"


def verify_password(password: str, stored_password: str) -> bool:
    try:
        salt_hex, hash_hex = stored_password.split(":", 1)
    except ValueError:
        return False

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        100_000
    )
    return hmac.compare_digest(password_hash.hex(), hash_hex)


def create_access_token(user_id: int):
    return jwt.encode(
        {"sub": str(user_id), "type": "access", "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_EXPIRE_MIN)},
        settings.SECRET_KEY,
        algorithm="HS256"
    )


def create_refresh_token(user_id: int):
    jti = str(uuid.uuid4())
    return jwt.encode(
        {"sub": str(user_id), "jti": jti, "type": "refresh", "exp": datetime.utcnow() + timedelta(days=settings.REFRESH_EXPIRE_DAYS)},
        settings.SECRET_KEY,
        algorithm="HS256"
    ), jti
