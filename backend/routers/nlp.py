import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException

from database import supabase
from dependencies import get_current_user
from household_utils import get_or_create_household_id
from schemas import ParseRequest, SaveRequest
from llm import get_parser

router = APIRouter()
_parse = get_parser()

SYSTEM_PROMPT = """You are a parser for a household finance app used in India.
Extract structured data from the user's text and return ONLY a valid JSON array — no explanation.

Each element must be one of:

1. Expense (any money spent — standalone or part of a bigger report):
{"type": "expense", "date": "YYYY-MM-DD", "amount": 150.0, "paid_amount": 150.0, "description": "Rice", "category": "groceries"}

2. Shopping list item:
{"type": "list_item", "item_name": "Rice", "quantity": "2kg"}

Parsing rules for WhatsApp-style expense reports (renovation, construction, events):
- Every line item becomes ONE "expense"
- Date headers like "*_14 Apr 2026_*", "14 Apr 2026", "14th Apr 2026" apply to ALL items below until the next date
- Item lines use formats like: "Description :- 1234" or "Description - 1234" or "Description: 1234"
- Items ABOVE a "Yet to Pay" / "Balance" / "Pending" / "To Pay" section marker:
    set paid_amount = amount  (fully paid)
- Items BELOW a "Yet to Pay" / "Balance" / "Pending" section:
    set paid_amount = 0       (not yet paid)
- "Miscellaneous" or non-date headers: use the nearest preceding date, or today
- Ignore WhatsApp formatting: *, _, ---, bold/italic markers
- For short natural-language input ("spent ₹450 on groceries"): single expense item

General rules:
- Always return a JSON array, even for one item: [{"type": ...}]
- Handle Tamil and English input
- Use today's date if no date is mentioned
- If paid_amount is unknown, set it equal to amount (fully paid)
- Return ONLY the JSON array, nothing else
"""


@router.post("/parse")
async def parse_text(body: ParseRequest, user=Depends(get_current_user)):
    today = date.today().isoformat()
    user_message = f"Today is {today}. Language hint: {body.language}.\n\nInput: {body.text}"

    try:
        raw = _parse(SYSTEM_PROMPT, user_message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {type(e).__name__}: {e}")

    try:
        result = json.loads(raw)
        return result if isinstance(result, list) else [result]
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail=f"Could not parse input: {raw}")


@router.post("/save")
async def save_parsed(body: SaveRequest, user=Depends(get_current_user)):
    household_id = get_or_create_household_id(user.id)
    saved = []

    for item in body.items:
        item_type = item.get("type")

        # Accept both old (`project_entry`) and new (`expense`) type names
        if item_type in ("expense", "project_entry"):
            # Amount: accept `amount` OR legacy `total_amount`
            amount = item.get("amount")
            if amount is None:
                amount = item.get("total_amount")
            amount = amount or 0

            # Paid: None/missing → fully paid (= amount)
            paid = item.get("paid_amount")
            if paid is None:
                paid = amount

            # Date: accept `date` OR legacy `entry_date`
            entry_date = item.get("date") or item.get("entry_date") or date.today().isoformat()

            # Description: `description` / legacy `work_description` / `note`
            desc = (
                item.get("description")
                or item.get("work_description")
                or item.get("note")
            )

            payload = {
                "household_id": household_id,
                "added_by":     user.id,
                "project_id":   body.project_id,
                "date":         entry_date,
                "amount":       amount,
                "paid_amount":  paid,
                "description":  desc,
                "category":     (item.get("category") or "").strip().lower() or None,
            }

            try:
                result = supabase.table("expenses").insert(payload).execute()
                saved.append({"type": "expense", **result.data[0]})
            except Exception as e:
                print(f"[nlp.save] insert failed for {payload}: {e}")
                raise HTTPException(status_code=400, detail=f"Failed to save expense: {e}")

        elif item_type == "list_item":
            result = (
                supabase.table("list_items")
                .insert(
                    {
                        "household_id": household_id,
                        "added_by":     user.id,
                        "item_name":    item.get("item_name"),
                        "quantity":     item.get("quantity"),
                    }
                )
                .execute()
            )
            saved.append({"type": "list_item", **result.data[0]})

        else:
            print(f"[nlp.save] skipped unknown item type: {item_type} — {item}")

    return saved
