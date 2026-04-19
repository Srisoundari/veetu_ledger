from calendar import monthrange
from datetime import date

from fastapi import APIRouter, Depends
from dependencies import get_current_user
from household_utils import get_or_create_household_id
from database import supabase

router = APIRouter()


@router.get("/")
async def get_dashboard(month: str = None, user=Depends(get_current_user)):
    """
    One round-trip for everything the dashboard needs:
      - Monthly total, category breakdown, recent expenses (standalone + group items)
      - Active group count + total outstanding balance
      - Pending shopping-list item count
    """
    household_id = get_or_create_household_id(user.id)

    if not month:
        today = date.today()
        month = f"{today.year}-{today.month:02d}"

    year, mon  = map(int, month.split("-"))
    last_day   = monthrange(year, mon)[1]
    month_start = f"{month}-01"
    month_end   = f"{month}-{last_day:02d}"

    # 1. ALL expenses for the month (standalone + group line-items)
    expenses = (
        supabase.table("expenses")
        .select("id, date, amount, description, project_id")
        .eq("household_id", household_id)
        .gte("date", month_start)
        .lte("date", month_end)
        .order("date", desc=True)
        .execute()
        .data
    ) or []

    # Resolve project_id → name so the breakdown is by category (group)
    project_ids = list({e["project_id"] for e in expenses if e.get("project_id")})
    project_names: dict[str, str] = {}
    if project_ids:
        project_rows = (
            supabase.table("projects")
            .select("id, name")
            .in_("id", project_ids)
            .execute()
            .data
        ) or []
        project_names = {p["id"]: p["name"] for p in project_rows}

    total_spent = 0
    cat_map: dict[str, float] = {}
    for e in expenses:
        amt = e.get("amount") or 0
        total_spent += amt
        key = project_names.get(e.get("project_id")) or "Uncategorised"
        cat_map[key] = cat_map.get(key, 0) + amt
        # Attach name so the frontend can show it in the recent-expenses list
        e["category"] = key

    categories = [
        {"name": k, "total": round(v, 2)}
        for k, v in sorted(cat_map.items(), key=lambda x: -x[1])
    ]

    # 2. Active groups + outstanding balance
    active = (
        supabase.table("projects")
        .select("id")
        .eq("household_id", household_id)
        .neq("status", "completed")
        .execute()
        .data
    ) or []

    outstanding_balance = 0
    if active:
        ids = [p["id"] for p in active]
        rows = (
            supabase.table("expenses")
            .select("balance")
            .in_("project_id", ids)
            .execute()
            .data
        ) or []
        outstanding_balance = sum(r.get("balance") or 0 for r in rows)

    # 3. Pending shopping-list items
    pending = (
        supabase.table("list_items")
        .select("id")
        .eq("household_id", household_id)
        .eq("is_done", False)
        .execute()
        .data
    ) or []

    return {
        "month":               month,
        "total_spent":         round(total_spent, 2),
        "categories":          categories,
        "recent_expenses":     expenses[:10],
        "active_projects":     len(active),
        "outstanding_balance": round(outstanding_balance, 2),
        "pending_items":       len(pending),
    }
