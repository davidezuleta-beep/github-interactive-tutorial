/* Utilities shared by the whole simulator. */
window.GH = window.GH || {};
(function (GH) {
  'use strict';

  // ---------- Event bus ----------
  const listeners = {};
  GH.bus = {
    on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); return () => GH.bus.off(name, fn); },
    off(name, fn) { listeners[name] = (listeners[name] || []).filter(f => f !== fn); },
    emit(name, data) { (listeners[name] || []).slice().forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); (listeners['*'] || []).forEach(fn => fn(name, data)); }
  };

  // ---------- HTML helpers ----------
  GH.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  GH.icon = function (name, size, cls) {
    size = size || 16;
    const key = size >= 24 && window.OCTICONS[name + '@24'] ? name + '@24' : name;
    const d = window.OCTICONS[key] || window.OCTICONS['dot-fill'];
    const vb = key.endsWith('@24') ? 24 : 16;
    const w = Math.round(d.w * size / vb);
    return `<svg class="octicon octicon-${name} ${cls || ''}" viewBox="0 0 ${d.w} ${vb}" width="${w}" height="${size}" aria-hidden="true">${d.p}</svg>`;
  };

  // ---------- Avatars (generated, no external images) ----------
  const palette = ['#1f6feb', '#8957e5', '#bf4b8a', '#d1242f', '#bc4c00', '#9a6700', '#1a7f37', '#0969da', '#6639ba', '#0e8a16'];
  function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); }
  // Logo de Biniac: foto de perfil de la cuenta de práctica (la experiencia es de Biniac).
  GH.brandLogo = 'assets/biniac-logo.png?v=' + (window.ASSET_V || '1');
  GH.avatar = function (login, size, square) {
    size = size || 20;
    const me = GH.store && GH.store.state && GH.store.state.user && GH.store.state.user.login;
    if (login && login === me) {
      return `<span class="avatar avatar-brand ${square ? 'square' : ''}" style="width:${size}px;height:${size}px" title="${GH.esc(login)}"><img src="${GH.brandLogo}" alt="" width="${size}" height="${size}" decoding="async"></span>`;
    }
    const h = hash(login || '?');
    const color = palette[h % palette.length];
    // identicon-ish 5x5 symmetric pattern
    let cells = '';
    for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
      if ((h >> (y * 3 + x)) & 1) {
        cells += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`;
        if (x < 2) cells += `<rect x="${5 - x}" y="${y + 1}" width="1" height="1"/>`;
      }
    }
    return `<span class="avatar ${square ? 'square' : ''}" style="width:${size}px;height:${size}px;background:#e6edf3" title="${GH.esc(login)}"><svg viewBox="0 0 7 7" shape-rendering="crispEdges"><g fill="${color}">${cells}</g></svg></span>`;
  };

  // ---------- Time ----------
  GH.now = () => Date.now();
  GH.timeAgo = function (ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 45) return 'now';
    const m = Math.round(s / 60);
    if (m < 60) return m === 1 ? '1 minute ago' : `${m} minutes ago`;
    const h = Math.round(m / 60);
    if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
    const d = Math.round(h / 24);
    if (d < 30) return d === 1 ? 'yesterday' : `${d} days ago`;
    const mo = Math.round(d / 30);
    if (mo < 12) return mo === 1 ? 'last month' : `${mo} months ago`;
    const y = Math.round(mo / 12);
    return y === 1 ? 'last year' : `${y} years ago`;
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  GH.fmtDate = function (ts) { const d = new Date(ts); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  GH.bytes = function (n) { if (n < 1024) return n + ' Bytes'; if (n < 1024 * 1024) return (n / 1024).toFixed(2).replace(/\.00$/, '') + ' KB'; return (n / 1024 / 1024).toFixed(2) + ' MB'; };

  GH.sha = function () {
    let s = '';
    for (let i = 0; i < 40; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    return s;
  };
  GH.slug = function (name) {
    return String(name || '').trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
  };
  GH.clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------- Minimal Markdown ----------
  function inline(t) {
    t = GH.esc(t);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    t = t.replace(/(^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
      const safe = /^(https?:|#|mailto:)/i.test(url) ? url : '#';
      return `<a href="${safe}" ${/^https?:/.test(safe) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${txt}</a>`;
    });
    return t;
  }
  GH.markdown = function (src) {
    const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
    let html = '', i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line)) {
        const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++; html += `<pre><code>${GH.esc(buf.join('\n'))}</code></pre>`; continue;
      }
      const hm = line.match(/^(#{1,6})\s+(.*)$/);
      if (hm) { const n = hm[1].length; html += `<h${n}>${inline(hm[2])}</h${n}>`; i++; continue; }
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { html += '<hr>'; i++; continue; }
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
        html += `<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`; continue;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        html += '<ul>';
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          let item = lines[i++].replace(/^\s*[-*+]\s+/, '');
          const task = item.match(/^\[( |x)\]\s+(.*)$/i);
          if (task) item = `<input type="checkbox" disabled ${task[1].toLowerCase() === 'x' ? 'checked' : ''}> ` + inline(task[2]); else item = inline(item);
          html += `<li>${item}</li>`;
        }
        html += '</ul>'; continue;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        html += '<ol>';
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*\d+[.)]\s+/, ''))}</li>`;
        html += '</ol>'; continue;
      }
      if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:-|]+\|\s*$/.test(lines[i + 1])) {
        const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const head = cells(line); i += 2;
        html += '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
        while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) html += '<tr>' + cells(lines[i++]).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
        html += '</tbody></table>'; continue;
      }
      if (!line.trim()) { i++; continue; }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*[-*+]\s+|\s*\d+[.)]\s+|\|)/.test(lines[i])) buf.push(lines[i++]);
      if (!buf.length) buf.push(lines[i++]);
      html += `<p>${inline(buf.join(' '))}</p>`;
    }
    return html;
  };

  // ---------- Line diff (LCS) ----------
  GH.diffLines = function (a, b) {
    const A = a == null ? [] : String(a).split('\n');
    const B = b == null ? [] : String(b).split('\n');
    if (A.length && A[A.length - 1] === '' && a.endsWith('\n')) A.pop();
    if (B.length && B[B.length - 1] === '' && b.endsWith('\n')) B.pop();
    const n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { out.push({ t: ' ', a: i + 1, b: j + 1, s: A[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: '-', a: i + 1, s: A[i] }); i++; }
      else { out.push({ t: '+', b: j + 1, s: B[j] }); j++; }
    }
    while (i < n) { out.push({ t: '-', a: i + 1, s: A[i] }); i++; }
    while (j < m) { out.push({ t: '+', b: j + 1, s: B[j] }); j++; }
    return out;
  };
  GH.diffStats = function (a, b) {
    const d = GH.diffLines(a, b);
    return { add: d.filter(x => x.t === '+').length, del: d.filter(x => x.t === '-').length };
  };

  GH.copyText = function (text) {
    try { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {}); } catch (e) { /* ignore */ }
  };

  // ---------- Safe storage ----------
  GH.storage = {
    get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
})(window.GH);
