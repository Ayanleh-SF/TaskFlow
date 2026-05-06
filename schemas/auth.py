from pydantic import BaseModel


class LoginPayload(BaseModel):
    username: str
    password: str


class TokenPair(BaseModel):
    access: str
    refresh: str


class RefreshPayload(BaseModel):
    refresh: str
