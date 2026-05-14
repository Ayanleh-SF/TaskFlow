from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from db.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    jti = Column(String, unique=True)


class EmailConfirmationToken(Base):
    __tablename__ = "email_confirmation_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
