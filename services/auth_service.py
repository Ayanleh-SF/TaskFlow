from sqlalchemy.orm import Session
from models.user import User
from models.token import RefreshToken
from schemas.user import UserCreate
from core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


def register(db: Session, data: UserCreate):
    existing_user = (
        db.query(User)
        .filter((User.username == data.username) | (User.email == data.email))
        .first()
    )
    if existing_user:
        raise ValueError("Username or email already exists")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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

    stored = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not stored:
        raise Exception("Token reuse detected")

    # DELETE OLD TOKEN (ROTATION)
    db.delete(stored)
    db.commit()

    # ISSUE NEW TOKENS
    access = create_access_token(token_payload["sub"])
    refresh, new_jti = create_refresh_token(token_payload["sub"])

    db.add(RefreshToken(user_id=token_payload["sub"], jti=new_jti))
    db.commit()

    return access, refresh
