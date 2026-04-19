import random
import string
from database import supabase


def _make_invite_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def get_or_create_household_id(user_id: str) -> str:
    """Return the household_id for the user, auto-creating a personal one if needed."""
    result = supabase.table("profiles").select("household_id").eq("id", user_id).maybe_single().execute()
    household_id = ((result and result.data) or {}).get("household_id")

    if household_id:
        return household_id

    # Auto-create a personal household silently
    household = supabase.table("households").insert({
        "name": "My Household",
        "invite_code": _make_invite_code(),
    }).execute().data[0]

    supabase.table("profiles").upsert({
        "id": user_id,
        "household_id": household["id"],
    }).execute()

    return household["id"]
