from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
import models, schemas
from auth_utils import get_current_user

router = APIRouter()


def can_access_project(project: models.Project, user: models.User) -> bool:
    if user.role == models.UserRole.admin:
        return True
    if project.owner_id == user.id:
        return True
    return any(m.user_id == user.id for m in project.members)


def can_modify_task(task: models.Task, user: models.User) -> bool:
    if user.role == models.UserRole.admin:
        return True
    project = task.project
    if project.owner_id == user.id:
        return True
    membership = next((m for m in project.members if m.user_id == user.id), None)
    if membership and membership.role == models.UserRole.admin:
        return True
    # Creator or assignee can update status
    return task.creator_id == user.id or task.assignee_id == user.id


@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(
    project_id: Optional[int] = Query(None),
    status: Optional[models.TaskStatus] = Query(None),
    priority: Optional[models.TaskPriority] = Query(None),
    assignee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Task)

    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        if not project or not can_access_project(project, current_user):
            raise HTTPException(status_code=403, detail="No access to project")
        q = q.filter(models.Task.project_id == project_id)
    else:
        # Limit to user's tasks if not admin
        if current_user.role != models.UserRole.admin:
            q = q.join(models.Project).filter(
                (models.Project.owner_id == current_user.id) |
                (models.Task.assignee_id == current_user.id) |
                (models.Task.creator_id == current_user.id)
            )

    if status:
        q = q.filter(models.Task.status == status)
    if priority:
        q = q.filter(models.Task.priority == priority)
    if assignee_id:
        q = q.filter(models.Task.assignee_id == assignee_id)

    return q.order_by(models.Task.created_at.desc()).all()


@router.post("/", response_model=schemas.TaskOut, status_code=201)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not can_access_project(project, current_user):
        raise HTTPException(status_code=403, detail="No access to project")

    if payload.assignee_id:
        assignee = db.query(models.User).filter(models.User.id == payload.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")

    task = models.Task(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        project_id=payload.project_id,
        assignee_id=payload.assignee_id,
        creator_id=current_user.id,
        due_date=payload.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/my", response_model=List[schemas.TaskOut])
def my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Task)
        .filter(models.Task.assignee_id == current_user.id)
        .order_by(models.Task.due_date.asc().nullslast())
        .all()
    )


@router.get("/overdue", response_model=List[schemas.TaskOut])
def overdue_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    now = datetime.utcnow()
    q = db.query(models.Task).filter(
        models.Task.due_date < now,
        models.Task.status != models.TaskStatus.done,
    )
    if current_user.role != models.UserRole.admin:
        q = q.filter(
            (models.Task.assignee_id == current_user.id) |
            (models.Task.creator_id == current_user.id)
        )
    return q.all()


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not can_access_project(task.project, current_user):
        raise HTTPException(status_code=403, detail="No access")
    return task


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not can_modify_task(task, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to modify this task")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not can_modify_task(task, current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(task)
    db.commit()
