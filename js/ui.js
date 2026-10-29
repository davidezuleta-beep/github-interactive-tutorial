/* Shared UI: header, menus, dialogs, toasts, command palette, navigation drawer, action delegation. */
(function (GH) {
  'use strict';
  const { esc, icon, avatar } = GH;
  const S = () => GH.store;
  GH.actions = GH.actions || {};

  const ui = GH.ui = {};

  // ---------- Delegated actions ----------
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav && !nav.disabled) { e.preventDefault(); ui.closeMenus(); GH.router.go(nav.getAttribute('data-nav')); return; }
    const a = e.target.closest('[data-action]');
    if (a && !a.disabled) {
      const fn = GH.actions[a.getAttribute('data-action')];
      if (fn) { e.preventDefault(); fn(a, e); }
    }
  });
  document.addEventListener('input', (e) => {
    const a = e.target.closest('[data-oninput]');
    if (a) { const fn = GH.actions[a.getAttribute('data-oninput')]; if (fn) fn(a, e); }
  });
  document.addEventListener('change', (e) => {
    const a = e.target.closest('[data-onchange]');
    if (a) { const fn = GH.actions[a.getAttribute('data-onchange')]; if (fn) fn(a, e); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.querySelector('.palette')) { ui.closePalette(); return; }
      if (document.querySelector('.Overlay')) { ui.closeMenus(); return; }
      if (document.querySelector('.Dialog-backdrop')) { ui.closeDialog(); return; }
      if (document.querySelector('.drawer')) { ui.closeDrawer(); return; }
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && !['input', 'textarea'].includes(tag) && !document.querySelector('.palette')) { e.preventDefault(); ui.openPalette(); }
    const k = e.target.closest && e.target.closest('[data-onenter]');
    if (k && e.key === 'Enter') { const fn = GH.actions[k.getAttribute('data-onenter')]; if (fn) { e.preventDefault(); fn(k, e); } }
  });

  // ---------- Toasts ----------
  ui.toast = function (msg, kind) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.setAttribute('role', 'status'); wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    if ([...wrap.children].some(c => c.dataset.msg === msg)) return;
    while (wrap.children.length >= 2) wrap.firstChild.remove();
    const t = document.createElement('div');
    t.dataset.msg = msg;
    t.className = 'toast ' + (kind || '');
    t.innerHTML = icon(kind === 'info' ? 'info' : 'check-circle-fill') + `<span>${msg}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, kind === 'info' ? 4200 : 2600);
  };
  ui.notSimulated = function (what) {
    ui.toast(`<strong>${esc(what)}</strong> no está incluido en este simulador educativo. En GitHub real sí funciona.`, 'info');
  };
  GH.actions.notsim = (el) => ui.notSimulated(el.getAttribute('data-what') || el.textContent.trim());

  // ---------- Menus (anchored overlays) ----------
  let menuCleanup = [];
  ui.openMenu = function (anchor, html, opts) {
    opts = opts || {};
    ui.closeMenus();
    const el = document.createElement('div');
    el.className = 'Overlay';
    if (opts.id) el.setAttribute('data-menu', opts.id);
    if (opts.tour) el.setAttribute('data-tour', opts.tour);
    el.setAttribute('role', 'menu');
    el.style.width = opts.width ? opts.width + 'px' : '';
    el.innerHTML = html;
    document.getElementById('overlays').appendChild(el);
    anchor.setAttribute('aria-expanded', 'true');
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const w = el.offsetWidth, h = el.offsetHeight;
      let left = opts.align === 'right' ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      let top = r.bottom + 4;
      if (top + h > window.innerHeight - 8 && r.top - h - 4 > 8) top = r.top - h - 4;
      el.style.left = left + 'px'; el.style.top = top + 'px';
    };
    place();
    const onDoc = (e) => { if (!el.contains(e.target) && !anchor.contains(e.target) && !(e.target.closest && e.target.closest('#tour-layer'))) ui.closeMenus(); };
    const onScroll = () => place();
    setTimeout(() => document.addEventListener('click', onDoc, true), 0);
    window.addEventListener('resize', onScroll); window.addEventListener('scroll', onScroll, true);
    menuCleanup.push(() => { document.removeEventListener('click', onDoc, true); window.removeEventListener('resize', onScroll); window.removeEventListener('scroll', onScroll, true); anchor.setAttribute('aria-expanded', 'false'); el.remove(); });
    if (opts.onMount) opts.onMount(el);
    const first = el.querySelector('input, .ActionList-btn, button');
    if (first && opts.focus !== false) setTimeout(() => first.focus(), 20);
    GH.bus.emit('menu:opened', opts.id);
    return el;
  };
  ui.closeMenus = function () {
    if (!menuCleanup.length) return;
    const fns = menuCleanup; menuCleanup = [];
    fns.forEach(f => f());
    GH.bus.emit('menu:closed');
  };
  ui.menuItem = function (o) {
    const attrs = [o.action ? `data-action="${o.action}"` : '', o.nav ? `data-nav="${esc(o.nav)}"` : '', o.what ? `data-what="${esc(o.what)}"` : '', o.tour ? `data-tour="${o.tour}"` : '', o.data || ''].join(' ');
    return `<li class="ActionList-item" role="none"><button class="ActionList-btn ${o.danger ? 'danger' : ''} ${o.checked != null ? (o.checked ? 'checked' : '') : ''}" role="menuitem" ${attrs}>${o.checked != null ? icon('check', 16, 'check') : ''}${o.icon ? icon(o.icon) : ''}<span class="flex-1"><span>${o.label}</span>${o.desc ? `<span class="desc">${o.desc}</span>` : ''}</span>${o.trailing || ''}</button></li>`;
  };

  // ---------- Dialogs ----------
  ui.dialog = function (o) {
    ui.closeDialog();
    ui.closeMenus();
    const bd = document.createElement('div');
    bd.className = 'Dialog-backdrop';
    bd.innerHTML = `<div class="Dialog ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title)}" ${o.tour ? `data-tour="${o.tour}"` : ''}>
      <div class="Dialog-header"><h2>${o.title}</h2><button class="btn btn-invisible btn-icon" data-action="closeDialog" aria-label="Close">${icon('x')}</button></div>
      <div class="Dialog-body">${o.body}</div>
      ${o.footer ? `<div class="Dialog-footer">${o.footer}</div>` : ''}</div>`;
    bd.addEventListener('mousedown', (e) => { if (e.target === bd) bd._down = true; });
    bd.addEventListener('click', (e) => { if (e.target === bd && bd._down) ui.closeDialog(); bd._down = false; });
    document.getElementById('overlays').appendChild(bd);
    if (o.onMount) o.onMount(bd.querySelector('.Dialog'));
    const f = bd.querySelector('[autofocus], input, textarea');
    if (f) setTimeout(() => f.focus(), 30);
    GH.bus.emit('dialog:opened', o.id);
    return bd.querySelector('.Dialog');
  };
  ui.closeDialog = function () { const d = document.querySelector('.Dialog-backdrop'); if (d) { d.remove(); GH.bus.emit('dialog:closed'); } };
  GH.actions.closeDialog = () => ui.closeDialog();

  // ---------- Command palette (search) ----------
  ui.openPalette = function (initial) {
    ui.closeMenus();
    ui.closePalette(true);
    const bd = document.createElement('div'); bd.className = 'palette-backdrop';
    const p = document.createElement('div'); p.className = 'palette'; p.setAttribute('data-tour', 'palette'); p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Search');
    p.innerHTML = `<div class="palette-input">${icon('search')}<input type="text" placeholder="Search or jump to..." aria-label="Search or jump to" data-tour="palette-input" autocomplete="off" value="${esc(initial || '')}"><button class="btn btn-invisible btn-sm btn-icon" data-action="closePalette" aria-label="Close search">${icon('x')}</button></div><div class="palette-results"></div>`;
    bd.addEventListener('click', () => ui.closePalette());
    const ov = document.getElementById('overlays');
    ov.appendChild(bd); ov.appendChild(p);
    const input = p.querySelector('input');
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const mine = S().myRepos();
      const all = S().visibleRepos();
      let html = '';
      if (!q) {
        const list = (mine.length ? mine : all.filter(r => r.owner !== S().me())).slice(0, 5);
        html += `<div class="palette-group-title">Repositories</div>` + list.map(r => item(r)).join('');
        html += `<div class="ActionList-divider"></div><div class="palette-group-title">Suggestions</div><button class="palette-item" data-action="notsim" data-what="Copilot Chat">${icon('copilot')}<span>Chat with Copilot</span><span class="hint">Start a new Copilot thread</span></button>`;
      } else {
        const res = all.filter(r => (r.owner + '/' + r.name + ' ' + r.description).toLowerCase().includes(q));
        html += `<div class="palette-group-title">Repositories</div>`;
        html += res.length ? res.slice(0, 7).map(r => item(r)).join('') : `<div class="palette-item muted" style="cursor:default">No repositories match "${esc(input.value)}"</div>`;
        html += `<div class="ActionList-divider"></div><button class="palette-item" data-action="paletteSearch" data-tour="palette-search-all">${icon('search')}<span>${esc(input.value)}</span><span class="hint">Search all of GitHub</span></button>`;
      }
      html += `<div class="palette-footer"><a href="#" data-action="notsim" data-what="Search syntax tips">Search syntax tips</a><a href="#" data-action="notsim" data-what="Give feedback">Give feedback</a></div>`;
      p.querySelector('.palette-results').innerHTML = html;
      GH.bus.emit('palette:results', q);
    };
    function item(r) {
      return `<button class="palette-item" data-nav="#/${esc(r.owner)}/${esc(r.name)}" data-tour="palette-repo-${esc(r.name)}">${icon(r.visibility === 'private' ? 'lock' : 'repo')}<span>${esc(r.owner)}/${esc(r.name)}</span><span class="hint">Jump to</span></button>`;
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const first = p.querySelector('.palette-item[data-nav]');
        if (input.value.trim() && first) { first.click(); } else if (input.value.trim()) { GH.actions.paletteSearch(); }
      }
    });
    render();
    setTimeout(() => input.focus(), 20);
    GH.bus.emit('palette:opened');
  };
  ui.closePalette = function (silent) {
    const p = document.querySelector('.palette'), b = document.querySelector('.palette-backdrop');
    if (p) p.remove(); if (b) b.remove();
    if (p && !silent) GH.bus.emit('palette:closed');
  };
  GH.actions.openPalette = () => ui.openPalette();
  GH.actions.closePalette = () => ui.closePalette();
  GH.actions.paletteSearch = () => { const v = (document.querySelector('.palette input') || {}).value || ''; ui.closePalette(true); GH.router.go('#/search?q=' + encodeURIComponent(v.trim())); };
  GH.bus.on('route', () => ui.closePalette(true));

  // ---------- Navigation drawer ----------
  ui.openDrawer = function () {
    ui.closeMenus();
    const ov = document.getElementById('overlays');
    const bd = document.createElement('div'); bd.className = 'drawer-backdrop'; bd.addEventListener('click', () => ui.closeDrawer());
    const d = document.createElement('nav'); d.className = 'drawer'; d.setAttribute('data-tour', 'drawer'); d.setAttribute('aria-label', 'Global navigation');
    const r = GH.router.current || {};
    const mine = S().myRepos();
    const link = (ic, label, nav, sel, what) => `<button class="navlist-item ${sel ? 'selected' : ''}" ${nav ? `data-nav="${nav}"` : `data-action="notsim" data-what="${what || label}"`} data-drawer-link>${icon(ic)}<span>${label}</span></button>`;
    d.innerHTML = `<div class="drawer-head"><span class="sim-logo" aria-hidden="true">${icon('mortar-board')}</span><button class="btn btn-invisible btn-icon" data-action="closeDrawer" aria-label="Close navigation" data-tour="drawer-close">${icon('x')}</button></div>
      <div class="drawer-body"><div class="navlist">
        ${link('home', 'Home', '#/', r.view === 'dashboard')}
        ${link('globe', 'Feed', '#/', false)}
        ${link('issue-opened', 'Issues', '#/issues', r.view === 'globalIssues')}
        ${link('git-pull-request', 'Pull requests', '#/pulls', r.view === 'globalPulls')}
        ${link('repo', 'Repositories', '#/' + S().me() + '?tab=repositories', false)}
        ${link('table', 'Projects', null, false)}
        ${link('comment-discussion', 'Discussions', null, false)}
        ${link('codespaces', 'Codespaces', null, false)}
        ${link('copilot', 'Copilot', null, false)}
        <div class="navlist-divider"></div>
        ${link('telescope', 'Explore', '#/explore', r.view === 'explore')}
        ${link('gift', 'Marketplace', null, false)}
        ${link('server', 'MCP registry', null, false)}
        <div class="navlist-divider"></div>
        <div class="navlist-heading"><span>Top repositories</span></div>
        ${mine.length ? mine.slice(0, 6).map(x => `<a class="repo-list-item" href="#/${esc(x.owner)}/${esc(x.name)}" data-drawer-link>${avatar(x.owner, 16)}<span class="truncate">${esc(x.owner)}/${esc(x.name)}</span></a>`).join('') : '<div class="muted f6" style="padding:4px 8px">You don\'t have any repositories yet.</div>'}
      </div></div>`;
    d.addEventListener('click', (e) => { if (e.target.closest('[data-drawer-link]') && !e.target.closest('[data-action="notsim"]')) setTimeout(() => ui.closeDrawer(), 0); });
    ov.appendChild(bd); ov.appendChild(d);
    setTimeout(() => d.querySelector('button').focus(), 20);
    GH.bus.emit('drawer:opened');
  };
  ui.closeDrawer = function () {
    const d = document.querySelector('.drawer'); const b = document.querySelector('.drawer-backdrop');
    if (d) d.remove(); if (b) b.remove();
    if (d) GH.bus.emit('drawer:closed');
  };
  GH.actions.openDrawer = () => ui.openDrawer();
  GH.actions.closeDrawer = () => ui.closeDrawer();

  // ---------- Header menus ----------
  GH.actions.createMenu = (el) => {
    const r = GH.router.current && GH.router.current.repo;
    ui.openMenu(el, `<ul class="ActionList" role="none">
      ${ui.menuItem({ icon: 'issue-opened', label: 'New issue', action: 'newIssueFromHeader' })}
      ${ui.menuItem({ icon: 'repo', label: 'New repository', nav: '#/new', tour: 'menu-new-repo' })}
      ${ui.menuItem({ icon: 'repo-push', label: 'Import repository', action: 'notsim', what: 'Import repository' })}
      <li class="ActionList-divider" role="separator"></li>
      ${ui.menuItem({ icon: 'codespaces', label: 'New codespace', action: 'notsim', what: 'Codespaces' })}
      ${ui.menuItem({ icon: 'code', label: 'New gist', action: 'notsim', what: 'Gists' })}
      <li class="ActionList-divider" role="separator"></li>
      ${ui.menuItem({ icon: 'organization', label: 'New organization', action: 'notsim', what: 'Organizations' })}
      ${ui.menuItem({ icon: 'project', label: 'New project', action: 'notsim', what: 'Projects' })}
      ${r && S().isAdmin(r) ? `<li class="ActionList-divider" role="separator"></li><li class="ActionList-heading">This repository</li>${ui.menuItem({ icon: 'person', label: 'Invite collaborators', nav: `#/${r.owner}/${r.name}/settings/access` })}` : ''}
    </ul>`, { align: 'right', width: 220, id: 'create', tour: 'menu-create' });
  };
  GH.actions.newIssueFromHeader = () => {
    const r = GH.router.current && GH.router.current.repo;
    if (r) GH.router.go(`#/${r.owner}/${r.name}/issues/new`);
    else { const mine = S().myRepos(); if (mine.length) GH.router.go(`#/${mine[0].owner}/${mine[0].name}/issues/new`); else ui.toast('Primero crea un repositorio para poder abrir un issue.', 'info'); }
    ui.closeMenus();
  };
  GH.actions.userMenu = (el) => {
    const u = S().state.user;
    ui.openMenu(el, `<div class="Overlay-header" style="padding:16px">${avatar(u.login, 32)}<div class="flex-1"><div class="bold">${esc(u.login)}</div><div class="muted f6">${esc(u.name)}</div></div></div>
      <ul class="ActionList" role="none" style="padding-top:0">
      ${ui.menuItem({ icon: 'smiley', label: 'Set status', action: 'notsim', what: 'Set status' })}
      <li class="ActionList-divider" role="separator"></li>
      ${ui.menuItem({ icon: 'person', label: 'Profile', nav: '#/' + u.login, tour: 'menu-profile' })}
      ${ui.menuItem({ icon: 'repo', label: 'Repositories', nav: '#/' + u.login + '?tab=repositories', tour: 'menu-repos' })}
      ${ui.menuItem({ icon: 'star', label: 'Stars', nav: '#/' + u.login + '?tab=stars' })}
      ${ui.menuItem({ icon: 'code', label: 'Gists', action: 'notsim', what: 'Gists' })}
      ${ui.menuItem({ icon: 'organization', label: 'Organizations', action: 'notsim', what: 'Organizations' })}
      <li class="ActionList-divider" role="separator"></li>
      ${ui.menuItem({ icon: 'gear', label: 'Settings', action: 'notsim', what: 'Configuración de la cuenta' })}
      ${ui.menuItem({ icon: 'copilot', label: 'Copilot settings', action: 'notsim', what: 'Copilot' })}
      ${ui.menuItem({ icon: 'paintbrush', label: 'Appearance', action: 'notsim', what: 'Appearance' })}
      <li class="ActionList-divider" role="separator"></li>
      ${ui.menuItem({ icon: 'sign-out', label: 'Sign out', action: 'signOutInfo' })}
      </ul>`, { align: 'right', width: 280, id: 'user', tour: 'menu-user' });
  };
  GH.actions.signOutInfo = () => { ui.closeMenus(); ui.toast('Este simulador no usa cuentas ni contraseñas: no hay ninguna sesión que cerrar.', 'info'); };
  GH.actions.copilotMenu = (el) => {
    ui.openMenu(el, `<ul class="ActionList">${ui.menuItem({ icon: 'copilot', label: 'Open Copilot', action: 'notsim', what: 'Copilot' })}${ui.menuItem({ icon: 'plus', label: 'New chat', action: 'notsim', what: 'Copilot' })}</ul>`, { align: 'right', width: 200 });
  };

  // ---------- Header ----------
  ui.header = function (ctx) {
    ctx = ctx || {};
    const u = S().state.user;
    const r = ctx.repo;
    let context = '';
    if (r) context = `<a class="owner" href="#/${esc(r.owner)}">${esc(r.owner)}</a><span class="sep">/</span><a href="#/${esc(r.owner)}/${esc(r.name)}" data-tour="header-repo-link">${esc(r.name)}</a>`;
    else if (ctx.owner) context = `<a href="#/${esc(ctx.owner)}">${esc(ctx.owner)}</a>`;
    else context = `<a href="#/">${esc(ctx.title || 'Dashboard')}</a>`;
    const openIssues = 0;
    return `<header class="AppHeader" role="banner">
      <div class="AppHeader-globalBar">
        <div class="AppHeader-logo">
          <button class="AppHeader-button" data-action="openDrawer" aria-label="Open global navigation menu" data-tour="header-menu">${icon('three-bars')}</button>
          <a href="#/" class="sim-logo" aria-label="Dashboard (inicio)" data-tour="header-logo" title="Inicio">${icon('mortar-board')}</a>
          <div class="AppHeader-context">${context}</div>
          <span class="sim-tag" title="Simulador educativo independiente: no es GitHub y no está afiliado a GitHub, Inc. Nada de lo que hagas aquí sale de tu navegador.">Simulador</span>
        </div>
        <div class="AppHeader-actions">
          <button class="AppHeader-button search" data-action="openPalette" aria-label="Search or jump to…" data-tour="header-search">${icon('search')}</button>
          <div class="btn-group" data-tour="header-copilot"><button class="AppHeader-button" style="border-radius:6px 0 0 6px" data-action="notsim" data-what="Copilot" aria-label="Chat with Copilot">${icon('copilot')}</button><button class="AppHeader-button" style="border-radius:0 6px 6px 0;margin-left:-1px;min-width:24px;padding:0 4px" data-action="copilotMenu" aria-label="Open Copilot menu">${icon('triangle-down')}</button></div>
          <span class="AppHeader-divider"></span>
          <button class="AppHeader-button" data-action="createMenu" aria-label="Create something new" aria-haspopup="true" data-tour="header-create">${icon('plus')}${icon('triangle-down')}</button>
          <span class="flex gap-2" data-tour="header-shortcuts">
            <button class="AppHeader-button" data-nav="#/issues" aria-label="Your issues" data-tour="header-issues">${icon('issue-opened')}</button>
            <button class="AppHeader-button" data-nav="#/pulls" aria-label="Your pull requests" data-tour="header-pulls">${icon('git-pull-request')}</button>
            <button class="AppHeader-button" data-nav="#/${esc(u.login)}?tab=repositories" aria-label="Your repositories" data-tour="header-repos">${icon('repo')}</button>
            <button class="AppHeader-button" data-nav="#/notifications" aria-label="You have unread notifications" data-tour="header-inbox">${icon('inbox')}${S().state.notifications.some(n => !n.read) ? '<span class="badge-dot"></span>' : ''}</button>
          </span>
          <button class="AppHeader-avatarBtn" data-action="userMenu" aria-label="Open user navigation menu" aria-haspopup="true" data-tour="header-avatar">${avatar(u.login, 32)}</button>
        </div>
      </div>
      ${r ? ui.repoTabs(r, ctx.tab) : ''}
    </header>`;
  };

  ui.repoTabs = function (r, tab) {
    const openIssues = r.issues.filter(i => i.state === 'open').length;
    const openPRs = r.pulls.filter(p => p.state === 'open').length;
    const base = `#/${r.owner}/${r.name}`;
    const t = (id, ic, label, href, count) => `<a class="UnderlineNav-item ${tab === id ? 'selected' : ''}" href="${href}" ${tab === id ? 'aria-current="page"' : ''} data-tour="tab-${id}">${icon(ic)}<span>${label}</span>${count ? `<span class="Counter">${count}</span>` : ''}</a>`;
    return `<div class="AppHeader-localBar"><nav class="UnderlineNav" aria-label="Repository" data-tour="repo-tabs">
      ${t('code', 'code', 'Code', base)}
      ${r.features.issues ? t('issues', 'issue-opened', 'Issues', base + '/issues', openIssues) : ''}
      ${t('pulls', 'git-pull-request', 'Pull requests', base + '/pulls', openPRs)}
      ${t('actions', 'play', 'Actions', base + '/actions')}
      ${r.features.projects ? t('projects', 'table', 'Projects', base + '/projects') : ''}
      ${r.features.wiki && r.owner !== S().me() ? t('wiki', 'book', 'Wiki', base + '/wiki') : ''}
      ${t('security', 'shield', 'Security and quality', base + '/security')}
      ${t('insights', 'graph', 'Insights', base + '/insights')}
      ${S().isAdmin(r) ? t('settings', 'gear', 'Settings', base + '/settings') : ''}
    </nav></div>`;
  };

  ui.footer = function () {
    return `<footer class="sim-footer"><span>${icon('mortar-board')} Simulador educativo independiente para aprender GitHub.</span><span>No está afiliado a GitHub, Inc. No usa cuentas, contraseñas ni repositorios reales.</span><span>Iconos: Octicons (MIT).</span></footer>`;
  };

  ui.copyBtn = function (text, label, tour) {
    return `<button class="btn btn-invisible btn-sm btn-icon" data-action="copy" data-copy="${esc(text)}" aria-label="${esc(label || 'Copy')}" ${tour ? `data-tour="${tour}"` : ''}>${icon('copy')}</button>`;
  };
  GH.actions.copy = (el) => {
    GH.copyText(el.getAttribute('data-copy'));
    el.innerHTML = icon('check', 16, 'color-success');
    setTimeout(() => { if (el.isConnected) el.innerHTML = icon('copy'); }, 1600);
    ui.toast('Copied!');
    GH.bus.emit('copied', el.getAttribute('data-copy'));
  };

  ui.relTime = function (ts) { return `<relative-time title="${esc(new Date(ts).toLocaleString())}">${GH.timeAgo(ts)}</relative-time>`; };
})(window.GH);
