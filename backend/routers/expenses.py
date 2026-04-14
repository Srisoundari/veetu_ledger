from fastapi import APIRouter, Depends, HTTPException
from database import supabase
from dependencies import get_current_user
from schemas import ExpenseCreate, ExpenseUpdate

router = APIRouter()


def _get_household_id(user_id: str) -> str:
    result = supabase.table("profiles").select("household_id").eq("id", user_id).single().execute()
    household_id = result.data.get("household_id")
    if not household_id:
        raise HTTPException(status_code=400, detail="Join or create a household first")
    return household_id


@router.get("/")
async def list_expenses(month: str = None, user=Depends(get_current_user)):
    """List expenses for the household. Optionally filter by month (YYYY-MM)."""
    household_id = _get_household_id(user.id)
    query = (
        supabase.table("expenses")
        .select("*")
        .eq("household_id", household_id)
        .order("date", desc=True)
    )
    if month:
        from calendar import monthrange

        year, mon = map(int, month.split("-"))
        last_day = monthrange(year, mon)[1]
        query = query.gte("date", f"{month}-01").lte("date", f"{month}-{last_day:02d}")
    return query.execute().data


@router.post("/")
async def create_expense(body: ExpenseCreate, user=Depends(get_current_user)):
    household_id = _get_household_id(user.id)
    result = (
        supabase.table("expenses")
        .insert(
            {
                "household_id": household_id,
                "added_by": user.id,
                "date": str(body.date),
                "amount": body.amount,
                "note": body.note,
                "category": body.category,
            }
        )
        .execute()
    )
    return result.data[0]


@router.patch("/{expense_id}")
async def update_expense(expense_id: str, body: ExpenseUpdate, user=Depends(get_current_user)):
    data = {
        k: str(v) if hasattr(v, "isoformat") else v
        for k, v in body.model_dump(exclude_none=True).items()
    }
    result = (
        supabase.table("expenses")
        .update(data)
        .eq("id", expense_id)
        .eq("added_by", user.id)
        .execute()
    )
    return result.data[0]


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, user=Depends(get_current_user)):
    supabase.table("expenses").delete().eq("id", expense_id).eq("added_by", user.id).execute()
    return {"deleted": expense_id}
