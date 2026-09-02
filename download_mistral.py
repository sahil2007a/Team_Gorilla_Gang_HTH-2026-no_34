"""
AgriFlow — Local Mistral-7B Model Weights Downloader with Auto-Resume
"""
import os
import sys
import time
from pathlib import Path
from huggingface_hub import hf_hub_download

# Fix Windows console utf-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"
TARGET_DIR = Path(__file__).parent / "models" / "Mistral-7B-Instruct-v0.3"
TARGET_DIR.mkdir(parents=True, exist_ok=True)

WEIGHT_FILES = [
    "model-00001-of-00003.safetensors",
    "model-00002-of-00003.safetensors",
    "model-00003-of-00003.safetensors",
]

def download_weights():
    print("=" * 60)
    print("AGRIFLOW MISTRAL-7B MODEL DOWNLOADER (WITH RESUME)")
    print("=" * 60)
    print(f"Destination: {TARGET_DIR}")
    print(f"Source Repo: {REPO_ID}")
    print("=" * 60)

    for idx, fname in enumerate(WEIGHT_FILES, 1):
        target_path = TARGET_DIR / fname
        # If file is complete (approx > 4GB)
        if target_path.exists() and target_path.stat().st_size > 4_000_000_000:
            sz_gb = round(target_path.stat().st_size / (1024**3), 2)
            print(f"[{idx}/{len(WEIGHT_FILES)}] {fname} already complete ({sz_gb} GB). Skipping.")
            continue

        success = False
        attempts = 0
        max_attempts = 10

        while not success and attempts < max_attempts:
            attempts += 1
            print(f"\n[{idx}/{len(WEIGHT_FILES)}] Downloading {fname} (Attempt {attempts}/{max_attempts})...")
            try:
                hf_hub_download(
                    repo_id=REPO_ID,
                    filename=fname,
                    local_dir=str(TARGET_DIR),
                    force_download=False,
                    resume_download=True,
                )
                print(f"[{idx}/{len(WEIGHT_FILES)}] Downloaded {fname} successfully!")
                success = True
            except Exception as e:
                print(f"Network glitch while downloading {fname}: {e}")
                print("Retrying in 5 seconds...")
                time.sleep(5)

        if not success:
            print(f"Failed to download {fname} after {max_attempts} attempts.")
            return False

    print("\n" + "=" * 60)
    print("ALL MISTRAL-7B MODEL WEIGHTS DOWNLOADED SUCCESSFULLY!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    download_weights()
