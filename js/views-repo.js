/* Views: repository code tab (home, folders, files), editor, new file, upload. */
(function (GH) {
  'use strict';
  const { esc, icon, avatar } = GH;
  const S = () => GH.store;
  const L = GH.L;
  const V = GH.views, A = GH.actions;
  const href = (...a) => GH.router.href(...a);
  const isText = (name) => /\.(md|markdown|txt|csv|tsv|html?|css|js|json|ya?ml|xml|svg|py|rb|java|c|cpp|ts|tsx|jsx|sh|ini|cfg|gitignore)$/i.test(name) || /^(LICENSE|README|\.gitignore|Makefile)$/i.test(name.split('/').pop());

  // ---------- shared bits ----------
  GH.repoUrl = (r) => `https://github.com/${r.owner}/${r.name}`;
  function currentBranch(rt) { return rt.branch || rt.repo.defaultBranch; }
  function branchBtn(r, b, kind, path) {
    return `<button class="btn" data-action="branchMenu" data-kind="${kind}" data-branch="${esc(b)}" data-path="${esc(path || '')}" aria-haspopup="true" data-tour="branch-btn" style="max-width:220px">${icon('git-branch')}<span class="truncate bold">${esc(b)}</span>${icon('triangle-down', 16, 'dropdown-caret')}</button>`;
  }
  GH.branchBtn = branchBtn;
  function lastCommitBar(r, b, c, path, standalone) {
    if (!c) return '';
    const count = S().history(r, b).length;
    const histHref = href(r.owner, r.name, 'commits', b) + (path ? '?path=' + encodeURIComponent(path) : '');
    return `<div class="commit-bar ${standalone ? 'standalone' : ''}" data-tour="commit-bar">${avatar(c.author, 24)}<a class="author" href="#/${esc(c.author)}">${esc(c.author)}</a><a class="msg truncate" href="${href(r.owner, r.name, 'commit', c.sha)}">${esc(c.message)}</a>
      <span class="meta"><a class="sha" href="${href(r.owner, r.name, 'commit', c.sha)}">${c.sha.slice(0, 7)}</a> · ${GH.timeAgo(c.date)}
      <a class="history-link" href="${histHref}" data-tour="history-link" aria-label="Commit history">${icon('history')}<span>${count} Commit${count === 1 ? '' : 's'}</span></a></span></div>`;
  }
  GH.lastCommitBar = lastCommitBar;
  function crumbs(r, b, path, opts) {
    opts = opts || {};
    const parts = path ? path.split('/') : [];
    let acc = '';
    let html = `<a href="${href(r.owner, r.name, 'tree', b)}" data-tour="crumb-root">${esc(r.name)}</a>`;
    parts.forEach((p, i) => {
      acc = acc ? acc + '/' + p : p;
      const last = i === parts.length - 1;
      html += `<span class="sep">/</span>` + (last && !opts.linkLast ? `<span class="current">${esc(p)}</span>` : `<a href="${href(r.owner, r.name, 'tree', b, acc)}">${esc(p)}</a>`);
    });
    if (opts.trailingSlash) html += `<span class="sep">/</span>`;
    return `<nav class="breadcrumb" aria-label="Breadcrumbs" data-tour="breadcrumb">${html}${path ? GH.ui.copyBtn(path, 'Copy path') : ''}</nav>`;
  }
  GH.crumbs = crumbs;

  function pushBanner(r) {
    if (!S().isAdmin(r)) return '';
    const items = S().branchNames(r).filter(b => b !== r.defaultBranch).map(b => {
      const ahead = S().ahead(r, r.defaultBranch, b);
      if (!ahead.length || S().openPullFor(r, b) || r.pulls.some(p => p.head === b && p.state === 'merged' && p.commits && ahead.every(c => p.commits.includes(c.sha)))) return null;
      const last = ahead[ahead.length - 1];
      if (Date.now() - last.date > 3 * 86400000) return null;
      return { b, last };
    }).filter(Boolean);
    return items.map(({ b, last }) => `<div class="flash flash-warn mb-3" data-tour="push-banner">${icon('git-branch', 16, 'muted')}<span class="flex-1"><span class="branch-name">${esc(b)}</span> had recent pushes ${GH.timeAgo(last.date)}</span><button class="btn btn-primary" data-nav="${href(r.owner, r.name, 'compare', r.defaultBranch + '...' + b)}?expand=1" data-tour="compare-pr-btn">${esc(L.comparePr)}</button></div>`).join('');
  }

  function repoTitleRow(r) {
    const admin = S().isAdmin(r);
    return `<div class="repo-title-row" data-tour="repo-title">${avatar(r.owner, 24, !!(S().state.people[r.owner] || {}).org)}<a class="repo-name" href="${href(r.owner, r.name)}">${esc(r.name)}</a><span class="Label" data-tour="repo-visibility-label">${r.visibility === 'private' ? L.private : L.public}</span>${r.forkOf ? `<span class="muted f6 flex gap-1">${icon('repo-forked', 12)} forked from <a href="#/${esc(r.forkOf)}">${esc(r.forkOf)}</a></span>` : ''}
      <div class="actions">
        ${admin ? `<button class="btn btn-sm" data-action="notsim" data-what="Pin">${icon('pin')} Pin</button>` : ''}
        <div class="btn-group"><button class="btn btn-sm" data-action="watchRepo">${icon(r.watching ? 'eye' : 'eye')} ${r.watching ? L.unwatch : L.watch} <span class="Counter">${r.watchers}</span></button><button class="btn btn-sm btn-caret" data-action="notsim" data-what="Opciones de notificación">${icon('triangle-down')}</button></div>
        <div class="btn-group"><button class="btn btn-sm" data-action="forkRepo" ${admin ? 'disabled title="Cannot fork because you own this repository"' : ''}>${icon('repo-forked')} ${L.fork} <span class="Counter">${r.forks}</span></button><button class="btn btn-sm btn-caret" data-action="notsim" data-what="Lista de forks">${icon('triangle-down')}</button></div>
        <div class="btn-group" data-tour="star-btn"><button class="btn btn-sm" data-action="starCurrent">${icon(r.starred ? 'star-fill' : 'star', 16, r.starred ? 'color-attention' : '')} ${r.starred ? L.starred : L.star} <span class="Counter">${r.stars}</span></button><button class="btn btn-sm btn-caret" data-action="notsim" data-what="Listas de estrellas">${icon('triangle-down')}</button></div>
      </div></div>`;
  }
  A.watchRepo = () => { const r = GH.router.current.repo; S().toggleWatch(r); GH.ui.toast(r.watching ? 'Ahora recibirás notificaciones de este repositorio.' : 'Dejaste de seguir este repositorio.', 'info'); GH.render(); };
  A.starCurrent = () => { const r = GH.router.current.repo; S().toggleStar(r); GH.render(); if (r.starred) GH.ui.toast(`Marcaste <strong>${esc(r.name)}</strong> con una estrella ⭐`); };
  A.forkRepo = () => {
    const r = GH.router.current.repo;
    GH.ui.dialog({
      title: 'Create a new fork', wide: true,
      body: `<p class="muted mb-3">A <em>fork</em> is a copy of a repository. Forking a repository allows you to freely experiment with changes without affecting the original project.</p>
        <div class="flex gap-2"><div><label class="form-label">${L.owner} *</label><button class="btn">${avatar(S().me(), 20)} ${esc(S().me())}</button></div><div style="font-size:24px;padding-top:24px" class="muted">/</div><div class="flex-1"><label class="form-label">${L.repoName} *</label><input class="form-control" value="${esc(r.name)}" readonly></div></div>
        <p class="muted f6 mt-3">${icon('info', 12)} En el simulador, el fork se crea como una copia en tu cuenta.</p>`,
      footer: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn btn-primary" data-action="doFork">Create fork</button>`
    });
  };
  A.doFork = () => { const f = S().fork(GH.router.current.repo); GH.ui.closeDialog(); GH.router.go(href(f.owner, f.name)); GH.ui.toast('Fork created'); };

  function sidebar(r, b) {
    const files = S().files(r, b);
    const hasReadme = !!files['README.md'];
    const exts = {};
    Object.keys(files).forEach(p => { const e = (p.split('.').pop() || '').toLowerCase(); const lang = { md: 'Markdown', html: 'HTML', css: 'CSS', js: 'JavaScript', csv: 'CSV', py: 'Python', json: 'JSON' }[e]; if (lang) exts[lang] = (exts[lang] || 0) + (files[p].size || 1); });
    const total = Object.values(exts).reduce((a, x) => a + x, 0) || 1;
    const colors = { Markdown: '#083fa1', HTML: '#e34c26', CSS: '#663399', JavaScript: '#f1e05a', CSV: '#237346', Python: '#3572A5', JSON: '#292929' };
    return `<div class="BorderGrid" data-tour="about">
      <div class="BorderGrid-cell"><h2>About ${S().isAdmin(r) ? `<button class="btn btn-invisible btn-sm btn-icon" data-action="editAbout" aria-label="Edit repository details">${icon('gear')}</button>` : ''}</h2>
        ${r.description ? `<p class="about-desc">${esc(r.description)}</p>` : `<p class="muted"><em>No description, website, or topics provided.</em></p>`}
        ${r.topics.length ? `<div class="flex gap-1 mt-2" style="flex-wrap:wrap">${r.topics.map(t => `<span class="Label Label--accent" style="background:var(--bgColor-accent-muted);border-color:transparent">${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="side-list">
          ${hasReadme ? `<a href="#readme">${icon('book')} Readme</a>` : ''}
          <a href="${href(r.owner, r.name, 'commits', b)}">${icon('pulse')} Activity</a>
          <a href="#" data-action="starCurrent">${icon('star')} <strong>${r.stars}</strong> stars</a>
          <a href="#" data-action="watchRepo">${icon('eye')} <strong>${r.watchers}</strong> watching</a>
          <a href="#" data-action="notsim" data-what="Lista de forks">${icon('repo-forked')} <strong>${r.forks}</strong> forks</a>
        </div></div>
      <div class="BorderGrid-cell"><h2>Releases</h2><p class="muted f6">No releases published</p>${S().isAdmin(r) ? `<a class="f6" href="#" data-action="notsim" data-what="Releases (versiones publicadas)">Create a new release</a>` : ''}</div>
      <div class="BorderGrid-cell"><h2>Packages</h2><p class="muted f6">No packages published</p></div>
      ${Object.keys(exts).length ? `<div class="BorderGrid-cell"><h2>Languages</h2><div class="lang-bar">${Object.entries(exts).map(([l, n]) => `<span style="width:${n / total * 100}%;background:${colors[l]}"></span>`).join('')}</div><div class="flex gap-3 f6" style="flex-wrap:wrap">${Object.entries(exts).map(([l, n]) => `<span class="flex gap-1"><span class="lang-dot" style="background:${colors[l]}"></span><strong>${l}</strong> <span class="muted">${(n / total * 100).toFixed(1)}%</span></span>`).join('')}</div></div>` : ''}
    </div>`;
  }
  A.editAbout = () => {
    const r = GH.router.current.repo;
    GH.ui.dialog({
      title: 'Edit repository details',
      body: `<label class="form-label">${L.description}</label><textarea class="form-control" id="ab-desc" style="min-height:70px">${esc(r.description)}</textarea><label class="form-label mt-3">Topics <span class="muted" style="font-weight:400">(separate with spaces)</span></label><input class="form-control" id="ab-topics" value="${esc(r.topics.join(' '))}">`,
      footer: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn btn-primary" data-action="saveAbout">Save changes</button>`
    });
  };
  A.saveAbout = () => { const r = GH.router.current.repo; r.description = document.getElementById('ab-desc').value.trim(); r.topics = document.getElementById('ab-topics').value.trim().split(/\s+/).filter(Boolean).map(t => t.toLowerCase()); S().save(); GH.ui.closeDialog(); GH.render(); };

  function fileTable(r, b, path, entries, withHead) {
    const fresh = GH._freshPaths || [];
    const rows = entries.map(e => `<tr class="${fresh.includes(e.path) ? 'fresh' : ''}" data-tour="row-${esc(e.name)}"><td><div class="name">${e.type === 'dir' ? icon('file-directory-fill', 16, 'icon-dir') : icon('file', 16, 'icon-file')}<a href="${href(r.owner, r.name, e.type === 'dir' ? 'tree' : 'blob', b, e.path)}" data-tour="file-${esc(e.name)}">${esc(e.name)}</a></div></td>
      <td class="cmsg">${e.commit ? `<a href="${href(r.owner, r.name, 'commit', e.commit.sha)}" class="truncate" style="display:block;max-width:360px">${esc(e.commit.message)}</a>` : ''}</td><td class="cdate">${e.commit ? GH.timeAgo(e.commit.date) : ''}</td></tr>`).join('');
    const up = path ? `<tr><td colspan="3"><div class="name">${icon('file-directory-fill', 16, 'icon-dir')}<a href="${href(r.owner, r.name, 'tree', b, path.split('/').slice(0, -1).join('/'))}" aria-label="Parent directory">..</a></div></td></tr>` : '';
    return `<table class="file-table" data-tour="file-table">${withHead ? '<thead><tr><th>Name</th><th>Last commit message</th><th style="text-align:right">Last commit date</th></tr></thead>' : ''}<tbody>${up}${rows}</tbody></table>`;
  }

  function addFileBtn(r, b, path, compact) {
    if (!S().isAdmin(r) || !r.branches[b]) return '';
    return compact ? `<button class="btn btn-icon" data-action="addFileMenu" data-branch="${esc(b)}" data-path="${esc(path || '')}" aria-label="${L.addFile}" data-tour="add-file-btn">${icon('plus')}</button>`
      : `<button class="btn" data-action="addFileMenu" data-branch="${esc(b)}" data-path="${esc(path || '')}" data-tour="add-file-btn">${L.addFile} ${icon('triangle-down', 16, 'dropdown-caret')}</button>`;
  }
  A.addFileMenu = (el) => {
    const r = GH.router.current.repo, b = el.getAttribute('data-branch'), p = el.getAttribute('data-path');
    GH.ui.openMenu(el, `<ul class="ActionList">${GH.ui.menuItem({ icon: 'plus', label: L.createNewFile, nav: href(r.owner, r.name, 'new', b, p), tour: 'menu-new-file' })}${GH.ui.menuItem({ icon: 'upload', label: L.uploadFiles, nav: href(r.owner, r.name, 'upload', b, p), tour: 'menu-upload' })}</ul>`, { width: 200, id: 'add-file', tour: 'menu-add-file' });
  };

  // ---------- Code view (repo home + folders) ----------
  V.code = function (rt) {
    const r = rt.repo, b = currentBranch(rt), path = rt.path || '';
    const header = { repo: r, tab: 'code' };
    const title = `${r.owner}/${r.name}${path ? ': ' + path : ''}`;
    if (!Object.keys(r.branches).length) return { header, title, html: `<div class="container-xl">${repoTitleRow(r)}${emptyRepo(r)}</div>` };
    if (!S().branch(r, b)) return V.notFound(rt);
    if (path && !S().isDir(r, b, path)) { if (S().fileAt(r, b, path)) return { redirect: href(r.owner, r.name, 'blob', b, path) }; return V.notFound(rt); }
    const entries = S().tree(r, b, path);
    const br = S().branch(r, b);
    const head = r.commits[br.head];
    const nBranches = Object.keys(r.branches).length;
    if (!path) {
      const readme = S().fileAt(r, b, 'README.md');
      return {
        header, title, html: `<div class="container-xl">${repoTitleRow(r)}<div class="layout"><div style="min-width:0">
          ${pushBanner(r)}
          <div class="file-nav" data-tour="file-nav">${branchBtn(r, b, 'tree', '')}
            <a class="btn btn-invisible" href="${href(r.owner, r.name, 'branches')}" data-tour="branches-link">${icon('git-branch')} <span><strong>${nBranches}</strong> <span class="muted">Branch${nBranches === 1 ? '' : 'es'}</span></span></a>
            <button class="btn btn-invisible" data-action="notsim" data-what="Tags (etiquetas de versión)">${icon('tag')} <span><strong>0</strong> <span class="muted">Tags</span></span></button>
            <span class="spacer"></span>
            <div class="input-wrap goto-file">${icon('search')}<input class="form-control" placeholder="Go to file" data-action="gotoFile" readonly aria-label="Go to file"><kbd class="kbd-hint">t</kbd></div>
            ${addFileBtn(r, b, '', true)}
            <button class="btn btn-primary" data-action="codeMenu" aria-haspopup="true" data-tour="code-btn">${icon('code')} ${L.codeBtn} ${icon('triangle-down')}</button>
          </div>
          ${lastCommitBar(r, b, head, '')}
          ${fileTable(r, b, '', entries, false)}
          ${readme ? `<div class="readme-box" id="readme" data-tour="readme"><div class="readme-head"><span class="readme-tab">${icon('book')} README</span><span class="ml-auto"></span>${S().isAdmin(r) && r.branches[b] ? `<a class="btn btn-invisible btn-icon" href="${href(r.owner, r.name, 'edit', b, 'README.md')}" aria-label="Edit file" data-tour="readme-edit">${icon('pencil')}</a>` : ''}<button class="btn btn-invisible btn-icon" data-action="notsim" data-what="Índice del README" aria-label="Outline">${icon('list-unordered')}</button></div><div class="readme-body markdown-body" data-tour="readme-body">${GH.markdown(readme.content)}</div></div>`
            : `<div class="readme-box" data-tour="readme"><div class="readme-head"><span class="readme-tab">README</span></div><div class="blankslate">${icon('book', 24)}<h3>Add a README</h3><p>Help people interested in this repository understand your project by adding a README.</p>${S().isAdmin(r) ? `<a class="btn btn-primary mt-3" href="${href(r.owner, r.name, 'new', b)}?filename=README.md" data-tour="add-readme-btn">Add a README</a>` : ''}</div></div>`}
        </div><div>${sidebar(r, b)}</div></div></div>`,
        after() { GH._freshPaths = null; }
      };
    }
    // folder view
    const lastInDir = entries.reduce((m, e) => (e.commit && (!m || e.commit.date > m.date) ? e.commit : m), null);
    return {
      header, title, html: `<div class="container-xl">
        <div class="file-nav" style="align-items:flex-start">
          <button class="btn btn-invisible btn-icon" data-action="toggleTree" aria-label="Expand file tree">${icon('sidebar-collapse')}</button>
          ${branchBtn(r, b, 'tree', path)}
          <div style="padding-top:4px">${crumbs(r, b, path, { trailingSlash: true })}</div>
          <span class="spacer"></span>
          <div class="input-wrap goto-file">${icon('search')}<input class="form-control" placeholder="Go to file" data-action="gotoFile" readonly aria-label="Go to file"><kbd class="kbd-hint">t</kbd></div>
          ${addFileBtn(r, b, path, false)}
          <button class="btn btn-icon" data-action="notsim" data-what="Más opciones" aria-label="More options">${icon('kebab-horizontal')}</button>
        </div>
        ${treePanelWrap(r, b, path, `${lastCommitBar(r, b, lastInDir, path)}${fileTable(r, b, path, entries, true).replace('class="file-table"', 'class="file-table" style="border-top:1px solid var(--borderColor-default);border-radius:0 0 6px 6px"')}`)}
      </div>`, after() { GH._freshPaths = null; }
    };
  };

  function emptyRepo(r) {
    const url = GH.repoUrl(r) + '.git';
    const admin = S().isAdmin(r);
    return `<div data-tour="empty-repo">
      <div class="Box" style="background:var(--bgColor-accent-muted);border-color:var(--borderColor-accent-emphasis)">
        <div style="padding:16px"><h3 class="f4 mb-3">Quick setup — if you’ve done this kind of thing before</h3>
          <div class="flex gap-2" style="flex-wrap:wrap"><button class="btn btn-sm" data-action="notsim" data-what="GitHub Desktop">${icon('desktop-download')} Set up in Desktop</button><span class="muted">or</span><div class="Segmented" style="height:28px"><button aria-current="true" style="font-size:12px">HTTPS</button><button style="font-size:12px" data-action="notsim" data-what="SSH">SSH</button></div><input class="form-control mono" style="flex:1;min-width:240px;height:28px" readonly value="${esc(url)}" aria-label="Clone URL">${GH.ui.copyBtn(url, 'Copy URL')}</div>
          ${admin ? `<p class="muted mt-3">Get started by <a href="${href(r.owner, r.name, 'new', 'main')}" data-tour="empty-new-file">creating a new file</a> or <a href="${href(r.owner, r.name, 'upload', 'main')}" data-tour="empty-upload">uploading an existing file</a>. We recommend every repository include a <a href="${href(r.owner, r.name, 'new', 'main')}?filename=README.md">README</a>, LICENSE, and .gitignore.</p>` : ''}
        </div></div>
      <h3 class="f4 mt-4 mb-2">…or create a new repository on the command line</h3>
      <div class="Box"><pre class="mono f6" style="margin:0;padding:16px;overflow:auto">echo "# ${esc(r.name)}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin ${esc(url)}
git push -u origin main</pre></div>
      <p class="muted f6 mt-3">${icon('light-bulb', 12)} La línea de comandos es para personas técnicas; en este simulador practicaremos con la interfaz web.</p>
    </div>`;
  }

  // file tree side panel
  GH._treeOpen = false;
  A.toggleTree = () => { GH._treeOpen = !GH._treeOpen; GH.render(); };
  function treePanelWrap(r, b, path, inner) {
    if (!GH._treeOpen) return inner;
    const files = Object.keys(S().files(r, b)).sort();
    const dirs = new Set(); files.forEach(f => { const p = f.split('/'); for (let i = 1; i < p.length; i++) dirs.add(p.slice(0, i).join('/')); });
    const all = [...dirs].map(d => ({ p: d, dir: true })).concat(files.map(f => ({ p: f, dir: false }))).sort((a, c) => a.p.localeCompare(c.p));
    const list = all.map(x => { const depth = x.p.split('/').length - 1; const name = x.p.split('/').pop(); return `<a class="navlist-item ${x.p === path ? 'selected' : ''}" style="padding-left:${8 + depth * 16}px;height:28px" href="${href(r.owner, r.name, x.dir ? 'tree' : 'blob', b, x.p)}">${icon(x.dir ? 'file-directory-fill' : 'file', 16, x.dir ? 'icon-dir' : '')}<span class="truncate">${esc(name)}</span></a>`; }).join('');
    return `<div style="display:grid;grid-template-columns:280px minmax(0,1fr);gap:16px"><div class="Box" style="padding:8px;align-self:start"><div class="flex mb-2" style="padding:0 8px"><strong class="flex-1">Files</strong></div><div class="navlist">${list}</div></div><div style="min-width:0">${inner}</div></div>`;
  }

  A.gotoFile = () => {
    const rt = GH.router.current; const r = rt.repo; const b = currentBranch(rt);
    const files = Object.keys(S().files(r, b)).sort();
    const el = document.querySelector('[data-action="gotoFile"]');
    GH.ui.openMenu(el.parentElement, `<div class="Overlay-body" style="padding-top:12px"><input class="form-control" placeholder="Search files" data-oninput="gotoFilter" aria-label="Search files"></div><ul class="ActionList" id="goto-list" style="max-height:320px;overflow:auto;padding-top:0">${files.map(f => GH.ui.menuItem({ icon: 'file', label: esc(f), nav: href(r.owner, r.name, 'blob', b, f), data: `data-f="${esc(f.toLowerCase())}"` })).join('')}</ul>`, { width: 360, align: 'right' });
  };
  A.gotoFilter = (el) => { const q = el.value.toLowerCase(); document.querySelectorAll('#goto-list [data-f]').forEach(b => { b.parentElement.style.display = b.getAttribute('data-f').includes(q) ? '' : 'none'; }); };
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' && !/input|textarea/i.test(e.target.tagName) && document.querySelector('[data-action="gotoFile"]') && !document.querySelector('.Overlay, .Dialog-backdrop, .palette')) { e.preventDefault(); A.gotoFile(); }
  });

  // ---------- Code (clone) menu ----------
  let cloneTab = 'https';
  A.codeMenu = (el) => {
    const r = GH.router.current.repo;
    const urls = { https: GH.repoUrl(r) + '.git', ssh: `git@github.com:${r.owner}/${r.name}.git`, cli: `gh repo clone ${r.owner}/${r.name}` };
    const hints = { https: 'Clone using the web URL.', ssh: 'Use a password-protected SSH key.', cli: 'Work fast with our official CLI.' };
    const render = () => `<div class="tabnav" style="padding:8px 8px 0"><button class="tabnav-tab selected">Local</button><button class="tabnav-tab" data-action="notsim" data-what="Codespaces">Codespaces</button></div>
      <div style="padding:16px"><div class="flex mb-2">${icon('terminal')}<strong class="flex-1" style="margin-left:8px">Clone</strong><button class="btn btn-invisible btn-sm btn-icon" data-action="notsim" data-what="Ayuda sobre clonar" aria-label="Which remote URL should I use?">${icon('question')}</button></div>
        <div class="Segmented mb-2" style="height:28px">${['https', 'ssh', 'cli'].map(k => `<button style="font-size:12px" data-action="cloneTab" data-k="${k}" ${cloneTab === k ? 'aria-current="true"' : ''}>${{ https: 'HTTPS', ssh: 'SSH', cli: 'GitHub CLI' }[k]}</button>`).join('')}</div>
        <div class="flex gap-1" data-tour="clone-url"><input class="form-control mono" readonly value="${esc(urls[cloneTab])}" aria-label="Clone URL" style="height:32px">${GH.ui.copyBtn(urls[cloneTab], 'Copy url to clipboard', 'clone-copy')}</div>
        <p class="muted f6 mt-2">${hints[cloneTab]}</p></div>
      <div class="ActionList-divider" style="margin:0"></div>
      <ul class="ActionList">${GH.ui.menuItem({ icon: 'desktop-download', label: 'Open with GitHub Desktop', action: 'notsim', what: 'GitHub Desktop' })}${GH.ui.menuItem({ icon: 'file-zip', label: 'Download ZIP', action: 'downloadZip' })}</ul>`;
    const m = GH.ui.openMenu(el, render(), { align: 'right', width: 400, id: 'code', tour: 'code-menu', focus: false });
    A.cloneTab = (b) => { cloneTab = b.getAttribute('data-k'); m.innerHTML = render(); };
  };
  A.downloadZip = () => { GH.ui.closeMenus(); GH.ui.toast('En GitHub real descargarías un archivo .zip con todo el proyecto. El simulador no genera la descarga.', 'info'); };

  // ---------- Branch menu ----------
  A.branchMenu = (el) => {
    const rt = GH.router.current; const r = rt.repo;
    const cur = el.getAttribute('data-branch'), kind = el.getAttribute('data-kind'), path = el.getAttribute('data-path');
    const canCreate = S().isAdmin(r) && kind !== 'compare';
    let q = '';
    const target = (b) => {
      if (kind === 'commits') return href(r.owner, r.name, 'commits', b);
      if (kind === 'blob' && S().fileAt(r, b, path)) return href(r.owner, r.name, 'blob', b, path);
      if (kind === 'tree' && path && S().isDir(r, b, path)) return href(r.owner, r.name, 'tree', b, path);
      return href(r.owner, r.name, 'tree', b);
    };
    const list = () => {
      const names = S().branchNames(r).filter(n => n.toLowerCase().includes(q.toLowerCase()));
      const clean = q.trim().replace(/\s+/g, '-').replace(/[^\w.\-]/g, '-');
      let h = names.map(n => `<li class="ActionList-item"><button class="ActionList-btn ${n === cur ? 'checked' : ''}" data-nav="${target(n)}" data-tour="branch-item-${esc(n)}">${icon('check', 16, 'check')}<span class="flex-1 truncate">${esc(n)}</span>${n === r.defaultBranch ? `<span class="Label">${L.defaultLabel}</span>` : ''}</button></li>`).join('');
      if (!names.length && !q) h = '<li class="muted" style="padding:8px 16px">Nothing to show</li>';
      if (q.trim() && canCreate && !r.branches[clean]) h += `<li class="ActionList-item"><button class="ActionList-btn" data-action="createBranchFromMenu" data-name="${esc(clean)}" data-from="${esc(cur)}" data-tour="create-branch-item">${icon('git-branch')}<span class="flex-1">${L.createBranch} <strong>${esc(clean)}</strong> from <strong>${esc(cur)}</strong></span></button></li>`;
      else if (q.trim() && !names.length) h += `<li class="muted" style="padding:8px 16px">Nothing to show</li>`;
      return h;
    };
    const m = GH.ui.openMenu(el, `<div class="Overlay-header"><h3>Switch branches/tags</h3><button class="btn btn-invisible btn-sm btn-icon" data-action="closeMenus" aria-label="Close">${icon('x')}</button></div>
      <div style="padding:0 16px 8px"><div class="input-wrap">${icon('search')}<input class="form-control" placeholder="${canCreate ? L.branchFilter : 'Find a branch...'}" data-tour="branch-filter" aria-label="Find or create a branch" autocomplete="off"></div></div>
      <div class="tabnav" style="padding:0 8px"><button class="tabnav-tab selected">Branches</button><button class="tabnav-tab" data-action="notsim" data-what="Tags">Tags</button></div>
      <ul class="ActionList" id="branch-list" style="max-height:300px;overflow:auto">${list()}</ul>
      <div class="ActionList-divider" style="margin:0"></div><ul class="ActionList"><li class="ActionList-item"><a class="ActionList-btn" href="${href(r.owner, r.name, 'branches')}">${L.viewAllBranches}</a></li></ul>`, { width: 320, id: 'branch', tour: 'branch-menu' });
    const input = m.querySelector('input');
    input.addEventListener('input', () => { q = input.value; m.querySelector('#branch-list').innerHTML = list(); GH.bus.emit('branch:filter', q); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const c = m.querySelector('[data-action="createBranchFromMenu"]') || m.querySelector('#branch-list [data-nav]'); if (c) c.click(); } });
  };
  A.closeMenus = () => GH.ui.closeMenus();
  A.createBranchFromMenu = (el) => {
    const r = GH.router.current.repo; const name = el.getAttribute('data-name'), from = el.getAttribute('data-from');
    S().createBranch(r, name, from);
    S().state.tutorial.branch = name; S().save();
    GH.ui.closeMenus();
    GH.router.go(href(r.owner, r.name, 'tree', name));
    GH.ui.toast(`Branch <strong>${esc(name)}</strong> created`);
  };

  // ---------- Blob view ----------
  let blobMode = {};
  V.blob = function (rt) {
    const r = rt.repo, b = rt.branch, path = rt.path;
    const f = S().branch(r, b) && S().fileAt(r, b, path);
    const virtual = !!(f && S().branch(r, b).virtual);
    if (!f) return V.notFound(rt);
    const c = r.commits[f.commit];
    const isMd = /\.md$/i.test(path);
    const key = r.owner + r.name + path;
    const mode = blobMode[key] || (isMd ? 'preview' : 'code');
    const lines = f.binary ? [] : f.content.replace(/\n$/, '').split('\n');
    const loc = lines.filter(l => l.trim()).length;
    let body;
    if (f.binary) body = `<div class="blob-binary">${icon('file-media', 24)}<p class="mt-2"><a href="#" data-action="downloadBlob">View raw</a></p><p class="f6">(Archivo binario · ${GH.bytes(f.size)}. El simulador guarda solo su nombre y tamaño.)</p></div>`;
    else if (mode === 'preview') body = `<div class="markdown-body" style="padding:32px" data-tour="blob-preview">${GH.markdown(f.content)}</div>`;
    else body = `<div class="blob-code" data-tour="blob-code"><table>${lines.map((l, i) => `<tr>${mode === 'blame' ? `<td class="num" style="text-align:left;min-width:220px;border-right:1px solid var(--borderColor-muted)">${i === 0 && c ? `<a class="link-muted truncate" style="display:block;max-width:200px" href="${href(r.owner, r.name, 'commit', c.sha)}">${esc(c.message)}</a>` : ''}</td>` : ''}<td class="num">${i + 1}</td><td class="line">${esc(l) || ' '}</td></tr>`).join('')}</table></div>`;
    return {
      header: { repo: r, tab: 'code' }, title: `${r.name}/${path} at ${b}`,
      html: `<div class="container-xl">
        <div class="file-nav" style="align-items:flex-start">
          <button class="btn btn-invisible btn-icon" data-action="toggleTree" aria-label="Expand file tree">${icon(GH._treeOpen ? 'sidebar-expand' : 'sidebar-collapse')}</button>
          ${branchBtn(r, b, 'blob', path)}
          <div style="padding-top:4px">${crumbs(r, b, path)}</div><span class="spacer"></span>
          <div class="input-wrap goto-file">${icon('search')}<input class="form-control" placeholder="Go to file" data-action="gotoFile" readonly aria-label="Go to file"><kbd class="kbd-hint">t</kbd></div>
          <button class="btn btn-icon" data-action="notsim" data-what="Más opciones" aria-label="More file actions">${icon('kebab-horizontal')}</button>
        </div>
        ${treePanelWrap(r, b, path, `${lastCommitBar(r, b, c, path, true)}
        <div class="blob-box" data-tour="blob-box"><div class="blob-head">
          <div class="Segmented" data-tour="blob-modes">${isMd ? `<button data-action="blobMode" data-m="preview" ${mode === 'preview' ? 'aria-current="true"' : ''} data-tour="mode-preview">${L.preview}</button>` : ''}<button data-action="blobMode" data-m="code" ${mode === 'code' ? 'aria-current="true"' : ''} data-tour="mode-code">${L.tabCode}</button><button data-action="blobMode" data-m="blame" ${mode === 'blame' ? 'aria-current="true"' : ''} data-tour="mode-blame">${L.blame}</button></div>
          <span class="info">${f.binary ? GH.bytes(f.size) : `${lines.length} lines (${loc} loc) · ${GH.bytes(f.size)}`}</span><span class="spacer flex-1"></span>
          <button class="btn btn-sm" data-action="rawBlob">Raw</button>
          ${f.binary ? '' : `<button class="btn btn-sm btn-icon" data-action="copy" data-copy="${esc(f.content)}" aria-label="Copy raw content">${icon('copy')}</button>`}
          <button class="btn btn-sm btn-icon" data-action="downloadBlob" aria-label="Download raw file">${icon('download')}</button>
          ${S().isAdmin(r) && !f.binary && !virtual ? `<div class="btn-group"><a class="btn btn-sm btn-icon" href="${href(r.owner, r.name, 'edit', b, path)}" aria-label="Edit this file" data-tour="edit-file-btn">${icon('pencil')}</a><button class="btn btn-sm btn-caret" data-action="blobMore" aria-label="More edit options">${icon('triangle-down')}</button></div>` : ''}
          <button class="btn btn-sm btn-icon btn-invisible" data-action="notsim" data-what="Símbolos" aria-label="Symbols">${icon('list-unordered')}</button>
        </div>${body}</div>`)}
      </div>`
    };
  };
  A.blobMode = (el) => { const rt = GH.router.current; blobMode[rt.repo.owner + rt.repo.name + rt.path] = el.getAttribute('data-m'); GH.render(); GH.bus.emit('blob:mode', el.getAttribute('data-m')); };
  A.rawBlob = () => {
    const rt = GH.router.current; const f = S().fileAt(rt.repo, rt.branch, rt.path);
    GH.ui.dialog({ title: 'Raw · ' + esc(rt.path.split('/').pop()), wide: true, body: f.binary ? '<p class="muted">Binary file</p>' : `<pre class="mono f6" style="margin:0;white-space:pre-wrap">${esc(f.content)}</pre>`, footer: '<button class="btn" data-action="closeDialog">Close</button>' });
  };
  A.downloadBlob = () => {
    const rt = GH.router.current; const f = S().fileAt(rt.repo, rt.branch, rt.path);
    if (f.binary) { GH.ui.toast('El simulador solo guarda el nombre y tamaño de los archivos binarios.', 'info'); return; }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([f.content], { type: 'text/plain' })); a.download = rt.path.split('/').pop(); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); } catch (e) { GH.ui.toast('No se pudo descargar', 'info'); }
  };
  A.blobMore = (el) => {
    const rt = GH.router.current; const r = rt.repo;
    GH.ui.openMenu(el, `<ul class="ActionList">${GH.ui.menuItem({ icon: 'pencil', label: 'Edit in place', nav: href(r.owner, r.name, 'edit', rt.branch, rt.path) })}${GH.ui.menuItem({ icon: 'codespaces', label: 'Open in codespace', action: 'notsim', what: 'Codespaces' })}<li class="ActionList-divider"></li>${GH.ui.menuItem({ icon: 'trash', label: 'Delete file', action: 'deleteFile', danger: true })}</ul>`, { align: 'right', width: 220 });
  };
  A.deleteFile = () => {
    const rt = GH.router.current; const r = rt.repo;
    GH.ui.closeMenus();
    openCommitDialog({ r, b: rt.branch, defaultMsg: `Delete ${rt.path.split('/').pop()}`, changes: [{ path: rt.path, content: null }], done: () => GH.router.go(href(r.owner, r.name, 'tree', rt.branch)) });
  };

  // ---------- Commit dialog (shared by edit / new / delete) ----------
  function openCommitDialog(o) {
    const r = o.r, b = o.b, me = S().me();
    let n = 1; while (r.branches[`${me}-patch-${n}`]) n++;
    const suggested = `${me}-patch-${n}`;
    GH.ui.dialog({
      title: L.commitChanges, tour: 'commit-dialog',
      body: `<label class="form-label" for="cd-msg">Commit message</label><input id="cd-msg" class="form-control" value="${esc(o.defaultMsg)}" data-tour="cd-msg" autocomplete="off">
        <label class="form-label mt-3" for="cd-desc">${L.extendedDesc}</label><textarea id="cd-desc" class="form-control" placeholder="Add an optional extended description..." style="min-height:80px" data-tour="cd-desc"></textarea>
        <div class="mt-3" data-tour="cd-target">
          <label class="radio"><input type="radio" name="cd-where" value="direct" checked data-onchange="cdWhere"><span>Commit directly to the <span class="branch-name">${esc(b)}</span> branch</span></label>
          <label class="radio mt-2"><input type="radio" name="cd-where" value="branch" data-onchange="cdWhere" data-tour="cd-newbranch-radio"><span>Create a <strong>new branch</strong> for this commit and start a pull request <a href="#" data-action="notsim" data-what="Documentación sobre pull requests">Learn more about pull requests</a></span></label>
          <div id="cd-branchwrap" style="display:none;margin:8px 0 0 24px"><div class="input-wrap">${icon('git-branch')}<input id="cd-branch" class="form-control mono" value="${esc(suggested)}" aria-label="New branch name"></div></div>
        </div>`,
      footer: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn btn-primary" data-action="cdCommit" data-tour="cd-commit" id="cd-commit">${L.commitChanges}</button>`
    });
    A.cdWhere = () => { const v = document.querySelector('input[name="cd-where"]:checked').value; document.getElementById('cd-branchwrap').style.display = v === 'branch' ? '' : 'none'; document.getElementById('cd-commit').textContent = v === 'branch' ? 'Propose changes' : L.commitChanges; };
    A.cdCommit = () => {
      const msg = document.getElementById('cd-msg').value.trim() || o.defaultMsg;
      const desc = document.getElementById('cd-desc').value.trim();
      const where = document.querySelector('input[name="cd-where"]:checked').value;
      let target = b;
      if (where === 'branch') {
        target = (document.getElementById('cd-branch').value.trim() || suggested).replace(/\s+/g, '-').replace(/[^\w.\-]/g, '-');
        if (!r.branches[target]) S().createBranch(r, target, b);
        S().state.tutorial.branch = target;
      }
      S().commit(r, target, o.changes, msg, desc);
      GH.ui.closeDialog();
      GH.ui.toast('Changes committed');
      if (where === 'branch') GH.router.go(href(r.owner, r.name, 'compare', b + '...' + target) + '?expand=1');
      else o.done(target);
    };
  }
  GH.openCommitDialog = openCommitDialog;

  // ---------- Editor (edit + new file) ----------
  let ed = null;
  function editorView(rt, isNew) {
    const r = rt.repo; const b = rt.branch || r.defaultBranch;
    if (!S().isAdmin(r)) return V.notFound(rt);
    if (!r.branches[b] && Object.keys(r.branches).length) return V.notFound(rt);
    const key = (isNew ? 'new:' : 'edit:') + S().key(r) + b + rt.path;
    if (!ed || ed.key !== key) {
      const f = isNew ? null : S().fileAt(r, b, rt.path);
      if (!isNew && !f) return V.notFound(rt);
      ed = { key, original: f ? f.content : '', content: f ? f.content : '', tab: 'edit', filename: isNew ? (rt.query.filename || '') : rt.path.split('/').pop(), dir: isNew ? (rt.path || '') : rt.path.split('/').slice(0, -1).join('/') };
    }
    const lines = ed.content.split('\n').length;
    const crumb = `<a href="${href(r.owner, r.name, 'tree', b)}">${esc(r.name)}</a>${ed.dir ? ed.dir.split('/').map(p => `<span class="sep">/</span><span class="current" style="font-weight:600">${esc(p)}</span>`).join('') : ''}<span class="sep">/</span>`;
    return {
      header: { repo: r, tab: 'code' }, title: isNew ? `New file at ${r.name}` : `Editing ${r.name}/${rt.path} at ${b}`,
      html: `<div class="container-xl" data-tour="editor-page">
        <div class="flex gap-2 mb-3" style="flex-wrap:wrap">
          <nav class="breadcrumb">${crumb}<input class="form-control" style="width:240px;height:32px;font-size:14px" value="${esc(ed.filename)}" placeholder="Name your file..." data-oninput="edName" aria-label="File name" data-tour="editor-filename"><span class="muted f5" style="margin-left:8px">in</span> <span class="branch-name">${esc(b)}</span></nav>
          <span class="spacer flex-1"></span>
          <button class="btn" data-action="edCancel">Cancel changes</button>
          <button class="btn btn-primary" data-action="edCommit" data-tour="editor-commit">${L.commitChangesDots}</button>
        </div>
        <div class="editor-box"><div class="flex" style="background:var(--bgColor-muted);border-bottom:1px solid var(--borderColor-default);padding:8px 8px 0"><div class="tabnav" style="border:0"><button class="tabnav-tab ${ed.tab === 'edit' ? 'selected' : ''}" data-action="edTab" data-t="edit">Edit</button><button class="tabnav-tab ${ed.tab === 'preview' ? 'selected' : ''}" data-action="edTab" data-t="preview" data-tour="editor-preview-tab">${L.preview}</button></div><span class="ml-auto flex gap-2" style="padding-bottom:8px"><button class="btn btn-sm">Spaces ${icon('triangle-down')}</button><button class="btn btn-sm">2 ${icon('triangle-down')}</button><button class="btn btn-sm">No wrap ${icon('triangle-down')}</button></span></div>
          ${ed.tab === 'edit' ? `<div class="editor-area"><div class="editor-gutter" id="ed-gutter">${Array.from({ length: lines }, (_, i) => i + 1).join('\n')}</div><textarea id="ed-text" spellcheck="false" data-oninput="edInput" aria-label="File contents" data-tour="editor-textarea" placeholder="Enter file contents here">${esc(ed.content)}</textarea></div>`
          : `<div class="markdown-body" style="padding:32px;min-height:420px">${/\.md$/i.test(ed.filename) ? GH.markdown(ed.content) : `<pre class="mono">${esc(ed.content)}</pre>`}</div>`}
        </div>
        <p class="muted f6 mt-2">${icon('light-bulb', 12)} Use <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>m</kbd> to toggle the <kbd>tab</kbd> key moving focus. Alternatively, use <kbd>esc</kbd> then <kbd>tab</kbd> to move to the next interactive element on the page.</p>
      </div>`,
      after() { const t = document.getElementById('ed-text'); if (t) { t.addEventListener('scroll', () => { document.getElementById('ed-gutter').scrollTop = t.scrollTop; }); } }
    };
  }
  V.edit = (rt) => editorView(rt, false);
  V.newFile = (rt) => editorView(rt, true);
  GH.editorState = () => ed;
  A.edInput = (el) => { ed.content = el.value; const g = document.getElementById('ed-gutter'); if (g) g.textContent = Array.from({ length: el.value.split('\n').length }, (_, i) => i + 1).join('\n'); GH.bus.emit('editor:input', ed); };
  A.edName = (el) => { ed.filename = el.value; GH.bus.emit('editor:input', ed); };
  A.edTab = (el) => { ed.tab = el.getAttribute('data-t'); GH.render(); };
  A.edCancel = () => {
    const rt = GH.router.current; const r = rt.repo;
    const dirty = ed && ed.content !== ed.original;
    const go = () => { ed = null; GH.router.go(rt.view === 'edit' ? href(r.owner, r.name, 'blob', rt.branch, rt.path) : href(r.owner, r.name, 'tree', rt.branch || r.defaultBranch, rt.path)); };
    if (!dirty) return go();
    GH.ui.dialog({ title: 'Discard changes?', body: '<p>You have unsaved changes. Are you sure you want to discard them?</p>', footer: '<button class="btn" data-action="closeDialog">Keep editing</button><button class="btn btn-danger" data-action="edDiscard">Discard changes</button>' });
    A.edDiscard = () => { GH.ui.closeDialog(); go(); };
  };
  A.edCommit = () => {
    const rt = GH.router.current; const r = rt.repo; const b = rt.branch || r.defaultBranch;
    const name = (ed.filename || '').trim().replace(/^\/+/, '');
    if (!name) { GH.ui.toast('Ponle un nombre al archivo antes de guardarlo.', 'info'); const i = document.querySelector('[data-tour="editor-filename"]'); if (i) i.focus(); return; }
    const newPath = (ed.dir ? ed.dir + '/' : '') + name;
    const isNew = rt.view === 'newFile';
    const changes = [];
    if (!isNew && newPath !== rt.path) changes.push({ path: rt.path, content: null });
    changes.push({ path: newPath, content: ed.content.endsWith('\n') || !ed.content ? ed.content : ed.content + '\n' });
    if (isNew && S().fileAt(r, b, newPath)) { GH.ui.toast(`Ya existe un archivo llamado <strong>${esc(newPath)}</strong>.`, 'info'); return; }
    openCommitDialog({ r, b, defaultMsg: isNew ? `Create ${name}` : `Update ${name}`, changes, done: (target) => { ed = null; GH._freshPaths = [newPath]; GH.router.go(href(r.owner, r.name, 'blob', target, newPath)); } });
  };

  // ---------- Upload ----------
  let up = null;
  GH.sampleUploadFiles = function () {
    return [
      { path: 'plan-de-trabajo.md', content: '# Plan de trabajo\n\n## Objetivo\n\nOrganizar el lanzamiento del nuevo boletín del equipo.\n\n## Tareas\n\n- [x] Definir los temas del primer número\n- [ ] Escribir los textos\n- [ ] Revisar con el equipo\n- [ ] Publicar\n\n## Fechas\n\n| Tarea | Responsable | Fecha |\n|---|---|---|\n| Textos | Ana | 15 de noviembre |\n| Revisión | Carlos | 20 de noviembre |\n' },
      { path: 'presupuesto.csv', content: 'concepto,valor\nDiseño,1200000\nImpresión,800000\nDistribución,350000\n' },
      { path: 'imagenes/portada.png', binary: true, size: 48213, mime: 'image/png' }
    ];
  };
  V.upload = function (rt) {
    const r = rt.repo; const b = rt.branch || r.defaultBranch;
    if (!S().isAdmin(r)) return V.notFound(rt);
    const key = S().key(r) + b + (rt.path || '');
    if (!up || up.key !== key) up = { key, files: [], message: '', desc: '', where: 'direct' };
    const base = rt.path ? rt.path + '/' : '';
    return {
      header: { repo: r, tab: 'code' }, title: `${L.uploadFiles} · ${r.name}`,
      html: `<div class="container-lg" data-tour="upload-page">
        <nav class="breadcrumb mb-3"><a href="${href(r.owner, r.name, 'tree', b)}">${esc(r.name)}</a>${rt.path ? rt.path.split('/').map(p => `<span class="sep">/</span><span class="current">${esc(p)}</span>`).join('') : ''}<span class="sep">/</span></nav>
        <div class="dropzone" id="dropzone" data-tour="dropzone">${icon('file-added', 24)}<div class="big"><strong>Drag files here to add them to your repository</strong></div><p class="muted mt-2">Or <button class="btn-link" data-action="upChoose" data-tour="choose-files">choose your files</button></p><input type="file" id="up-input" multiple hidden></div>
        ${up.files.length ? `<div class="Box upload-list mt-3" data-tour="upload-list">${up.files.map((f, i) => `<div class="Box-row"><span class="flex gap-2">${icon('file', 16, 'muted')}<span class="mono f6">${esc(base + f.path)}</span>${S().fileAt(r, b, base + f.path) ? '<span class="Label Label--attention">replaces existing file</span>' : ''}</span><span class="flex gap-2"><span class="muted f6">${GH.bytes(f.binary ? f.size : new Blob([f.content]).size)}</span><button class="btn btn-invisible btn-sm btn-icon" data-action="upRemove" data-i="${i}" aria-label="Remove ${esc(f.path)}">${icon('x')}</button></span></div>`).join('')}</div>` : ''}
        <div class="commit-form">${avatar(S().me(), 48)}<div class="panel" data-tour="upload-commit-box"><h3>${L.commitChanges}</h3>
          <input class="form-control" placeholder="Add files via upload" value="${esc(up.message)}" data-oninput="upMsg" aria-label="Commit message" data-tour="upload-msg">
          <textarea class="form-control mt-2" placeholder="Add an optional extended description..." data-oninput="upDesc" aria-label="${L.extendedDesc}" style="min-height:80px">${esc(up.desc)}</textarea>
          <div class="mt-3" data-tour="upload-target"><label class="radio"><input type="radio" name="up-where" value="direct" ${up.where === 'direct' ? 'checked' : ''} data-onchange="upWhere">${icon('git-commit', 16, 'muted')}<span>Commit directly to the <span class="branch-name">${esc(b)}</span> branch.</span></label>
          <label class="radio mt-2"><input type="radio" name="up-where" value="branch" ${up.where === 'branch' ? 'checked' : ''} data-onchange="upWhere">${icon('git-pull-request', 16, 'muted')}<span>Create a <strong>new branch</strong> for this commit and start a pull request.</span></label></div>
        </div></div>
        <div class="flex gap-2 mt-3" style="margin-left:64px"><button class="btn btn-primary" data-action="upCommit" data-tour="upload-commit" ${up.files.length ? '' : 'disabled'}>${L.commitChanges}</button><a class="btn btn-danger" href="${href(r.owner, r.name, 'tree', b, rt.path)}">Cancel</a></div>
      </div>`,
      after() {
        const dz = document.getElementById('dropzone'); const inp = document.getElementById('up-input');
        inp.addEventListener('change', () => readFiles(inp.files));
        ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
        ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
        dz.addEventListener('drop', (e) => readFiles(e.dataTransfer.files));
      }
    };
  };
  function readFiles(list) {
    const arr = [...(list || [])];
    let pending = arr.length;
    if (!pending) return;
    arr.forEach(f => {
      const path = (f.webkitRelativePath || f.name).replace(/^\/+/, '');
      if (isText(f.name) && f.size < 512 * 1024) {
        const rd = new FileReader();
        rd.onload = () => { addUp({ path, content: String(rd.result) }); if (--pending === 0) done(); };
        rd.onerror = () => { addUp({ path, binary: true, size: f.size }); if (--pending === 0) done(); };
        rd.readAsText(f);
      } else { addUp({ path, binary: true, size: f.size, mime: f.type }); if (--pending === 0) done(); }
    });
    function done() { GH.render(); GH.bus.emit('upload:files-added', up.files.length); }
  }
  function addUp(f) { up.files = up.files.filter(x => x.path !== f.path).concat([f]); }
  GH.addSampleUploads = () => { if (!up) return; GH.sampleUploadFiles().forEach(addUp); GH.render(); GH.bus.emit('upload:files-added', up.files.length); };
  A.upChoose = () => document.getElementById('up-input').click();
  A.upRemove = (el) => { up.files.splice(+el.getAttribute('data-i'), 1); GH.render(); };
  A.upMsg = (el) => { up.message = el.value; GH.bus.emit('form:input'); };
  A.upDesc = (el) => { up.desc = el.value; };
  A.upWhere = (el) => { up.where = el.value; };
  A.upCommit = () => {
    const rt = GH.router.current; const r = rt.repo; const b = rt.branch || r.defaultBranch;
    if (!up.files.length) return;
    const base = rt.path ? rt.path + '/' : '';
    const changes = up.files.map(f => f.binary ? { path: base + f.path, binary: true, size: f.size, mime: f.mime } : { path: base + f.path, content: f.content });
    let target = b;
    if (!Object.keys(r.branches).length) r.branches.main = { name: 'main', head: null, files: {}, createdAt: Date.now() };
    if (up.where === 'branch') { const me = S().me(); let n = 1; while (r.branches[`${me}-patch-${n}`]) n++; target = `${me}-patch-${n}`; S().createBranch(r, target, b); S().state.tutorial.branch = target; }
    const msg = up.message.trim() || 'Add files via upload';
    S().commit(r, target, changes, msg, up.desc.trim());
    // highlight top-level entries in the folder we uploaded to
    GH._freshPaths = [...new Set(changes.map(c => { const rest = c.path.slice(base.length).split('/')[0]; return base + rest; }))];
    up = null;
    if (target !== b) GH.router.go(href(r.owner, r.name, 'compare', b + '...' + target) + '?expand=1');
    else GH.router.go(href(r.owner, r.name, 'tree', b, rt.path));
  };
})(window.GH);
