/*
 * GAMIFICACIÓN (diseñada por Biniac)
 * ----------------------------------
 * Puntos, niveles, insignias (premios), desafíos y misiones. Los valores y textos están en
 * GH.tourContent.game (js/tour/content.js). Este archivo calcula, guarda y muestra el progreso.
 * Todo se guarda solo en este navegador (localStorage «ghsim:game:v1»).
 */
(function (GH) {
  'use strict';
  const KEY = 'ghsim:game:v1';
  const C = () => GH.tourContent;
  const CFG = () => C().game;
  const TS = () => (GH.tour && GH.tour.state && GH.tour.state()) || { completed: [], mode: 'intro' };
  const icon = (n, s, c) => GH.icon(n, s, c);
  const esc = (s) => GH.esc(s);
  const V = () => GH.voice || { play() {}, has: () => false, isEnabled: () => false };

  function blank() { return { points: 0, steps: {}, modules: [], badges: [], challenges: [], terms: [], hinted: {}, cleanModules: 0, voiceModules: 0, run: {} }; }
  let g = Object.assign(blank(), GH.storage.get(KEY) || {});
  const save = () => GH.storage.set(KEY, g);

  function level(pts) {
    pts = pts == null ? g.points : pts;
    const L = CFG().levels; let i = 0;
    while (i + 1 < L.length && pts >= L[i + 1].min) i++;
    const cur = L[i], nxt = L[i + 1] || null;
    const pct = nxt ? Math.round(((pts - cur.min) / (nxt.min - cur.min)) * 100) : 100;
    return { n: i + 1, name: cur.name, icon: cur.icon, min: cur.min, next: nxt, pct: Math.max(0, Math.min(100, pct)) };
  }

  // ---------- Earning ----------
  function add(n) {
    const before = level().n;
    g.points += n; save();
    const after = level();
    fly(n);
    return after.n > before ? after : null;
  }
  function run(m) { g.run[m] = g.run[m] || { pts: 0, hints: 0 }; return g.run[m]; }

  const game = GH.game = {
    state: () => g,
    level: () => level(),
    reset() { g = blank(); save(); emit(); },
    moduleStart(m) { g.run[m] = { pts: 0, hints: 0 }; save(); },
    hint(m, s) { run(m).hints++; g.hinted[m + ':' + s] = 1; save(); },
    term(k) { if (k && !g.terms.includes(k)) { g.terms.push(k); save(); checkSpecial(); } },
    // A guided step was completed. Returns the points earned (0 if it was already counted).
    stepDone(m, s, st) {
      const key = m + ':' + s;
      if (g.steps[key]) return 0;
      const P = CFG().points;
      const interactive = st && st.advance && st.advance !== 'next';
      const n = P.step + (interactive && !g.hinted[key] ? P.firstTry : 0);
      g.steps[key] = n; run(m).pts += n;
      const up = add(n);
      if (up) levelUp(up, true);
      emit();
      return n;
    },
    // A mission (module) was completed. Returns what was earned so the completion card can show it.
    moduleComplete(m, opts) {
      opts = opts || {};
      const r = run(m); const res = { pts: r.pts, bonus: 0, badges: [], levelUp: null, first: !g.modules.includes(m) };
      if (res.first) {
        g.modules.push(m);
        res.bonus = CFG().points.module;
        if (r.hints === 0) g.cleanModules++;
        if (V().isEnabled()) g.voiceModules++;
        const before = level().n; g.points += res.bonus; save(); fly(res.bonus);
        const lv = level(); if (lv.n > before) res.levelUp = lv;
      }
      res.total = res.pts + res.bonus;
      CFG().badges.forEach(b => { if (b.module === m && !g.badges.includes(b.id)) { g.badges.push(b.id); res.badges.push(b); } });
      res.badges = res.badges.concat(checkSpecial(true));
      save();
      if (opts.toast) { res.badges.forEach(b => badgeToast(b)); if (res.levelUp) levelUp(res.levelUp); }
      emit();
      return res;
    },
    // Credits missions completed before gamification existed (silently, once).
    sync(ts) {
      let changed = false; const P = CFG().points;
      (ts.completed || []).forEach(m => {
        if (g.modules.includes(m) || !C().modules[m]) return;
        C().modules[m].steps.forEach((st, s) => { const k = m + ':' + s; if (!g.steps[k]) { g.steps[k] = P.step; g.points += P.step; } });
        g.modules.push(m); g.points += P.module;
        CFG().badges.forEach(b => { if (b.module === m && !g.badges.includes(b.id)) g.badges.push(b.id); });
        changed = true;
      });
      if (changed) { save(); checkSpecial(true); emit(); }
    },
    checkChallenges,
    challengeDone: (i) => g.challenges.includes(i),
    hudHTML, panelHTML, completionHTML, missionBanner, welcomeHTML,
    stepValue(m, s, st) { const P = CFG().points; return g.steps[m + ':' + s] ? 0 : P.step + (st && st.advance && st.advance !== 'next' ? P.firstTry : 0); }
  };

  function emit() { GH.bus.emit('game:changed'); }

  function checkSpecial(silent) {
    const lv = level(); const out = [];
    CFG().badges.forEach(b => {
      if (b.when && !g.badges.includes(b.id)) { let ok = false; try { ok = !!b.when(g, TS(), lv); } catch (e) { ok = false; } if (ok) { g.badges.push(b.id); out.push(b); } }
    });
    if (out.length) { save(); if (!silent) out.forEach(b => badgeToast(b)); emit(); }
    return out;
  }

  function checkChallenges() {
    const ts = TS(); if (!ts.introDone) return;
    let changed = false;
    C().challenges.forEach(([t], i) => {
      if (g.challenges.includes(i)) return;
      let ok = false; try { ok = !!C().challenges[i][2](); } catch (e) { ok = false; }
      if (ok) {
        g.challenges.push(i); changed = true; save();
        const up = add(CFG().points.challenge);
        rewardToast({ kicker: 'Desafío superado', title: t.replace(/\s*[⭐]+\s*/g, ' ').trim(), sub: `+${CFG().points.challenge} puntos`, icon: 'goal' });
        if (ts.mode !== 'guided' && V().has('challenge:0')) V().play('challenge:0');
        if (up) levelUp(up, ts.mode === 'guided');
      }
    });
    if (changed) { checkSpecial(); emit(); }
  }

  // ---------- Feedback (floating points, reward cards) ----------
  function layer() { return document.getElementById('tour-layer'); }
  function fly(n) {
    const L = layer(); if (!L || !n) return;
    const chip = L.querySelector('.td-xp');
    const f = document.createElement('span'); f.className = 'xp-fly'; f.textContent = '+' + n;
    if (chip) { const r = chip.getBoundingClientRect(); f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top - 4) + 'px'; } else { f.style.left = '120px'; f.style.bottom = '90px'; }
    L.appendChild(f); setTimeout(() => f.remove(), 1300);
    if (chip) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
  }
  function rewardToast(o) {
    const L = layer(); if (!L) return;
    let wrap = L.querySelector('.tour-rewards');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'tour-rewards'; wrap.setAttribute('aria-live', 'polite'); L.appendChild(wrap); }
    const c = document.createElement('div'); c.className = 'reward-card ' + (o.cls || '');
    c.innerHTML = `<span class="rw-ic">${icon(o.icon || 'trophy', 24)}</span><div class="flex-1"><div class="rw-k">${esc(o.kicker)}</div><div class="rw-t">${esc(o.title)}</div>${o.sub ? `<div class="rw-s">${esc(o.sub)}</div>` : ''}</div><button class="btn btn-invisible btn-sm btn-icon" aria-label="Cerrar">${icon('x')}</button>`;
    c.querySelector('button').addEventListener('click', () => c.remove());
    wrap.appendChild(c);
    while (wrap.children.length > 3) wrap.firstChild.remove();
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 4800);
  }
  function badgeToast(b) { rewardToast({ kicker: 'Nueva insignia', title: b.name, sub: b.desc, icon: b.icon, cls: 'badge' }); }
  function levelUp(lv, quiet) {
    rewardToast({ kicker: `¡Subiste al nivel ${lv.n}!`, title: lv.name, sub: lv.next ? `Siguiente nivel: ${lv.next.name} (${lv.next.min} pts)` : 'Llegaste al nivel máximo.', icon: lv.icon, cls: 'level' });
    if (!quiet && V().has('level:0')) V().play('level:0');
    checkSpecial();
  }

  // ---------- HTML helpers ----------
  function hudHTML() {
    const lv = level();
    return `<button class="td-xp" data-t="panel" data-tab="challenges" title="Tus logros: ${g.points} puntos · Nivel ${lv.n}, ${esc(lv.name)}" aria-label="Logros: ${g.points} puntos, nivel ${lv.n}">${icon('star-fill', 16)}<span class="td-xp-pts">${g.points}</span><span class="td-xp-lv">Nv ${lv.n}</span></button>`;
  }
  function missionBanner(m) {
    const ms = CFG().missions[m]; if (!ms) return '';
    return `<div class="tb-mission">${icon('north-star', 16)}<div><div class="tbm-k">Misión ${m + 1} de ${CFG().missions.length}</div><strong>${esc(ms.name)}</strong><span>${esc(ms.story)}</span></div></div>`;
  }
  function badgeHTML(b, on) {
    return `<div class="bdg ${on ? 'on' : ''}" title="${esc(b.name)}: ${esc(b.desc)}"><span class="bdg-ic">${icon(on ? b.icon : 'lock', on ? 24 : 16)}</span><strong>${esc(b.name)}</strong><span>${esc(b.desc)}</span></div>`;
  }
  function completionHTML(m, res) {
    const lv = level(); const next = CFG().missions[m + 1];
    return `<div class="tb-reward">
        <div class="tbr-pts">${icon('star-fill', 16)}<span><strong>+${res.total}</strong> puntos en esta misión${res.bonus ? ` <span class="muted">(incluye +${res.bonus} por completarla)</span>` : ''}</span></div>
        ${res.badges.map(b => `<div class="tbr-badge">${icon(b.icon, 24)}<div><div class="rw-k">Nueva insignia</div><strong>${esc(b.name)}</strong><span>${esc(b.desc)}</span></div></div>`).join('')}
        ${res.levelUp ? `<div class="tbr-level">${icon(res.levelUp.icon, 16)}<span>¡Subiste al <strong>nivel ${res.levelUp.n}: ${esc(res.levelUp.name)}</strong>!</span></div>` : ''}
        <div class="tbr-bar"><div class="flex"><span>Nivel ${lv.n} · ${esc(lv.name)}</span><span class="flex-1"></span><span class="muted">${g.points}${lv.next ? ' / ' + lv.next.min : ''} pts</span></div><div class="xp-bar"><i style="width:${lv.pct}%"></i></div></div>
        ${next ? `<div class="tbr-next">${icon('north-star', 16)}<span>Próxima misión: <strong>${esc(next.name)}</strong></span></div>` : ''}
      </div>`;
  }
  function panelHTML() {
    const lv = level(); const P = CFG().points; const ts = TS();
    const grad = g.badges.includes('b-grad');
    const user = GH.store.state.user;
    const chDone = C().challenges.filter((c, i) => g.challenges.includes(i)).length;
    return `<div class="ach-level">
        <div class="flex gap-3" style="align-items:center"><span class="ach-lv-ic">${icon(lv.icon, 24)}</span><div class="flex-1"><div class="f6 muted">Nivel ${lv.n} de ${CFG().levels.length}</div><strong class="f3">${esc(lv.name)}</strong></div><div class="ach-pts"><strong>${g.points}</strong><span>puntos</span></div></div>
        <div class="xp-bar mt-3"><i style="width:${lv.pct}%"></i></div>
        <div class="f6 muted mt-2">${lv.next ? `Te faltan <strong>${lv.next.min - g.points}</strong> puntos para <strong>${esc(lv.next.name)}</strong>.` : '¡Llegaste al nivel máximo!'}</div>
        <div class="ach-levels">${CFG().levels.map((l, i) => `<span class="${i < lv.n ? 'on' : ''}" title="${esc(l.name)} · ${l.min} pts">${icon(l.icon, 16)}</span>`).join('<i></i>')}</div>
      </div>
      <details class="ach-how"><summary>${icon('info')} Cómo ganar puntos</summary><ul>
        <li><span>+${P.step}</span> por cada paso del recorrido</li>
        <li><span>+${P.firstTry}</span> extra si lo logras a la primera, sin pistas</li>
        <li><span>+${P.module}</span> por cada misión completada</li>
        <li><span>+${P.challenge}</span> por cada desafío superado</li></ul></details>
      <h4 class="ach-h">${icon('goal')} Desafíos <span class="Counter">${chDone} / ${C().challenges.length}</span></h4>
      <p class="muted f6 mb-2">Practica por tu cuenta. Cada desafío se marca solo cuando lo logras.</p>
      <ul class="tp-ch">${C().challenges.map(([t, d], i) => { const ok = g.challenges.includes(i); return `<li class="${ok ? 'ok' : ''}"><span class="tp-cb">${ok ? icon('check') : ''}</span><div class="flex-1"><strong>${t}</strong><div class="muted f6">${d}</div></div><span class="ch-pts">+${P.challenge}</span></li>`; }).join('')}</ul>
      <h4 class="ach-h">${icon('trophy')} Insignias <span class="Counter">${g.badges.length} / ${CFG().badges.length}</span></h4>
      <div class="bdg-grid">${CFG().badges.map(b => badgeHTML(b, g.badges.includes(b.id))).join('')}</div>
      <h4 class="ach-h">${icon('mortar-board')} Premio final</h4>
      <div class="diploma ${grad ? 'on' : ''}">
        <div class="dp-top"><img src="${GH.brandLogo}" alt="Biniac" width="40" height="40"><div><div class="dp-k">Reconocimiento de práctica</div><strong>Ruta de aprendizaje de GitHub</strong></div></div>
        ${grad ? `<p class="dp-name">${esc(user.name || user.login)}</p><p class="muted f6">completó las ${C().modules.length} misiones del simulador de GitHub con <strong>${g.points} puntos</strong> · Nivel ${lv.n}: ${esc(lv.name)}.</p><p class="dp-foot">Diseñado por Biniac · ${new Date().toLocaleDateString('es')}</p>`
        : `<p class="muted f6">${icon('lock', 12)} Se desbloquea al completar las ${C().modules.length} misiones. Llevas ${ts.completed.length}.</p>`}
      </div>`;
  }
  function welcomeHTML() {
    const P = CFG().points; const L = CFG().levels;
    const hasV = V().has('welcome:0');
    return `<div class="ti-card gw-card" role="dialog" aria-modal="true" aria-labelledby="gw-title">
      <div class="gw-brand"><img src="${GH.brandLogo}" alt="Biniac" width="44" height="44"><div><div class="gw-k">Una experiencia diseñada por Biniac</div><div class="gw-sub">Aprende GitHub jugando, con una guía que te habla</div></div></div>
      <h2 id="gw-title">Antes de empezar: así funciona esta experiencia</h2>
      <div class="gw-voice">
        <span class="gw-ic">${icon('unmute', 24)}</span>
        <div class="flex-1"><strong>1. Tiene voz: sube el volumen</strong><span>${esc(CFG().guide)}, tu guía, te hablará en cada paso. Usa audífonos o altavoces. Puedes pausarla o apagarla con el botón <b>Voz</b>.</span></div>
        ${hasV ? `<button class="btn btn-sm gw-test" data-t="welcome-voice">${icon('play')} Probar el sonido</button>` : ''}
      </div>
      <div class="gw-game">
        <div class="gw-row"><span class="gw-ic">${icon('trophy', 24)}</span><div><strong>2. Es un juego con misiones</strong><span>${CFG().story}</span></div></div>
        <div class="gw-grid">
          <div class="gw-item"><span class="gw-i">${icon('star', 24)}</span><strong>Puntos</strong><span>+${P.step} por paso, +${P.firstTry} si lo logras a la primera, +${P.module} por misión y +${P.challenge} por desafío.</span></div>
          <div class="gw-item"><span class="gw-i">${icon('north-star', 24)}</span><strong>Misiones</strong><span>${C().modules.length} misiones cortas que cuentan una historia: de visitante a parte del equipo.</span></div>
          <div class="gw-item"><span class="gw-i">${icon('trophy', 24)}</span><strong>Niveles e insignias</strong><span>${L.length} niveles, de ${esc(L[0].name)} a ${esc(L[L.length - 1].name)}, y ${CFG().badges.length} insignias para coleccionar.</span></div>
          <div class="gw-item"><span class="gw-i">${icon('goal', 24)}</span><strong>Desafíos y premio</strong><span>${C().challenges.length} desafíos para practicar solo/a y un reconocimiento final de Biniac.</span></div>
        </div>
      </div>
      <p class="gw-note">${icon('star-fill', 12)} Tus puntos aparecen abajo a la izquierda, en la barra. Púlsalos para ver tus logros.</p>
      <div class="ti-foot"><span class="muted f6">Todo ocurre en tu navegador. No necesitas cuenta.</span><span class="flex-1"></span><button class="btn btn-primary btn-lg" data-t="welcome-go">${icon('rocket')} ¡Acepto la misión!</button></div>
    </div>`;
  }

  // Challenges are checked whenever the simulated state changes.
  GH.bus.on('state:changed', () => setTimeout(checkChallenges, 50));
  GH.bus.on('route', () => setTimeout(checkChallenges, 80));
})(window.GH);
