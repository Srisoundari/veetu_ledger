from calendar import monthrange

from fastapi import APIRouter, Depends
from database import supabase
from dependencies import get_current_user
from household_utils import get_or_create_household_id
from schemas import ExpenseCreate, ExpenseUpdate

router = APIRouter()


@router.get("/")
async def list_expenses(
    month: str = None,
    project_id: str = None,
    user=Depends(get_current_user),
):
    """
    List expenses for the household.
      - month=YYYY-MM filters by month
      - project_id=<uuid> filters by group
      - project_id="null" fetches only standalone expenses
    """
    household_id = get_or_create_household_id(user.id)

    query = (
        supabase.table("expenses")
        .select("*")
        .eq("household_id", household_id)
        .order("date", desc=True)
    )

    if project_id == "null":
        query = query.is_("project_id", "null")
    elif project_id:
        query = query.eq("project_id", project_id)

    if month:
        year, mon = map(int, month.split("-"))
        last_day = monthrange(year, mon)[1]
        query = query.gte("date", f"{month}-01").lte("date", f"{month}-{last_day:02d}")

    return query.execute().data


@router.post("/")
async def create_expense(body: ExpenseCreate, user=Depends(get_current_user)):
    print("Creating expense with data:", body)
    household_id = get_or_create_household_id(user.id)
    result = (
        supabase.table("expenses")
        .insert(
            {
                "household_id": household_id,
                "added_by": user.id,
                "project_id": body.project_id,
                "date": str(body.date),
                "amount": body.amount,
                "paid_amount": body.paid_amount,
                "description": body.description,
                "category": body.category.strip().lower() if body.category else None,
            }
        )
        .execute()
    )
    return result.data[0]


@router.patch("/{expense_id}")
async def update_expense(expense_id: str, body: ExpenseUpdate, user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    data = {
        k: str(v) if hasattr(v, "isoformat") else v
        for k, v in body.model_dump(exclude_none=True).items()
    }
    if "category" in data and data["category"]:
        data["category"] = data["category"].strip().lower()
    result = (
        supabase.table("expenses")
        .update(data)
        .eq("id", expense_id)
        .eq("household_id", household_id)
        .execute()
    )
    return result.data[0]


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    supabase.table("expenses").delete().eq("id", expense_id).eq(
        "household_id", household_id
    ).execute()
    return {"deleted": expense_id}


@router.get("/summary")
async def summary(project_id: str = None, user=Depends(get_current_user)):
    """Total / paid / balance / item count — optionally scoped to a project."""
    household_id = get_or_create_household_id(user.id)
    query = (
        supabase.table("expenses")
        .select("amount, paid_amount, balance")
        .eq("household_id", household_id)
    )
    if project_id:
        query = query.eq("project_id", project_id)
    rows = query.execute().data or []

    total = sum(r.get("amount") or 0 for r in rows)
    paid = sum(
        (r.get("paid_amount") if r.get("paid_amount") is not None else r.get("amount") or 0)
        for r in rows
    )
    balance = sum(r.get("balance") or 0 for r in rows)
    return {"total_amount": total, "paid_amount": paid, "balance": balance, "days": len(rows)}
