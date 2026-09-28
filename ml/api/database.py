"""
AgriFlow Database — SQLite schema + connection helpers.
Easily swappable to PostgreSQL by changing DB_URL and psycopg2 adapter.
"""
import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "agriflow.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = get_conn()
    c = conn.cursor()

    # ── Farmers ──────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS farmers (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        mobile      TEXT    NOT NULL UNIQUE,
        aadhaar     TEXT,
        village     TEXT    NOT NULL,
        district    TEXT    NOT NULL,
        state       TEXT    NOT NULL DEFAULT 'Maharashtra',
        password_hash TEXT  NOT NULL,
        token       TEXT,
        created_at  TEXT    DEFAULT (datetime('now'))
    )""")

    # ── Farmer Crops ─────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS farmer_crops (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id   INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
        crop_name   TEXT    NOT NULL,
        field_name  TEXT,
        acreage     REAL,
        sown_date   TEXT,
        created_at  TEXT    DEFAULT (datetime('now'))
    )""")

    # ── Scan Results ─────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS scan_results (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id           INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
        leaf_detected       INTEGER NOT NULL DEFAULT 0,
        image_quality       TEXT,
        crop_name           TEXT,
        crop_confidence     REAL,
        health_status       TEXT,
        disease_name        TEXT,
        disease_confidence  REAL,
        severity            TEXT,
        cause               TEXT,
        analysis            TEXT,
        action              TEXT,
        recommendations     TEXT,   -- JSON array stored as text
        message             TEXT,
        created_at          TEXT    DEFAULT (datetime('now'))
    )""")

    # ── Market Prices ─────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS market_prices (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name   TEXT    NOT NULL,
        market      TEXT    NOT NULL,
        district    TEXT    NOT NULL,
        state       TEXT    NOT NULL DEFAULT 'Maharashtra',
        price       REAL    NOT NULL,
        prev_price  REAL,
        unit        TEXT    NOT NULL DEFAULT 'quintal',
        price_date  TEXT    NOT NULL DEFAULT (date('now')),
        updated_at  TEXT    DEFAULT (datetime('now'))
    )""")

    # ── Admin Users ───────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS admin_users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        username    TEXT    NOT NULL UNIQUE,
        password_hash TEXT  NOT NULL,
        created_at  TEXT    DEFAULT (datetime('now'))
    )""")

    # ── Farmer Finances (Income & Expenses) ──────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS farmer_finances (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id   INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
        type        TEXT    NOT NULL,  -- 'income' or 'expense'
        category    TEXT    NOT NULL,
        amount      REAL    NOT NULL,
        crop_name   TEXT,
        description TEXT,
        entry_date  TEXT    NOT NULL DEFAULT (date('now')),
        created_at  TEXT    DEFAULT (datetime('now'))
    )""")

    # ── Community Mandi Trades (Real Peer-to-Peer Trades) ────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS community_trades (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_name         TEXT    NOT NULL,
        village             TEXT    NOT NULL,
        district            TEXT    NOT NULL,
        crop_name           TEXT    NOT NULL,
        variety             TEXT,
        price_per_kg        INTEGER NOT NULL,
        price_per_quintal   INTEGER NOT NULL,
        mandi_name          TEXT    NOT NULL,
        quantity_sold       TEXT    NOT NULL,
        time_ago            TEXT    DEFAULT 'Just now',
        verified            INTEGER DEFAULT 1,
        created_at          TEXT    DEFAULT (datetime('now'))
    )""")

    # Check if community_trades has records, if not seed initial real trades for Nagpur & Ramtek
    existing = c.execute("SELECT COUNT(*) as cnt FROM community_trades").fetchone()["cnt"]
    if existing == 0:
        real_trades = [
            ("Yatharth Thakare", "Mansar, Ramtek", "Nagpur", "Tomato", "Hybrid Desi Red", 30, 3000, "Ramtek APMC Mandi", "25 Crates (625 kg)", "1 hour ago", 1),
            ("Atharv Thakare", "Ramtek", "Nagpur", "Cotton (Kapas)", "H-4 Long Staple", 75, 7500, "Nagpur APMC Mandi (Kalamna)", "14 Quintals", "3 hours ago", 1),
            ("Sakshi Charlewar", "Ramtek", "Nagpur", "Soybean", "JS-335 Clean Grade", 49, 4900, "Hingna APMC Mandi", "20 Quintals", "5 hours ago", 1),
            ("Ramesh Patil", "Saoner", "Nagpur", "Green Chilli", "G4 Hot Green", 62, 6200, "Kalmeshwar APMC Mandi", "8 Bags (320 kg)", "Today, 10:45 AM", 1),
            ("Gajanan Deshmukh", "Katol", "Nagpur", "Nagpur Santra (Orange)", "Grade A Mandarin", 42, 4200, "Katol APMC Mandi", "40 Crates", "Today, 08:30 AM", 1),
            ("Pravin Meshram", "Umred", "Nagpur", "Paddy / Rice", "Wada Kolam", 32, 3200, "Umred APMC Mandi", "18 Quintals", "Today, 09:15 AM", 1),
            ("Nilesh Bhoyar", "Ramtek", "Nagpur", "Wheat (Sharbati)", "Sharbati Gold Grade", 24, 2400, "Ramtek APMC Mandi", "22 Quintals", "Today, 11:00 AM", 1),
        ]
        c.executemany("""
            INSERT INTO community_trades (
                farmer_name, village, district, crop_name, variety,
                price_per_kg, price_per_quintal, mandi_name, quantity_sold, time_ago, verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, real_trades)

    # ── IoT Sensor Readings ──────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id     TEXT    NOT NULL DEFAULT 'ESP32-SOIL-001',
        soil_moisture REAL    NOT NULL,
        temperature   REAL    NOT NULL,
        humidity      REAL    NOT NULL,
        created_at    TEXT    DEFAULT (datetime('now'))
    )""")

    conn.commit()
    conn.close()
    print("[DB] Schema initialised at", DB_PATH)


def row_to_dict(row) -> dict:
    return dict(row) if row else None


def rows_to_list(rows) -> list:
    return [dict(r) for r in rows]
