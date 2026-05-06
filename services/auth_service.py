from sqlalchemy.orm import Session
from models.user import User
from models.token import RefreshToken
from core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
)


def login(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise Exception("Invalid creds")

    access = create_access_token(user.id)
    refresh, jti = create_refresh_token(user.id)

    db.add(RefreshToken(user_id=user.id, jti=jti))
    db.commit()

    return access, refresh


def refresh(db: Session, token_payload):
    jti = token_payload.get("jti")
    user_id = int(token_payload["sub"])

    stored = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not stored:
        raise Exception("Token reuse detected")

    # DELETE OLD TOKEN (ROTATION)
    db.delete(stored)
    db.commit()

    # ISSUE NEW TOKENS
    access = create_access_token(user_id)
    refresh, new_jti = create_refresh_token(user_id)

    db.add(RefreshToken(user_id=user_id, jti=new_jti))
    db.commit()

    return access, refresh
