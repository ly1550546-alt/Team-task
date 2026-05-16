from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    member = "member"


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


# ── Auth ──────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.member

    @validator("name")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @validator("password")
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ── Users ─────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# ── Projects ──────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

    @validator("name")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Project name cannot be empty")
        return v.strip()


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectMemberOut(BaseModel):
    id: int
    user_id: int
    role: UserRole
    joined_at: datetime
    user: UserOut

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    owner: UserOut
    members: List[ProjectMemberOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class AddMemberRequest(BaseModel):
    user_id: int
    role: UserRole = UserRole.member


# ── Tasks ─────────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    project_id: int
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None

    @validator("title")
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Task title cannot be empty")
        return v.strip()


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    project_id: int
    assignee_id: Optional[int]
    creator_id: int
    due_date: Optional[datetime]
    created_at: datetime
    assignee: Optional[UserOut]
    creator: UserOut
    project: Optional["ProjectSimple"]

    class Config:
        from_attributes = True


class ProjectSimple(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────
class DashboardStats(BaseModel):
    total_projects: int
    total_tasks: int
    tasks_todo: int
    tasks_in_progress: int
    tasks_done: int
    tasks_overdue: int
    recent_tasks: List[TaskOut] = []


TokenResponse.model_rebuild()
TaskOut.model_rebuild()
