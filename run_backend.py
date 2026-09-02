"""
AgriFlow Backend Launcher
Run this from anywhere: python run_backend.py
"""
import sys
import os
import socket
from pathlib import Path

# Fix Windows console utf-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add ml directory to sys.path
root_dir = Path(__file__).resolve().parent
ml_dir = root_dir / "ml"
sys.path.insert(0, str(ml_dir))

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

if __name__ == "__main__":
    PORT = 8001
    print("=" * 60)
    print("AGRIFLOW BACKEND CHECK")
    print("=" * 60)
    
    if is_port_in_use(PORT):
        print(f"AgriFlow Backend is ALREADY actively running on port {PORT}!")
        print(f"API Endpoint: http://localhost:{PORT}")
        print(f"In-App Proxy: http://localhost:8002/proxy")
        print("You don't need to run it again — it is ready to receive requests.")
        print("=" * 60)
        sys.exit(0)

    import uvicorn
    print(f"Starting AgriFlow Backend Server on http://0.0.0.0:{PORT} ...")
    print("=" * 60)
    uvicorn.run("api.main:app", host="0.0.0.0", port=PORT, reload=True)
