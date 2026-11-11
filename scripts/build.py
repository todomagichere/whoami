"""Copy the static site into the deployment directory."""
from pathlib import Path
import shutil
import os
import re

root = Path(__file__).resolve().parent.parent
output = root / "dist"
if output.exists():
    shutil.rmtree(output)
shutil.copytree(root / "public", output)
version = os.environ.get("GITHUB_SHA", "development")
if not re.fullmatch(r"[a-zA-Z0-9_-]+", version):
    raise ValueError("Invalid application version")
index = output / "index.html"
html = index.read_text(encoding="utf-8").replace(
    '<meta name="app-version" content="development">',
    f'<meta name="app-version" content="{version}">',
)
if version != "development":
    html = re.sub(r'((?:src|href)="(?:[a-z0-9-]+\.js|styles\.css))(?:\?[^" ]*)?("[^>]*>)',
                  lambda match: f'{match.group(1)}?v={version}{match.group(2)}', html)
index.write_text(html, encoding="utf-8")
print("Static site prepared in dist/")
