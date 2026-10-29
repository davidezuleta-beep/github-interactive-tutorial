/* Views: compare, pull request list, pull request page (conversation, commits, checks, files). */
(function (GH) {
  'use strict';
  const { esc, icon, avatar } = GH;
  const S = () => GH.store;
  const V = GH.views, A = GH.actions;
  const href = (...a) => GH.router.href(...a);

  function humanize(b) { const s = b.replace(/[-_]+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---------- Compare ----------
  let prf = null;
  V.compare = function (rt) {
    const r = rt.repo;
    const base = rt.baseBranch || r.defaultBranch;
    const head = rt.headBranch || base;
    if (!r.branches[base] || !r.branches[head]) return V.notFound(rt);
    const ahead = S().ahead(r, base, head);
    const files = S().changedBetween(r, base, head);
    const existing = S().openPullFor(r, head);
    const same = base === head;
    const expand = rt.query.expand === '1' && !existing && ahead.length;
    const key = S().key(r) + base + '...' + head;
    if (!prf || prf.key !== key) prf = { key, title: ahead.length === 1 ? ahead[0].message : humanize(head), body: '', tab: 'write' };
    const tot = GH.diffTotals(files);
    const rangeBtn = (label, b, which) => `<button class="btn btn-sm" data-action="compareMenu" data-which="${which}" data-base="${esc(base)}" data-head="${esc(head)}" data-tour="compare-${which}">${icon('git-branch', 16)}<span><span class="k">${label}:</span> <strong>${esc(b)}</strong></span>${icon('triangle-down')}</button>`;
    let status = '';
    if (!same && ahead.length) status = `<span class="flex gap-1 f6" data-tour="merge-status"><strong class="color-success flex gap-1">${icon('check')} Able to merge.</strong><span class="muted">These branches can be automatically merged.</span></span>`;
    const intro = same || !ahead.length
      ? `<div class="flash mt-3" style="background:var(--bgColor-muted);border-color:var(--borderColor-default)">${same ? 'Choose different branches or forks above to discuss and review changes.' : `There isn’t anything to compare. <strong>${esc(base)}</strong> is up to date with all commits from <strong>${esc(head)}</strong>.`}<span class="ml-auto"></span><button class="btn btn-primary" disabled>Create pull request</button></div>`
      : existing ? `<div class="flash mt-3">${icon('git-pull-request', 16, 'color-success')}<span class="flex-1">There is already an open pull request for this branch: <a href="${href(r.owner, r.name, 'pull', existing.number)}">#${existing.number} ${esc(existing.title)}</a></span><a class="btn" href="${href(r.owner, r.name, 'pull', existing.number)}">View pull request</a></div>`
      : !expand ? `<div class="flash mt-3" style="background:var(--bgColor-muted);border-color:var(--borderColor-default)"><span class="flex-1">Discuss and review the changes in this comparison with others. <a href="#" data-action="notsim" data-what="Documentación sobre pull requests">Learn about pull requests</a></span><a class="btn btn-primary" href="${href(r.owner, r.name, 'compare', base + '...' + head)}?expand=1" data-tour="compare-create-btn">Create pull request</a></div>` : '';
    const form = expand ? `<div class="layout mt-4" style="grid-template-columns:minmax(0,1fr) 256px"><div class="timeline-comment" style="margin:0">${avatar(S().me(), 40)}<div class="comment-box" data-tour="pr-form">
        <div style="padding:16px"><label class="form-label" for="pr-title">Add a title <span class="color-danger">*</span></label><input id="pr-title" class="form-control" value="${esc(prf.title)}" data-oninput="prfTitle" data-tour="pr-title" style="font-size:16px"></div>
        <div style="padding:0 16px"><label class="form-label">Add a description</label><div class="tabnav"><button class="tabnav-tab ${prf.tab === 'write' ? 'selected' : ''}" data-action="prfTab" data-t="write">Write</button><button class="tabnav-tab ${prf.tab === 'preview' ? 'selected' : ''}" data-action="prfTab" data-t="preview">Preview</button></div></div>
        <div style="padding:8px 16px">${prf.tab === 'write' ? `<textarea class="form-control" id="pr-body" placeholder="Add your description here..." style="min-height:160px" data-oninput="prfBody" data-tour="pr-body">${esc(prf.body)}</textarea>` : `<div class="markdown-body" style="min-height:160px;padding:8px">${prf.body ? GH.markdown(prf.body) : '<p class="muted">Nothing to preview</p>'}</div>`}<p class="form-hint">Markdown is supported · Paste, drop, or click to add files</p></div>
        <div class="flex gap-2" style="padding:0 16px 16px;justify-content:flex-end"><div class="btn-group"><button class="btn btn-primary" data-action="prfCreate" data-tour="pr-create">Create pull request</button><button class="btn btn-primary btn-caret" data-action="notsim" data-what="Borradores de pull request (draft)" aria-label="Select pull request type">${icon('triangle-down')}</button></div></div>
      </div></div>
      <div>${sideMeta(null)}</div></div>` : '';
    return {
      header: { repo: r, tab: 'pulls' }, title: `Comparing ${base}...${head} · ${r.owner}/${r.name}`,
      html: `<div class="container-xl" data-tour="compare-page">
        <h1 class="page-title">${expand ? 'Open a pull request' : 'Comparing changes'}</h1>
        <p class="muted mb-3">${expand ? 'Create a new pull request by comparing changes across two branches. If you need to, you can also <a href="#" data-action="notsim" data-what="Comparar entre forks">compare across forks</a>.' : 'Choose two branches to see what’s changed or to start a new pull request.'}</p>
        <div class="range-editor" data-tour="compare-range">${icon('git-compare', 16, 'muted')}${rangeBtn('base', base, 'base')}${icon('arrow-left', 16, 'muted')}${rangeBtn('compare', head, 'head')}${status}</div>
        ${intro}${form}
        ${!same && ahead.length ? `<div class="Box mt-4" data-tour="compare-summary"><div class="flex" style="justify-content:space-around;padding:12px;flex-wrap:wrap;gap:12px"><span class="flex gap-1">${icon('git-commit', 16, 'muted')} <strong>${ahead.length}</strong> commit${ahead.length === 1 ? '' : 's'}</span><span class="flex gap-1">${icon('file-diff', 16, 'muted')} <strong>${files.length}</strong> file${files.length === 1 ? '' : 's'} changed</span><span class="flex gap-1">${icon('people', 16, 'muted')} <strong>${new Set(ahead.map(c => c.author)).size}</strong> contributor</span></div></div>
          <div class="mt-3 mb-3">${ahead.map(c => `<div class="flex gap-2 f6" style="padding:6px 0">${icon('git-commit', 16, 'muted')}${avatar(c.author, 16)}<a class="link-primary" href="${href(r.owner, r.name, 'commit', c.sha)}">${esc(c.message)}</a><span class="ml-auto mono muted">${c.sha.slice(0, 7)}</span></div>`).join('')}</div>
          <p class="mb-3">Showing <strong>${files.length} changed file${files.length === 1 ? '' : 's'}</strong> with <strong class="color-success">${tot.add} additions</strong> and <strong class="color-danger">${tot.del} deletions</strong>.</p>
          <div data-tour="compare-diff">${GH.renderDiff(files, { viewHref: (p) => href(r.owner, r.name, 'blob', head, p) })}</div>` : (same ? `<div class="blankslate mt-4">${icon('git-compare', 24)}<h3>Compare and review just about anything</h3><p>Branches, tags, commit ranges, and time ranges. In the same repository and across forks.</p></div>` : '')}
      </div>`
    };
  };
  A.prfTitle = (el) => { prf.title = el.value; GH.bus.emit('form:input'); };
  A.prfBody = (el) => { prf.body = el.value; GH.bus.emit('form:input'); };
  A.prfTab = (el) => { prf.tab = el.getAttribute('data-t'); GH.render(); };
  A.prfCreate = () => {
    const rt = GH.router.current; const r = rt.repo;
    const base = rt.baseBranch || r.defaultBranch, head = rt.headBranch;
    if (!prf.title.trim()) { GH.ui.toast('El pull request necesita un título.', 'info'); return; }
    const pr = S().createPull(r, { title: prf.title.trim(), body: prf.body.trim(), base, head });
    prf = null;
    GH.router.go(href(r.owner, r.name, 'pull', pr.number));
  };
  A.compareMenu = (el) => {
    const r = GH.router.current.repo; const which = el.getAttribute('data-which');
    const base = el.getAttribute('data-base'), head = el.getAttribute('data-head');
    GH.ui.openMenu(el, `<div class="Overlay-header"><h3>Choose a ${which === 'base' ? 'base ref' : 'head ref'}</h3></div><ul class="ActionList" style="padding-top:0">${S().branchNames(r).map(n => {
      const nb = which === 'base' ? n : base, nh = which === 'head' ? n : head;
      return GH.ui.menuItem({ label: esc(n), nav: href(r.owner, r.name, 'compare', nb + '...' + nh), checked: (which === 'base' ? base : head) === n });
    }).join('')}</ul>`, { width: 280 });
  };

  function sideMeta(pr) {
    const item = (t, v, ic) => `<div class="discussion-sidebar-item"><div class="head"><span>${t}</span>${icon(ic || 'gear')}</div><div class="muted">${v}</div></div>`;
    return item('Reviewers', 'No reviews') + item('Assignees', pr ? 'No one—<a href="#" data-action="notsim" data-what="Asignar personas">assign yourself</a>' : 'No one—assign yourself') + item('Labels', 'None yet') + item('Projects', 'None yet') + item('Milestone', 'No milestone') + item('Development', pr ? 'Successfully merging this pull request may close these issues.' : 'Use <a href="#" data-action="notsim" data-what="Closing keywords">Closing keywords</a> in the description to automatically close issues');
  }

  // ---------- PR list ----------
  V.pulls = function (rt) {
    const r = rt.repo;
    const state = rt.query.state === 'closed' ? 'closed' : 'open';
    const open = r.pulls.filter(p => p.state === 'open'), closed = r.pulls.filter(p => p.state !== 'open');
    const list = (state === 'open' ? open : closed).slice().sort((a, b) => b.number - a.number);
    const base = href(r.owner, r.name, 'pulls');
    return {
      header: { repo: r, tab: 'pulls' }, title: `Pull requests · ${r.owner}/${r.name}`,
      html: `<div class="list-layout" data-tour="pulls-page"><aside class="list-side"><div class="navlist">
        <button class="navlist-item selected">${icon('git-pull-request')}<span>Pull requests</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('smiley')}<span>Authored by me</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('person')}<span>Assigned to me</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('comment-discussion')}<span>Involves me</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Filtro">${icon('git-pull-request')}<span>Review requests</span></button>
        <div class="navlist-divider"></div>
        <button class="navlist-item" data-action="notsim" data-what="Milestones">${icon('milestone')}<span>Milestones</span></button>
        <button class="navlist-item" data-action="notsim" data-what="Labels">${icon('tag')}<span>Labels</span></button></div></aside>
        <div class="list-main">
          <div class="flex mb-3"><h1 class="bold" style="font-size:20px">Pull requests</h1><span class="ml-auto"></span><a class="btn btn-primary" href="${href(r.owner, r.name, 'compare')}" data-tour="new-pr-btn">New pull request</a></div>
          <div class="filterbar"><div class="filter-input"><span class="q"><b>is:</b>pr state:<b>${state}</b></span><span class="ml-auto"></span>${icon('x-circle-fill', 16, 'muted')}</div><button class="btn btn-icon" aria-label="Search">${icon('search')}</button></div>
          <div class="Box"><div class="list-head"><a class="tog ${state === 'open' ? 'selected' : ''}" href="${base}">Open <span class="Counter">${open.length}</span></a><a class="tog ${state === 'closed' ? 'selected' : ''}" href="${base}?state=closed">Closed <span class="Counter">${closed.length}</span></a><span class="ml-auto flex gap-2"><button class="tog" data-action="notsim" data-what="Filtro por autor">Author ${icon('triangle-down')}</button><button class="tog" data-action="notsim" data-what="Filtro por etiqueta">Label ${icon('triangle-down')}</button></span></div>
          ${list.length ? list.map(p => `<div class="list-row" data-tour="pr-row-${p.number}">${GH.prIcon(p)}<div class="flex-1"><a class="t" href="${href(r.owner, r.name, 'pull', p.number)}">${esc(p.title)}</a><div class="s">#${p.number} ${p.state === 'merged' ? `by ${esc(p.author)} was merged ${GH.timeAgo(p.mergedAt)}` : p.state === 'closed' ? `by ${esc(p.author)} was closed ${GH.timeAgo(p.closedAt)}` : `opened ${GH.timeAgo(p.createdAt)} by ${esc(p.author)}`}</div></div>${(p.comments || []).length ? `<span class="muted f6 flex gap-1">${icon('comment')} ${p.comments.length}</span>` : ''}</div>`).join('')
            : `<div class="blankslate">${icon('git-pull-request', 24)}<h3>No pull requests matched your search</h3><p>Try a different search query. <a href="#" data-action="notsim" data-what="Ayuda de búsqueda">Learn more about searching and filtering pull requests.</a></p></div>`}</div>
        </div></div>`
    };
  };

  // ---------- PR page ----------
  let mergeOpen = false;
  V.pull = function (rt) {
    const r = rt.repo; const pr = S().pull(r, rt.number);
    if (!pr) return V.notFound(rt);
    const commits = S().pullCommits(r, pr);
    const files = S().pullFiles(r, pr);
    const tot = GH.diffTotals(files);
    const sub = rt.sub;
    const base = href(r.owner, r.name, 'pull', pr.number);
    const stateLbl = pr.state === 'merged' ? `<span class="State State--merged" data-tour="pr-state">${icon('git-merge')} Merged</span>` : pr.state === 'closed' ? `<span class="State State--closed" data-tour="pr-state">${icon('git-pull-request-closed')} Closed</span>` : `<span class="State State--open" data-tour="pr-state">${icon('git-pull-request')} Open</span>`;
    const verb = pr.state === 'merged' ? `<strong style="color:var(--fgColor-default)">${esc(pr.mergedBy)}</strong> merged ${commits.length} commit${commits.length === 1 ? '' : 's'} into` : `<strong style="color:var(--fgColor-default)">${esc(pr.author)}</strong> wants to merge ${commits.length} commit${commits.length === 1 ? '' : 's'} into`;
    const tabs = [['conversation', 'comment-discussion', 'Conversation', (pr.comments || []).length], ['commits', 'git-commit', 'Commits', commits.length], ['checks', 'checklist', 'Checks', 0], ['files', 'file-diff', 'Files changed', files.length]];
    let body = '';
    if (sub === 'files') {
      body = `<div class="flex gap-2 mb-3 f6" style="flex-wrap:wrap"><button class="btn btn-sm btn-invisible">Changes from <strong>all commits</strong> ${icon('triangle-down')}</button><button class="btn btn-sm btn-invisible">File filter ${icon('triangle-down')}</button><button class="btn btn-sm btn-invisible">Conversations ${icon('triangle-down')}</button><span class="ml-auto muted">0 / ${files.length} files viewed</span><button class="btn btn-sm btn-primary" data-action="notsim" data-what="Revisiones formales (Approve / Request changes)">Review changes ${icon('triangle-down')}</button></div><div data-tour="pr-diff">${GH.renderDiff(files, { viewHref: r.branches[pr.head] ? (p) => href(r.owner, r.name, 'blob', pr.head, p) : null })}</div>`;
    } else if (sub === 'commits') {
      body = `<div class="Box">${commits.map((c, i) => `<div class="commit-item" style="${i ? 'border-top:1px solid var(--borderColor-muted)' : ''}"><div class="flex-1"><a class="title" href="${href(r.owner, r.name, 'commit', c.sha)}">${esc(c.message)}</a><div class="byline">${avatar(c.author, 16)} <strong>${esc(c.author)}</strong> committed ${GH.timeAgo(c.date)}</div></div><div class="right"><a class="sha-link" href="${href(r.owner, r.name, 'commit', c.sha)}">${c.sha.slice(0, 7)}</a>${GH.ui.copyBtn(c.sha, 'Copy full SHA')}</div></div>`).join('') || '<div class="blankslate"><p>No commits</p></div>'}</div>`;
    } else if (sub === 'checks') {
      body = `<div class="Box blankslate">${icon('checklist', 24)}<h3>No checks</h3><p>Los <em>checks</em> son pruebas automáticas (GitHub Actions) que revisan los cambios antes de integrarlos. Este repositorio no tiene ninguna configurada.</p></div>`;
    } else {
      const events = [];
      events.push({ t: pr.createdAt + 1, html: `<div class="timeline-item"><span class="badge">${icon('git-commit')}</span>${avatar(pr.author, 20)} <strong style="color:var(--fgColor-default)">${esc(pr.author)}</strong> added ${commits.length} commit${commits.length === 1 ? '' : 's'}</div>${commits.map(c => `<div class="timeline-item" style="padding:2px 0 2px 24px">${icon('git-commit', 16, 'muted')}${avatar(c.author, 16)}<a class="link-muted mono f6" href="${href(r.owner, r.name, 'commit', c.sha)}">${esc(c.message)}</a><span class="ml-auto mono f6">${c.sha.slice(0, 7)}</span></div>`).join('')}` });
      (pr.comments || []).forEach(cm => events.push({ t: cm.date, html: comment(cm.author, cm.date, cm.body, cm.author === r.owner) }));
      if (pr.state === 'merged') events.push({ t: pr.mergedAt, html: `<div class="timeline-item"><span class="badge merged">${icon('git-merge')}</span>${avatar(pr.mergedBy, 20)} <strong style="color:var(--fgColor-default)">${esc(pr.mergedBy)}</strong> merged commit <a class="mono link-primary" href="${href(r.owner, r.name, 'commit', pr.mergeCommit)}">${(pr.mergeCommit || '').slice(0, 7)}</a> into <span class="branch-name">${esc(pr.base)}</span> ${GH.timeAgo(pr.mergedAt)}</div>` });
      if (pr.state === 'closed') events.push({ t: pr.closedAt, html: `<div class="timeline-item"><span class="badge" style="background:var(--bgColor-danger-emphasis);color:#fff">${icon('git-pull-request-closed')}</span><strong style="color:var(--fgColor-default)">${esc(S().me())}</strong> closed this ${GH.timeAgo(pr.closedAt)}</div>` });
      if (pr.headDeleted) events.push({ t: pr.deletedAt || Date.now(), html: `<div class="timeline-item"><span class="badge">${icon('git-branch')}</span><strong style="color:var(--fgColor-default)">${esc(S().me())}</strong> deleted the <span class="branch-name" style="text-decoration:line-through">${esc(pr.head)}</span> branch</div>` });
      events.sort((a, b) => a.t - b.t);
      body = `<div class="layout" style="grid-template-columns:minmax(0,1fr) 256px"><div style="min-width:0" data-tour="pr-conversation">
        ${comment(pr.author, pr.createdAt, pr.body || '_No description provided._', true, true)}
        <div class="timeline-line">${events.map(e => e.html).join('')}</div>
        ${mergeBox(r, pr)}
        <div class="divider"></div>
        <div class="timeline-comment">${avatar(S().me(), 40)}<div class="comment-box"><div class="tabnav" style="padding:8px 8px 0;background:var(--bgColor-muted);border-radius:6px 6px 0 0"><button class="tabnav-tab selected">Write</button><button class="tabnav-tab" data-action="notsim" data-what="Vista previa de comentarios">Preview</button></div><div style="padding:8px"><textarea class="form-control" id="pr-comment" placeholder="Use Markdown to format your comment" style="min-height:100px" aria-label="Add a comment"></textarea></div><div class="flex gap-2" style="padding:0 8px 8px;justify-content:flex-end">${pr.state === 'open' && S().isAdmin(r) ? `<button class="btn" data-action="closePr">${icon('git-pull-request-closed', 16, 'color-danger')} Close pull request</button>` : ''}${pr.state === 'closed' ? `<button class="btn" data-action="reopenPr">Reopen pull request</button>` : ''}<button class="btn btn-primary" data-action="prComment">Comment</button></div></div></div>
      </div><div>${sideMeta(pr)}</div></div>`;
    }
    return {
      header: { repo: r, tab: 'pulls' }, title: `${pr.title} · Pull Request #${pr.number} · ${r.owner}/${r.name}`,
      html: `<div class="container-xl" data-tour="pr-page">
        <div class="flex gap-2" style="align-items:flex-start" data-tour="pr-header"><h1 style="font-size:32px;font-weight:400;line-height:1.25" class="flex-1">${esc(pr.title)} <span class="muted" style="font-weight:300">#${pr.number}</span></h1>${S().isAdmin(r) || pr.author === S().me() ? `<button class="btn btn-sm" data-action="editPrTitle">Edit</button>` : ''}</div>
        <div class="flex gap-2 mt-2 mb-3" style="flex-wrap:wrap">${stateLbl}<span class="muted">${verb} <span class="branch-name">${esc(pr.base)}</span> from <span class="branch-name">${esc(pr.head)}</span> ${pr.state === 'merged' ? GH.timeAgo(pr.mergedAt) : ''}</span></div>
        <div class="flex" style="border-bottom:1px solid var(--borderColor-default);margin-bottom:16px"><nav class="UnderlineNav" style="margin-bottom:-1px" data-tour="pr-tabs">${tabs.map(t => `<a class="UnderlineNav-item ${sub === t[0] ? 'selected' : ''}" href="${base}${t[0] === 'conversation' ? '' : '/' + t[0]}" data-tour="pr-tab-${t[0]}">${icon(t[1])}<span>${t[2]}</span><span class="Counter">${t[3]}</span></a>`).join('')}</nav><span class="ml-auto f6 mono flex gap-1"><span class="color-success">+${tot.add}</span><span class="color-danger">−${tot.del}</span>${GH.statBar(tot.add, tot.del)}</span></div>
        ${body}
      </div>`
    };
  };
  function comment(author, date, body, isOwner, first) {
    return `<div class="timeline-comment ${first ? 'owner' : ''}">${avatar(author, 40)}<div class="comment-box"><div class="comment-head"><strong style="color:var(--fgColor-default)">${esc(author)}</strong> commented ${GH.timeAgo(date)}<span class="ml-auto"></span>${first ? '<span class="Label">Author</span>' : isOwner ? '<span class="Label">Owner</span>' : ''}<button class="btn btn-invisible btn-sm btn-icon" data-action="notsim" data-what="Opciones del comentario" aria-label="Show options">${icon('kebab-horizontal')}</button></div><div class="comment-body markdown-body" style="font-size:14px">${GH.markdown(body)}</div></div></div>`;
  }
  function mergeBox(r, pr) {
    if (pr.state === 'merged') {
      return `<div class="merge-box" data-tour="merged-box"><span class="merge-icon" style="background:var(--bgColor-done-emphasis)">${icon('git-merge', 24)}</span><div class="merge-panel done"><div class="merge-row"><div class="flex-1"><strong class="f4">Pull request successfully merged and closed</strong><p class="muted mt-2">${pr.headDeleted ? `The <span class="branch-name">${esc(pr.head)}</span> branch has been deleted.` : `You’re all set — the <span class="branch-name">${esc(pr.head)}</span> branch can be safely deleted.`}</p></div>${!pr.headDeleted && r.branches[pr.head] && S().isAdmin(r) ? `<button class="btn" data-action="deletePrBranch" data-tour="delete-branch-btn">Delete branch</button>` : ''}</div></div></div>`;
    }
    if (pr.state === 'closed') return `<div class="merge-box"><span class="merge-icon" style="background:var(--bgColor-danger-emphasis)">${icon('git-pull-request-closed', 24)}</span><div class="merge-panel"><div class="merge-row"><div><strong>Closed with unmerged commits</strong><p class="muted">This pull request is closed, but the <span class="branch-name">${esc(pr.head)}</span> branch has unmerged commits.</p></div></div></div></div>`;
    if (!S().isAdmin(r)) return `<div class="merge-box"><span class="merge-icon" style="background:var(--bgColor-neutral-emphasis)">${icon('git-merge', 24)}</span><div class="merge-panel"><div class="merge-row"><div><strong>This branch has no conflicts with the base branch</strong><p class="muted">Only those with write access to this repository can merge pull requests.</p></div></div></div></div>`;
    return `<div class="merge-box" data-tour="merge-box"><span class="merge-icon" style="background:var(--bgColor-success-emphasis)">${icon('git-merge', 24)}</span><div class="merge-panel success">
      <div class="merge-row"><span class="ic" style="background:var(--bgColor-neutral-muted)">${icon('check-circle', 16, 'muted')}</span><div><strong>No conflicts with base branch</strong><p class="muted f6">Merging can be performed automatically.</p></div></div>
      ${mergeOpen ? `<div class="merge-row" style="display:block" data-tour="merge-confirm-box"><label class="form-label" for="mg-title">Commit message</label><input class="form-control" id="mg-title" value="Merge pull request #${pr.number} from ${esc(r.owner)}/${esc(pr.head)}"><label class="form-label mt-2" for="mg-desc">Extended description</label><textarea class="form-control" id="mg-desc" style="min-height:60px">${esc(pr.title)}</textarea><p class="f6 muted mt-2">This commit will be authored by ${esc(S().me())}</p><div class="flex gap-2 mt-3"><button class="btn btn-primary" data-action="confirmMerge" data-tour="confirm-merge">Confirm merge</button><button class="btn" data-action="cancelMerge">Cancel</button></div></div>`
      : `<div class="merge-row"><div class="btn-group"><button class="btn btn-primary" data-action="startMerge" data-tour="merge-btn">Merge pull request</button><button class="btn btn-primary btn-caret" data-action="mergeMethods" aria-label="Select merge method">${icon('triangle-down')}</button></div><p class="muted f6" style="align-self:center">You can also merge this with the command line. <a href="#" data-action="notsim" data-what="Instrucciones de línea de comandos">View command line instructions.</a></p></div>`}
    </div></div>`;
  }
  A.startMerge = () => { mergeOpen = true; GH.render(); setTimeout(() => { const b = document.querySelector('[data-tour="confirm-merge"]'); if (b) b.scrollIntoView({ block: 'center' }); }, 30); };
  A.cancelMerge = () => { mergeOpen = false; GH.render(); };
  A.mergeMethods = (el) => GH.ui.openMenu(el, `<ul class="ActionList">${GH.ui.menuItem({ label: 'Create a merge commit', desc: 'All commits from this branch will be added to the base branch via a merge commit.', action: 'startMergeFromMenu', checked: true })}${GH.ui.menuItem({ label: 'Squash and merge', desc: 'The commits from this branch will be combined into one commit in the base branch.', action: 'startMergeFromMenu', checked: false })}${GH.ui.menuItem({ label: 'Rebase and merge', desc: 'The commits from this branch will be rebased and added to the base branch.', action: 'startMergeFromMenu', checked: false })}</ul>`, { width: 360 });
  A.startMergeFromMenu = () => { GH.ui.closeMenus(); A.startMerge(); };
  A.confirmMerge = () => {
    const rt = GH.router.current; const r = rt.repo; const pr = S().pull(r, rt.number);
    S().mergePull(r, pr, document.getElementById('mg-title').value.trim(), document.getElementById('mg-desc').value.trim());
    mergeOpen = false; GH.render();
    GH.ui.toast('Pull request successfully merged and closed');
  };
  A.deletePrBranch = () => {
    const rt = GH.router.current; const r = rt.repo; const pr = S().pull(r, rt.number);
    pr.deletedAt = Date.now();
    S().deleteBranch(r, pr.head); GH.render();
  };
  A.closePr = () => { const rt = GH.router.current; const r = rt.repo; S().closePull(r, S().pull(r, rt.number)); GH.render(); };
  A.reopenPr = () => { const rt = GH.router.current; const r = rt.repo; S().reopenPull(r, S().pull(r, rt.number)); GH.render(); };
  A.prComment = () => {
    const t = document.getElementById('pr-comment'); if (!t.value.trim()) return;
    const rt = GH.router.current; S().comment(S().pull(rt.repo, rt.number), t.value.trim()); GH.render();
  };
  A.editPrTitle = () => {
    const rt = GH.router.current; const pr = S().pull(rt.repo, rt.number);
    GH.ui.dialog({ title: 'Edit title', body: `<input class="form-control" id="ept" value="${esc(pr.title)}">`, footer: '<button class="btn" data-action="closeDialog">Cancel</button><button class="btn btn-primary" data-action="saveEpt">Save</button>' });
    A.saveEpt = () => { pr.title = document.getElementById('ept').value.trim() || pr.title; S().save(); GH.ui.closeDialog(); GH.render(); };
  };
  GH.bus.on('route', (rt) => { if (rt.view !== 'pull') mergeOpen = false; });
})(window.GH);
