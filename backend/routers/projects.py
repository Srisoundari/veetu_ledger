from fastapi import APIRouter, Depends, HTTPException
from database import supabase
from dependencies import get_current_user
from schemas import ProjectCreate, ProjectUpdate, ProjectEntryCreate, ProjectEntryUpdate

router = APIRouter()


def _get_household_id(user_id: str) -> str:
    result = supabase.table("profiles").select("household_id").eq("id", user_id).single().execute()
    household_id = result.data.get("household_id") if result.data else None
    if not household_id:
        raise HTTPException(
            status_code=400,
            detail="You need to join or create a household before adding groups or expenses. Go to the Household tab.",
        )
    return household_id


# ---------- Projects ----------


@router.get("/")
async def list_projects(user=Depends(get_current_user)):
    household_id = _get_household_id(user.id)
    projects = (
        supabase.table("projects")
        .select("*")
        .eq("household_id", household_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )
    if projects:
        ids = [p["id"] for p in projects]
        entries = (
            supabase.table("project_entries")
            .select("project_id, total_amount, paid_amount, balance")
            .in_("project_id", ids)
            .execute()
            .data
        )
        sums = {}
        for e in entries:
            pid = e["project_id"]
            s = sums.setdefault(pid, {"total_amount": 0, "paid_amount": 0, "balance": 0, "days": 0})
            s["total_amount"] += e.get("total_amount") or 0
            s["paid_amount"] += e.get("paid_amount") or 0
            s["balance"] += e.get("balance") or 0
            s["days"] += 1
        for p in projects:
            p["summary"] = sums.get(
                p["id"], {"total_amount": 0, "paid_amount": 0, "balance": 0, "days": 0}
            )
    return projects


@router.get("/balance")
async def total_balance(user=Depends(get_current_user)):
    """Return total outstanding balance across all active projects for the household."""
    household_id = _get_household_id(user.id)
    active = (
        supabase.table("projects")
        .select("id")
        .eq("household_id", household_id)
        .neq("status", "completed")
        .execute()
        .data
    )
    if not active:
        return {"total_balance": 0, "active_projects": 0}
    project_ids = [p["id"] for p in active]
    entries = (
        supabase.table("project_entries")
        .select("balance")
        .in_("project_id", project_ids)
        .execute()
        .data
    )
    total = sum(e.get("balance", 0) or 0 for e in entries)
    return {"total_balance": total, "active_projects": len(active)}


@router.post("/")
async def create_project(body: ProjectCreate, user=Depends(get_current_user)):
    household_id = _get_household_id(user.id)
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
    supabase.table("projects").delete().eq("id", project_id).execute()
    return {"deleted": project_id}


# ---------- Project Entries ----------


@router.get("/{project_id}/entries")
async def list_entries(project_id: str, user=Depends(get_current_user)):
    return (
        supabase.table("project_entries")
        .select("*")
        .eq("project_id", project_id)
        .order("entry_date")
        .execute()
        .data
    )


@router.post("/{project_id}/entries")
async def add_entry(project_id: str, body: ProjectEntryCreate, user=Depends(get_current_user)):
    result = (
        supabase.table("project_entries")
        .insert(
            {
                "project_id": project_id,
                "entry_date": str(body.entry_date),
                "day_number": body.day_number,
                "work_description": body.work_description,
                "total_amount": body.total_amount,
                "paid_amount": body.paid_amount,
            }
        )
        .execute()
    )
    return result.data[0]


@router.get("/{project_id}/summary")
async def project_summary(project_id: str, user=Depends(get_current_user)):
    entries = (
        supabase.table("project_entries")
        .select("total_amount, paid_amount, balance")
        .eq("project_id", project_id)
        .execute()
        .data
    )
    total = sum(e["total_amount"] for e in entries)
    paid = sum(e["paid_amount"] for e in entries)
    balance = sum(e["balance"] for e in entries)
    return {"total_amount": total, "paid_amount": paid, "balance": balance, "days": len(entries)}


@router.patch("/{project_id}/entries/{entry_id}")
async def update_entry(
    project_id: str, entry_id: str, body: ProjectEntryUpdate, user=Depends(get_current_user)
):
    data = {
        k: str(v) if hasattr(v, "isoformat") else v
        for k, v in body.model_dump(exclude_none=True).items()
    }
    result = (
        supabase.table("project_entries")
        .update(data)
        .eq("id", entry_id)
        .eq("project_id", project_id)
        .execute()
    )
    return result.data[0]


@router.delete("/{project_id}/entries/{entry_id}")
async def delete_entry(project_id: str, entry_id: str, user=Depends(get_current_user)):
    supabase.table("project_entries").delete().eq("id", entry_id).execute()
    return {"deleted": entry_id}
