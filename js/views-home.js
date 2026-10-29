/* Views: dashboard, new repository, profile, search, explore, notifications, global lists, 404. */
(function (GH) {
  'use strict';
  const { esc, icon, avatar } = GH;
  const S = () => GH.store;
  const V = GH.views;
  const A = GH.actions;

  function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function repoIcon(r) { return icon(r.visibility === 'private' ? 'lock' : 'repo'); }
  function visLabel(r) { return `<span class="Label">${r.visibility === 'private' ? 'Private' : 'Public'}</span>`; }

  // ---------------- Dashboard ----------------
  V.dashboard = function () {
    const u = S().state.user;
    const mine = S().myRepos();
    const fresh = S().state.tutorial.freshRepo;
    const myPRs = [];
    S().visibleRepos().forEach(r => r.pulls.forEach(p => { if (p.author === u.login) myPRs.push({ r, p }); }));
    myPRs.sort((a, b) => b.p.createdAt - a.p.createdAt);
    const explore = S().visibleRepos().filter(r => r.owner !== u.login);
    const side = `<aside class="dashboard-side" aria-label="Dashboard sidebar">
      <nav class="navlist" aria-label="Dashboard">
        <a class="navlist-item selected" href="#/" aria-current="page">${icon('home')}<span>Home</span></a>
        <button class="navlist-item" data-action="notsim" data-what="Feed">${icon('globe')}<span>Feed</span></button>
      </nav>
      <div class="navlist-divider" style="margin:16px 0"></div>
      <div data-tour="top-repos">
        <div class="navlist-heading"><span>Top repositories</span><span class="flex gap-1"><button class="btn btn-primary btn-sm" data-nav="#/new" data-tour="side-new-repo">${icon('repo')} New</button></span></div>
        ${mine.length ? `<div class="navlist" style="margin-top:8px">${mine.slice(0, 8).map(r => `<a class="repo-list-item ${fresh === S().key(r) ? 'fresh' : ''}" href="#/${esc(r.owner)}/${esc(r.name)}" data-tour="top-repo-${esc(r.name)}">${avatar(r.owner, 20)}<span class="truncate">${esc(r.owner)}/${esc(r.name)}</span>${r.visibility === 'private' ? icon('lock', 12, 'muted') : ''}</a>`).join('')}</div>`
        : `<div style="padding:8px"><p class="muted" style="margin-bottom:12px">Create your first project</p><p class="muted f6" style="margin-bottom:12px">Ready to start building? Create a repository for a new idea or bring over an existing repository to keep contributing to it.</p><button class="btn btn-primary btn-sm" data-nav="#/new">${icon('repo')} Create repository</button></div>`}
      </div>
    </aside>`;
    const main = `<div class="dashboard-main">
      <div class="flex" style="justify-content:flex-end"><span class="Label Label--success">Preview</span><button class="btn btn-invisible btn-sm btn-icon" data-action="notsim" data-what="Dashboard preview">${icon('triangle-down')}</button></div>
      <h1 class="greeting" data-tour="greeting">${icon('copilot', 24)} ${greeting()}, ${esc(u.name || u.login)}!</h1>
      <div class="copilot-box" data-tour="copilot-box">
        <textarea placeholder="Ask anything or type @ to add context" aria-label="Ask Copilot" data-onenter="copilotAsk"></textarea>
        <div class="flex gap-2">
          <button class="btn btn-sm" data-action="notsim" data-what="Copilot">${icon('comment-discussion')} Ask ${icon('triangle-down')}</button>
          <button class="btn btn-sm" data-action="notsim" data-what="Copilot">${icon('repo')} All repositories ${icon('triangle-down')}</button>
          <button class="btn btn-sm btn-icon" data-action="notsim" data-what="Copilot" aria-label="Add context">${icon('plus')}</button>
          <span class="ml-auto"></span>
          <button class="btn btn-invisible btn-sm btn-icon" data-action="copilotAsk" aria-label="Send">${icon('arrow-right')}</button>
        </div>
      </div>
      <div class="chip-row">
        <button class="chip" data-action="notsim" data-what="Copilot">${icon('bug')} Debug</button>
        <button class="chip" data-action="notsim" data-what="Copilot coding agent">${icon('cloud')} Agent</button>
        <button class="chip" data-action="newIssueFromHeader">${icon('issue-opened')} Create issue</button>
        <button class="chip" data-action="notsim" data-what="Copilot">${icon('file')} Write code ${icon('triangle-down')}</button>
        <button class="chip" data-action="notsim" data-what="Copilot">${icon('git-branch')} Git ${icon('triangle-down')}</button>
      </div>
      <section class="dash-section">
        <div class="dash-section-head"><h2>Pull requests</h2><span class="flex gap-2"><a href="#/pulls">View all</a><button class="btn btn-invisible btn-sm btn-icon" data-action="notsim" data-what="Filtros" aria-label="Filter">${icon('filter')}</button></span></div>
        <div class="Box">${myPRs.length ? myPRs.slice(0, 4).map(({ r, p }) => `<div class="Box-row hoverable">${prIcon(p)}<div class="flex-1"><a class="link-primary bold" href="#/${esc(r.owner)}/${esc(r.name)}/pull/${p.number}">${esc(p.title)}</a><div class="muted f6">${esc(r.owner)}/${esc(r.name)} #${p.number} · ${GH.timeAgo(p.createdAt)}</div></div></div>`).join('') : `<div class="Box-row muted" style="justify-content:center;padding:24px">No pull requests found, try a different filter.</div>`}</div>
      </section>
      <section class="dash-section" data-tour="explore-repos">
        <div class="dash-section-head"><h2>Explore repositories</h2><a href="#/explore">Explore more →</a></div>
        <div class="feed-card">${explore.map(r => `<div class="feed-item">${avatar(r.owner, 32, true)}<div class="flex-1"><a class="link-primary bold" href="#/${esc(r.owner)}/${esc(r.name)}">${esc(r.owner)}/${esc(r.name)}</a><p class="muted" style="margin:4px 0">${esc(r.description)}</p><span class="muted f6 flex gap-3"><span class="flex gap-1">${icon('star')} ${r.stars}</span><span class="flex gap-1"><span class="lang-dot" style="background:#083fa1"></span> Markdown</span><span>Updated ${GH.timeAgo(S().pushedAt(r))}</span></span></div><button class="btn btn-sm" data-action="starRepo" data-repo="${esc(S().key(r))}">${icon(r.starred ? 'star-fill' : 'star', 16, r.starred ? 'color-attention' : '')} ${r.starred ? 'Starred' : 'Star'}</button></div>`).join('')}</div>
      </section>
    </div>`;
    return { header: { title: 'Dashboard' }, title: 'Dashboard', html: `<div class="dashboard">${side}${main}</div>`, noFooter: false, after() { if (fresh) setTimeout(() => { S().state.tutorial.freshRepo = null; }, 5000); } };
  };
  A.copilotAsk = () => GH.ui.notSimulated('Copilot (asistente de IA)');
  A.starRepo = (el) => { const r = S().state.repos[el.getAttribute('data-repo')]; if (r) { S().toggleStar(r); GH.ui.toast(r.starred ? `Marcaste <strong>${esc(r.name)}</strong> con una estrella ⭐` : 'Estrella retirada', r.starred ? '' : 'info'); GH.render(); } };

  function prIcon(p) {
    if (p.state === 'merged') return icon('git-merge', 16, 'color-done');
    if (p.state === 'closed') return icon('git-pull-request-closed', 16, 'color-danger');
    return icon('git-pull-request', 16, 'color-success');
  }
  GH.prIcon = prIcon;

  // ---------------- New repository ----------------
  const SUGGESTIONS = ['probable-disco', 'fantastic-octo-garden', 'super-duper-guide', 'glowing-umbrella', 'curly-adventure', 'refactored-memory'];
  let nr = null;
  function resetNR() { nr = { name: '', description: '', visibility: 'public', readme: false, gitignore: null, license: null, suggestion: SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)] }; }
  GH.resetNewRepoForm = resetNR;
  V.newRepo = function () {
    if (!nr) resetNR();
    const me = S().me();
    return {
      header: { title: 'New repository' }, title: 'New repository',
      html: `<div class="newrepo" data-tour="new-repo-form">
        <h1>Create a new repository</h1>
        <p class="muted">Repositories contain a project's files and version history. Have a project elsewhere? <a href="#" data-action="notsim" data-what="Import a repository">Import a repository</a>.</p>
        <p class="muted"><em>Required fields are marked with an asterisk (*).</em></p>
        <div class="step-section"><span class="step-num">1</span><h2>General</h2>
          <div class="flex gap-2" style="align-items:flex-start">
            <div><label class="form-label">Owner *</label><button class="btn" data-action="notsim" data-what="Cambiar de propietario (organizaciones)">${avatar(me, 20)} ${esc(me)} ${icon('triangle-down')}</button></div>
            <div style="font-size:24px;padding-top:28px;color:var(--fgColor-muted)">/</div>
            <div class="flex-1"><label class="form-label" for="nr-name">Repository name *</label><input id="nr-name" class="form-control" value="${esc(nr.name)}" data-oninput="nrName" data-tour="nr-name" autocomplete="off" aria-describedby="nr-name-status"><div id="nr-name-status"></div></div>
          </div>
          <p class="muted" style="margin-top:12px">Great repository names are short and memorable. How about <button class="btn-link" style="color:var(--fgColor-success);font-weight:600" data-action="nrSuggest">${esc(nr.suggestion)}</button>?</p>
          <div class="mt-3"><label class="form-label" for="nr-desc" style="font-weight:400">Description</label><input id="nr-desc" class="form-control" maxlength="350" value="${esc(nr.description)}" data-oninput="nrDesc" data-tour="nr-desc"><div class="form-hint" id="nr-desc-count">${nr.description.length} / 350 characters</div></div>
        </div>
        <div class="step-section"><span class="step-num">2</span><h2>Configuration</h2>
          <div class="config-box">
            <div class="config-row" data-tour="nr-visibility"><div class="txt"><strong>Choose visibility *</strong><span>Choose who can see and commit to this repository</span></div><button class="btn" data-action="nrVisMenu" data-tour="nr-vis-btn" aria-haspopup="true">${icon(nr.visibility === 'private' ? 'lock' : 'repo')} ${nr.visibility === 'private' ? 'Private' : 'Public'} ${icon('triangle-down')}</button></div>
            <div class="config-row"><div class="txt"><strong>Start with a template</strong><span>Templates pre-configure your repository with files.</span></div><button class="btn" data-action="notsim" data-what="Plantillas de repositorio">No template ${icon('triangle-down')}</button></div>
            <div class="config-row" data-tour="nr-readme"><div class="txt"><strong>Add README</strong><span>READMEs can be used as longer descriptions. <a href="#" data-action="notsim" data-what="Documentación sobre READMEs">About READMEs</a></span></div><button class="toggle" role="switch" aria-checked="${nr.readme}" data-action="nrReadme" data-tour="nr-readme-toggle" aria-label="Add README"><span>${nr.readme ? 'On' : 'Off'}</span><span class="knob-track"><span class="knob"></span></span></button></div>
            <div class="config-row"><div class="txt"><strong>Add .gitignore</strong><span>.gitignore tells git which files not to track.</span></div><button class="btn" data-action="nrGitignore">${nr.gitignore ? esc(nr.gitignore) : 'No .gitignore'} ${icon('triangle-down')}</button></div>
            <div class="config-row"><div class="txt"><strong>Add license</strong><span>Licenses explain how others can use your code.</span></div><button class="btn" data-action="nrLicense">${nr.license ? esc(nr.license) : 'No license'} ${icon('triangle-down')}</button></div>
          </div>
        </div>
        <div class="flex mt-4" style="justify-content:flex-end"><button class="btn btn-primary" data-action="nrCreate" data-tour="nr-create" ${validName().ok ? '' : 'disabled'}>Create repository</button></div>
      </div>`,
      after() { updateNameStatus(); }
    };
  };
  function validName() {
    const raw = nr.name.trim();
    if (!raw) return { ok: false };
    const slug = GH.slug(raw);
    if (!slug) return { ok: false, msg: 'Repository name can only contain ASCII letters, digits, and the characters ., -, and _.' };
    if (S().raw(S().me(), slug)) return { ok: false, msg: `The repository <strong>${esc(slug)}</strong> already exists on this account.` };
    return { ok: true, slug, renamed: slug !== raw };
  }
  function updateNameStatus() {
    const el = document.getElementById('nr-name-status'); if (!el) return;
    const v = validName();
    if (!nr.name.trim()) el.innerHTML = '';
    else if (!v.ok) el.innerHTML = `<div class="form-error">${icon('alert', 12)} ${v.msg}</div>`;
    else el.innerHTML = v.renamed ? `<div class="form-hint">Your new repository will be created as <strong style="color:var(--fgColor-default)">${esc(v.slug)}</strong>.</div>` : `<div class="form-success">${icon('check', 12)} ${esc(v.slug)} is available.</div>`;
    const btn = document.querySelector('[data-action="nrCreate"]'); if (btn) btn.disabled = !v.ok;
  }
  A.nrName = (el) => { nr.name = el.value; updateNameStatus(); GH.bus.emit('form:input'); };
  A.nrDesc = (el) => { nr.description = el.value; const c = document.getElementById('nr-desc-count'); if (c) c.textContent = `${el.value.length} / 350 characters`; GH.bus.emit('form:input'); };
  A.nrSuggest = () => { nr.name = nr.suggestion; GH.render(); GH.bus.emit('form:input'); };
  A.nrVisMenu = (el) => {
    GH.ui.openMenu(el, `<ul class="ActionList">
      ${GH.ui.menuItem({ icon: 'repo', label: 'Public', desc: 'Anyone on the internet can see this repository. You choose who can commit.', action: 'nrSetVis', data: 'data-v="public"', checked: nr.visibility === 'public', tour: 'nr-vis-public' })}
      ${GH.ui.menuItem({ icon: 'lock', label: 'Private', desc: 'You choose who can see and commit to this repository.', action: 'nrSetVis', data: 'data-v="private"', checked: nr.visibility === 'private', tour: 'nr-vis-private' })}
    </ul>`, { align: 'right', width: 320, id: 'nr-vis', tour: 'nr-vis-menu' });
  };
  A.nrSetVis = (el) => { nr.visibility = el.getAttribute('data-v'); GH.ui.closeMenus(); GH.render(); GH.bus.emit('nr:visibility', nr.visibility); };
  A.nrReadme = () => { nr.readme = !nr.readme; GH.render(); GH.bus.emit('nr:readme', nr.readme); };
  A.nrGitignore = (el) => GH.ui.openMenu(el, `<ul class="ActionList">${['No .gitignore', 'Node', 'Python', 'macOS'].map(x => GH.ui.menuItem({ label: x, action: 'nrSetGi', data: `data-v="${x}"`, checked: (nr.gitignore || 'No .gitignore') === x })).join('')}</ul>`, { align: 'right', width: 220 });
  A.nrSetGi = (el) => { const v = el.getAttribute('data-v'); nr.gitignore = v === 'No .gitignore' ? null : v; GH.ui.closeMenus(); GH.render(); };
  A.nrLicense = (el) => GH.ui.openMenu(el, `<ul class="ActionList">${['No license', 'MIT License', 'Apache License 2.0'].map(x => GH.ui.menuItem({ label: x, action: 'nrSetLic', data: `data-v="${x}"`, checked: (nr.license || 'No license') === x })).join('')}</ul>`, { align: 'right', width: 220 });
  A.nrSetLic = (el) => { const v = el.getAttribute('data-v'); nr.license = v === 'No license' ? null : v; GH.ui.closeMenus(); GH.render(); };
  A.nrCreate = () => {
    const v = validName(); if (!v.ok) return;
    const r = S().createRepo({ name: v.slug, description: nr.description.trim(), visibility: nr.visibility, readme: nr.readme, gitignore: nr.gitignore, license: nr.license });
    S().state.tutorial.repo = S().key(r);
    S().state.tutorial.freshRepo = S().key(r);
    S().save();
    resetNR();
    GH.router.go(`#/${r.owner}/${r.name}`);
    GH.bus.emit('repo:created', r);
  };

  // ---------------- Profile ----------------
  V.profile = function (rt) {
    const login = rt.owner;
    const isMe = login === S().me();
    const p = S().state.people[login] || (isMe ? { login, name: S().state.user.name, bio: S().state.user.bio } : null);
    if (!p) return V.notFound(rt);
    const tab = rt.query.tab || 'overview';
    const repos = S().reposOf(login);
    const starred = S().visibleRepos().filter(r => r.starred);
    const tabs = [['overview', 'book', 'Overview'], ['repositories', 'repo', 'Repositories', repos.length], ['projects', 'table', 'Projects'], ['packages', 'package', 'Packages'], ['stars', 'star', 'Stars', isMe ? starred.length : 0]];
    let body = '';
    if (tab === 'repositories' || tab === 'stars') {
      const list = tab === 'stars' ? starred : repos;
      const q = (rt.query.q || '').toLowerCase();
      const filtered = list.filter(r => !q || r.name.toLowerCase().includes(q));
      body = `<div class="flex gap-2" style="padding-bottom:16px;border-bottom:1px solid var(--borderColor-muted)"><input class="form-control" placeholder="Find a repository…" value="${esc(rt.query.q || '')}" data-onenter="profileFilter" data-tab="${tab}" aria-label="Find a repository" style="flex:1"><button class="btn">Type ${icon('triangle-down')}</button><button class="btn">Sort ${icon('triangle-down')}</button>${isMe && tab === 'repositories' ? `<button class="btn btn-primary" data-nav="#/new">${icon('repo')} New</button>` : ''}</div>
        ${filtered.length ? filtered.map(r => `<div class="repo-row" data-tour="profile-repo-${esc(r.name)}"><div class="flex gap-2"><a class="f4 bold" href="#/${esc(r.owner)}/${esc(r.name)}">${tab === 'stars' ? esc(r.owner) + ' / ' : ''}${esc(r.name)}</a>${visLabel(r)}<button class="btn btn-sm ml-auto" data-action="starRepo" data-repo="${esc(S().key(r))}">${icon(r.starred ? 'star-fill' : 'star')} ${r.starred ? 'Starred' : 'Star'}</button></div>${r.description ? `<p class="muted mt-2">${esc(r.description)}</p>` : ''}<div class="muted f6 mt-2 flex gap-3"><span class="flex gap-1"><span class="lang-dot" style="background:#083fa1"></span> Markdown</span>${r.stars ? `<span class="flex gap-1">${icon('star')} ${r.stars}</span>` : ''}<span>Updated ${GH.timeAgo(S().pushedAt(r))}</span></div></div>`).join('') : `<div class="blankslate">${icon(tab === 'stars' ? 'star' : 'repo', 24)}<h3>${tab === 'stars' ? (isMe ? 'Create your first list' : 'No starred repositories') : `${esc(login)} doesn’t have any repositories ${q ? 'that match' : 'yet'}.`}</h3>${tab === 'stars' ? '<p>Marca repositorios con ⭐ Star para guardarlos aquí.</p>' : ''}</div>`}`;
    } else if (tab === 'overview') {
      const pop = repos.slice(0, 6);
      body = `<h2 class="f4" style="font-weight:400;margin-bottom:8px">${repos.length ? 'Popular repositories' : ''}</h2>
        ${pop.length ? `<div class="repo-grid">${pop.map(r => `<div class="repo-card"><div class="flex gap-2"><a class="bold" href="#/${esc(r.owner)}/${esc(r.name)}">${esc(r.name)}</a>${visLabel(r)}</div><p class="muted f6 flex-1">${esc(r.description)}</p><div class="muted f6 flex gap-3"><span class="flex gap-1"><span class="lang-dot" style="background:#083fa1"></span> Markdown</span>${r.stars ? `<span class="flex gap-1">${icon('star')} ${r.stars}</span>` : ''}</div></div>`).join('')}</div>` : `<div class="Box blankslate">${icon('repo', 24)}<h3>${isMe ? 'You don’t have any public repositories yet.' : 'No public repositories'}</h3>${isMe ? '<p>Crea tu primer repositorio con el botón <strong>+</strong> del encabezado.</p>' : ''}</div>`}
        <h2 class="f4 mt-4" style="font-weight:400;margin-bottom:8px">${contribCount(login)} contributions in the last year</h2>${contribGraph(login)}`;
    } else {
      body = `<div class="Box blankslate">${icon(tab === 'projects' ? 'table' : 'package', 24)}<h3>${tab === 'projects' ? 'Create your first GitHub project' : 'Get started with GitHub Packages'}</h3><p>Esta sección no forma parte del simulador.</p></div>`;
    }
    return {
      header: { owner: login }, title: login,
      html: `<div class="AppHeader-localBar" style="background:var(--bgColor-inset);border-bottom:1px solid var(--borderColor-muted)"><nav class="UnderlineNav" data-tour="profile-tabs">${tabs.map(t => `<a class="UnderlineNav-item ${tab === t[0] ? 'selected' : ''}" href="#/${esc(login)}?tab=${t[0]}">${icon(t[1])}<span>${t[2]}</span>${t[3] ? `<span class="Counter">${t[3]}</span>` : ''}</a>`).join('')}</nav></div>
      <div class="container-xl" data-tour="profile-main"><div class="profile-layout">
        <div>${avatar(login, 296, p.org).replace('class="avatar', 'class="avatar profile-avatar')}
          <h1 style="font-size:24px;margin-top:16px">${esc(p.name || login)}</h1><div class="muted" style="font-size:20px;font-weight:300">${esc(login)}</div>
          ${p.bio ? `<p class="mt-3">${esc(p.bio)}</p>` : ''}
          ${isMe ? `<button class="btn btn-block mt-3" data-action="editProfile">Edit profile</button>` : `<button class="btn btn-block mt-3" data-action="notsim" data-what="Seguir a otras personas">Follow</button>`}
          <div class="muted mt-3 flex gap-1">${icon('people')} <strong style="color:var(--fgColor-default)">${isMe ? 0 : 42}</strong> followers · <strong style="color:var(--fgColor-default)">${isMe ? 0 : 3}</strong> following</div>
        </div>
        <div>${body}</div>
      </div></div>`
    };
  };
  A.profileFilter = (el) => GH.router.go(`#/${GH.router.current.owner}?tab=${el.getAttribute('data-tab')}&q=${encodeURIComponent(el.value)}`);
  A.editProfile = () => {
    const u = S().state.user;
    GH.ui.dialog({
      title: 'Edit profile', body: `<label class="form-label">Name</label><input class="form-control" id="ep-name" value="${esc(u.name)}"><label class="form-label mt-3">Bio</label><textarea class="form-control" id="ep-bio" style="min-height:60px">${esc(u.bio || '')}</textarea><p class="form-hint">Tu nombre de usuario (<strong>${esc(u.login)}</strong>) forma parte de las direcciones de tus repositorios.</p>`,
      footer: `<button class="btn" data-action="closeDialog">Cancel</button><button class="btn btn-primary" data-action="saveProfile">Save</button>`
    });
  };
  A.saveProfile = () => { const u = S().state.user; u.name = document.getElementById('ep-name').value.trim() || u.name; u.bio = document.getElementById('ep-bio').value.trim(); S().save(); GH.ui.closeDialog(); GH.render(); GH.ui.toast('Profile updated'); };

  function myCommits(login) { const out = []; Object.values(S().state.repos).forEach(r => Object.values(r.commits).forEach(c => { if (c.author === login) out.push(c); })); return out; }
  function contribCount(login) { return myCommits(login).filter(c => Date.now() - c.date < 365 * 86400000).length; }
  function contribGraph(login) {
    const counts = {};
    myCommits(login).forEach(c => { const d = new Date(c.date); d.setHours(0, 0, 0, 0); counts[d.getTime()] = (counts[d.getTime()] || 0) + 1; });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - 52 * 7 - today.getDay());
    let cells = '';
    for (let w = 0; w < 53; w++) for (let d = 0; d < 7; d++) {
      const day = new Date(start); day.setDate(start.getDate() + w * 7 + d);
      if (day > today) continue;
      const n = counts[day.getTime()] || 0;
      const fill = n === 0 ? '#151b23' : n < 2 ? '#033a16' : n < 4 ? '#196c2e' : n < 6 ? '#2ea043' : '#56d364';
      cells += `<rect x="${w * 13}" y="${d * 13}" width="10" height="10" rx="2" fill="${fill}" stroke="#ffffff0d"><title>${n} contributions on ${GH.fmtDate(day.getTime())}</title></rect>`;
    }
    return `<div class="Box" style="padding:16px;overflow-x:auto"><svg width="${53 * 13}" height="${7 * 13}" role="img" aria-label="Contribution graph">${cells}</svg><div class="flex f6 muted mt-2" style="justify-content:flex-end;gap:4px">Less <svg width="62" height="10">${['#151b23', '#033a16', '#196c2e', '#2ea043', '#56d364'].map((c, i) => `<rect x="${i * 13}" width="10" height="10" rx="2" fill="${c}"/>`).join('')}</svg> More</div></div>`;
  }

  // ---------------- Search ----------------
  V.search = function (rt) {
    const q = (rt.query.q || '').trim();
    const res = S().visibleRepos().filter(r => !q || (r.owner + '/' + r.name + ' ' + r.description).toLowerCase().includes(q.toLowerCase()));
    return {
      header: { title: 'Search' }, title: 'Search: ' + q,
      html: `<div class="list-layout"><aside class="list-side"><div class="navlist-heading">Filter by</div><div class="navlist">
        <button class="navlist-item selected">${icon('repo')}<span class="flex-1">Repositories</span><span class="Counter">${res.length}</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Búsqueda de código">${icon('code')}<span>Code</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Búsqueda de issues">${icon('issue-opened')}<span>Issues</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Búsqueda de pull requests">${icon('git-pull-request')}<span>Pull requests</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Búsqueda de usuarios">${icon('people')}<span>Users</span></button></div></aside>
        <div class="list-main"><div class="flex mb-3"><h2 class="f4">${res.length} result${res.length === 1 ? '' : 's'}</h2></div>
        <div class="Box">${res.length ? res.map(r => `<div class="Box-row hoverable" style="align-items:flex-start">${avatar(r.owner, 20, true)}<div class="flex-1"><a class="f4 bold" href="#/${esc(r.owner)}/${esc(r.name)}" data-tour="search-result-${esc(r.name)}">${esc(r.owner)}/${esc(r.name)}</a><p class="muted mt-2">${esc(r.description)}</p><div class="muted f6 mt-2 flex gap-3"><span class="flex gap-1"><span class="lang-dot" style="background:#083fa1"></span> Markdown</span><span class="flex gap-1">${icon('star')} ${r.stars}</span><span>Updated ${GH.timeAgo(S().pushedAt(r))}</span></div></div><button class="btn btn-sm" data-action="starRepo" data-repo="${esc(S().key(r))}">${icon(r.starred ? 'star-fill' : 'star')} ${r.starred ? 'Starred' : 'Star'}</button></div>`).join('') : `<div class="blankslate">${icon('search', 24)}<h3>Your search did not match any repositories</h3><p>Prueba con otra palabra, por ejemplo <em>recetas</em>.</p></div>`}</div></div></div>`
    };
  };

  V.explore = function () {
    const res = S().visibleRepos().filter(r => r.visibility === 'public').sort((a, b) => b.stars - a.stars);
    return { header: { title: 'Explore' }, title: 'Explore', html: `<div class="container-lg"><h1 class="page-title mb-3">Explore</h1><p class="muted mb-3">Proyectos públicos de la comunidad (ficticios) para practicar.</p><div class="Box">${res.map(r => `<div class="Box-row" style="align-items:flex-start">${avatar(r.owner, 32, true)}<div class="flex-1"><a class="f4 bold" href="#/${esc(r.owner)}/${esc(r.name)}">${esc(r.owner)} / ${esc(r.name)}</a><p class="muted mt-2">${esc(r.description)}</p></div><span class="muted flex gap-1">${icon('star')} ${r.stars}</span></div>`).join('')}</div></div>` };
  };

  V.notifications = function () {
    return { header: { title: 'Notifications' }, title: 'Notifications', html: `<div class="list-layout"><aside class="list-side"><div class="navlist"><button class="navlist-item selected">${icon('inbox')}<span>Inbox</span></button><button class="navlist-item" data-action="notsim" data-what="Saved">${icon('bookmark')}<span>Saved</span></button><button class="navlist-item" data-action="notsim" data-what="Done">${icon('check')}<span>Done</span></button></div></aside><div class="list-main"><div class="Box"><div class="list-head"><span class="bold">Inbox</span></div><div class="blankslate">${icon('inbox', 24)}<h3>All caught up!</h3><p>Take a break, write some code, do what you do best.</p><p class="f6 mt-3">Aquí llegan avisos cuando alguien te menciona, te pide revisar un pull request o comenta en tus issues.</p></div></div></div></div>` };
  };

  // ---------------- Global issues / PRs ----------------
  function globalList(kind) {
    const me = S().me();
    const items = [];
    S().visibleRepos().forEach(r => (kind === 'pulls' ? r.pulls : r.issues).forEach(x => { if (x.author === me || r.owner === me) items.push({ r, x }); }));
    items.sort((a, b) => b.x.createdAt - a.x.createdAt);
    const ic = kind === 'pulls' ? 'git-pull-request' : 'issue-opened';
    return `<div class="list-layout"><aside class="list-side"><div class="navlist">
      <button class="navlist-item selected">${icon(ic)}<span>${kind === 'pulls' ? 'Pull requests' : 'Issues'}</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('smiley')}<span>Created by me</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('person')}<span>Assigned to me</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('mention')}<span>Mentioned</span></button></div></aside>
      <div class="list-main"><h1 class="page-title bold mb-3" style="font-size:20px;font-weight:600">${kind === 'pulls' ? 'Pull requests' : 'Issues'}</h1>
      <div class="Box"><div class="list-head"><span class="tog selected">${icon(ic)} Open <span class="Counter">${items.filter(i => i.x.state === 'open').length}</span></span></div>
      ${items.length ? items.map(({ r, x }) => `<div class="list-row">${kind === 'pulls' ? prIcon(x) : icon(x.state === 'open' ? 'issue-opened' : 'issue-closed', 16, x.state === 'open' ? 'color-success' : 'color-done')}<div class="flex-1"><a class="t" href="#/${esc(r.owner)}/${esc(r.name)}/${kind === 'pulls' ? 'pull' : 'issues'}/${x.number}">${esc(x.title)}</a><div class="s">${esc(r.owner)}/${esc(r.name)}#${x.number} · opened ${GH.timeAgo(x.createdAt)} by ${esc(x.author)}</div></div></div>`).join('') : `<div class="blankslate">${icon(ic, 24)}<h3>No results matched your search</h3><p>Cuando abras ${kind === 'pulls' ? 'pull requests' : 'issues'} en tus repositorios aparecerán aquí.</p></div>`}</div></div></div>`;
  }
  V.globalIssues = () => ({ header: { title: 'Issues' }, title: 'Issues', html: globalList('issues') });
  V.globalPulls = () => ({ header: { title: 'Pull requests' }, title: 'Pull requests', html: globalList('pulls') });

  // ---------------- 404 ----------------
  V.notFound = function (rt) {
    const blocked = rt && rt.blockedRepo;
    return {
      header: { title: 'Page not found' }, title: 'Page not found',
      html: `<div class="notfound" data-tour="not-found"><div class="big404">404</div><h1>This is not the web page you are looking for.</h1>
        <div class="flex gap-2" style="max-width:420px;margin:24px auto 0"><input class="form-control" placeholder="Find code, projects, and people on GitHub:" data-onenter="notFoundSearch" aria-label="Search"><button class="btn" data-action="notFoundSearchBtn">Search</button></div>
        <p class="mt-4"><a href="#/">Go to your dashboard</a></p>
        <p class="muted f6" style="max-width:560px;margin:48px auto 0;border-top:1px solid var(--borderColor-muted);padding-top:16px">${icon('mortar-board', 12)} Nota del simulador: GitHub muestra esta misma página cuando una dirección no existe <em>o</em> cuando el repositorio es privado y no tienes permiso. Así no revela que el proyecto existe.${blocked ? '' : ''}</p></div>`
    };
  };
  A.notFoundSearch = (el) => GH.router.go('#/search?q=' + encodeURIComponent(el.value));
  A.notFoundSearchBtn = (el) => { const i = el.parentElement.querySelector('input'); A.notFoundSearch(i); };
})(window.GH);
