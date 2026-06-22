from pathlib import Path
from uuid import uuid4

STORAGE_DIR = Path(__file__).resolve().parents[1] / '..' / '..' / 'storage'
STORAGE_DIR = STORAGE_DIR.resolve()
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

def save_upload(file_bytes: bytes, filename: str) -> Path:
    file_id = uuid4().hex
    target_path = STORAGE_DIR / f"{file_id}_{Path(filename).name}"
    target_path.write_bytes(file_bytes)
    return target_path
