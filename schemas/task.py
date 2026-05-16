from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


TaskStatus = Literal["a_faire", "en_cours", "termine"]
TaskPriority = Literal["Haute", "Moyenne", "Basse"]


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = "a_faire"
    owner: str = "Moi"
    due_date: date | None = None
    priority: TaskPriority = "Moyenne"


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    owner: str | None = None
    due_date: date | None = None
    priority: TaskPriority | None = None


class TaskOut(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
