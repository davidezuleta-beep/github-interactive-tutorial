/* Guided-tour engine: welcome, coach marks, highlights, hints, back/repeat/restart, progress, glossary, challenges. */
(function (GH) {
  'use strict';
  const { esc, icon } = GH;
  const C = () => GH.tourContent;
  const KEY = 'ghsim:tour:v1', SNAPS = 'ghsim:tour:modsnaps:v1';
  const layer = () => document.getElementById('tour-layer');

  const tour = GH.tour = {};
  let ts = null;                 // persisted tour state
  let stepSnaps = {};            // in-memory snapshots per step
  let token = 0;                 // increments on every step change
  let tick = null, missingSince = 0, scrolledFor = -1, lastRect = null;
  let els = {};

  function save() { GH.storage.set(KEY, ts); }
  function defaults() { return { introDone: false, mode: 'intro', m: 0, s: 0, completed: [], panelTab: 'modules' }; }
  const mod = () => C().modules[ts.m];
  const step = () => ts.mode === 'guided' && mod() ? mod().steps[ts.s] : null;
  const val = (v) => (typeof v === 'function' ? v(C().ctx) : v);
  function findTarget(sel) {
    if (!sel) return null;
    const list = document.querySelectorAll(sel);
    for (const el of list) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return el; }
    return null;
  }
  function closeAllOverlays() { GH.ui.closeMenus(); GH.ui.closeDialog(); GH.ui.closePalette(true); GH.ui.closeDrawer(); }

  // ---------------- Init ----------------
  tour.init = function () {
    ts = Object.assign(defaults(), GH.storage.get(KEY) || {});
    buildLayer();
    window.addEventListener('click', onClickCapture, true);
    GH.bus.on('*', onBusEvent);
    document.addEventListener('input', () => setTimeout(evaluateCheck, 0));
    window.addEventListener('resize', position); window.addEventListener('scroll', position, true);
    GH.bus.on('route', (rt) => {
      if ((rt.view === 'code' || rt.view === 'blob') && rt.repo && rt.branch && !rt.repo.branches[rt.branch]) { GH.store.state.tutorial.timeTravel = true; GH.store.save(); }
      fillDynamic();
    });
    GH.bus.on('state:changed', () => { if (els.panel && els.panel.classList.contains('open') && ts.panelTab === 'challenges') renderPanel(); renderDock(); });
    if (!ts.introDone) { showIntro(0); return; }
    if (ts.mode === 'guided' && mod()) {
      let s = Math.min(ts.s, mod().steps.length - 1);
      while (s > 0 && mod().steps[s].transient) s--;
      enterStep(ts.m, s, { noPrepare: true });
    } else { ts.mode = 'free'; renderDock(); }
  };

  function buildLayer() {
    const L = layer();
    L.innerHTML = `<div class="tour-ring" hidden></div>
      <div class="tour-bubble" role="dialog" aria-modal="false" aria-labelledby="tb-title" tabindex="-1" hidden></div>
      <div class="tour-dock" role="region" aria-label="Controles del recorrido"></div>
      <aside class="tour-panel" aria-label="Panel de ayuda" aria-hidden="true"></aside>
      <div class="sr-only" aria-live="polite" id="tour-live"></div>`;
    els = { ring: L.querySelector('.tour-ring'), bubble: L.querySelector('.tour-bubble'), dock: L.querySelector('.tour-dock'), panel: L.querySelector('.tour-panel'), live: L.querySelector('#tour-live') };
    L.addEventListener('click', onLayerClick);
  }

  // ---------------- Intro ----------------
  function slugLogin(name) {
    let s = (name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    if (!s) return 'aprendiz';
    let base = s, i = 2;
    while (GH.store.state.people[s]) s = base + '-' + (i++);
    return s;
  }
  function showIntro(i) {
    hideBubble();
    const slides = C().intro;
    const sl = slides[i];
    let m = layer().querySelector('.tour-intro');
    if (!m) { m = document.createElement('div'); m.className = 'tour-intro'; layer().appendChild(m); }
    const last = i === slides.length - 1;
    m.innerHTML = `<div class="ti-card" role="dialog" aria-modal="true" aria-labelledby="ti-title">
      <div class="ti-top"><span class="ti-badge">${icon(sl.icon, 24)}</span><span class="ti-step">${i + 1} / ${slides.length}</span></div>
      <h2 id="ti-title">${sl.title}</h2><div class="ti-body">${sl.body}</div>
      <div class="ti-foot"><div class="ti-dots">${slides.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div><span class="flex-1"></span>
        ${i > 0 ? `<button class="btn" data-t="intro-prev">Atrás</button>` : `<button class="btn btn-invisible" data-t="intro-skip">Saltar la bienvenida</button>`}
        ${last ? `<button class="btn" data-t="intro-free">Explorar por mi cuenta</button><button class="btn btn-primary" data-t="intro-start">Empezar el recorrido guiado ${icon('arrow-right')}</button>` : `<button class="btn btn-primary" data-t="intro-next">Siguiente ${icon('arrow-right')}</button>`}
      </div></div>`;
    m.dataset.i = i;
    const inp = m.querySelector('#intro-name');
    if (inp) {
      inp.value = ts.pendingName || '';
      const upd = () => { ts.pendingName = inp.value; m.querySelector('#intro-login-hint').innerHTML = `Tu usuario de práctica será <strong>${esc(slugLogin(inp.value))}</strong>.`; };
      inp.addEventListener('input', upd); upd();
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') finishIntro('guided'); });
    }
    setTimeout(() => { const b = m.querySelector('[data-t="intro-next"], [data-t="intro-start"]'); if (b && !inp) b.focus(); }, 30);
    renderDock();
  }
  function finishIntro(mode) {
    const name = (ts.pendingName || '').trim();
    if (name) GH.store.setUser(slugLogin(name), name);
    delete ts.pendingName;
    ts.introDone = true; save();
    const m = layer().querySelector('.tour-intro'); if (m) m.remove();
    GH.render();
    if (mode === 'guided') tour.startModule(0); else tour.goFree('modules');
  }

  // ---------------- Modules & steps ----------------
  tour.startModule = function (m, opts) {
    opts = opts || {};
    closeAllOverlays();
    closePanel();
    const snaps = GH.storage.get(SNAPS) || {};
    if (opts.restore && snaps[m]) { GH.store.restore(snaps[m].state); }
    ts.mode = 'guided'; ts.m = m; ts.s = 0; save();
    C().modules[m].prepare && C().modules[m].prepare();
    snaps[m] = { state: GH.store.snapshot(), hash: location.hash };
    GH.storage.set(SNAPS, snaps);
    Object.keys(stepSnaps).forEach(k => { if (k.startsWith(m + ':')) delete stepSnaps[k]; });
    setTimeout(() => enterStep(m, 0), 60);
  };

  function enterStep(m, s, opts) {
    opts = opts || {};
    const steps = C().modules[m].steps;
    while (s < steps.length && steps[s].skipIf && steps[s].skipIf(C().ctx)) s++;
    if (s >= steps.length) { ts.m = m; ts.s = steps.length - 1; return completeModule(); }
    ts.mode = 'guided'; ts.m = m; ts.s = s; save();
    token++; missingSince = 0; scrolledFor = -1;
    const st = steps[s];
    if (st.prepare && !opts.noPrepare) st.prepare(C().ctx);
    if (!opts.keepSnap) stepSnaps[m + ':' + s] = { state: GH.store.snapshot(), hash: location.hash };
    renderBubble();
    renderDock();
    els.live.textContent = `Módulo ${m + 1}, paso ${s + 1}: ${st.title}`;
    clearInterval(tick); tick = setInterval(() => { position(); evaluateCheck(); }, 150);
    setTimeout(() => { position(); evaluateCheck(); focusForStep(st); }, 80);
  }
  function focusForStep(st) {
    const t = findTarget(st.target);
    if (t && st.advance && st.advance.check && /^(INPUT|TEXTAREA)$/.test(t.tagName)) { t.focus(); return; }
    const a = document.activeElement;
    if (!a || a === document.body) els.bubble.focus({ preventScroll: true });
  }

  function next() {
    const st = step(); if (!st) return;
    if (ts.s < mod().steps.length - 1) enterStep(ts.m, ts.s + 1); else completeModule();
  }
  tour.next = next;

  function completeModule() {
    const m = ts.m;
    if (!ts.completed.includes(m)) ts.completed.push(m);
    save();
    clearInterval(tick); tick = setInterval(position, 200);
    const M = C().modules[m];
    const nextM = C().modules[m + 1];
    ts.s = M.steps.length; // "completed" pseudo-step
    hideRing();
    els.bubble.hidden = false;
    els.bubble.className = 'tour-bubble center done';
    els.bubble.innerHTML = `<div class="tb-celebrate">${icon('check-circle-fill', 24)}</div>
      <div class="tb-module">Módulo ${m + 1} de ${C().modules.length}</div>
      <h3 id="tb-title">¡Módulo completado!</h3><p class="tb-sub">${esc(M.title)}</p>
      ${M.learn.length ? `<ul class="tb-learn">${M.learn.map(l => `<li>${icon('check', 16)}<span>${l}</span></li>`).join('')}</ul>` : ''}
      <div class="tb-foot"><button class="btn btn-sm" data-t="repeat-module">${icon('sync')} Repetir módulo</button><span class="flex-1"></span>
      ${nextM ? `<button class="btn btn-primary btn-sm" data-t="next-module">Siguiente: ${esc(nextM.title)} ${icon('arrow-right')}</button>` : `<button class="btn btn-primary btn-sm" data-t="free">Explorar libremente</button>`}</div>`;
    els.bubble.style.left = ''; els.bubble.style.top = '';
    els.live.textContent = `Módulo ${m + 1} completado`;
    renderDock();
    GH.bus.emit('tour:module-complete', m);
  }

  tour.back = function () {
    if (ts.mode !== 'guided') return;
    const steps = mod().steps;
    let m = ts.m, i = Math.min(ts.s, steps.length) - 1;
    while (i > 0 && steps[i].transient) i--;
    if (i < 0) {
      if (m === 0) return;
      m = m - 1; const ps = C().modules[m].steps; i = ps.length - 1;
      while (i > 0 && ps[i].transient) i--;
    }
    restoreTo(m, i);
  };
  tour.repeatStep = function () {
    if (ts.mode !== 'guided') return;
    const steps = mod().steps;
    if (ts.s >= steps.length) { return tour.startModule(ts.m, { restore: true }); }
    let i = ts.s; while (i > 0 && steps[i].transient) i--;
    restoreTo(ts.m, i);
  };
  function restoreTo(m, i) {
    const snap = stepSnaps[m + ':' + i];
    closeAllOverlays();
    if (!snap) { tour.startModule(m, { restore: true }); return; }
    GH.store.restore(snap.state);
    if (location.hash !== snap.hash) location.hash = snap.hash; else GH.render();
    setTimeout(() => enterStep(m, i, { keepSnap: true }), 60);
  }
  tour.repeatModule = () => tour.startModule(ts.m, { restore: true });
  tour.restartAll = function () {
    confirmBox('¿Reiniciar todo?', 'Se borrarán tus repositorios de práctica y tu progreso, y volverás a la bienvenida.', 'Sí, reiniciar', () => {
      GH.storage.del(KEY); GH.storage.del(SNAPS); GH.storage.del('ghsim:state:v1');
      stepSnaps = {}; clearInterval(tick);
      closeAllOverlays(); closePanel();
      GH.store.reset();
      if (GH.resetNewRepoForm) GH.resetNewRepoForm();
      ts = defaults(); save();
      location.hash = '#/'; GH.render();
      showIntro(0);
    });
  };
  tour.goFree = function (tab) {
    if (ts.mode === 'guided' && ts.m === C().modules.length - 1 && !ts.completed.includes(ts.m)) ts.completed.push(ts.m);
    ts.mode = 'free'; save();
    clearInterval(tick); hideBubble();
    renderDock();
    if (tab) openPanel(tab);
    GH.bus.emit('tour:free');
  };

  // ---------------- Bubble rendering ----------------
  function renderBubble() {
    const st = step(); if (!st) return;
    const M = mod();
    const b = els.bubble;
    b.hidden = false;
    b.className = 'tour-bubble';
    const isNext = st.advance === 'next' || (st.advance && st.advance.check && !st.advance.auto);
    const actions = (st.actions || []).map((a, k) => `<button class="btn btn-sm ${a.primary ? 'btn-primary' : ''}" data-t="action" data-k="${k}">${a.label}</button>`).join('');
    b.innerHTML = `<div class="tb-head"><span class="tb-avatar" aria-hidden="true">${icon('mortar-board')}</span><div class="flex-1"><div class="tb-guide">Tu guía</div><div class="tb-module">Módulo ${ts.m + 1} · Paso ${ts.s + 1} de ${M.steps.length}</div></div><button class="btn btn-invisible btn-sm btn-icon" data-t="minimize" aria-label="Minimizar el globo">${icon('dash')}</button></div>
      <h3 id="tb-title">${st.title}</h3>
      <div class="tb-body">${val(st.body)}</div>
      <div class="tb-hint" hidden>${icon('light-bulb')}<span></span></div>
      <div class="tb-missing" hidden>${icon('info')}<span>No encuentro el elemento de este paso. ¿Se cerró un menú o cambiaste de página?</span><button class="btn btn-sm" data-t="repeat-step">Repetir paso</button></div>
      <div class="tb-foot">${ts.m > 0 || ts.s > 0 ? `<button class="btn btn-sm btn-invisible" data-t="back" aria-label="Paso anterior">${icon('arrow-left')} Atrás</button>` : ''}<span class="flex-1"></span>${actions}${isNext ? `<button class="btn btn-sm btn-primary" data-t="next" ${st.advance === 'next' ? '' : 'disabled'}>Continuar ${icon('arrow-right')}</button>` : ''}</div>`;
    fillDynamic();
    lastRect = null;
    position();
  }
  function fillDynamic() { document.querySelectorAll('#tour-layer [data-me]').forEach(e => { e.textContent = GH.store.me(); }); }
  function hideRing() { els.ring.hidden = true; }
  function hideBubble() { if (els.bubble) { els.bubble.hidden = true; } hideRing(); }

  function position() {
    if (!els.bubble || els.bubble.hidden) return;
    const st = step();
    const b = els.bubble;
    if (!st) { centerBubble(); return; }
    if (b.classList.contains('minimized')) { hideRing(); return; }
    const t = findTarget(st.target);
    const miss = b.querySelector('.tb-missing');
    if (st.target && !t) {
      hideRing();
      if (!missingSince) missingSince = Date.now();
      if (miss) miss.hidden = Date.now() - missingSince < 2500;
      if (!b.classList.contains('corner')) cornerBubble();
      return;
    }
    missingSince = 0; if (miss) miss.hidden = true;
    if (!t) { centerBubble(); hideRing(); return; }
    let r = t.getBoundingClientRect();
    if (scrolledFor !== token) {
      scrolledFor = token;
      const big = r.height > window.innerHeight * 0.6;
      if (r.top < 72 || r.bottom > window.innerHeight - 80) { t.scrollIntoView({ block: big ? 'start' : 'center', behavior: 'auto' }); r = t.getBoundingClientRect(); }
    }
    const pad = 4;
    const ring = els.ring;
    ring.hidden = false;
    const top = Math.max(r.top - pad, 2), left = Math.max(r.left - pad, 2);
    const bottom = Math.min(r.bottom + pad, window.innerHeight - 2), right = Math.min(r.right + pad, window.innerWidth - 2);
    ring.style.top = top + 'px'; ring.style.left = left + 'px'; ring.style.width = Math.max(0, right - left) + 'px'; ring.style.height = Math.max(0, bottom - top) + 'px';
    const key = [Math.round(r.top), Math.round(r.left), Math.round(r.width), Math.round(r.height), b.offsetHeight, window.innerWidth, window.innerHeight].join(',');
    if (key === lastRect) return;
    lastRect = key;
    placeBubble(r, st.placement);
  }
  function centerBubble() { const b = els.bubble; b.classList.remove('corner'); b.classList.add('center'); b.style.left = ''; b.style.top = ''; b.removeAttribute('data-arrow'); }
  function cornerBubble() { const b = els.bubble; b.classList.remove('center'); b.classList.add('corner'); b.style.left = ''; b.style.top = ''; b.removeAttribute('data-arrow'); }
  function placeBubble(r, pref) {
    const b = els.bubble;
    b.classList.remove('center', 'corner');
    const W = b.offsetWidth || 360, H = b.offsetHeight || 200, g = 14, M = 12, dockH = 70;
    const vw = window.innerWidth, vh = window.innerHeight;
    const big = r.height > vh * 0.55 || (r.width > vw * 0.6 && r.height > vh * 0.35);
    if (pref === 'corner' || big) { cornerBubble(); return; }
    if (pref === 'center') { centerBubble(); return; }
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const clampX = (x) => Math.max(M, Math.min(x, vw - W - M));
    const clampY = (y) => Math.max(M + 64, Math.min(y, vh - H - dockH));
    const cand = {
      bottom: { x: clampX(cx - W / 2), y: r.bottom + g, ok: r.bottom + g + H < vh - dockH },
      top: { x: clampX(cx - W / 2), y: r.top - g - H, ok: r.top - g - H > M },
      right: { x: r.right + g, y: clampY(cy - H / 2), ok: r.right + g + W < vw - M },
      left: { x: r.left - g - W, y: clampY(cy - H / 2), ok: r.left - g - W > M }
    };
    const order = [pref || 'bottom', 'bottom', 'top', 'right', 'left'];
    const side = order.find(o => cand[o] && cand[o].ok);
    if (!side) { cornerBubble(); return; }
    const p = cand[side];
    b.style.left = Math.round(p.x) + 'px'; b.style.top = Math.round(p.y) + 'px';
    b.setAttribute('data-arrow', side);
    const ax = side === 'bottom' || side === 'top' ? Math.max(16, Math.min(cx - p.x, W - 16)) : 0;
    const ay = side === 'left' || side === 'right' ? Math.max(16, Math.min(cy - p.y, H - 16)) : 0;
    b.style.setProperty('--ax', ax + 'px'); b.style.setProperty('--ay', ay + 'px');
  }

  // ---------------- Advancing ----------------
  function scheduleAdvance(delay) {
    const my = token;
    setTimeout(() => { if (my === token && ts.mode === 'guided') next(); }, delay || 80);
  }
  function onBusEvent(name) {
    const st = step(); if (!st) return;
    const adv = st.advance;
    if (adv && adv.event === name) scheduleAdvance(120);
    if (name === 'route') {
      const re = st.route || (adv && adv.route);
      if (re && re.test(location.hash)) scheduleAdvance(100);
    }
    setTimeout(evaluateCheck, 30);
  }
  function evaluateCheck() {
    const st = step(); if (!st || !st.advance || !st.advance.check) return;
    let ok = false; try { ok = !!st.advance.check(C().ctx); } catch (e) { ok = false; }
    if (st.advance.auto) { if (ok) { const my = token; st._pending = st._pending || setTimeout(() => { st._pending = null; if (my === token) { let still = false; try { still = st.advance.check(C().ctx); } catch (e) { /* */ } if (still) next(); } }, 350); } return; }
    const btn = els.bubble.querySelector('[data-t="next"]'); if (btn) btn.disabled = !ok;
  }

  // ---------------- Click guard (guided mode) ----------------
  function onClickCapture(e) {
    if (ts.mode !== 'guided') return;
    let st = step(); if (!st) return;
    const t = e.target; if (!t || !t.closest) return;
    if (t.closest('#tour-layer')) return;
    // If an auto-advancing step is already satisfied, move on now so a quick click on the next target isn't blocked.
    if (st.advance && st.advance.check && st.advance.auto) {
      let done = false; try { done = !!st.advance.check(C().ctx); } catch (err) { /* */ }
      const own = st.click || st.target;
      if (done && !(own && t.closest(own))) { next(); st = step(); if (!st) return; }
    }
    if (st.allow === '*') { checkClickAdvance(t, st); return; }
    const clickSel = st.click || st.target;
    if (clickSel && t.closest(clickSel)) { checkClickAdvance(t, st); return; }
    const inTarget = st.target && t.closest(st.target);
    if (inTarget && (st.advance !== 'next' || t.closest('input, textarea, select, label'))) return;
    if (Array.isArray(st.allow) && st.allow.some(sel => t.closest(sel))) return;
    if (t.closest('.toast-wrap')) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    showHint(st);
  }
  function checkClickAdvance(t, st) {
    if (st.advance !== 'click') return;
    const sel = st.click || st.target;
    if (sel && t.closest(sel)) scheduleAdvance(90);
  }
  let hintTimer = null;
  function showHint(st) {
    const h = els.bubble.querySelector('.tb-hint');
    const b = els.bubble;
    if (b.classList.contains('minimized')) b.classList.remove('minimized');
    if (h) {
      h.hidden = false;
      h.querySelector('span').innerHTML = st.hint || (st.target ? 'Haz clic en el elemento resaltado en azul para continuar.' : 'Lee el mensaje y pulsa «Continuar» cuando estés listo.');
    }
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    els.ring.classList.remove('flash'); void els.ring.offsetWidth; els.ring.classList.add('flash');
    lastRect = null; position();
    clearTimeout(hintTimer); hintTimer = setTimeout(() => { if (h && h.isConnected) h.hidden = true; lastRect = null; position(); }, 6000);
  }

  // ---------------- Tour layer clicks ----------------
  function onLayerClick(e) {
    const term = e.target.closest('.tb-term');
    if (term) { openPanel('glossary', term.getAttribute('data-term')); return; }
    const b = e.target.closest('[data-t]'); if (!b) return;
    const t = b.getAttribute('data-t');
    const st = step();
    switch (t) {
      case 'intro-next': showIntro(+layer().querySelector('.tour-intro').dataset.i + 1); break;
      case 'intro-prev': showIntro(+layer().querySelector('.tour-intro').dataset.i - 1); break;
      case 'intro-skip': showIntro(C().intro.length - 1); break;
      case 'intro-start': finishIntro('guided'); break;
      case 'intro-free': finishIntro('free'); break;
      case 'next': if (!b.disabled) next(); break;
      case 'back': tour.back(); break;
      case 'repeat-step': tour.repeatStep(); break;
      case 'repeat-module': tour.repeatModule(); break;
      case 'next-module': tour.startModule(ts.m + 1); break;
      case 'free': tour.goFree('challenges'); break;
      case 'action': if (st) { const a = st.actions[+b.getAttribute('data-k')]; if (a) { a.run(C().ctx); setTimeout(evaluateCheck, 50); } } break;
      case 'minimize': els.bubble.classList.toggle('minimized'); b.innerHTML = icon(els.bubble.classList.contains('minimized') ? 'chevron-up' : 'dash'); b.setAttribute('aria-label', els.bubble.classList.contains('minimized') ? 'Mostrar el globo' : 'Minimizar el globo'); lastRect = null; position(); break;
      case 'panel': togglePanel(b.getAttribute('data-tab')); break;
      case 'panel-close': closePanel(); break;
      case 'panel-tab': ts.panelTab = b.getAttribute('data-tab'); save(); renderPanel(); break;
      case 'start-module': tour.startModule(+b.getAttribute('data-m'), { restore: ts.completed.includes(+b.getAttribute('data-m')) }); break;
      case 'continue-guided': closePanel(); if (ts.mode !== 'guided') { const m = firstIncomplete(); tour.startModule(m); } break;
      case 'go-free': tour.goFree(); closePanel(); break;
      case 'restart': tour.restartAll(); break;
      case 'show-intro': closePanel(); showIntro(0); break;
      case 'confirm-yes': { const fn = confirmFn; closeConfirm(); if (fn) fn(); break; }
      case 'confirm-no': closeConfirm(); break;
    }
  }
  function firstIncomplete() { for (let i = 0; i < C().modules.length; i++) if (!ts.completed.includes(i)) return i; return 0; }

  // ---------------- Dock ----------------
  function renderDock() {
    const d = els.dock; if (!d || !ts) return;
    const N = C().modules.length;
    if (!ts.introDone) { d.innerHTML = ''; d.hidden = true; return; }
    d.hidden = false;
    const done = C().challenges.filter(c => { try { return c[2](); } catch (e) { return false; } }).length;
    if (ts.mode === 'guided') {
      const M = mod(); const total = M.steps.length; const s = Math.min(ts.s + 1, total);
      d.innerHTML = `<div class="td-mods" aria-label="Progreso por módulos">${C().modules.map((x, i) => `<span class="${ts.completed.includes(i) ? 'done' : ''} ${i === ts.m ? 'cur' : ''}" title="Módulo ${i + 1}: ${esc(x.title)}"></span>`).join('')}</div>
        <div class="td-info"><div class="td-title">Módulo ${ts.m + 1} de ${N} · ${esc(M.title)}</div><div class="td-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${s}" aria-label="Pasos del módulo"><i style="width:${(ts.s >= total ? 1 : s / total) * 100}%"></i></div></div>
        <div class="td-btns"><button class="btn btn-sm btn-invisible btn-icon" data-t="back" title="Paso anterior" aria-label="Paso anterior" ${ts.m === 0 && ts.s === 0 ? 'disabled' : ''}>${icon('arrow-left')}</button>
        <button class="btn btn-sm btn-invisible btn-icon" data-t="repeat-step" title="Repetir este paso" aria-label="Repetir este paso">${icon('sync')}</button>
        <button class="btn btn-sm btn-invisible btn-icon" data-t="panel" data-tab="modules" title="Índice del recorrido" aria-label="Índice del recorrido">${icon('list-unordered')}</button>
        <button class="btn btn-sm btn-invisible btn-icon" data-t="panel" data-tab="glossary" title="Glosario" aria-label="Glosario">${icon('book')}</button>
        <button class="btn btn-sm" data-t="go-free" title="Salir del recorrido y navegar libremente">Explorar libre</button></div>`;
    } else {
      d.innerHTML = `<span class="tb-avatar" aria-hidden="true">${icon('mortar-board')}</span><div class="td-info"><div class="td-title">Exploración libre</div><div class="td-sub">${ts.completed.length} de ${N} módulos · ${done} de ${C().challenges.length} retos</div></div>
        <div class="td-btns"><button class="btn btn-sm" data-t="panel" data-tab="challenges">${icon('goal')} Retos</button><button class="btn btn-sm" data-t="panel" data-tab="glossary">${icon('book')} Glosario</button><button class="btn btn-sm btn-primary" data-t="panel" data-tab="modules">${icon('mortar-board')} Recorrido guiado</button></div>`;
    }
  }

  // ---------------- Panel ----------------
  let panelTerm = null;
  function openPanel(tab, termKey) { ts.panelTab = tab || ts.panelTab; panelTerm = termKey || null; save(); renderPanel(); els.panel.classList.add('open'); els.panel.setAttribute('aria-hidden', 'false'); }
  function closePanel() { if (!els.panel) return; els.panel.classList.remove('open'); els.panel.setAttribute('aria-hidden', 'true'); }
  function togglePanel(tab) { if (els.panel.classList.contains('open') && ts.panelTab === tab) closePanel(); else openPanel(tab); }
  tour.openPanel = openPanel;
  function renderPanel() {
    const tab = ts.panelTab;
    const tabs = [['modules', 'mortar-board', 'Recorrido'], ['glossary', 'book', 'Glosario'], ['challenges', 'goal', 'Retos'], ['settings', 'gear', 'Ajustes']];
    let body = '';
    if (tab === 'modules') {
      body = `<p class="muted mb-3">Ocho módulos cortos. Puedes hacerlos en orden o empezar por el que necesites.</p><div class="tp-mods">${C().modules.map((m, i) => {
        const done = ts.completed.includes(i), cur = ts.mode === 'guided' && ts.m === i;
        return `<div class="tp-mod ${done ? 'done' : ''} ${cur ? 'cur' : ''}"><span class="tp-ic">${done ? icon('check') : icon(m.icon)}</span><div class="flex-1"><div class="f6 muted">Módulo ${i + 1}</div><strong>${esc(m.title)}</strong>${cur ? '<div class="f6" style="color:var(--fgColor-accent)">En curso</div>' : ''}</div><button class="btn btn-sm ${!done && !cur ? 'btn-primary' : ''}" data-t="start-module" data-m="${i}">${done ? 'Repetir' : cur ? 'Reiniciar' : 'Empezar'}</button></div>`;
      }).join('')}</div>
      <div class="flex gap-2 mt-3">${ts.mode !== 'guided' ? `<button class="btn btn-primary" data-t="continue-guided">Continuar el recorrido</button>` : `<button class="btn" data-t="go-free">Pasar a exploración libre</button>`}<button class="btn btn-invisible" data-t="show-intro">Ver la bienvenida</button></div>`;
    } else if (tab === 'glossary') {
      body = `<div class="input-wrap mb-3">${icon('search')}<input class="form-control" id="tp-gq" placeholder="Buscar un término…" aria-label="Buscar en el glosario"></div><dl class="tp-gloss">${C().glossary.map(([k, t, d]) => `<div class="tp-term ${panelTerm === k ? 'hl' : ''}" id="term-${k}" data-k="${esc((t + ' ' + d).toLowerCase())}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
    } else if (tab === 'challenges') {
      body = `<p class="muted mb-3">Practica por tu cuenta. Cada reto se marca solo cuando lo logras.</p><ul class="tp-ch">${C().challenges.map(([t, d, f]) => { let ok = false; try { ok = f(); } catch (e) { /* */ } return `<li class="${ok ? 'ok' : ''}"><span class="tp-cb">${ok ? icon('check') : ''}</span><div><strong>${t}</strong><div class="muted f6">${d}</div></div></li>`; }).join('')}</ul>`;
    } else {
      body = `<h4 class="mb-2">Tus datos</h4><p class="muted f6 mb-3">Todo lo que haces se guarda solo en este navegador. Nada se envía a internet ni a GitHub.</p>
        <h4 class="mb-2">Empezar de cero</h4><p class="muted f6 mb-2">Borra tus repositorios de práctica y tu progreso.</p><button class="btn btn-danger" data-t="restart">${icon('sync')} Reiniciar todo</button>
        <h4 class="mb-2 mt-4">Acerca de</h4><p class="muted f6">Simulador educativo independiente. No está afiliado a GitHub, Inc. La interfaz se inspira en el sistema de diseño Primer (licencia MIT).</p>`;
    }
    els.panel.innerHTML = `<div class="tp-head"><strong class="flex-1">Ayuda</strong><button class="btn btn-invisible btn-sm btn-icon" data-t="panel-close" aria-label="Cerrar panel">${icon('x')}</button></div>
      <nav class="tp-tabs" role="tablist">${tabs.map(([id, ic, l]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'on' : ''}" data-t="panel-tab" data-tab="${id}">${icon(ic)}<span>${l}</span></button>`).join('')}</nav>
      <div class="tp-body">${body}</div>`;
    const gq = els.panel.querySelector('#tp-gq');
    if (gq) gq.addEventListener('input', () => { const q = gq.value.toLowerCase(); els.panel.querySelectorAll('.tp-term').forEach(x => { x.style.display = x.getAttribute('data-k').includes(q) ? '' : 'none'; }); });
    if (panelTerm) setTimeout(() => { const el = els.panel.querySelector('#term-' + panelTerm); if (el) el.scrollIntoView({ block: 'center' }); }, 30);
  }

  // ---------------- Confirm box ----------------
  let confirmFn = null;
  function confirmBox(title, text, yes, fn) {
    confirmFn = fn;
    const c = document.createElement('div'); c.className = 'tour-confirm';
    c.innerHTML = `<div class="ti-card" role="alertdialog" aria-modal="true" style="width:420px"><h2 style="font-size:20px">${title}</h2><p class="muted mt-2">${text}</p><div class="ti-foot"><span class="flex-1"></span><button class="btn" data-t="confirm-no">Cancelar</button><button class="btn btn-danger" data-t="confirm-yes">${yes}</button></div></div>`;
    layer().appendChild(c);
    setTimeout(() => c.querySelector('[data-t="confirm-no"]').focus(), 20);
  }
  function closeConfirm() { const c = layer().querySelector('.tour-confirm'); if (c) c.remove(); confirmFn = null; }

  tour.state = () => ts;
})(window.GH);
