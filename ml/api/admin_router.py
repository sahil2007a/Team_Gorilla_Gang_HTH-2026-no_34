"""Admin router — secure admin login + full data access"""
import bcrypt
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional
try:
    from .database import get_conn, rows_to_list, row_to_dict
except (ImportError, ValueError):
    from database import get_conn, rows_to_list, row_to_dict
import secrets

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_TOKEN_STORE: dict[str, str] = {}  # username -> token (in-memory for simplicity)


class AdminLogin(BaseModel):
    username: str
    password: str


def _require_admin(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    conn = get_conn()
    try:
        row = conn.execute("SELECT username FROM admin_users WHERE token = ?", (token,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Admin authentication required.")
        return row["username"]
    finally:
        conn.close()


@router.post("/login")
def admin_login(req: AdminLogin):
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM admin_users WHERE username = ?", (req.username,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid admin credentials.")
        admin = dict(row)
        if not bcrypt.checkpw(req.password.encode(), admin["password_hash"].encode()):
            raise HTTPException(status_code=401, detail="Invalid admin credentials.")
        token = secrets.token_hex(32)
        conn.execute("UPDATE admin_users SET token = ? WHERE username = ?", (token, req.username))
        conn.commit()
        return {"success": True, "token": token, "username": req.username}
    finally:
        conn.close()


@router.post("/logout")
def admin_logout(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    conn = get_conn()
    try:
        conn.execute("UPDATE admin_users SET token = NULL WHERE token = ?", (token,))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


@router.get("/dashboard")
def dashboard(authorization: str = Header(None)):
    _require_admin(authorization)
    conn = get_conn()
    try:
        total_farmers = conn.execute("SELECT COUNT(*) as c FROM farmers").fetchone()["c"]
        total_scans = conn.execute("SELECT COUNT(*) as c FROM scan_results").fetchone()["c"]
        scans_today = conn.execute("SELECT COUNT(*) as c FROM scan_results WHERE date(created_at)=date('now')").fetchone()["c"]
        diseases_detected = conn.execute("SELECT COUNT(*) as c FROM scan_results WHERE disease_name NOT IN ('None','') AND disease_name IS NOT NULL").fetchone()["c"]
        market_entries = conn.execute("SELECT COUNT(*) as c FROM market_prices").fetchone()["c"]
        district_count = conn.execute("SELECT COUNT(DISTINCT district) as c FROM farmers").fetchone()["c"]
        crop_count = conn.execute("SELECT COUNT(*) as c FROM farmer_crops").fetchone()["c"]
        
        # Financial aggregations
        tot_inc = conn.execute("SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE type='income'").fetchone()["s"]
        tot_exp = conn.execute("SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE type='expense'").fetchone()["s"]
        
        return {
            "total_farmers": total_farmers,
            "total_scans": total_scans,
            "scans_today": scans_today,
            "diseases_detected": diseases_detected,
            "market_entries": market_entries,
            "district_count": district_count,
            "crop_count": crop_count,
            "total_income": round(tot_inc, 2),
            "total_expenses": round(tot_exp, 2),
            "net_profit": round(tot_inc - tot_exp, 2),
        }
    finally:
        conn.close()


@router.get("/finances")
def list_all_finances(
    authorization: str = Header(None),
    type: Optional[str] = Query(None),
    farmer_id: Optional[int] = Query(None),
    offset: int = Query(0),
    limit: int = Query(50),
):
    _require_admin(authorization)
    conn = get_conn()
    try:
        conditions, params = [], []
        if type:
            conditions.append("f.type = ?")
            params.append(type)
        if farmer_id:
            conditions.append("f.farmer_id = ?")
            params.append(farmer_id)
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        entries = rows_to_list(conn.execute(
            f"""SELECT f.id, f.farmer_id, f.type, f.category, f.amount, f.crop_name, f.description, f.entry_date, f.created_at,
                       fm.name as farmer_name, fm.mobile as farmer_mobile, fm.village, fm.district
                FROM farmer_finances f
                LEFT JOIN farmers fm ON f.farmer_id = fm.id
                {where}
                ORDER BY f.entry_date DESC, f.created_at DESC
                LIMIT ? OFFSET ?""",
            params + [limit, offset]
        ).fetchall())
        
        tot_inc = conn.execute("SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE type='income'").fetchone()["s"]
        tot_exp = conn.execute("SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE type='expense'").fetchone()["s"]
        total = conn.execute(f"SELECT COUNT(*) as c FROM farmer_finances f {where}", params).fetchone()["c"]
        
        return {
            "entries": entries,
            "total": total,
            "total_income": round(tot_inc, 2),
            "total_expenses": round(tot_exp, 2),
            "net_profit": round(tot_inc - tot_exp, 2)
        }
    finally:
        conn.close()


@router.get("/farmers/{farmer_id}/finances")
def farmer_finances_ledger(farmer_id: int, authorization: str = Header(None)):
    _require_admin(authorization)
    conn = get_conn()
    try:
        farmer = row_to_dict(conn.execute("SELECT id, name, mobile, village, district FROM farmers WHERE id=?", (farmer_id,)).fetchone())
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
            
        entries = rows_to_list(conn.execute(
            "SELECT * FROM farmer_finances WHERE farmer_id=? ORDER BY entry_date DESC, created_at DESC",
            (farmer_id,)
        ).fetchall())
        
        income = conn.execute("SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE farmer_id=? AND type='income'", (farmer_id,)).fetchone()["s"]
        expenses = conn.execute("SELECT COALESCE(SUM(amount), 0) as s FROM farmer_finances WHERE farmer_id=? AND type='expense'", (farmer_id,)).fetchone()["s"]
        
        return {
            "farmer": farmer,
            "entries": entries,
            "total_income": round(income, 2),
            "total_expenses": round(expenses, 2),
            "net_balance": round(income - expenses, 2)
        }
    finally:
        conn.close()


@router.get("/farmers")
def list_farmers(
    authorization: str = Header(None),
    search: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    offset: int = Query(0),
    limit: int = Query(50),
):
    _require_admin(authorization)
    conn = get_conn()
    try:
        conditions, params = [], []
        if search:
            conditions.append("(name LIKE ? OR mobile LIKE ? OR village LIKE ?)")
            params += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if district:
            conditions.append("district = ?")
            params.append(district)
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        farmers = rows_to_list(conn.execute(
            f"SELECT id,name,mobile,village,district,state,aadhaar,created_at FROM farmers {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [limit, offset]
        ).fetchall())
        total = conn.execute(f"SELECT COUNT(*) as c FROM farmers {where}", params).fetchone()["c"]
        return {"farmers": farmers, "total": total}
    finally:
        conn.close()


@router.get("/farmers/{farmer_id}")
def farmer_detail(farmer_id: int, authorization: str = Header(None)):
    _require_admin(authorization)
    conn = get_conn()
    try:
        farmer = row_to_dict(conn.execute(
            "SELECT id,name,mobile,village,district,state,aadhaar,created_at FROM farmers WHERE id=?", (farmer_id,)
        ).fetchone())
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer not found")
        crops = rows_to_list(conn.execute("SELECT * FROM farmer_crops WHERE farmer_id=?", (farmer_id,)).fetchall())
        scans = rows_to_list(conn.execute(
            "SELECT id,leaf_detected,crop_name,health_status,disease_name,severity,crop_confidence,disease_confidence,created_at FROM scan_results WHERE farmer_id=? ORDER BY created_at DESC LIMIT 20",
            (farmer_id,)
        ).fetchall())
        farmer["crops"] = crops
        farmer["recent_scans"] = scans
        return farmer
    finally:
        conn.close()


@router.get("/scans")
def list_scans(
    authorization: str = Header(None),
    search: Optional[str] = Query(None),
    health_status: Optional[str] = Query(None),
    offset: int = Query(0),
    limit: int = Query(50),
):
    _require_admin(authorization)
    conn = get_conn()
    try:
        conditions, params = [], []
        if search:
            conditions.append("(crop_name LIKE ? OR disease_name LIKE ?)")
            params += [f"%{search}%", f"%{search}%"]
        if health_status:
            conditions.append("health_status = ?")
            params.append(health_status)
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        scans = rows_to_list(conn.execute(
            f"""SELECT s.id, s.leaf_detected, s.image_quality, s.crop_name, s.crop_confidence,
                s.health_status, s.disease_name, s.disease_confidence, s.severity,
                s.analysis, s.action, s.recommendations, s.message, s.created_at,
                f.name as farmer_name, f.mobile as farmer_mobile
                FROM scan_results s
                LEFT JOIN farmers f ON s.farmer_id = f.id
                {where}
                ORDER BY s.created_at DESC LIMIT ? OFFSET ?""",
            params + [limit, offset]
        ).fetchall())
        total = conn.execute(f"SELECT COUNT(*) as c FROM scan_results {where}", params).fetchone()["c"]
        return {"scans": scans, "total": total}
    finally:
        conn.close()


@router.get("/market")
def list_market(authorization: str = Header(None), offset: int = 0, limit: int = 100):
    _require_admin(authorization)
    conn = get_conn()
    try:
        prices = rows_to_list(conn.execute(
            "SELECT * FROM market_prices ORDER BY price_date DESC, district, crop_name LIMIT ? OFFSET ?",
            (limit, offset)
        ).fetchall())
        total = conn.execute("SELECT COUNT(*) as c FROM market_prices").fetchone()["c"]
        return {"prices": prices, "total": total}
    finally:
        conn.close()


@router.post("/market")
def add_market_price(body: dict, authorization: str = Header(None)):
    _require_admin(authorization)
    conn = get_conn()
    try:
        # Get previous price
        prev = conn.execute(
            "SELECT price FROM market_prices WHERE crop_name=? AND district=? ORDER BY price_date DESC LIMIT 1",
            (body.get("crop_name"), body.get("district"))
        ).fetchone()
        prev_price = prev["price"] if prev else None
        conn.execute(
            "INSERT INTO market_prices (crop_name, market, district, state, price, prev_price, unit, price_date) VALUES (?,?,?,?,?,?,?,?)",
            (body["crop_name"], body["market"], body["district"], body.get("state", "Maharashtra"),
             body["price"], prev_price, body.get("unit", "quintal"), body.get("price_date"))
        )
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


@router.put("/market/{price_id}")
def update_market_price(price_id: int, body: dict, authorization: str = Header(None)):
    _require_admin(authorization)
    conn = get_conn()
    try:
        existing = row_to_dict(conn.execute("SELECT * FROM market_prices WHERE id=?", (price_id,)).fetchone())
        if not existing:
            raise HTTPException(status_code=404, detail="Price entry not found")
        conn.execute(
            "UPDATE market_prices SET price=?, prev_price=?, market=?, updated_at=datetime('now') WHERE id=?",
            (body.get("price", existing["price"]), existing["price"], body.get("market", existing["market"]), price_id)
        )
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


@router.delete("/market/{price_id}")
def delete_market_price(price_id: int, authorization: str = Header(None)):
    _require_admin(authorization)
    conn = get_conn()
    try:
        conn.execute("DELETE FROM market_prices WHERE id=?", (price_id,))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()
