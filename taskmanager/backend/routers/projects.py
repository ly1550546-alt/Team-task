from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from auth_utils import get_current_user

router = APIRouter()


def get_project_or_404(project_id: int, db: Session) -> models.Project:
    p = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


def is_project_admin(project: models.Project, user: models.User) -> bool:
    if user.role == models.UserRole.admin:
        return True
    if project.owner_id == user.id:
        return True
    membership = next((m for m in project.members if m.user_id == user.id), None)
    return membership and membership.role == models.UserRole.admin


def is_project_member(project: models.Project, user: models.User) -> bool:
    if user.role == models.UserRole.admin:
        return True
    if project.owner_id == user.id:
        return True
    return any(m.user_id == user.id for m in project.members)


@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == models.UserRole.admin:
        return db.query(models.Project).all()

    # Return projects where user is owner or member
    owned = db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    member_of = (
        db.query(models.Project)
        .join(models.ProjectMember)
        .filter(models.ProjectMember.user_id == current_user.id)
        .all()
    )
    seen = {p.id for p in owned}
    result = list(owned)
    for p in member_of:
        if p.id not in seen:
            result.append(p)
            seen.add(p.id)
    return result


@router.post("/", response_model=schemas.ProjectOut, status_code=201)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = models.Project(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    if not is_project_member(project, current_user):
        raise HTTPException(status_code=403, detail="Not a project member")
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    if not is_project_admin(project, current_user):
        raise HTTPException(status_code=403, detail="Only project admins can update")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    if not is_project_admin(project, current_user):
        raise HTTPException(status_code=403, detail="Only project admins can delete")
    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", response_model=schemas.ProjectOut)
def add_member(
    project_id: int,
    payload: schemas.AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    if not is_project_admin(project, current_user):
        raise HTTPException(status_code=403, detail="Only project admins can add members")

    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = next((m for m in project.members if m.user_id == payload.user_id), None)
    if existing or project.owner_id == payload.user_id:
        raise HTTPException(status_code=400, detail="User already in project")

    member = models.ProjectMember(
        project_id=project_id, user_id=payload.user_id, role=payload.role
    )
    db.add(member)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}/members/{user_id}", response_model=schemas.ProjectOut)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    if not is_project_admin(project, current_user):
        raise HTTPException(status_code=403, detail="Only project admins can remove members")

    membership = next((m for m in project.members if m.user_id == user_id), None)
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(membership)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}/dashboard", response_model=schemas.DashboardStats)
def project_dashboard(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from datetime import datetime
    project = get_project_or_404(project_id, db)
    if not is_project_member(project, current_user):
        raise HTTPException(status_code=403, detail="Not a project member")

    tasks = project.tasks
    now = datetime.utcnow()
    return schemas.DashboardStats(
        total_projects=1,
        total_tasks=len(tasks),
        tasks_todo=sum(1 for t in tasks if t.status == models.TaskStatus.todo),
        tasks_in_progress=sum(1 for t in tasks if t.status == models.TaskStatus.in_progress),
        tasks_done=sum(1 for t in tasks if t.status == models.TaskStatus.done),
        tasks_overdue=sum(1 for t in tasks if t.due_date and t.due_date.replace(tzinfo=None) < now and t.status != models.TaskStatus.done),
        recent_tasks=sorted(tasks, key=lambda t: t.created_at, reverse=True)[:5],
    )
