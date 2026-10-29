/* Simulated GitHub data store. Everything lives in memory (and optionally in this browser's localStorage). */
(function (GH) {
  'use strict';
  const KEY = 'ghsim:state:v1';
  const DAY = 86400000, HOUR = 3600000, MIN = 60000;

  function file(content, commit, extra) { return Object.assign({ content: content, commit: commit, size: content == null ? 0 : new Blob([content]).size }, extra || {}); }

  // ---------- Seed data (fictional) ----------
  function seed(login, name) {
    const t = Date.now();
    const st = {
      version: 1,
      user: { login: login || 'aprendiz', name: name || 'Aprendiz', bio: 'Aprendiendo GitHub paso a paso.' },
      people: {
        'comunidad-demo': { login: 'comunidad-demo', name: 'Comunidad Demo', org: true, bio: 'Organización ficticia para practicar.' },
        'carlos-demo': { login: 'carlos-demo', name: 'Carlos Demo' },
        'ana-demo': { login: 'ana-demo', name: 'Ana Demo' },
        'lucia-demo': { login: 'lucia-demo', name: 'Lucía Demo' },
        'equipo-diseno': { login: 'equipo-diseno', name: 'Equipo Diseño (demo)' }
      },
      repos: {},
      notifications: [],
      tutorial: {}
    };

    // Public sample repository: a community recipe book
    const r = {
      owner: 'comunidad-demo', name: 'recetas-familiares',
      description: 'Recetario colaborativo: recetas de nuestras familias, probadas y comentadas.',
      visibility: 'public', defaultBranch: 'main', createdAt: t - 220 * DAY,
      stars: 128, watchers: 12, forks: 34, starred: false, watching: false,
      topics: ['recetas', 'cocina', 'colaborativo'], features: { issues: true, wiki: true, projects: true, discussions: false },
      collaborators: [], commits: {}, branches: {}, pulls: [], issues: [], nextNumber: 1
    };
    const c1 = GH.sha(), c2 = GH.sha(), c3 = GH.sha(), c4 = GH.sha(), c5 = GH.sha(), c6 = GH.sha();
    const README = `# Recetas familiares\n\nBienvenido a nuestro **recetario colaborativo**. Aquí guardamos las recetas de nuestras familias para que nunca se pierdan.\n\n## ¿Cómo está organizado?\n\n- \`postres/\`: dulces y tortas.\n- \`platos-fuertes/\`: almuerzos y cenas.\n- \`lista-de-compras.md\`: ingredientes que usamos seguido.\n\n## ¿Cómo participar?\n\n1. Propón una receta nueva con un *pull request*.\n2. Si encuentras un error, abre un *issue* para contarnos.\n3. Todas las recetas deben indicar porciones y tiempo de preparación.\n\n> "La cocina de la abuela, ahora con historial de versiones."\n`;
    const ARROZ = `# Arroz con leche\n\n**Porciones:** 6  \n**Tiempo:** 45 minutos\n\n## Ingredientes\n\n- 1 taza de arroz\n- 1 litro de leche\n- 1 taza de azúcar\n- 2 astillas de canela\n- Cáscara de 1 limón\n- Una pizca de sal\n\n## Preparación\n\n1. Remoja el arroz 20 minutos y escúrrelo.\n2. Cocina el arroz con 2 tazas de agua, la canela y la cáscara de limón.\n3. Cuando el agua se consuma, agrega la leche y cocina a fuego bajo.\n4. Añade el azúcar y revuelve hasta que espese.\n5. Sirve frío o caliente, con canela en polvo.\n`;
    const TORTA = `# Torta de banano\n\n**Porciones:** 10  \n**Tiempo:** 1 hora\n\n## Ingredientes\n\n- 3 bananos maduros\n- 2 huevos\n- 1/2 taza de mantequilla\n- 1 taza de azúcar\n- 2 tazas de harina\n- 1 cucharadita de polvo de hornear\n\n## Preparación\n\n1. Precalienta el horno a 180 °C.\n2. Tritura los bananos y mézclalos con la mantequilla y el azúcar.\n3. Agrega los huevos y luego la harina con el polvo de hornear.\n4. Hornea 45 minutos.\n`;
    const AJIACO = `# Ajiaco\n\n**Porciones:** 8  \n**Tiempo:** 1 hora 30 minutos\n\n## Ingredientes\n\n- 1 pechuga de pollo\n- 1 kg de papa criolla\n- 1/2 kg de papa sabanera\n- 3 mazorcas\n- Guascas al gusto\n- Crema de leche y alcaparras para servir\n\n## Preparación\n\n1. Cocina el pollo con las mazorcas en agua con sal.\n2. Agrega las papas y deja que la criolla se deshaga.\n3. Desmecha el pollo y regrésalo a la olla con las guascas.\n4. Sirve con crema, alcaparras y aguacate.\n`;
    const SANCOCHO = `# Sancocho\n\n**Porciones:** 8  \n**Tiempo:** 2 horas\n\n## Ingredientes\n\n- 1 kg de costilla de res\n- 2 plátanos verdes\n- 1 kg de yuca\n- 3 mazorcas\n- Cilantro\n\n## Preparación\n\n1. Cocina la carne en abundante agua.\n2. Agrega el plátano, la yuca y la mazorca.\n3. Cocina hasta que todo esté blando y sirve con cilantro.\n`;
    const COMPRAS = `# Lista de compras frecuente\n\n- [x] Arroz\n- [x] Leche\n- [ ] Canela\n- [ ] Papa criolla\n- [ ] Guascas\n- [ ] Plátano verde\n`;
    const EMPANADAS = `# Empanadas\n\n**Porciones:** 20  \n**Tiempo:** 2 horas\n\n## Ingredientes\n\n- 2 tazas de harina de maíz precocida\n- 1/2 kg de carne molida\n- 4 papas\n- Hogao\n\n## Preparación\n\n1. Prepara la masa con agua tibia y sal.\n2. Mezcla la carne cocida con la papa y el hogao.\n3. Rellena, cierra con un tenedor y fríe.\n`;
    r.commits[c1] = { sha: c1, message: 'Initial commit', description: '', author: 'lucia-demo', date: t - 220 * DAY, parents: [], changes: [{ path: 'README.md', before: null, after: '# Recetas familiares\n' }] };
    r.commits[c2] = { sha: c2, message: 'Agrego las primeras recetas de postres', description: '', author: 'lucia-demo', date: t - 180 * DAY, parents: [c1], changes: [{ path: 'postres/arroz-con-leche.md', before: null, after: ARROZ }, { path: 'postres/torta-de-banano.md', before: null, after: TORTA }] };
    r.commits[c3] = { sha: c3, message: 'Agrego ajiaco y sancocho', description: 'Recetas de la familia de Carlos.', author: 'carlos-demo', date: t - 95 * DAY, parents: [c2], changes: [{ path: 'platos-fuertes/ajiaco.md', before: null, after: AJIACO }, { path: 'platos-fuertes/sancocho.md', before: null, after: SANCOCHO }] };
    r.commits[c4] = { sha: c4, message: 'Creo la lista de compras', description: '', author: 'ana-demo', date: t - 40 * DAY, parents: [c3], changes: [{ path: 'lista-de-compras.md', before: null, after: COMPRAS }] };
    r.commits[c5] = { sha: c5, message: 'Actualizo el README con instrucciones para participar', description: '', author: 'lucia-demo', date: t - 3 * DAY, parents: [c4], changes: [{ path: 'README.md', before: '# Recetas familiares\n', after: README }] };
    r.commits[c6] = { sha: c6, message: 'Agrego receta de empanadas', description: '', author: 'ana-demo', date: t - 1 * DAY, parents: [c5], changes: [{ path: 'platos-fuertes/empanadas.md', before: null, after: EMPANADAS }] };
    const mainFiles = {
      'README.md': file(README, c5),
      'postres/arroz-con-leche.md': file(ARROZ, c2),
      'postres/torta-de-banano.md': file(TORTA, c2),
      'platos-fuertes/ajiaco.md': file(AJIACO, c3),
      'platos-fuertes/sancocho.md': file(SANCOCHO, c3),
      'lista-de-compras.md': file(COMPRAS, c4)
    };
    r.branches.main = { name: 'main', head: c5, files: mainFiles, createdAt: r.createdAt };
    const nf = GH.clone(mainFiles); nf['platos-fuertes/empanadas.md'] = file(EMPANADAS, c6);
    r.branches['nuevas-recetas'] = { name: 'nuevas-recetas', head: c6, files: nf, createdAt: t - 2 * DAY, base: c5 };
    r.pulls.push({ number: 3, title: 'Agrego receta de empanadas', body: 'Receta de empanadas de mi abuela. ¿Alguien puede revisar las cantidades?', base: 'main', head: 'nuevas-recetas', author: 'ana-demo', state: 'open', createdAt: t - 20 * HOUR, comments: [{ author: 'carlos-demo', body: '¡Se ve deliciosa! Yo agregaría cuánto hogao usar.', date: t - 10 * HOUR }], events: [] });
    r.issues.push({ number: 1, title: 'Agregar receta de arepas', body: 'Nos falta una receta básica de arepas. ¿Quién se anima?', author: 'carlos-demo', state: 'open', createdAt: t - 30 * DAY, comments: [], labels: ['receta nueva'] });
    r.issues.push({ number: 2, title: 'Revisar las cantidades del ajiaco', body: 'Creo que 1 kg de papa criolla es mucho para 8 porciones.', author: 'ana-demo', state: 'open', createdAt: t - 6 * DAY, comments: [{ author: 'lucia-demo', body: 'Lo pruebo este fin de semana y les cuento.', date: t - 5 * DAY }], labels: ['corrección'] });
    r.nextNumber = 4;
    st.repos['comunidad-demo/recetas-familiares'] = r;

    // Second public repo (for search variety)
    const g = GH.sha();
    const GUIA = `# Guía de bienvenida\n\nDocumentos para las personas que llegan a la comunidad.\n\n- Normas de convivencia\n- Calendario de encuentros\n- Contactos útiles\n`;
    st.repos['comunidad-demo/guia-de-bienvenida'] = {
      owner: 'comunidad-demo', name: 'guia-de-bienvenida', description: 'Documentos para nuevas personas en la comunidad.',
      visibility: 'public', defaultBranch: 'main', createdAt: t - 60 * DAY, stars: 9, watchers: 3, forks: 1, starred: false, watching: false,
      topics: [], features: { issues: true, wiki: false, projects: true, discussions: false }, collaborators: [],
      commits: { [g]: { sha: g, message: 'Initial commit', description: '', author: 'lucia-demo', date: t - 60 * DAY, parents: [], changes: [{ path: 'README.md', before: null, after: GUIA }] } },
      branches: { main: { name: 'main', head: g, files: { 'README.md': file(GUIA, g) }, createdAt: t - 60 * DAY } },
      pulls: [], issues: [], nextNumber: 1
    };

    // Private repo the learner has NO access to (used to show the 404 behaviour)
    const p = GH.sha();
    st.repos['comunidad-demo/presupuesto-2027'] = {
      owner: 'comunidad-demo', name: 'presupuesto-2027', description: 'Presupuesto interno (privado).',
      visibility: 'private', defaultBranch: 'main', createdAt: t - 10 * DAY, stars: 0, watchers: 2, forks: 0, starred: false, watching: false,
      topics: [], features: { issues: true, wiki: false, projects: true, discussions: false }, collaborators: [],
      commits: { [p]: { sha: p, message: 'Initial commit', description: '', author: 'lucia-demo', date: t - 10 * DAY, parents: [], changes: [] } },
      branches: { main: { name: 'main', head: p, files: { 'README.md': file('# Presupuesto 2027\n', p) }, createdAt: t - 10 * DAY } },
      pulls: [], issues: [], nextNumber: 1
    };
    return st;
  }

  const store = GH.store = {
    state: null,
    init() {
      const saved = GH.storage.get(KEY);
      this.state = saved && saved.version === 1 ? saved : seed();
    },
    save() { GH.storage.set(KEY, this.state); GH.bus.emit('state:changed'); },
    reset(login, name) { this.state = seed(login, name); this.save(); },
    snapshot() { return GH.clone(this.state); },
    restore(snap) { this.state = GH.clone(snap); this.save(); },
    me() { return this.state.user.login; },
    person(login) { return this.state.people[login] || (login === this.me() ? { login, name: this.state.user.name } : { login, name: login }); },
    setUser(login, name) {
      const old = this.me();
      if (login === old) { this.state.user.name = name; this.save(); return; }
      // rename owner of own repos
      const repos = {};
      Object.values(this.state.repos).forEach(r => {
        if (r.owner === old) r.owner = login;
        Object.values(r.commits).forEach(c => { if (c.author === old) c.author = login; });
        r.pulls.forEach(pr => { if (pr.author === old) pr.author = login; (pr.comments || []).forEach(cm => { if (cm.author === old) cm.author = login; }); });
        r.issues.forEach(is => { if (is.author === old) is.author = login; });
        repos[r.owner + '/' + r.name] = r;
      });
      this.state.repos = repos;
      if (this.state.tutorial.repo && this.state.tutorial.repo.startsWith(old + '/')) this.state.tutorial.repo = login + this.state.tutorial.repo.slice(old.length);
      this.state.user.login = login; this.state.user.name = name;
      this.save();
    },

    // ---------- Repos ----------
    key(r) { return r.owner + '/' + r.name; },
    raw(owner, name) { return this.state.repos[owner + '/' + name] || null; },
    canView(r) { return !!r && (r.visibility === 'public' || r.owner === this.me() || r.collaborators.some(c => c.login === this.me() && c.status === 'active')); },
    isAdmin(r) { return !!r && r.owner === this.me(); },
    get(owner, name) { const r = this.raw(owner, name); return this.canView(r) ? r : null; },
    reposOf(owner) { return Object.values(this.state.repos).filter(r => r.owner === owner && this.canView(r)).sort((a, b) => this.pushedAt(b) - this.pushedAt(a)); },
    myRepos() { return this.reposOf(this.me()); },
    visibleRepos() { return Object.values(this.state.repos).filter(r => this.canView(r)); },
    pushedAt(r) { return Math.max(...Object.values(r.commits).map(c => c.date), r.createdAt); },

    createRepo(o) {
      const me = this.me();
      const name = GH.slug(o.name);
      if (!name) throw new Error('Repository name is required');
      if (this.raw(me, name)) throw new Error('Name already exists on this account');
      const t = Date.now();
      const r = {
        owner: me, name, description: o.description || '', visibility: o.visibility || 'public', defaultBranch: 'main', createdAt: t,
        stars: 0, watchers: 1, forks: 0, starred: false, watching: true, topics: [], features: { issues: true, wiki: true, projects: true, discussions: false },
        collaborators: [], commits: {}, branches: {}, pulls: [], issues: [], nextNumber: 1
      };
      this.state.repos[me + '/' + name] = r;
      const files = [];
      if (o.readme) files.push({ path: 'README.md', content: `# ${name}\n${o.description ? '\n' + o.description + '\n' : ''}` });
      if (o.gitignore) files.push({ path: '.gitignore', content: '# Archivos que Git debe ignorar\n.DS_Store\nnode_modules/\n' });
      if (o.license) files.push({ path: 'LICENSE', content: 'MIT License\n\nCopyright (c) ' + new Date().getFullYear() + ' ' + me + '\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software...\n' });
      if (files.length) {
        r.branches.main = { name: 'main', head: null, files: {}, createdAt: t };
        this._commit(r, 'main', files, 'Initial commit', '');
      }
      this.save();
      return r;
    },
    rename(r, newName) {
      newName = GH.slug(newName);
      if (!newName || newName === r.name) return r;
      if (this.raw(r.owner, newName)) throw new Error('exists');
      const oldKey = this.key(r);
      delete this.state.repos[oldKey];
      r.name = newName;
      this.state.repos[this.key(r)] = r;
      if (this.state.tutorial.repo === oldKey) this.state.tutorial.repo = this.key(r);
      this.save();
      return r;
    },
    deleteRepo(r) { delete this.state.repos[this.key(r)]; if (this.state.tutorial.repo === this.key(r)) delete this.state.tutorial.repo; this.save(); },
    setVisibility(r, v) { r.visibility = v; this.save(); GH.bus.emit('repo:visibility', { repo: r, visibility: v }); },
    toggleStar(r) { r.starred = !r.starred; r.stars += r.starred ? 1 : -1; this.save(); GH.bus.emit('repo:star', r); },
    toggleWatch(r) { r.watching = !r.watching; r.watchers += r.watching ? 1 : -1; this.save(); },
    fork(r) {
      const me = this.me();
      let name = r.name, i = 1;
      while (this.raw(me, name)) name = r.name + '-' + (i++);
      const f = GH.clone(r);
      Object.assign(f, { owner: me, name, stars: 0, watchers: 1, forks: 0, starred: false, watching: true, pulls: [], issues: [], nextNumber: 1, collaborators: [], forkOf: this.key(r), visibility: 'public', createdAt: Date.now() });
      this.state.repos[me + '/' + name] = f;
      r.forks += 1;
      this.save();
      GH.bus.emit('repo:forked', f);
      return f;
    },

    // ---------- Files & commits ----------
    branch(r, b) {
      if (r.branches[b]) return r.branches[b];
      const c = this.commitByPrefix(r, b);
      return c ? { name: b, head: c.sha, files: this.filesAtCommit(r, c.sha), virtual: true } : null;
    },
    commitByPrefix(r, s) {
      if (!s || s.length < 7 || !/^[0-9a-f]+$/.test(s)) return null;
      return r.commits[s] || Object.values(r.commits).find(c => c.sha.startsWith(s)) || null;
    },
    // Rebuild the file tree as it was at a given commit (replays first-parent history).
    filesAtCommit(r, sha) {
      const chain = []; let cur = r.commits[sha];
      while (cur) { chain.push(cur); cur = r.commits[cur.parents[0]]; }
      const files = {};
      chain.reverse().forEach(c => c.changes.forEach(ch => {
        if (ch.deleted || (ch.after == null && !ch.binary)) delete files[ch.path];
        else files[ch.path] = file(ch.binary ? null : ch.after, c.sha, ch.binary ? { binary: true, size: ch.size || 0 } : null);
      }));
      return files;
    },
    branchNames(r) { const names = Object.keys(r.branches); return names.sort((a, b) => (a === r.defaultBranch ? -1 : b === r.defaultBranch ? 1 : a.localeCompare(b))); },
    files(r, b) { const br = this.branch(r, b); return br ? br.files : {}; },
    fileAt(r, b, path) { return this.files(r, b)[path] || null; },
    isDir(r, b, path) { if (!path) return true; const pre = path.replace(/\/$/, '') + '/'; return Object.keys(this.files(r, b)).some(p => p.startsWith(pre)); },
    tree(r, b, dir) {
      const files = this.files(r, b);
      const pre = dir ? dir.replace(/\/$/, '') + '/' : '';
      const entries = {};
      Object.keys(files).forEach(p => {
        if (!p.startsWith(pre)) return;
        const rest = p.slice(pre.length);
        const parts = rest.split('/');
        const name = parts[0];
        const isDir = parts.length > 1;
        const full = pre + name;
        const commit = r.commits[files[p].commit];
        const e = entries[name] || (entries[name] = { name, path: full, type: isDir ? 'dir' : 'file', commit });
        if (isDir) e.type = 'dir';
        if (commit && (!e.commit || commit.date > e.commit.date)) e.commit = commit;
      });
      return Object.values(entries).sort((a, b2) => (a.type !== b2.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b2.name, undefined, { sensitivity: 'base' })));
    },
    _commit(r, b, changes, message, description, extra) {
      const br = r.branches[b];
      const sha = GH.sha();
      const recorded = [];
      changes.forEach(ch => {
        const prev = br.files[ch.path];
        const before = prev ? (prev.binary ? null : prev.content) : null;
        if (ch.content === null && !ch.binary) {
          if (prev) { delete br.files[ch.path]; recorded.push({ path: ch.path, before, after: null, binaryBefore: !!(prev && prev.binary), deleted: true }); }
          return;
        }
        br.files[ch.path] = file(ch.binary ? null : ch.content, sha, ch.binary ? { binary: true, size: ch.size || 0, mime: ch.mime || '' } : null);
        recorded.push({ path: ch.path, before, after: ch.binary ? null : ch.content, binary: !!ch.binary, size: ch.size, isNew: !prev });
      });
      const c = Object.assign({ sha, message: message || 'Update files', description: description || '', author: this.me(), date: Date.now(), parents: br.head ? [br.head] : [], changes: recorded }, extra || {});
      r.commits[sha] = c;
      br.head = sha;
      return c;
    },
    commit(r, b, changes, message, description) {
      if (!r.branches[b]) { r.branches[b] = { name: b, head: null, files: {}, createdAt: Date.now() }; }
      const c = this._commit(r, b, changes, message, description);
      this.save();
      GH.bus.emit('commit:created', { repo: r, branch: b, commit: c });
      return c;
    },
    history(r, b) {
      const br = this.branch(r, b); if (!br || !br.head) return [];
      const seen = new Set(), out = [], stack = [br.head];
      while (stack.length) { const s = stack.pop(); if (!s || seen.has(s)) continue; seen.add(s); const c = r.commits[s]; if (!c) continue; out.push(c); c.parents.forEach(p => stack.push(p)); }
      return out.sort((a, c) => c.date - a.date);
    },
    reachable(r, head) { const seen = new Set(), stack = [head]; while (stack.length) { const s = stack.pop(); if (!s || seen.has(s)) continue; seen.add(s); const c = r.commits[s]; if (c) c.parents.forEach(p => stack.push(p)); } return seen; },
    ahead(r, base, head) {
      const bb = this.branch(r, base), hb = this.branch(r, head);
      if (!bb || !hb) return [];
      const inBase = this.reachable(r, bb.head);
      return [...this.reachable(r, hb.head)].filter(s => !inBase.has(s)).map(s => r.commits[s]).filter(Boolean).sort((a, c) => a.date - c.date);
    },
    behind(r, base, head) { return this.ahead(r, head, base); },
    changedBetween(r, base, head) {
      const commits = this.ahead(r, base, head);
      const paths = new Set(); commits.forEach(c => c.changes.forEach(ch => paths.add(ch.path)));
      const bf = this.files(r, base), hf = this.files(r, head);
      return [...paths].sort().map(p => {
        const a = bf[p], h = hf[p];
        return { path: p, before: a ? (a.binary ? null : a.content) : null, after: h ? (h.binary ? null : h.content) : null, binary: !!((a && a.binary) || (h && h.binary)), exists: !!h, existed: !!a, size: h ? h.size : 0 };
      }).filter(x => x.binary ? (x.exists !== x.existed || true) : x.before !== x.after);
    },
    createBranch(r, name, from) {
      name = name.trim().replace(/\s+/g, '-');
      if (!name || r.branches[name]) throw new Error('invalid');
      const src = r.branches[from || r.defaultBranch];
      r.branches[name] = { name, head: src.head, files: GH.clone(src.files), createdAt: Date.now(), base: src.head, from: src.name };
      this.save();
      GH.bus.emit('branch:created', { repo: r, branch: name });
      return r.branches[name];
    },
    deleteBranch(r, name) {
      if (name === r.defaultBranch) return;
      delete r.branches[name];
      r.pulls.forEach(p => { if (p.head === name) p.headDeleted = true; });
      this.save();
      GH.bus.emit('branch:deleted', { repo: r, branch: name });
    },

    // ---------- Pull requests ----------
    openPullFor(r, head) { return r.pulls.find(p => p.head === head && p.state === 'open'); },
    pull(r, n) { return r.pulls.find(p => p.number === +n) || null; },
    createPull(r, o) {
      const pr = { number: r.nextNumber++, title: o.title, body: o.body || '', base: o.base, head: o.head, author: this.me(), state: 'open', createdAt: Date.now(), comments: [], events: [], commits: this.ahead(r, o.base, o.head).map(c => c.sha) };
      r.pulls.push(pr);
      this.save();
      GH.bus.emit('pr:created', { repo: r, pr });
      return pr;
    },
    pullCommits(r, pr) {
      if (pr.state === 'merged' || pr.headDeleted) return (pr.commits || []).map(s => r.commits[s]).filter(Boolean);
      return this.ahead(r, pr.base, pr.head);
    },
    pullFiles(r, pr) {
      if (pr.state === 'merged' && pr.mergedFiles) return pr.mergedFiles;
      if (!r.branches[pr.head]) return pr.mergedFiles || [];
      return this.changedBetween(r, pr.base, pr.head);
    },
    mergePull(r, pr, title, desc) {
      const files = this.changedBetween(r, pr.base, pr.head);
      const head = r.branches[pr.head], base = r.branches[pr.base];
      const commits = this.ahead(r, pr.base, pr.head).map(c => c.sha);
      const sha = GH.sha();
      const recorded = [];
      files.forEach(f => {
        const hf = head.files[f.path];
        const prev = base.files[f.path];
        if (hf) base.files[f.path] = Object.assign(GH.clone(hf), { commit: sha }); else delete base.files[f.path];
        recorded.push({ path: f.path, before: prev ? (prev.binary ? null : prev.content) : null, after: hf ? (hf.binary ? null : hf.content) : null, binary: f.binary, isNew: !prev, deleted: !hf });
      });
      const c = { sha, message: title || `Merge pull request #${pr.number} from ${r.owner}/${pr.head}`, description: desc || pr.title, author: this.me(), date: Date.now(), parents: [base.head, head.head], changes: recorded, merge: true };
      r.commits[sha] = c;
      base.head = sha;
      // keep head branch pointing to same files; mark PR merged
      pr.state = 'merged'; pr.mergedAt = Date.now(); pr.mergedBy = this.me(); pr.mergeCommit = sha; pr.commits = commits; pr.mergedFiles = files;
      this.save();
      GH.bus.emit('pr:merged', { repo: r, pr });
      return c;
    },
    closePull(r, pr) { pr.state = 'closed'; pr.closedAt = Date.now(); this.save(); GH.bus.emit('pr:closed', { repo: r, pr }); },
    reopenPull(r, pr) { pr.state = 'open'; delete pr.closedAt; this.save(); },
    comment(target, body) { target.comments = target.comments || []; target.comments.push({ author: this.me(), body, date: Date.now() }); this.save(); GH.bus.emit('comment:created', target); },

    // ---------- Issues ----------
    issue(r, n) { return r.issues.find(i => i.number === +n) || null; },
    createIssue(r, title, body) {
      const is = { number: r.nextNumber++, title, body: body || '', author: this.me(), state: 'open', createdAt: Date.now(), comments: [], labels: [] };
      r.issues.push(is); this.save(); GH.bus.emit('issue:created', { repo: r, issue: is }); return is;
    },
    setIssueState(r, is, state) { is.state = state; if (state === 'closed') is.closedAt = Date.now(); this.save(); GH.bus.emit('issue:' + state, { repo: r, issue: is }); },

    // ---------- Access ----------
    addCollaborator(r, login, role) {
      if (r.collaborators.some(c => c.login === login)) return;
      r.collaborators.push({ login, role: role || 'Write', status: 'pending', invitedAt: Date.now() });
      this.save(); GH.bus.emit('collaborator:added', { repo: r, login });
    },
    removeCollaborator(r, login) { r.collaborators = r.collaborators.filter(c => c.login !== login); this.save(); GH.bus.emit('collaborator:removed', { repo: r, login }); },
    setCollaboratorRole(r, login, role) { const c = r.collaborators.find(x => x.login === login); if (c) { c.role = role; this.save(); } },

    // ---------- Tutorial helpers ----------
    tutorialRepo() {
      const k = this.state.tutorial.repo;
      const r = k && this.state.repos[k];
      if (r && r.owner === this.me()) return r;
      return this.myRepos()[0] || null;
    }
  };
})(window.GH);
