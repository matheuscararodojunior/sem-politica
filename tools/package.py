#!/usr/bin/env python3
"""Gera o ZIP de publicação (Chrome Web Store / Firefox AMO).

Uso: python3 tools/package.py
Saída: ../dist/<nome>-v<versao>.zip (sem README, licença, tools/, data/ etc.)
"""
import json
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = os.path.basename(ROOT)
with open(os.path.join(ROOT, 'manifest.json')) as f:
    VERSION = json.load(f)['version']

EXCLUDE_DIRS = {'.git', 'tools', 'data', 'store', '__pycache__', 'icons_src'}
EXCLUDE_FILES = {'icon.svg', 'README.md', 'LICENSE', '.gitignore'}
EXCLUDE_SUFFIX = ('.zip', '.crx', '.pem')

DIST = os.path.join(os.path.dirname(ROOT), 'dist')
os.makedirs(DIST, exist_ok=True)
out = os.path.join(DIST, f'{NAME}-v{VERSION}.zip')

files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
    for fn in filenames:
        if fn in EXCLUDE_FILES or fn.endswith(EXCLUDE_SUFFIX):
            continue
        full = os.path.join(dirpath, fn)
        files.append((full, os.path.relpath(full, ROOT)))
files.sort(key=lambda x: x[1])

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for full, rel in files:
        z.write(full, rel)

print(f'{out}  ({len(files)} arquivos, {os.path.getsize(out) // 1024} KB)')
