/* Views: issues, repository settings (general, collaborators), and other repository sections. */
(function (GH) {
  'use strict';
  const { esc, icon, avatar } = GH;
  const S = () => GH.store;
  const V = GH.views, A = GH.actions;
  const href = (...a) => GH.router.href(...a);

  // ---------------- Issues ----------------
  function issueSide(r) {
    return `<aside class="list-side"><div class="navlist">
      <a class="navlist-item selected" href="${href(r.owner, r.name, 'issues')}">${icon('issue-opened')}<span>Issues</span></a>
      <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('person')}<span>Assigned to me</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('smiley')}<span>Created by me</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('mention')}<span>Mentioned</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('clock')}<span>Recent activity</span></button>
      <div class="navlist-divider"></div>
      <button class="navlist-item" data-action="notsim" data-what="Vistas">${icon('stack')}<span>Views</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Projects">${icon('table')}<span>Projects</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Milestones">${icon('milestone')}<span>Milestones</span></button>
      <button class="navlist-item" data-action="notsim" data-what="Labels">${icon('tag')}<span>Labels</span></button>
    </div></aside>`;
  }
  V.issues = function (rt) {
    const r = rt.repo;
    if (!r.features.issues) return { redirect: href(r.owner, r.name) };
    const state = rt.query.state === 'closed' ? 'closed' : 'open';
    const open = r.issues.filter(i => i.state === 'open'), closed = r.issues.filter(i => i.state !== 'open');
    const list = (state === 'open' ? open : closed).slice().sort((a, b) => b.number - a.number);
    const base = href(r.owner, r.name, 'issues');
    return {
      header: { repo: r, tab: 'issues' }, title: `Issues · ${r.owner}/${r.name}`,
      html: `<div class="list-layout" data-tour="issues-page">${issueSide(r)}<div class="list-main">
        <div class="flex mb-3"><h1 class="bold" style="font-size:20px">Issues</h1><span class="ml-auto"></span><a class="btn btn-primary" href="${href(r.owner, r.name, 'issues', 'new')}" data-tour="new-issue-btn">New issue</a></div>
        <div class="filterbar"><div class="filter-input"><span class="q"><b>is:</b>issue state:<b>${state}</b></span><span class="ml-auto"></span>${icon('x-circle-fill', 16, 'muted')}</div><button class="btn btn-icon" aria-label="Search">${icon('search')}</button></div>
        <div class="Box"><div class="list-head"><a class="tog ${state === 'open' ? 'selected' : ''}" href="${base}">Open <span class="Counter">${open.length}</span></a><a class="tog ${state === 'closed' ? 'selected' : ''}" href="${base}?state=closed">Closed <span class="Counter">${closed.length}</span></a><span class="ml-auto flex gap-2"><button class="tog" data-action="notsim" data-what="Filtro por autor">Author ${icon('triangle-down')}</button><button class="tog" data-action="notsim" data-what="Filtro por etiqueta">Labels ${icon('triangle-down')}</button></span></div>
        ${list.length ? list.map(i => `<div class="list-row">${icon(i.state === 'open' ? 'issue-opened' : 'issue-closed', 16, i.state === 'open' ? 'color-success' : 'color-done')}<div class="flex-1"><a class="t" href="${href(r.owner, r.name, 'issues', i.number)}">${esc(i.title)}</a> ${(i.labels || []).map(l => `<span class="Label Label--accent" style="background:var(--bgColor-accent-muted)">${esc(l)}</span>`).join(' ')}<div class="s">#${i.number} · ${esc(i.author)} opened ${GH.timeAgo(i.createdAt)}</div></div>${i.comments.length ? `<span class="muted f6 flex gap-1">${icon('comment')} ${i.comments.length}</span>` : ''}</div>`).join('')
          : `<div class="blankslate">${icon('search', 24)}<h3>No results matched your search</h3><p>Try a different search query. Los <em>issues</em> sirven para anotar tareas, ideas o problemas del proyecto.</p></div>`}</div>
      </div></div>`
    };
  };
  let ni = { title: '', body: '' };
  V.newIssue = function (rt) {
    const r = rt.repo;
    return {
      header: { repo: r, tab: 'issues' }, title: `New issue · ${r.owner}/${r.name}`,
      html: `<div class="container-lg"><h1 class="page-title mb-3" style="font-size:20px;font-weight:600">Create new issue</h1>
        <div class="layout" style="grid-template-columns:minmax(0,1fr) 256px"><div class="timeline-comment">${avatar(S().me(), 40)}<div class="comment-box" style="padding:16px">
          <label class="form-label" for="ni-title">Add a title <span class="color-danger">*</span></label><input class="form-control" id="ni-title" value="${esc(ni.title)}" data-oninput="niTitle" placeholder="Title">
          <label class="form-label mt-3" for="ni-body">Add a description</label><textarea class="form-control" id="ni-body" placeholder="Type your description here…" style="min-height:180px" data-oninput="niBody">${esc(ni.body)}</textarea>
          <div class="flex gap-2 mt-3" style="justify-content:flex-end"><a class="btn" href="${href(r.owner, r.name, 'issues')}">Cancel</a><button class="btn btn-primary" data-action="niCreate">Create</button></div>
        </div></div><div>${['Assignees', 'Labels', 'Type', 'Projects', 'Milestone'].map(t => `<div class="discussion-sidebar-item"><div class="head"><span>${t}</span>${icon('gear')}</div><div class="muted">${t === 'Assignees' ? 'No one—assign yourself' : t === 'Milestone' ? 'No milestone' : 'None yet'}</div></div>`).join('')}</div></div></div>`
    };
  };
  A.niTitle = (el) => { ni.title = el.value; };
  A.niBody = (el) => { ni.body = el.value; };
  A.niCreate = () => {
    const r = GH.router.current.repo;
    if (!ni.title.trim()) { GH.ui.toast('El issue necesita un título.', 'info'); return; }
    const is = S().createIssue(r, ni.title.trim(), ni.body.trim()); ni = { title: '', body: '' };
    GH.router.go(href(r.owner, r.name, 'issues', is.number));
  };
  V.issue = function (rt) {
    const r = rt.repo; const is = S().issue(r, rt.number);
    if (!is) { const pr = S().pull(r, rt.number); if (pr) return { redirect: href(r.owner, r.name, 'pull', pr.number) }; return V.notFound(rt); }
    const cm = (a, d, b, first) => `<div class="timeline-comment ${first ? 'owner' : ''}">${avatar(a, 40)}<div class="comment-box"><div class="comment-head"><strong style="color:var(--fgColor-default)">${esc(a)}</strong> ${first ? 'opened' : 'commented'} ${GH.timeAgo(d)}</div><div class="comment-body markdown-body" style="font-size:14px">${GH.markdown(b || '_No description provided._')}</div></div></div>`;
    return {
      header: { repo: r, tab: 'issues' }, title: `${is.title} · Issue #${is.number}`,
      html: `<div class="container-xl"><h1 style="font-size:32px;font-weight:400">${esc(is.title)} <span class="muted" style="font-weight:300">#${is.number}</span></h1>
        <div class="flex gap-2 mt-2 mb-3" style="padding-bottom:16px;border-bottom:1px solid var(--borderColor-default)"><span class="State ${is.state === 'open' ? 'State--open' : 'State--merged'}">${icon(is.state === 'open' ? 'issue-opened' : 'issue-closed')} ${is.state === 'open' ? 'Open' : 'Closed'}</span><span class="muted"><strong style="color:var(--fgColor-default)">${esc(is.author)}</strong> opened this issue ${GH.timeAgo(is.createdAt)} · ${is.comments.length} comment${is.comments.length === 1 ? '' : 's'}</span></div>
        <div class="layout" style="grid-template-columns:minmax(0,1fr) 256px"><div>${cm(is.author, is.createdAt, is.body, true)}${is.comments.map(c => cm(c.author, c.date, c.body)).join('')}
          <div class="divider"></div>
          <div class="timeline-comment">${avatar(S().me(), 40)}<div class="comment-box" style="padding:8px"><textarea class="form-control" id="is-comment" placeholder="Use Markdown to format your comment" aria-label="Add a comment"></textarea><div class="flex gap-2 mt-2" style="justify-content:flex-end"><button class="btn" data-action="toggleIssue">${is.state === 'open' ? `${icon('issue-closed', 16, 'color-done')} Close issue` : 'Reopen issue'}</button><button class="btn btn-primary" data-action="issueComment">Comment</button></div></div></div>
        </div><div>${['Assignees', 'Labels', 'Projects', 'Milestone'].map(t => `<div class="discussion-sidebar-item"><div class="head"><span>${t}</span>${icon('gear')}</div><div class="muted">${t === 'Labels' && is.labels && is.labels.length ? is.labels.map(l => `<span class="Label Label--accent">${esc(l)}</span>`).join(' ') : 'None yet'}</div></div>`).join('')}</div></div></div>`
    };
  };
  A.issueComment = () => { const t = document.getElementById('is-comment'); if (!t.value.trim()) return; const rt = GH.router.current; S().comment(S().issue(rt.repo, rt.number), t.value.trim()); GH.render(); };
  A.toggleIssue = () => { const rt = GH.router.current; const is = S().issue(rt.repo, rt.number); S().setIssueState(rt.repo, is, is.state === 'open' ? 'closed' : 'open'); GH.render(); };

  // ---------------- Settings ----------------
  const SECTIONS = [
    [null, [['general', 'gear', 'General']]],
    ['Access', [['access', 'people', 'Collaborators'], ['moderation', 'report', 'Moderation options']]],
    ['Code and automation', [['branches', 'git-branch', 'Branches'], ['tags', 'tag', 'Tags'], ['rules', 'repo-push', 'Rules'], ['actions', 'play', 'Actions'], ['webhooks', 'link', 'Webhooks'], ['copilot', 'copilot', 'Copilot'], ['environments', 'server', 'Environments'], ['codespaces', 'codespaces', 'Codespaces'], ['pages', 'browser', 'Pages']]],
    ['Security', [['security', 'shield', 'Advanced Security'], ['keys', 'key', 'Deploy keys'], ['secrets', 'shield-lock', 'Secrets and variables']]],
    ['Integrations', [['apps', 'apps', 'GitHub Apps'], ['notifications', 'mention', 'Email notifications']]]
  ];
  function settingsNav(r, cur) {
    return `<nav class="navlist" aria-label="Settings" data-tour="settings-nav">${SECTIONS.map(([title, items]) => `${title ? `<div class="settings-group-title">${title}</div>` : ''}${items.map(([id, ic, label]) => `<a class="navlist-item ${cur === id ? 'selected' : ''}" href="${href(r.owner, r.name, 'settings', id === 'general' ? '' : id)}" data-tour="settings-nav-${id}">${icon(ic)}<span>${label}</span></a>`).join('')}`).join('')}</nav>`;
  }
  V.settings = function (rt) {
    const r = rt.repo;
    if (!S().isAdmin(r)) return V.notFound(rt);
    const sec = rt.section;
    let body;
    if (sec === 'general') body = general(r);
    else if (sec === 'access') body = access(r);
    else {
      const item = SECTIONS.flatMap(s => s[1]).find(x => x[0] === sec);
      if (!item) return V.notFound(rt);
      body = `<h2 class="settings-section-title">${item[2]}</h2><div class="Box blankslate">${icon(item[1], 24)}<p>Esta sección de configuración existe en GitHub, pero el simulador se concentra en <a href="${href(r.owner, r.name, 'settings')}">General</a> y <a href="${href(r.owner, r.name, 'settings', 'access')}">Collaborators</a>.</p></div>`;
    }
    return {
      header: { repo: r, tab: 'settings' }, title: `Settings · ${r.owner}/${r.name}`,
      html: `<div class="container-xl"><div class="settings-layout" data-tour="settings-page"><div>${settingsNav(r, sec)}</div><div style="min-width:0">${body}</div></div></div>`
    };
  };
  function general(r) {
    const vis = r.visibility;
    return `<h2 class="settings-section-title">General</h2>
      <label class="form-label" for="st-name">Repository name</label>
      <div class="flex gap-2" style="max-width:440px"><input class="form-control" id="st-name" value="${esc(r.name)}"><button class="btn" data-action="renameRepo">Rename</button></div>
      <label class="checkbox mt-3"><input type="checkbox" data-onchange="notsimCheck" data-what="Repositorios plantilla"><span><strong>Template repository</strong><br><span class="muted f6">Template repositories let users generate new repositories with the same directory structure and files.</span></span></label>
      <h3 class="f5 bold mt-4 mb-2">Default branch</h3>
      <p class="muted f6 mb-2">The default branch is considered the “base” branch in your repository, against which all pull requests and code commits are automatically made, unless you specify a different branch.</p>
      <div class="flex gap-2"><span class="branch-name">${esc(r.defaultBranch)}</span><button class="btn btn-sm btn-icon" data-action="switchDefault" aria-label="Switch to another branch">${icon('arrow-both')}</button></div>
      <h2 class="settings-section-title">Features</h2>
      ${[['wiki', 'Wikis', 'Wikis host documentation for your repository.'], ['issues', 'Issues', 'Issues integrate lightweight task tracking into your repository.'], ['projects', 'Projects', 'Projects on GitHub are created at the repository owner\'s level.'], ['discussions', 'Discussions', 'Discussions is the space for your community to have conversations.']].map(([k, t, d]) => `<label class="checkbox mb-3"><input type="checkbox" ${r.features[k] ? 'checked' : ''} data-onchange="toggleFeature" data-k="${k}"><span><strong>${t}</strong><br><span class="muted f6">${d}</span></span></label>`).join('')}
      <h2 class="settings-section-title" style="border:0">Danger Zone</h2>
      <div class="Box Box--danger" data-tour="danger-zone">
        <div class="danger-row" data-tour="danger-visibility"><div class="txt"><strong>Change repository visibility</strong><span class="f6">This repository is currently <strong data-tour="current-visibility">${vis}</strong>.</span></div><button class="btn btn-danger" data-action="visibilityMenu" data-tour="change-visibility-btn" aria-haspopup="true">Change visibility ${icon('triangle-down')}</button></div>
        <div class="danger-row"><div class="txt"><strong>Disable branch protection rules</strong><span class="f6">Disable branch protection rules enforcement and APIs</span></div><button class="btn btn-danger" data-action="notsim" data-what="Reglas de protección de ramas">Disable branch protection rules</button></div>
        <div class="danger-row"><div class="txt"><strong>Transfer ownership</strong><span class="f6">Transfer this repository to another user or to an organization where you have the ability to create repositories.</span></div><button class="btn btn-danger" data-action="notsim" data-what="Transferir propiedad">Transfer</button></div>
        <div class="danger-row"><div class="txt"><strong>Archive this repository</strong><span class="f6">Mark this repository as archived and read-only.</span></div><button class="btn btn-danger" data-action="notsim" data-what="Archivar repositorios">Archive this repository</button></div>
        <div class="danger-row"><div class="txt"><strong>Delete this repository</strong><span class="f6">Once you delete a repository, there is no going back. Please be certain.</span></div><button class="btn btn-danger" data-action="deleteRepoDialog">Delete this repository</button></div>
      </div>`;
  }
  A.notsimCheck = (el) => { el.checked = false; GH.ui.notSimulated(el.getAttribute('data-what')); };
  A.toggleFeature = (el) => { const r = GH.router.current.repo; r.features[el.getAttribute('data-k')] = el.checked; S().save(); GH.render(); GH.ui.toast('Settings saved'); };
  A.renameRepo = () => {
    const r = GH.router.current.repo; const v = document.getElementById('st-name').value;
    try { const nr = S().rename(r, v); GH.router.go(href(nr.owner, nr.name, 'settings')); GH.ui.toast(`Repository renamed to <strong>${esc(nr.name)}</strong>. La dirección (URL) también cambió.`); }
    catch (e) { GH.ui.toast('Ya tienes un repositorio con ese nombre.', 'info'); }
  };
  A.switchDefault = (el) => {
    const r = GH.router.current.repo;
    GH.ui.openMenu(el, `<ul class="ActionList">${S().branchNames(r).map(n => GH.ui.menuItem({ label: esc(n), action: 'setDefault', data: `data-b="${esc(n)}"`, checked: n === r.defaultBranch })).join('')}</ul>`, { width: 240 });
  };
  A.setDefault = (el) => { const r = GH.router.current.repo; r.defaultBranch = el.getAttribute('data-b'); S().save(); GH.ui.closeMenus(); GH.render(); GH.ui.toast('Default branch updated'); };

  // Visibility change flow (multi-step dialog, like GitHub)
  A.visibilityMenu = (el) => {
    const r = GH.router.current.repo; const to = r.visibility === 'public' ? 'private' : 'public';
    GH.ui.openMenu(el, `<ul class="ActionList">${GH.ui.menuItem({ icon: to === 'private' ? 'lock' : 'globe', label: `Change to ${to}`, action: 'visibilityDialog', tour: 'vis-change-item' })}</ul>`, { align: 'right', width: 220, id: 'visibility' });
  };
  let visStep = 1;
  A.visibilityDialog = () => { visStep = 1; renderVisDialog(); };
  function renderVisDialog() {
    const r = GH.router.current.repo; const to = r.visibility === 'public' ? 'private' : 'public';
    const effects = to === 'private'
      ? ['Only you and the people you invite will be able to see this repository.', 'Stars and watchers from people without access will be removed.', 'Existing forks will remain public.', 'Links to this repository will show a 404 page to people without access.']
      : ['The code will be visible to everyone who can visit GitHub.', 'Anyone can fork your repository.', 'All push rulesets will be disabled.', 'Your changes will be published as activity.'];
    let body, footer;
    if (visStep === 1) {
      body = `<div class="flash flash-warn mb-3">${icon('alert', 16, 'color-attention')}<span>You are about to change the visibility of <strong>${esc(r.owner)}/${esc(r.name)}</strong>.</span></div><p>${to === 'private' ? 'Making this repository private will hide it from everyone except you and your collaborators.' : 'Making this repository public will make it visible to anyone on the internet.'}</p>`;
      footer = `<button class="btn btn-block btn-danger" data-action="visNext" data-tour="vis-step-1">I want to make this repository ${to}</button>`;
    } else if (visStep === 2) {
      body = `<p class="bold mb-2">Please read the following effects:</p><ul style="padding-left:20px">${effects.map(e => `<li class="mb-2">${e}</li>`).join('')}</ul>`;
      footer = `<button class="btn btn-block btn-danger" data-action="visNext" data-tour="vis-step-2">I have read and understand these effects</button>`;
    } else {
      body = `<p class="mb-2">To confirm, type "<strong>${esc(r.owner)}/${esc(r.name)}</strong>" in the box below</p><input class="form-control" id="vis-confirm" data-oninput="visConfirmInput" autocomplete="off" data-tour="vis-confirm-input" aria-label="Type the repository name to confirm">`;
      footer = `<button class="btn btn-block btn-danger" data-action="visApply" id="vis-apply" disabled data-tour="vis-step-3">Make this repository ${to}</button>`;
    }
    GH.ui.dialog({ title: 'Change repository visibility', body: `<div class="flex gap-2 mb-3 f6 muted">${[1, 2, 3].map(n => `<span class="Label ${n === visStep ? 'Label--accent' : ''}">Step ${n}</span>`).join('')}</div>${body}`, footer, tour: 'vis-dialog' });
  }
  A.visNext = () => { visStep++; renderVisDialog(); GH.bus.emit('vis:step', visStep); };
  A.visConfirmInput = (el) => { const r = GH.router.current.repo; document.getElementById('vis-apply').disabled = el.value.trim() !== `${r.owner}/${r.name}`; GH.bus.emit('form:input'); };
  A.visApply = () => {
    const r = GH.router.current.repo; const to = r.visibility === 'public' ? 'private' : 'public';
    S().setVisibility(r, to); GH.ui.closeDialog(); GH.render();
    GH.ui.toast(`Your repository is now <strong>${to}</strong>.`);
  };
  A.deleteRepoDialog = () => {
    const r = GH.router.current.repo;
    GH.ui.dialog({
      title: `Delete ${esc(r.owner)}/${esc(r.name)}`,
      body: `<div class="flash flash-warn mb-3" style="border-color:var(--borderColor-danger-emphasis);background:var(--bgColor-danger-muted)">${icon('alert', 16, 'color-danger')}<span>This will permanently delete the <strong>${esc(r.owner)}/${esc(r.name)}</strong> repository, wiki, issues, comments and pull requests.</span></div><p class="mb-2">To confirm, type "<strong>${esc(r.owner)}/${esc(r.name)}</strong>" in the box below</p><input class="form-control" data-oninput="delConfirmInput" autocomplete="off" aria-label="Confirm repository name"><p class="form-hint">${icon('mortar-board', 12)} En el simulador puedes recuperarlo con “Reiniciar” desde el panel de ayuda.</p>`,
      footer: `<button class="btn btn-block btn-danger" data-action="deleteRepo" id="del-apply" disabled>Delete this repository</button>`
    });
  };
  A.delConfirmInput = (el) => { const r = GH.router.current.repo; document.getElementById('del-apply').disabled = el.value.trim() !== `${r.owner}/${r.name}`; };
  A.deleteRepo = () => { const r = GH.router.current.repo; S().deleteRepo(r); GH.ui.closeDialog(); GH.router.go('#/'); GH.ui.toast(`Your repository "${esc(r.owner)}/${esc(r.name)}" was successfully deleted.`); };

  // Collaborators
  function access(r) {
    const n = r.collaborators.length;
    return `<h2 class="settings-section-title">Collaborators</h2>
      <h3 class="f4 mb-3" style="font-weight:400">Who has access</h3>
      <div class="access-cards" data-tour="who-has-access">
        <div class="access-card"><div class="k">${r.visibility === 'private' ? 'PRIVATE REPOSITORY' : 'PUBLIC REPOSITORY'} ${icon(r.visibility === 'private' ? 'lock' : 'globe', 12)}</div><p class="mt-2">${r.visibility === 'private' ? 'Only those with access to this repository can view it.' : 'This repository is public and visible to anyone.'}</p><a class="f6" href="${href(r.owner, r.name, 'settings')}#danger">Manage</a></div>
        <div class="access-card"><div class="k">DIRECT ACCESS ${icon('people', 12)}</div><p class="mt-2">${n ? `<strong>${n}</strong> ${n === 1 ? 'has' : 'have'} access to this repository.` : '0 collaborators have access to this repository. Only you can contribute to this repository.'}</p><span class="f6 muted">${r.collaborators.filter(c => c.status === 'pending').length} pending invitation${r.collaborators.filter(c => c.status === 'pending').length === 1 ? '' : 's'}</span></div>
      </div>
      <h3 class="f4 mb-3" style="font-weight:400">Manage access</h3>
      <div class="Box" data-tour="manage-access">${n ? `<div class="Box-header"><input type="checkbox" aria-label="Select all"><span class="flex-1 bold">Select all</span><button class="btn btn-primary btn-sm" data-action="addPeopleDialog" data-tour="add-people-btn">Add people</button></div>${r.collaborators.map(c => `<div class="Box-row" data-tour="collab-${esc(c.login)}"><input type="checkbox" aria-label="Select ${esc(c.login)}">${avatar(c.login, 32)}<div class="flex-1"><strong>${esc(c.login)}</strong><div class="muted f6">${c.status === 'pending' ? `Awaiting ${esc(c.login)}’s response` : 'Collaborator'}</div></div>${c.status === 'pending' ? '<span class="Label Label--attention">Pending Invite</span>' : ''}<select class="form-control" style="width:auto;height:28px;padding:0 8px" data-onchange="collabRole" data-l="${esc(c.login)}" aria-label="Role">${['Read', 'Triage', 'Write', 'Maintain', 'Admin'].map(x => `<option ${x === c.role ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="btn btn-invisible btn-sm btn-icon" data-action="removeCollab" data-l="${esc(c.login)}" aria-label="Remove ${esc(c.login)}">${icon('trash')}</button></div>`).join('')}`
        : `<div class="blankslate">${icon('people', 24)}<h3>You haven't invited any collaborators yet</h3><p class="mb-3"></p><button class="btn btn-primary" data-action="addPeopleDialog" data-tour="add-people-btn">Add people</button></div>`}</div>
      <p class="muted f6 mt-3">${icon('info', 12)} Roles: <strong>Read</strong> (ver), <strong>Triage</strong> (organizar issues), <strong>Write</strong> (subir cambios), <strong>Maintain</strong> (administrar sin acciones peligrosas), <strong>Admin</strong> (control total).</p>`;
  }
  A.collabRole = (el) => { S().setCollaboratorRole(GH.router.current.repo, el.getAttribute('data-l'), el.value); GH.ui.toast(`Role updated to <strong>${esc(el.value)}</strong>`); };
  A.removeCollab = (el) => { S().removeCollaborator(GH.router.current.repo, el.getAttribute('data-l')); GH.render(); };
  let addSel = null;
  A.addPeopleDialog = () => {
    const r = GH.router.current.repo; addSel = null;
    GH.ui.dialog({
      title: `Add a collaborator to ${esc(r.name)}`, tour: 'add-people-dialog',
      body: `<div class="input-wrap">${icon('search')}<input class="form-control" id="ap-q" placeholder="Search by username, full name, or email" data-oninput="apSearch" autocomplete="off" data-tour="ap-search" aria-label="Search people"></div><div id="ap-results" class="mt-2"></div><p class="form-hint">${icon('mortar-board', 12)} Personas ficticias disponibles: carlos-demo, ana-demo, lucia-demo, equipo-diseno.</p>`,
      footer: `<button class="btn btn-block btn-primary" data-action="apAdd" id="ap-add" disabled data-tour="ap-add">Select a collaborator above</button>`
    });
  };
  A.apSearch = (el) => {
    const r = GH.router.current.repo; const q = el.value.trim().toLowerCase();
    const people = Object.values(S().state.people).filter(p => !p.org && p.login !== S().me() && !r.collaborators.some(c => c.login === p.login) && q && (p.login + ' ' + p.name).toLowerCase().includes(q));
    document.getElementById('ap-results').innerHTML = q ? (people.length ? `<ul class="ActionList Box" style="padding:4px 0">${people.map(p => `<li class="ActionList-item"><button class="ActionList-btn ${addSel === p.login ? 'active' : ''}" data-action="apPick" data-l="${esc(p.login)}" data-tour="ap-person-${esc(p.login)}">${avatar(p.login, 20)}<strong>${esc(p.login)}</strong><span class="muted">${esc(p.name)}</span></button></li>`).join('')}</ul>` : `<p class="muted f6" style="padding:8px">No matching users</p>`) : '';
    GH.bus.emit('form:input');
  };
  A.apPick = (el) => {
    addSel = el.getAttribute('data-l');
    const b = document.getElementById('ap-add'); b.disabled = false; b.textContent = `Add ${addSel} to this repository`;
    document.querySelectorAll('#ap-results .ActionList-btn').forEach(x => x.classList.toggle('active', x === el));
    GH.bus.emit('ap:picked', addSel);
  };
  A.apAdd = () => {
    const r = GH.router.current.repo; if (!addSel) return;
    S().addCollaborator(r, addSel, 'Write'); GH.ui.closeDialog(); GH.render();
    GH.ui.toast(`Invitation sent to <strong>${esc(addSel)}</strong>`);
  };

  // ---------------- Other repo sections ----------------
  V.repoSection = function (rt) {
    const r = rt.repo; const s = rt.section;
    let html;
    if (s === 'actions') {
      html = `<div class="list-layout" data-tour="actions-page"><aside class="list-side"><div class="navlist"><button class="navlist-item selected">${icon('home')}<span>All workflows</span></button></div><div class="navlist-heading mt-3">Workflows</div><p class="muted f6" style="padding:0 8px">No workflows found</p><div class="navlist-divider" style="margin:16px 0"></div><div class="navlist">${[['package', 'Caches'], ['verified', 'Attestations'], ['server', 'Runners'], ['graph', 'Usage metrics'], ['meter', 'Performance metrics']].map(([i, l]) => `<button class="navlist-item" data-action="notsim" data-what="${l}">${icon(i)}<span>${l}</span></button>`).join('')}</div></aside>
        <div class="list-main"><div class="flex mb-2"><h1 class="bold" style="font-size:20px">All workflows</h1><span class="ml-auto"></span><button class="btn" data-action="notsim" data-what="Crear flujos de trabajo de GitHub Actions">New workflow</button></div><p class="muted mb-3">Showing runs from all workflows</p><div class="input-wrap mb-3"><input class="form-control" placeholder="Search runs" aria-label="Search runs"></div>
        <div class="Box"><div class="list-head"><strong>0 workflow runs</strong><span class="ml-auto flex gap-2"><button class="tog">Workflow ${icon('triangle-down')}</button><button class="tog">Event ${icon('triangle-down')}</button></span></div><div class="blankslate">${icon('workflow', 24)}<h3 style="font-size:16px">There are no workflow runs yet.</h3><p class="f6 mt-2">GitHub Actions automatiza tareas repetitivas (probar, publicar, enviar avisos) cada vez que algo cambia en el repositorio.</p></div></div></div></div>`;
    } else if (s === 'projects') {
      html = `<div class="container-lg"><div class="Box blankslate" style="padding:48px">${icon('table', 24)}<h3>Provide quick access to relevant projects.</h3><p>Add projects to view them here. Los <em>Projects</em> son tableros para planear el trabajo (como un tablero de tareas).</p><button class="btn mt-3" data-action="notsim" data-what="GitHub Projects">Link a project</button></div></div>`;
    } else if (s === 'wiki') {
      html = `<div class="container-lg"><div class="Box blankslate" style="padding:48px">${icon('book', 24)}<h3>Welcome to the ${esc(r.name)} wiki!</h3><p>Wikis provide a place in your repository to lay out the roadmap of your project, show the current status, and document software better, together.</p><button class="btn btn-primary mt-3" data-action="notsim" data-what="Wikis">Create the first page</button></div></div>`;
    } else if (s === 'security') {
      const rows = [['shield', 'Security policy', 'Define how users should report security vulnerabilities for this repository', 'Disabled'], ['report', 'Security advisories', 'View or disclose security advisories for this repository', 'Enabled'], ['shield-lock', 'Private vulnerability reporting', 'Allow users to privately report potential security vulnerabilities', 'Disabled'], ['package', 'Dependabot alerts', 'Get notified when one of your dependencies has a vulnerability', 'Disabled'], ['code', 'Code scanning alerts', 'Automatically detect common vulnerability and coding errors', 'Needs setup'], ['key', 'Secret scanning alerts', 'Get notified when a secret is pushed to this repository', 'Disabled']];
      html = `<div class="container-xl"><h1 class="page-title mb-3">Security overview</h1><div class="Box">${rows.map(([i, t, d, st]) => `<div class="Box-row">${icon(i, 16, 'muted')}<div class="flex-1"><strong>${t}</strong> <span class="muted f6">· ${st}</span><div class="muted f6">${d}</div></div>${S().isAdmin(r) ? `<button class="btn btn-sm" data-action="notsim" data-what="${t}">Set up</button>` : ''}</div>`).join('')}</div><p class="muted f6 mt-3">${icon('info', 12)} Para la visibilidad y el acceso de un repositorio, entra a <strong>Settings</strong> (solo visible para administradores).</p></div>`;
    } else {
      const week = Date.now() - 7 * 86400000;
      const commits = Object.values(r.commits).filter(c => c.date > week);
      html = `<div class="container-xl"><div class="settings-layout"><nav class="navlist">${['Pulse', 'Contributors', 'Community', 'Traffic', 'Commits', 'Code frequency', 'Dependency graph', 'Network', 'Forks'].map((l, i) => `<button class="navlist-item ${i === 0 ? 'selected' : ''}" ${i ? `data-action="notsim" data-what="Insights · ${l}"` : ''}>${l}</button>`).join('')}</nav>
        <div><div class="flex mb-3" style="border-bottom:1px solid var(--borderColor-default);padding-bottom:8px"><h2 class="f4" style="font-weight:400">${GH.fmtDate(week)} – ${GH.fmtDate(Date.now())}</h2><span class="ml-auto"></span><button class="btn btn-sm">Period: 1 week ${icon('triangle-down')}</button></div>
        <div class="Box"><div class="Box-header"><strong>Overview</strong></div><div class="flex" style="justify-content:space-around;padding:24px;text-align:center"><div><div style="font-size:24px">${r.pulls.filter(p => p.createdAt > week).length}</div><div class="muted f6">Active pull requests</div></div><div><div style="font-size:24px">${r.issues.filter(i => i.createdAt > week).length}</div><div class="muted f6">Active issues</div></div><div><div style="font-size:24px">${commits.length}</div><div class="muted f6">Commits</div></div><div><div style="font-size:24px">${new Set(commits.map(c => c.author)).size}</div><div class="muted f6">Authors</div></div></div></div>
        <p class="muted f6 mt-3">${icon('info', 12)} <strong>Insights</strong> muestra estadísticas de actividad del proyecto.</p></div></div></div>`;
    }
    return { header: { repo: r, tab: s }, title: `${s} · ${r.owner}/${r.name}`, html };
  };
})(window.GH);
