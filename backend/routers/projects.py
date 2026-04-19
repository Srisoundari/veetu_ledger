from fastapi import APIRouter, Depends
from database import supabase
from dependencies import get_current_user
from household_utils import get_or_create_household_id
from schemas import ProjectCreate, ProjectUpdate

router = APIRouter()


@router.get("/")
async def list_projects(user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    projects = (
        supabase.table("projects")
        .select("*")
        .eq("household_id", household_id)
        .order("created_at", desc=True)
        .execute()
        .data
    ) or []

    if not projects:
        return []

    ids = [p["id"] for p in projects]
    expenses = (
        supabase.table("expenses")
        .select("project_id, amount, paid_amount, balance")
        .in_("project_id", ids)
        .execute()
        .data
    ) or []

    sums = {}
    for e in expenses:
        pid = e["project_id"]
        s = sums.setdefault(pid, {"total_amount": 0, "paid_amount": 0, "balance": 0, "days": 0})
        amt  = e.get("amount") or 0
        paid = e.get("paid_amount") if e.get("paid_amount") is not None else amt
        s["total_amount"] += amt
        s["paid_amount"]  += paid
        s["balance"]      += e.get("balance") or 0
        s["days"]         += 1

    for p in projects:
        p["summary"] = sums.get(
            p["id"], {"total_amount": 0, "paid_amount": 0, "balance": 0, "days": 0}
        )
    return projects


@router.get("/balance")
async def total_balance(user=Depends(get_current_user)):
    """Total outstanding balance across active groups."""
    household_id = get_or_create_household_id(user.id)
    active = (
        supabase.table("projects")
        .select("id")
        .eq("household_id", household_id)
        .neq("status", "completed")
        .execute()
        .data
    ) or []
    if not active:
        return {"total_balance": 0, "active_projects": 0}
    ids = [p["id"] for p in active]
    rows = (
        supabase.table("expenses")
        .select("balance")
        .in_("project_id", ids)
        .execute()
        .data
    ) or []
    total = sum(r.get("balance") or 0 for r in rows)
    return {"total_balance": total, "active_projects": len(active)}


@router.post("/")
async def create_project(body: ProjectCreate, user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    result = (
        supabase.table("projects")
        .insert(
            {
                "household_id": household_id,
                "name": body.name,
                "description": body.description,
            }
        )
        .execute()
    )
    return result.data[0]


@router.patch("/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, user=Depends(get_current_user)):
    data = body.model_dump(exclude_none=True)
    result = supabase.table("projects").update(data).eq("id", project_id).execute()
    return result.data[0]


@router.patch("/{project_id}/complete")
async def complete_project(project_id: str, user=Depends(get_current_user)):
    result = (
        supabase.table("projects").update({"status": "completed"}).eq("id", project_id).execute()
    )
    return result.data[0]


@router.delete("/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    # Expenses cascade via FK on delete
    supabase.table("projects").delete().eq("id", project_id).execute()
    return {"deleted": project_id}
