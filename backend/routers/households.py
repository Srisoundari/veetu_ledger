import random
import string
from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from dependencies import get_current_user
from schemas import HouseholdCreate, ProfileUpdate

router = APIRouter()


def _make_invite_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.post("/create")
async def create_household(body: HouseholdCreate, user=Depends(get_current_user)):
    print(body)
    invite_code = _make_invite_code()
    result = (
        supabase.table("households")
        .insert(
            {
                "name": body.name,
                "invite_code": invite_code,
            }
        )
        .execute()
    )
    household = result.data[0]

    supabase.table("profiles").upsert(
        {
            "id": user.id,
            "household_id": household["id"],
        }
    ).execute()

    return household


@router.post("/join/{invite_code}")
async def join_household(invite_code: str, user=Depends(get_current_user)):
    result = supabase.table("households").select("*").eq("invite_code", invite_code).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Household not found")

    household = result.data[0]
    supabase.table("profiles").upsert(
        {
            "id": user.id,
            "household_id": household["id"],
        }
    ).execute()

    return household


@router.get("/me")
async def get_my_household(user=Depends(get_current_user)):
    profile = (
        supabase.table("profiles").select("*, households(*)").eq("id", user.id).single().execute()
    )
    return profile.data


@router.patch("/profile")
async def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    result = (
        supabase.table("profiles")
        .update(
            {
                "name": body.name,
                "language": body.language,
            }
        )
        .eq("id", user.id)
        .execute()
    )
    return result.data[0]
