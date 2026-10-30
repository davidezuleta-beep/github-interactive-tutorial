/* ✏️ ETIQUETAS DE GITHUB — fuente única de los nombres visibles de la interfaz.
 *
 * Si GitHub cambia el nombre de un botón, pestaña o sección, cámbialo SOLO aquí:
 *  - las pantallas simuladas (js/views-*.js, js/ui.js) lo leen como  L.clave
 *  - los globos, el glosario, los desafíos y la bienvenida (js/tour/content.js) lo escriben como  {{clave}}
 *  - los guiones de voz (js/tour/narration.js) también usan  {{clave}}; al cambiar la etiqueta,
 *    `node tools/voice.mjs status` mostrará qué audios hay que volver a grabar.
 *
 * Escribe el texto tal como aparece en GitHub (sin escapar: «&», no «&amp;»).
 * {user} se reemplaza por el argumento: {{addToRepo:carlos-demo}} → «Add carlos-demo to this repository».
 */
(function (GH) {
  'use strict';
  const L = GH.L = {
    // Pestañas del repositorio
    tabCode: 'Code',
    tabIssues: 'Issues',
    tabPulls: 'Pull requests',
    tabActions: 'Actions',
    tabProjects: 'Projects',
    tabWiki: 'Wiki',
    tabSecurity: 'Security and quality',
    tabInsights: 'Insights',
    tabSettings: 'Settings',

    // Inicio, navegación y creación de repositorios
    dashboard: 'Dashboard',
    home: 'Home',
    repositories: 'Repositories',
    profile: 'Profile',
    newRepo: 'New repository',
    createRepo: 'Create repository',
    repoName: 'Repository name',
    description: 'Description',
    owner: 'Owner',
    public: 'Public',
    private: 'Private',
    addReadme: 'Add README',

    // Página del repositorio y archivos
    watch: 'Watch',
    unwatch: 'Unwatch',
    fork: 'Fork',
    star: 'Star',
    starred: 'Starred',
    codeBtn: 'Code',
    addFile: 'Add file',
    uploadFiles: 'Upload files',
    createNewFile: 'Create new file',
    commitChanges: 'Commit changes',
    commitChangesDots: 'Commit changes...',
    extendedDesc: 'Extended description',
    preview: 'Preview',
    blame: 'Blame',
    commits: 'Commits',
    browseFiles: 'Browse files',
    verified: 'Verified',

    // Ramas
    branchFilter: 'Find or create a branch...',
    createBranch: 'Create branch',
    defaultLabel: 'default',
    viewAllBranches: 'View all branches',

    // Pull requests
    comparePr: 'Compare & pull request',
    createPr: 'Create pull request',
    ableToMerge: 'Able to merge',
    open: 'Open',
    merged: 'Merged',
    conversation: 'Conversation',
    checks: 'Checks',
    filesChanged: 'Files changed',
    mergePr: 'Merge pull request',
    confirmMerge: 'Confirm merge',
    deleteBranch: 'Delete branch',

    // Configuración, visibilidad y colaboradores
    general: 'General',
    dangerZone: 'Danger Zone',
    changeVisibility: 'Change visibility',
    iUnderstand: 'I have read and understand these effects',
    collaborators: 'Collaborators',
    addPeople: 'Add people',
    pendingInvite: 'Pending Invite',
    addToRepo: 'Add {user} to this repository',   // en los textos: {{addToRepo:carlos-demo}}

    // Roles (el valor guardado no cambia; esto es solo lo que se muestra)
    roleRead: 'Read',
    roleTriage: 'Triage',
    roleWrite: 'Write',
    roleMaintain: 'Maintain',
    roleAdmin: 'Admin'
  };

  const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const TOKEN = /\{\{(\w+)(?::([^}]*))?\}\}/g;
  const missing = new Set();
  const look = (k, arg) => {
    if (Object.prototype.hasOwnProperty.call(L, k)) return arg != null ? L[k].replace('{user}', arg) : L[k];
    if (!missing.has(k)) { missing.add(k); try { console.warn('[labels] Etiqueta desconocida: {{' + k + '}}'); } catch (e) { /* */ } }
    return '{{' + k + '}}';
  };

  GH.labels = {
    /** Reemplaza {{clave}} por la etiqueta (escapada para HTML). */
    html: (s) => typeof s === 'string' ? s.replace(TOKEN, (m, k, a) => escHtml(look(k, a))) : s,
    /** Reemplaza {{clave}} por la etiqueta en texto plano (para la voz). */
    text: (s) => typeof s === 'string' ? s.replace(TOKEN, (m, k, a) => look(k, a)) : s,
    /** Nombre visible de un rol guardado como 'Read' | 'Triage' | 'Write' | 'Maintain' | 'Admin'. */
    role: (r) => L['role' + r] || r,
    /** Recorre un objeto de contenido y resuelve {{clave}} en todos sus textos, también en los que devuelven funciones. */
    apply(obj) {
      const seen = new WeakSet();
      const walk = (v) => {
        if (typeof v === 'string') return GH.labels.html(v);
        if (typeof v === 'function') {
          const fn = v;
          const wrapped = function () { const r = fn.apply(this, arguments); return typeof r === 'string' ? GH.labels.html(r) : r; };
          return wrapped;
        }
        if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = walk(v[i]); return v; }
        if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
          if (seen.has(v)) return v; seen.add(v);
          for (const k of Object.keys(v)) v[k] = walk(v[k]);
        }
        return v;
      };
      return walk(obj);
    },
    missing: () => [...missing]
  };
})(window.GH);
