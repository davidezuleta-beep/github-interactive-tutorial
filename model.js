/* Browser-local domain model. It never calls a remote service. */
(function (G) {
  'use strict';
  const KEY = 'github-educativo-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const same = (a, b) => a === b;
  const id = () => { const values = new Uint32Array(1); crypto.getRandomValues(values); return values[0].toString(16).padStart(8, '0').slice(0, 7); };
  let state;
  let storageWarning = false;
  try { const raw = localStorage.getItem(KEY); state = raw ? JSON.parse(raw) : G.initialState(); if (state.version !== 1 || !Array.isArray(state.repos) || !state.learning) state = G.initialState(); }
  catch (_) { state = G.initialState(); storageWarning = true; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); storageWarning = false; return true; } catch (_) { storageWarning = true; return false; } }
  function error(message) { throw new Error(message); }
  function repo(repoId) { return state.repos.find(r => r.id === repoId); }
  function branch(r, name) { return r.branches[name || r.currentBranch]; }
  function validPath(path) { return typeof path === 'string' && path.length <= 180 && !path.startsWith('/') && !path.includes('\\') && !path.split('/').some(p => !p || p === '.' || p === '..' || ['__proto__', 'constructor', 'prototype'].includes(p)) && !/[\x00-\x1f<>:"|?*]/.test(path); }
  function changeList(a, b) { return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(p => !same(a[p], b[p])).sort(); }
  function commit(r, files, message, name) {
    if (!message || !message.trim()) error('Escribe un mensaje que explique qué cambió.');
    const b = branch(r, name); if (!b) error('No existe esa rama.');
    const paths = changeList(b.files, files); if (!paths.length) error('No hay cambios para guardar. Modifica al menos un archivo.');
    const c = {id: id(), message: message.trim().slice(0, 200), author: G.USER.login, date: new Date().toISOString(), files: clone(files), changes: paths};
    b.files = clone(files); b.commits.unshift(c); save(); return c;
  }
  function createRepo(name, description, visibility, readme) {
    name = name.trim(); if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(name)) error('Usa entre 1 y 100 caracteres: letras, números, guiones, puntos o guiones bajos. Empieza con una letra o número.');
    if (state.repos.some(r => r.owner === G.USER.login && r.name.toLowerCase() === name.toLowerCase())) error('Ya tienes un repositorio con ese nombre. Prueba otro.');
    const r = {id: id(), name, owner: G.USER.login, description: description.trim().slice(0, 350), visibility: visibility === 'private' ? 'private' : 'public', currentBranch: 'main', branches: {main: {files: {}, commits: [], forkPoint: {}}}, prs: [], issues: [], collaborators: [], star: false, watch: false, pinned: false, runs: []};
    state.repos.unshift(r); state.currentRepo = r.id;
    if (readme) commit(r, {'README.md': '# ' + name + '\n\n' + (r.description || 'Mi primer proyecto en GitHub.') + '\n'}, 'Initial commit');
    save(); return r;
  }
  function createBranch(r, name) {
    name = name.trim(); if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,79}$/.test(name) || name.includes('..') || name.includes('//') || name.endsWith('/') || name.endsWith('.') || name.endsWith('.lock') || ['__proto__', 'constructor', 'prototype'].includes(name)) error('Usa un nombre como mejora-bienvenida, sin espacios ni puntos consecutivos.');
    if (own(r.branches, name)) error('Esa rama ya existe. Selecciónala en el menú o escribe otro nombre.');
    const source = branch(r); r.branches[name] = {files: clone(source.files), commits: clone(source.commits), forkPoint: clone(source.files)}; r.currentBranch = name; save(); return name;
  }
  function switchBranch(r, name) { if (!own(r.branches, name)) error('No existe esa rama.'); r.currentBranch = name; save(); }
  function createPR(r, head, base, title, body) {
    if (!r.branches[head] || !r.branches[base] || head === base) error('Selecciona dos ramas diferentes.');
    if (!title.trim()) error('Agrega un título para tu propuesta.');
    if (!changeList(r.branches[base].files, r.branches[head].files).length) error('Las ramas tienen los mismos archivos. Primero guarda un cambio en tu rama.');
    if (r.prs.some(p => p.state === 'open' && p.head === head && p.base === base)) error('Ya hay un pull request abierto entre estas ramas.');
    const p = {id: r.issues.length + r.prs.length + 1, head, base, title: title.trim().slice(0, 200), body: body.trim(), author: G.USER.login, state: 'open', date: new Date().toISOString(), comments: [], ancestor: clone(r.branches[head].forkPoint)}; r.prs.push(p); save(); return p;
  }
  function mergePlan(r, p) {
    const source = r.branches[p.head].files, target = r.branches[p.base].files, ancestor = p.ancestor || {}, files = clone(target), conflicts = [];
    for (const path of changeList(ancestor, source)) {
      if (!same(target[path], ancestor[path]) && !same(target[path], source[path])) conflicts.push(path);
      else if (own(source, path)) files[path] = source[path]; else delete files[path];
    }
    return {files, conflicts};
  }
  function merge(r, p, resolutions = {}) {
    if (p.state !== 'open') error('Este pull request ya está cerrado.');
    const plan = mergePlan(r, p);
    for (const path of plan.conflicts) {
      if (!['head', 'base'].includes(resolutions[path])) error('Resuelve los conflictos antes de integrar.');
      const chosen = r.branches[resolutions[path] === 'head' ? p.head : p.base].files;
      if (own(chosen, path)) plan.files[path] = chosen[path]; else delete plan.files[path];
    }
    const b = r.branches[p.base], changes = changeList(b.files, plan.files);
    const c = {id: id(), message: 'Merge pull request #' + p.id + ' from ' + p.head, author: G.USER.login, date: new Date().toISOString(), files: clone(plan.files), changes, merge: true};
    const known = new Set(b.commits.map(c => c.id));
    b.commits = [c, ...r.branches[p.head].commits.filter(c => !known.has(c.id)), ...b.commits]; b.files = plan.files;
    p.state = 'merged'; p.mergedCommit = c.id; r.currentBranch = p.base;
    state.notifications.unshift('Pull request #' + p.id + ' integrado en ' + p.base + '.'); save(); return c;
  }
  function restore(commitRecord, r) { return commit(r, commitRecord.files, 'Restaurar versión ' + commitRecord.id); }
  function reset() { state = G.initialState(); state.welcomeSeen = true; save(); }
  G.Store = {get state() {return state;}, get storageWarning() {return storageWarning;}, KEY, clone, save, repo, branch, validPath, changeList, commit, createRepo, createBranch, switchBranch, createPR, mergePlan, merge, restore, reset};
})(window.GitSim);
