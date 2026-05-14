from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import User
from schemas.task import TaskCreate, TaskOut, TaskUpdate
from services.task_service import (
    create_task,
    delete_task,
    get_user_task,
    list_user_tasks,
    update_task,
)
from utils.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=201)
def create_my_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_task(db, current_user.id, data)


@router.get("", response_model=list[TaskOut])
def list_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_user_tasks(db, current_user.id)


@router.get("/{task_id}", response_model=TaskOut)
def read_my_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_user_task(db, current_user.id, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_my_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_user_task(db, current_user.id, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return update_task(db, task, data)


@router.delete("/{task_id}", status_code=204)
def delete_my_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_user_task(db, current_user.id, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    delete_task(db, task)
