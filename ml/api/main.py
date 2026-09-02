"""AgriFlow Backend — Main entry point"""
import os
import bcrypt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

import sys
from pathlib import Path

# Add api dir and ml dir to sys.path so script can be run directly or as a module
api_dir = Path(__file__).resolve().parent
ml_dir = api_dir.parent
for p in (str(api_dir), str(ml_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from .database import init_db, get_conn
    from .auth_router import router as auth_router
    from .scanner_router import router as scanner_router
    from .market_router import router as market_router
    from .admin_router import router as admin_router
    from .finances_router import router as finances_router
    from .ai_router import router as ai_router
    from .sensors_router import router as sensors_router
except (ImportError, ValueError):
    from database import init_db, get_conn
    from auth_router import router as auth_router
    from scanner_router import router as scanner_router
    from market_router import router as market_router
    from admin_router import router as admin_router
    from finances_router import router as finances_router
    from ai_router import router as ai_router
    from sensors_router import router as sensors_router

app = FastAPI(title="AgriFlow API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": f"Internal Server Error: {str(exc)}"})

# Register routers
app.include_router(auth_router)
app.include_router(scanner_router)
app.include_router(market_router)
app.include_router(admin_router)
app.include_router(finances_router)
app.include_router(ai_router)
app.include_router(sensors_router)

# Serve admin panel HTML
ADMIN_HTML = Path(__file__).parent / "admin_panel.html"

@app.get("/admin-panel")
def serve_admin():
    return FileResponse(str(ADMIN_HTML))


@app.get("/")
def health():
    return {"status": "ok", "version": "2.0.0", "message": "AgriFlow API running"}


def seed_initial_data():
    """Seed admin user and market prices on first run."""
    conn = get_conn()
    try:
        # Admin user
        # Admin user
        existing_admin = conn.execute("SELECT id FROM admin_users WHERE username='Agriflow'").fetchone()
        if not existing_admin:
            # Clean up old admin
            conn.execute("DELETE FROM admin_users WHERE username='admin'")
            # Add token column if missing (migration safety)
            try:
                conn.execute("ALTER TABLE admin_users ADD COLUMN token TEXT")
                conn.commit()
            except Exception:
                pass
            pw_hash = bcrypt.hashpw(b"Agriflow@2026", bcrypt.gensalt()).decode()
            conn.execute(
                "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
                ("Agriflow", pw_hash)
            )
            print("[SEED] Admin user created: Agriflow / Agriflow@2026")

        # Market prices seed (Maharashtra mandis)
        existing_prices = conn.execute("SELECT COUNT(*) as c FROM market_prices").fetchone()["c"]
        if existing_prices == 0:
            seed_prices = [
                # (crop_name, market, district, price, prev_price, unit, date)
                ("Chilli", "Ramtek APMC", "Nagpur", 9500, 8800, "quintal", "2024-01-15"),
                ("Chilli", "Hinganghat APMC", "Wardha", 9200, 8600, "quintal", "2024-01-15"),
                ("Chilli", "Amravati APMC", "Amravati", 9800, 9100, "quintal", "2024-01-15"),
                ("Wheat", "Nagpur APMC", "Nagpur", 2150, 2080, "quintal", "2024-01-15"),
                ("Wheat", "Wardha APMC", "Wardha", 2100, 2050, "quintal", "2024-01-15"),
                ("Wheat", "Amravati APMC", "Amravati", 2200, 2120, "quintal", "2024-01-15"),
                ("Soybean", "Nagpur APMC", "Nagpur", 4300, 4100, "quintal", "2024-01-15"),
                ("Soybean", "Wardha APMC", "Wardha", 4250, 4050, "quintal", "2024-01-15"),
                ("Soybean", "Latur APMC", "Latur", 4400, 4200, "quintal", "2024-01-15"),
                ("Cotton", "Wardha APMC", "Wardha", 7200, 6800, "quintal", "2024-01-15"),
                ("Cotton", "Yavatmal APMC", "Yavatmal", 7400, 7000, "quintal", "2024-01-15"),
                ("Cotton", "Akola APMC", "Akola", 7100, 6700, "quintal", "2024-01-15"),
                ("Tomato", "Nagpur APMC", "Nagpur", 1800, 2200, "quintal", "2024-01-15"),
                ("Tomato", "Pune APMC", "Pune", 2100, 1900, "quintal", "2024-01-15"),
                ("Onion", "Nashik APMC", "Nashik", 1200, 1500, "quintal", "2024-01-15"),
                ("Onion", "Lasalgaon APMC", "Nashik", 1350, 1600, "quintal", "2024-01-15"),
                ("Rice", "Nagpur APMC", "Nagpur", 2800, 2700, "quintal", "2024-01-15"),
                ("Rice", "Bhandara APMC", "Bhandara", 2900, 2750, "quintal", "2024-01-15"),
                ("Corn", "Amravati APMC", "Amravati", 1850, 1750, "quintal", "2024-01-15"),
                ("Corn", "Akola APMC", "Akola", 1900, 1800, "quintal", "2024-01-15"),
                # Historical entries (older dates)
                ("Chilli", "Ramtek APMC", "Nagpur", 8800, 8200, "quintal", "2023-12-15"),
                ("Chilli", "Ramtek APMC", "Nagpur", 8200, 7800, "quintal", "2023-11-15"),
                ("Wheat", "Nagpur APMC", "Nagpur", 2080, 2000, "quintal", "2023-12-15"),
                ("Wheat", "Nagpur APMC", "Nagpur", 2000, 1950, "quintal", "2023-11-15"),
                ("Soybean", "Nagpur APMC", "Nagpur", 4100, 3900, "quintal", "2023-12-15"),
                ("Cotton", "Wardha APMC", "Wardha", 6800, 6500, "quintal", "2023-12-15"),
            ]
            conn.executemany(
                "INSERT INTO market_prices (crop_name, market, district, price, prev_price, unit, price_date) VALUES (?,?,?,?,?,?,?)",
                seed_prices
            )
            print(f"[SEED] {len(seed_prices)} market price records seeded")

        conn.commit()
    finally:
        conn.close()


@app.on_event("startup")
def startup():
    init_db()
    seed_initial_data()
    print("[AgriFlow API v2.0] Ready on http://0.0.0.0:8001")
    print("[Admin Panel] http://localhost:8001/admin-panel")


if __name__ == "__main__":
    init_db()
    seed_initial_data()
    print("[AgriFlow API v2.0] Ready on http://0.0.0.0:8001")
    print("[Admin Panel] http://localhost:8001/admin-panel")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
