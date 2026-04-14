from pydantic import BaseModel
from typing import Optional
from datetime import date


# ---------- Profile ----------
class ProfileUpdate(BaseModel):
    name: str
    language: str = "en"  # 'en' or 'ta'


# ---------- Household ----------
class HouseholdCreate(BaseModel):
    name: str


class HouseholdRename(BaseModel):
    name: str


# ---------- Expense ----------
class ExpenseCreate(BaseModel):
    date: date
    amount: float
    note: Optional[str] = None
    category: Optional[str] = None


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    note: Optional[str] = None
    category: Optional[str] = None


class ExpenseResponse(ExpenseCreate):
    id: str
    household_id: str
    added_by: str


# ---------- Project ----------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectEntryCreate(BaseModel):
    entry_date: date
    day_number: Optional[int] = None
    work_description: Optional[str] = None
    total_amount: float
    paid_amount: float


class ProjectEntryUpdate(BaseModel):
    entry_date: Optional[date] = None
    day_number: Optional[int] = None
    work_description: Optional[str] = None
    total_amount: Optional[float] = None
    paid_amount: Optional[float] = None


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
    language: str = "en"  # 'en' or 'ta'


class SaveRequest(BaseModel):
    items: list[dict]
    project_id: Optional[str] = None  # required when saving project_entry items
