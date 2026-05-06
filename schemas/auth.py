from pydantic import BaseModel

class TokenPair(BaseModel):
    access: str
    refresh: str

class RefreshPayload(BaseModel):
    refresh: str