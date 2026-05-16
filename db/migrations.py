from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_task_columns(engine: Engine) -> None:
    inspector = inspect(engine)
    if not inspector.has_table("tasks"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("tasks")}
    statements = []

    if "owner" not in existing_columns:
        statements.append("ALTER TABLE tasks ADD COLUMN owner VARCHAR NOT NULL DEFAULT 'Moi'")
    if "due_date" not in existing_columns:
        statements.append("ALTER TABLE tasks ADD COLUMN due_date DATE")
    if "priority" not in existing_columns:
        statements.append(
            "ALTER TABLE tasks ADD COLUMN priority VARCHAR NOT NULL DEFAULT 'Moyenne'"
        )

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
