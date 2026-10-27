"""Build the dependency-free browser edition shared by the desktop shell."""
from pathlib import Path
import base64, re
root = Path(__file__).parent
src = root / 'src'
html = (src / 'index.html').read_text()
css = (src / 'style.css').read_text()
types = {'.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.png': 'image/png'}
def inline(m):
    path = src / m.group(1)
    return "url('data:" + types[path.suffix] + ";base64," + base64.b64encode(path.read_bytes()).decode() + "')"
css = re.sub(r"url\('((?:fonts|looks)/[^']+)'\)", inline, css)
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>')
for name in ('engine.js', 'app.js'):
    html = html.replace(f'<script src="{name}"></script>', '<script>' + (src / name).read_text() + '</script>')
(root / 'FAULT.html').write_text(html)
print(root / 'FAULT.html')
