"""Farmer Finances Router — Income & Expense Tracking & Farm Savings"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
try:
    from .database import get_conn, rows_to_list, row_to_dict
except (ImportError, ValueError):
    from database import get_conn, rows_to_list, row_to_dict

router = APIRouter(prefix="/finances", tags=["finances"])


def _require_farmer(authorization: str = Header(None)) -> int:
    token = (authorization or "").replace("Bearer ", "").strip()
    conn = get_conn()
    try:
        if token:
            farmer = conn.execute("SELECT id FROM farmers WHERE token = ?", (token,)).fetchone()
            if farmer:
                return farmer["id"]
        # Fallback to active farmer
        first_f = conn.execute("SELECT id FROM farmers ORDER BY id ASC LIMIT 1").fetchone()
        if first_f:
            return first_f["id"]
        return 1
    finally:
        conn.close()


class FinanceEntryRequest(BaseModel):
    type: str  # 'income' or 'expense'
    category: str
    amount: float
    crop_name: Optional[str] = None
    description: Optional[str] = None
    entry_date: Optional[str] = None


@router.get("/summary")
def get_farmer_finance_summary(authorization: str = Header(None)):
    farmer_id = _require_farmer(authorization)
    conn = get_conn()
    try:
        income = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE farmer_id=? AND type='income'",
            (farmer_id,)
        ).fetchone()["s"]
        expenses = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE farmer_id=? AND type='expense'",
            (farmer_id,)
        ).fetchone()["s"]
        
        entries = rows_to_list(conn.execute(
            "SELECT * FROM farmer_finances WHERE farmer_id=? ORDER BY entry_date DESC, created_at DESC LIMIT 100",
            (farmer_id,)
        ).fetchall())

        # Category breakdown for expenses
        exp_by_cat = conn.execute(
            "SELECT category, SUM(amount) as total FROM farmer_finances WHERE farmer_id=? AND type='expense' GROUP BY category ORDER BY total DESC",
            (farmer_id,)
        ).fetchall()

        # Category breakdown for incomes
        inc_by_cat = conn.execute(
            "SELECT category, SUM(amount) as total FROM farmer_finances WHERE farmer_id=? AND type='income' GROUP BY category ORDER BY total DESC",
            (farmer_id,)
        ).fetchall()
        
        return {
            "total_income": round(income, 2),
            "total_expenses": round(expenses, 2),
            "net_balance": round(income - expenses, 2),
            "income_breakdown": [dict(r) for r in inc_by_cat],
            "expense_breakdown": [dict(r) for r in exp_by_cat],
            "entries": entries
        }
    finally:
        conn.close()


@router.post("/add")
def add_finance_entry(req: FinanceEntryRequest, authorization: str = Header(None)):
    farmer_id = _require_farmer(authorization)
    if req.type not in ("income", "expense"):
        raise HTTPException(status_code=400, detail="Type must be 'income' or 'expense'.")
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0.")
        
    conn = get_conn()
    try:
        conn.execute(
            """INSERT INTO farmer_finances (farmer_id, type, category, amount, crop_name, description, entry_date)
               VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, date('now')))""",
            (farmer_id, req.type, req.category, req.amount, req.crop_name, req.description, req.entry_date)
        )
        conn.commit()
        return {"success": True, "message": f"Farm {req.type} recorded successfully"}
    finally:
        conn.close()


@router.delete("/{entry_id}")
def delete_finance_entry(entry_id: int, authorization: str = Header(None)):
    farmer_id = _require_farmer(authorization)
    conn = get_conn()
    try:
        res = conn.execute("DELETE FROM farmer_finances WHERE id=? AND farmer_id=?", (entry_id, farmer_id))
        conn.commit()
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"success": True, "message": "Entry deleted"}
    finally:
        conn.close()
