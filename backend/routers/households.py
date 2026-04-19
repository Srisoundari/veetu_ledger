import random
import string
from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from dependencies import get_current_user
from household_utils import get_or_create_household_id, _make_invite_code
from schemas import HouseholdCreate, HouseholdRename, ProfileUpdate

router = APIRouter()


@router.post("/create")
async def create_household(body: HouseholdCreate, user=Depends(get_current_user)):
    invite_code = _make_invite_code()
    result = supabase.table("households").insert({
        "name": body.name,
        "invite_code": invite_code,
    }).execute()
    household = result.data[0]
    supabase.table("profiles").upsert({
        "id": user.id,
        "household_id": household["id"],
    }).execute()
    return household


@router.post("/join/{invite_code}")
async def join_household(invite_code: str, user=Depends(get_current_user)):
    result = supabase.table("households").select("*").eq("invite_code", invite_code).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Household not found")
    household = result.data[0]
    supabase.table("profiles").upsert({
        "id": user.id,
        "household_id": household["id"],
    }).execute()
    return household


@router.get("/me")
async def get_my_household(user=Depends(get_current_user)):
    get_or_create_household_id(user.id)  # ensure profile + household exist
    profile = supabase.table("profiles").select("*, households(*)").eq("id", user.id).maybe_single().execute()
    return profile.data if profile else None


@router.get("/members")
async def get_members(user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    result = supabase.table("profiles").select("id, name, household_id").eq("household_id", household_id).execute()
    return result.data


@router.patch("/rename")
async def rename_household(body: HouseholdRename, user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    result = supabase.table("households").update({"name": body.name}).eq("id", household_id).execute()
    return result.data[0]


@router.patch("/new-invite")
async def new_invite_code(user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    code = _make_invite_code()
    result = supabase.table("households").update({"invite_code": code}).eq("id", household_id).execute()
    return result.data[0]


@router.delete("/leave")
async def leave_household(user=Depends(get_current_user)):
    supabase.table("profiles").update({"household_id": None}).eq("id", user.id).execute()
    return {"left": True}


@router.patch("/profile")
async def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    result = supabase.table("profiles").update({
        "name": body.name,
        "language": body.language,
    }).eq("id", user.id).execute()
    return result.data[0]
