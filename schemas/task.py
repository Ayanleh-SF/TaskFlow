from datetime import datetime
from typing import Literal

from pydantic import BaseModel


TaskStatus = Literal["a_faire", "en_cours", "termine"]


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = "a_faire"


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None


class TaskOut(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
