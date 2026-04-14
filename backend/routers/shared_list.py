from fastapi import APIRouter, Depends, HTTPException
from database import supabase
from dependencies import get_current_user
from schemas import ListItemCreate

router = APIRouter()


def _get_household_id(user_id: str) -> str:
    result = supabase.table("profiles").select("household_id").eq("id", user_id).single().execute()
    household_id = result.data.get("household_id")
    if not household_id:
        raise HTTPException(status_code=400, detail="Join or create a household first")
    return household_id


@router.get("/")
async def get_list(user=Depends(get_current_user)):
    household_id = _get_household_id(user.id)
    return supabase.table("list_items").select("*").eq("household_id", household_id).order("created_at").execute().data


@router.post("/")
async def add_item(body: ListItemCreate, user=Depends(get_current_user)):
    household_id = _get_household_id(user.id)
    result = supabase.table("list_items").insert({
        "household_id": household_id,
        "added_by": user.id,
        "item_name": body.item_name,
        "quantity": body.quantity,
    }).execute()
    return result.data[0]


@router.patch("/{item_id}/done")
async def mark_done(item_id: str, user=Depends(get_current_user)):
    result = supabase.table("list_items").update({
        "is_done": True,
        "done_by": user.id,
    }).eq("id", item_id).execute()
    return result.data[0]


@router.delete("/{item_id}")
async def delete_item(item_id: str, user=Depends(get_current_user)):
    supabase.table("list_items").delete().eq("id", item_id).execute()
    return {"deleted": item_id}


@router.delete("/")
async def clear_done_items(user=Depends(get_current_user)):
    household_id = _get_household_id(user.id)
    supabase.table("list_items").delete().eq("household_id", household_id).eq("is_done", True).execute()
    return {"cleared": True}
