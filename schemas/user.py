from pydantic import BaseModel

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    role: str
    is_active: bool

    class Config:
        from_attributes = True
