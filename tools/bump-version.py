#!/usr/bin/env python3
"""Pone un número de versión nuevo en los enlaces a estilos, scripts, audios y logo.

Así, cada vez que se publica, los navegadores descargan los archivos nuevos en lugar
de usar los guardados en caché. Ejecútalo antes de cada commit que vayas a publicar:

    python3 tools/bump-version.py
"""
import re, time, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
v = time.strftime('%Y%m%d%H%M')
idx = root / 'index.html'
s = idx.read_text(encoding='utf-8')
s = re.sub(r'((?:href|src)="(?:css|js)/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={v}"', s)
s = re.sub(r"window\.ASSET_V = '[^']*'", f"window.ASSET_V = '{v}'", s)
idx.write_text(s, encoding='utf-8')
print('versión', v)
