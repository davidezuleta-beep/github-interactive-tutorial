/* Views: commit history, commit detail, branches. Shared diff renderer. */
(function (GH) {
  'use strict';
  const { esc, icon, avatar } = GH;
  const S = () => GH.store;
  const V = GH.views, A = GH.actions;
  const href = (...a) => GH.router.href(...a);

  // ---------- Diff renderer ----------
  function hunks(ops, ctx) {
    const out = []; let cur = null;
    const changed = ops.map((o, i) => (o.t !== ' ' ? i : -1)).filter(i => i >= 0);
    if (!changed.length) return out;
    const keep = new Set();
    changed.forEach(i => { for (let k = Math.max(0, i - ctx); k <= Math.min(ops.length - 1, i + ctx); k++) keep.add(k); });
    let last = -2;
    [...keep].sort((a, b) => a - b).forEach(i => {
      if (i !== last + 1) { cur = { lines: [] }; out.push(cur); }
      cur.lines.push(ops[i]); last = i;
    });
    out.forEach(h => {
      const a = h.lines.find(l => l.a), b = h.lines.find(l => l.b);
      h.aStart = a ? a.a : 0; h.bStart = b ? b.b : 0;
      h.aLen = h.lines.filter(l => l.t !== '+').length; h.bLen = h.lines.filter(l => l.t !== '-').length;
    });
    return out;
  }
  function statBar(add, del) {
    const total = add + del; let a = 0, d = 0;
    if (total) { a = Math.round(add / total * 5); d = Math.min(5 - a, Math.round(del / total * 5)); if (add && !a) a = 1; if (del && !d && a < 5) d = 1; }
    let s = ''; for (let i = 0; i < 5; i++) s += `<i class="${i < a ? 'a' : i < a + d ? 'd' : ''}"></i>`;
    return `<span class="diff-stat">${s}</span>`;
  }
  GH.statBar = statBar;
  GH.renderDiff = function (files, opts) {
    opts = opts || {};
    return files.map((f, idx) => {
      const ops = f.binary ? [] : GH.diffLines(f.before, f.after);
      const add = ops.filter(o => o.t === '+').length, del = ops.filter(o => o.t === '-').length;
      const isNew = f.before == null && !f.existed, deleted = f.after == null && !f.binary && (f.deleted || f.exists === false);
      let body;
      if (f.binary) body = `<div class="diff-binary">Binary file not shown.</div>`;
      else if (!ops.length || (!add && !del)) body = `<div class="diff-binary">${deleted ? 'This file was deleted.' : 'Empty file.'}</div>`;
      else body = `<table class="diff-table">${hunks(ops, 3).map(h => `<tr class="hunk"><td class="n">…</td><td class="n">…</td><td class="c">@@ -${h.aStart},${h.aLen} +${h.bStart},${h.bLen} @@</td></tr>` + h.lines.map(l => `<tr class="${l.t === '+' ? 'add' : l.t === '-' ? 'del' : ''}"><td class="n">${l.a || ''}</td><td class="n">${l.b || ''}</td><td class="c"><span class="mk">${l.t === ' ' ? ' ' : l.t}</span>${esc(l.s) || ' '}</td></tr>`).join('')).join('')}</table>`;
      return `<div class="diff-file" data-tour="diff-file-${idx}"><div class="diff-file-head">${icon('chevron-down', 16, 'muted')}<span>${f.binary ? 'BIN' : add + del}</span>${f.binary ? '' : statBar(add, del)}<span class="bold" style="color:var(--fgColor-default)">${esc(f.path)}</span>${GH.ui.copyBtn(f.path, 'Copy file name')}${isNew ? '<span class="Label Label--success">new</span>' : ''}${deleted ? '<span class="Label Label--danger">deleted</span>' : ''}<span class="ml-auto"></span>${opts.viewHref && !deleted ? `<a class="btn btn-sm" href="${opts.viewHref(f.path)}">View file</a>` : ''}</div>${body}</div>`;
    }).join('');
  };
  GH.diffTotals = function (files) {
    let add = 0, del = 0;
    files.forEach(f => { if (f.binary) return; const s = GH.diffStats(f.before, f.after); add += s.add; del += s.del; });
    return { add, del };
  };

  // ---------- Commits list ----------
  V.commits = function (rt) {
    const r = rt.repo; const b = rt.branch || r.defaultBranch;
    if (!S().branch(r, b)) return V.notFound(rt);
    const pathFilter = rt.query.path || '';
    let list = S().history(r, b);
    if (pathFilter) list = list.filter(c => c.changes.some(ch => ch.path === pathFilter || ch.path.startsWith(pathFilter + '/')));
    const groups = [];
    list.forEach(c => { const d = GH.fmtDate(c.date); let g = groups[groups.length - 1]; if (!g || g.d !== d) groups.push(g = { d, items: [] }); g.items.push(c); });
    return {
      header: { repo: r, tab: 'code' }, title: `Commits · ${r.owner}/${r.name}`,
      html: `<div class="container-xl" data-tour="commits-page">
        <h1 class="page-title" style="padding-bottom:8px;border-bottom:1px solid var(--borderColor-default);margin-bottom:16px">Commits</h1>
        <div class="flex gap-2 mb-3">${GH.branchBtn(r, b, 'commits', '')}${pathFilter ? `<span class="muted">History for <a href="${href(r.owner, r.name, 'tree', b)}">${esc(r.name)}</a> / <strong style="color:var(--fgColor-default)">${esc(pathFilter)}</strong></span>` : ''}<span class="ml-auto"></span><button class="btn" data-action="notsim" data-what="Filtro por autor">${icon('people')} All users ${icon('triangle-down')}</button><button class="btn" data-action="notsim" data-what="Filtro por fecha">${icon('calendar')} All time ${icon('triangle-down')}</button></div>
        <div data-tour="commit-list">${groups.map((g, gi) => `<div class="commit-group"><div class="commit-group-title">${icon('git-commit')} Commits on ${g.d}</div>
          <div class="Box">${g.items.map((c, i) => `<div class="commit-item ${i ? '' : ''}" style="${i ? 'border-top:1px solid var(--borderColor-muted)' : ''}" ${gi === 0 && i === 0 ? 'data-tour="commit-first"' : ''}><div class="flex-1" style="min-width:0"><a class="title" href="${href(r.owner, r.name, 'commit', c.sha)}" ${gi === 0 && i === 0 ? 'data-tour="commit-first-link"' : ''}>${esc(c.message)}</a><div class="byline">${avatar(c.author, 16)}<a class="link-muted bold" href="#/${esc(c.author)}">${esc(c.author)}</a> ${c.author === S().me() ? 'authored' : 'committed'} ${GH.timeAgo(c.date)}</div></div>
            <div class="right">${c.author === S().me() ? '<span class="Label Label--success">Verified</span>' : ''}<a class="sha-link" href="${href(r.owner, r.name, 'commit', c.sha)}">${c.sha.slice(0, 7)}</a>${GH.ui.copyBtn(c.sha, 'Copy full SHA')}<a class="btn btn-invisible btn-sm btn-icon" href="${href(r.owner, r.name, 'tree', c.sha.slice(0, 7))}" aria-label="Browse repository at this point" title="Browse repository at this point">${icon('code')}</a></div></div>`).join('')}</div></div>`).join('') || `<div class="Box blankslate">${icon('git-commit', 24)}<h3>No commits history</h3></div>`}</div>
      </div>`
    };
  };

  // ---------- Commit detail ----------
  V.commit = function (rt) {
    const r = rt.repo; const c = S().commitByPrefix(r, rt.sha);
    if (!c) return V.notFound(rt);
    const files = c.changes.map(ch => ({ path: ch.path, before: ch.before, after: ch.after, binary: ch.binary, existed: ch.before != null && !ch.isNew, exists: !ch.deleted, deleted: ch.deleted }));
    const tot = GH.diffTotals(files);
    const branches = S().branchNames(r).filter(b => S().reachable(r, r.branches[b].head).has(c.sha));
    return {
      header: { repo: r, tab: 'code' }, title: `${c.message} · ${r.owner}/${r.name}@${c.sha.slice(0, 7)}`,
      html: `<div class="container-xl" data-tour="commit-page">
        <div class="flex mb-3"><h1 class="page-title" style="font-size:24px">Commit <span class="mono muted" style="font-size:20px">${c.sha.slice(0, 7)}</span></h1><span class="ml-auto"></span><a class="btn" href="${href(r.owner, r.name, 'tree', c.sha.slice(0, 7))}" data-tour="browse-files">${icon('code')} Browse files</a></div>
        <div class="Box mb-3"><div style="padding:16px"><h2 class="f4" style="font-size:20px">${esc(c.message)}</h2>${c.description ? `<p class="muted mt-2" style="white-space:pre-wrap">${esc(c.description)}</p>` : ''}
          <div class="flex gap-2 mt-3 muted f6" style="flex-wrap:wrap">${avatar(c.author, 20)}<a class="link-primary bold" href="#/${esc(c.author)}">${esc(c.author)}</a> committed ${GH.timeAgo(c.date)} ${c.author === S().me() ? '<span class="Label Label--success">Verified</span>' : ''}<span class="ml-auto"></span>${c.parents.length ? `${c.parents.length} parent${c.parents.length > 1 ? 's' : ''} ${c.parents.map(p => `<a class="mono link-muted" href="${href(r.owner, r.name, 'commit', p)}">${p.slice(0, 7)}</a>`).join(' + ')}` : '0 parents'} · commit <span class="mono" style="color:var(--fgColor-default)">${c.sha.slice(0, 7)}</span></div>
          ${branches.length ? `<div class="flex gap-1 mt-2 f6 muted">${icon('git-branch', 12)} ${branches.map(b => `<a class="branch-name" href="${href(r.owner, r.name, 'tree', b)}">${esc(b)}</a>`).join(' ')}</div>` : ''}
        </div></div>
        <p class="mb-3" data-tour="commit-stats">${icon('file-diff', 16, 'muted')} Showing <strong>${files.length} changed file${files.length === 1 ? '' : 's'}</strong> with <strong class="color-success">${tot.add} additions</strong> and <strong class="color-danger">${tot.del} deletions</strong>.</p>
        <div data-tour="commit-diff">${GH.renderDiff(files, { viewHref: (p) => href(r.owner, r.name, 'blob', c.sha.slice(0, 7), p) })}</div>
      </div>`
    };
  };

  // ---------- Branches page ----------
  V.branches = function (rt) {
    const r = rt.repo;
    const q = (rt.query.q || '').toLowerCase();
    const names = S().branchNames(r).filter(n => !q || n.toLowerCase().includes(q));
    const row = (n) => {
      const br = r.branches[n]; const head = r.commits[br.head];
      const ahead = n === r.defaultBranch ? 0 : S().ahead(r, r.defaultBranch, n).length;
      const behind = n === r.defaultBranch ? 0 : S().behind(r, r.defaultBranch, n).length;
      const pr = r.pulls.slice().reverse().find(p => p.head === n);
      return `<tr data-tour="branch-row-${esc(n)}"><td><span class="flex gap-1"><a class="branch-name" href="${href(r.owner, r.name, 'tree', n)}">${esc(n)}</a>${GH.ui.copyBtn(n, 'Copy branch name')}</span></td>
        <td class="muted">${head ? `<span class="flex gap-1">${avatar(head.author, 16)} ${GH.timeAgo(head.date)}</span>` : ''}</td>
        <td class="muted f6">${n === r.defaultBranch ? '<span class="Label">Default</span>' : `<span title="${behind} commits behind ${esc(r.defaultBranch)}">${behind}</span> | <span title="${ahead} commits ahead of ${esc(r.defaultBranch)}">${ahead}</span>`}</td>
        <td>${pr ? `<a class="flex gap-1 link-muted" href="${href(r.owner, r.name, 'pull', pr.number)}">${GH.prIcon(pr)} #${pr.number}</a>` : ''}</td>
        <td style="text-align:right">${n !== r.defaultBranch && S().isAdmin(r) ? `<button class="btn btn-invisible btn-sm btn-icon" data-action="deleteBranchRow" data-b="${esc(n)}" aria-label="Delete branch ${esc(n)}">${icon('trash')}</button>` : ''}<button class="btn btn-invisible btn-sm btn-icon" data-action="notsim" data-what="Más opciones de rama" aria-label="More options">${icon('kebab-horizontal')}</button></td></tr>`;
    };
    const head = '<thead><tr><th>Branch</th><th>Updated</th><th>Behind | Ahead</th><th>Pull request</th><th></th></tr></thead>';
    const def = names.filter(n => n === r.defaultBranch), others = names.filter(n => n !== r.defaultBranch);
    return {
      header: { repo: r, tab: 'code' }, title: `Branches · ${r.owner}/${r.name}`,
      html: `<div class="container-xl" data-tour="branches-page">
        <div class="flex mb-3"><h1 class="page-title">Branches</h1><span class="ml-auto"></span>${S().isAdmin(r) ? `<button class="btn btn-primary" data-action="newBranchDialog" data-tour="new-branch-btn">New branch</button>` : ''}</div>
        <nav class="UnderlineNav boxed-tabs mb-3" style="padding-bottom:0"><a class="UnderlineNav-item selected" href="#" data-action="noop">Overview</a><a class="UnderlineNav-item" data-action="notsim" data-what="Filtro de ramas activas">Active</a><a class="UnderlineNav-item" data-action="notsim" data-what="Filtro de ramas inactivas">Stale</a><a class="UnderlineNav-item" data-action="notsim" data-what="Todas las ramas">All</a></nav>
        <div class="input-wrap mb-3">${icon('search')}<input class="form-control" placeholder="Search branches..." value="${esc(rt.query.q || '')}" data-onenter="branchSearch" aria-label="Search branches"></div>
        <h2 class="f5 bold mb-2">Default</h2><table class="file-table with-head mb-3">${head}<tbody>${def.map(row).join('')}</tbody></table>
        <h2 class="f5 bold mb-2 mt-4">Your branches</h2>${others.length ? `<table class="file-table with-head">${head}<tbody>${others.map(row).join('')}</tbody></table>` : `<div class="Box blankslate">${icon('git-branch', 24)}<p>No branches yet. Crea una desde el botón de rama o con <strong>New branch</strong>.</p></div>`}
      </div>`
    };
  };
  A.noop = () => {};
  A.branchSearch = (el) => { const r = GH.router.current.repo; GH.router.go(href(r.owner, r.name, 'branches') + '?q=' + encodeURIComponent(el.value)); };
  A.deleteBranchRow = (el) => {
    const r = GH.router.current.repo; const b = el.getAttribute('data-b');
    S().deleteBranch(r, b); GH.render();
    GH.ui.toast(`Branch <strong>${esc(b)}</strong> deleted`);
  };
  A.newBranchDialog = () => {
    const r = GH.router.current.repo;
    GH.ui.dialog({
      title: 'Create a branch',
      body: `<label class="form-label" for="nb-name">New branch name</label><input class="form-control" id="nb-name" autocomplete="off"><label class="form-label mt-3">Source</label><select class="form-control" id="nb-src">${S().branchNames(r).map(n => `<option ${n === r.defaultBranch ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select><p class="form-hint">La nueva rama empieza como una copia exacta de la rama de origen.</p>`,
      footer: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn btn-primary" data-action="createBranchDialog">Create new branch</button>`
    });
  };
  A.createBranchDialog = () => {
    const r = GH.router.current.repo;
    const name = document.getElementById('nb-name').value.trim().replace(/\s+/g, '-').replace(/[^\w.\-]/g, '-');
    if (!name || r.branches[name]) { GH.ui.toast(name ? 'Ya existe una rama con ese nombre.' : 'Escribe un nombre para la rama.', 'info'); return; }
    S().createBranch(r, name, document.getElementById('nb-src').value);
    S().state.tutorial.branch = name; S().save();
    GH.ui.closeDialog(); GH.render(); GH.ui.toast(`Branch <strong>${esc(name)}</strong> created`);
  };
})(window.GH);
