from sqlalchemy import Column, Integer, String
from db.base import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    jti = Column(String, unique=True)
