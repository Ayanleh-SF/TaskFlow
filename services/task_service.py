from sqlalchemy.orm import Session

from models.task import Task
from schemas.task import TaskCreate, TaskUpdate


def create_task(db: Session, user_id: int, data: TaskCreate) -> Task:
    task = Task(
        user_id=user_id,
        title=data.title,
        description=data.description,
        status=data.status,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_user_tasks(db: Session, user_id: int) -> list[Task]:
    return db.query(Task).filter(Task.user_id == user_id).order_by(Task.id).all()


def get_user_task(db: Session, user_id: int, task_id: int) -> Task | None:
    return (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == user_id)
        .first()
    )


def update_task(db: Session, task: Task, data: TaskUpdate) -> Task:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
