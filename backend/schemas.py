from pydantic import BaseModel
from typing import Optional
import datetime


# ---------- Profile ----------
class ProfileUpdate(BaseModel):
    name: str
    language: str = "en"  # 'en' or 'ta'


# ---------- Household ----------
class HouseholdCreate(BaseModel):
    name: str


class HouseholdRename(BaseModel):
    name: str


# ---------- Expense (now unified: standalone OR group line-item) ----------
class ExpenseCreate(BaseModel):
    date: datetime.date
    amount: float
    paid_amount: Optional[float] = None          # null = fully paid
    description: Optional[str] = None            # replaces note + work_description
    category: Optional[str] = None
    project_id: Optional[str] = None             # null = standalone


class ExpenseUpdate(BaseModel):
    date: Optional[datetime.date] = None
    amount: Optional[float] = None
    paid_amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    project_id: Optional[str] = None


# ---------- Project (group) ----------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


# ---------- Shared List ----------
class ListItemCreate(BaseModel):
    item_name: str
    quantity: Optional[str] = None


class ListItemUpdate(BaseModel):
    item_name: Optional[str] = None
    quantity: Optional[str] = None


# ---------- NLP ----------
class ParseRequest(BaseModel):
    text: str
    language: str = "en"


class SaveRequest(BaseModel):
    items: list[dict]
    project_id: Optional[str] = None  # if set, every expense item is attached to this group
