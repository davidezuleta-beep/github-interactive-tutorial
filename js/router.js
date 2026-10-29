/* Hash router. Maps #/... URLs to view functions in GH.views. */
(function (GH) {
  'use strict';
  GH.views = GH.views || {};
  const router = GH.router = { current: null };

  function dec(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

  router.parse = function (hash) {
    let h = (hash || '').replace(/^#/, '');
    let query = {};
    const qi = h.indexOf('?');
    if (qi >= 0) { new URLSearchParams(h.slice(qi + 1)).forEach((v, k) => { query[k] = v; }); h = h.slice(0, qi); }
    const parts = h.split('/').filter(Boolean).map(dec);
    const R = (view, params) => Object.assign({ view, query, parts }, params || {});
    if (!parts.length) return R('dashboard');
    const top = { new: 'newRepo', issues: 'globalIssues', pulls: 'globalPulls', notifications: 'notifications', explore: 'explore', search: 'search' };
    if (parts.length === 1 && top[parts[0]]) return R(top[parts[0]]);
    if (parts.length === 1) return R('profile', { owner: parts[0] });
    const owner = parts[0], name = parts[1];
    const rest = parts.slice(2);
    const base = { owner, name };
    if (!rest.length) return R('code', Object.assign(base, { branch: null, path: '' }));
    const [seg, ...more] = rest;
    switch (seg) {
      case 'tree': return R('code', Object.assign(base, { branch: more[0], path: more.slice(1).join('/') }));
      case 'blob': return R('blob', Object.assign(base, { branch: more[0], path: more.slice(1).join('/') }));
      case 'edit': return R('edit', Object.assign(base, { branch: more[0], path: more.slice(1).join('/') }));
      case 'new': return R('newFile', Object.assign(base, { branch: more[0], path: more.slice(1).join('/') }));
      case 'upload': return R('upload', Object.assign(base, { branch: more[0], path: more.slice(1).join('/') }));
      case 'commits': return R('commits', Object.assign(base, { branch: more[0] }));
      case 'commit': return R('commit', Object.assign(base, { sha: more[0] }));
      case 'branches': return R('branches', base);
      case 'compare': {
        const range = more.join('/');
        const m = range.split('...');
        return R('compare', Object.assign(base, { baseBranch: m.length > 1 ? m[0] : null, headBranch: m.length > 1 ? m[1] : (m[0] || null) }));
      }
      case 'pulls': return R('pulls', base);
      case 'pull': return R('pull', Object.assign(base, { number: +more[0], sub: more[1] || 'conversation' }));
      case 'issues':
        if (more[0] === 'new') return R('newIssue', base);
        if (more[0]) return R('issue', Object.assign(base, { number: +more[0] }));
        return R('issues', base);
      case 'settings': return R('settings', Object.assign(base, { section: more[0] || 'general' }));
      case 'actions': case 'projects': case 'wiki': case 'security': case 'insights':
        return R('repoSection', Object.assign(base, { section: seg }));
      default: return R('notFound');
    }
  };

  router.href = function (...segs) { return '#/' + segs.filter(s => s !== '' && s != null).map(s => String(s).split('/').map(encodeURIComponent).join('/')).join('/'); };

  router.go = function (hash) {
    if (location.hash === hash) router.render(true); else location.hash = hash;
  };

  router.render = function (keepScroll) {
    const route = router.parse(location.hash);
    // Resolve repository for repo views
    if (route.owner && route.name) {
      const raw = GH.store.raw(route.owner, route.name);
      route.repo = GH.store.get(route.owner, route.name);
      if (!route.repo) { route.blockedRepo = raw; route.view = 'notFound'; }
    }
    const prev = router.current;
    router.current = route;
    const fn = GH.views[route.view] || GH.views.notFound;
    let out;
    try { out = fn(route) || {}; } catch (e) { console.error(e); out = { html: `<div class="container-lg"><div class="flash flash-warn">${GH.icon('alert')} Algo salió mal en el simulador: ${GH.esc(e.message)}</div></div>` }; }
    if (out.redirect) { location.replace(out.redirect); return; }
    const app = document.getElementById('app');
    const y = window.scrollY;
    GH.ui.closeMenus();
    app.innerHTML = GH.ui.header(out.header || {}) + `<main id="main" tabindex="-1">${out.html || ''}</main>` + (out.noFooter ? '' : GH.ui.footer());
    document.title = out.title ? out.title + ' · Simulador de GitHub' : 'Simulador de GitHub';
    if (keepScroll) window.scrollTo(0, y);
    else if (!prev || prev.view !== route.view || location.hash !== router._lastHash) window.scrollTo(0, 0);
    router._lastHash = location.hash;
    if (out.after) { try { out.after(document.getElementById('main')); } catch (e) { console.error(e); } }
    GH.bus.emit('route', route);
  };

  GH.render = () => router.render(true);
  window.addEventListener('hashchange', () => router.render(false));
})(window.GH);
