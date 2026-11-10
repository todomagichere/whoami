"""Copy the static site into the deployment directory."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
output = root / "dist"
if output.exists():
    shutil.rmtree(output)
shutil.copytree(root / "public", output)
print("Static site prepared in dist/")
