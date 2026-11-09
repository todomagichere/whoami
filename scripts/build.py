"""Copy the static site into the deployment directory."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
shutil.copytree(root / "public", root / "dist", dirs_exist_ok=True)
print("Static site prepared in dist/")
