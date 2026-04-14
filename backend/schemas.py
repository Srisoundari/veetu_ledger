from pydantic import BaseModel
from typing import Optional
from datetime import date


# ---------- Profile ----------
class ProfileUpdate(BaseModel):
    name: str
    language: str = "en"   # 'en' or 'ta'


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


class ExpenseResponse(ExpenseCreate):
    id: str
    household_id: str
    added_by: str


# ---------- Project ----------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectEntryCreate(BaseModel):
    entry_date: date
    day_number: Optional[int] = None
    work_description: Optional[str] = None
    total_amount: float
    paid_amount: float


# ---------- Shared List ----------
class ListItemCreate(BaseModel):
    item_name: str
    quantity: Optional[str] = None


# ---------- NLP ----------
class ParseRequest(BaseModel):
    text: str
    language: str = "en"   # 'en' or 'ta'
