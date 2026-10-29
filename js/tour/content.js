/*
 * CONTENIDO DEL RECORRIDO EDUCATIVO
 * ---------------------------------
 * Aquí se definen la bienvenida, los 8 módulos, sus pasos, el glosario y los retos.
 * Para cambiar textos o agregar pasos solo necesitas editar este archivo.
 *
 * Campos de un paso:
 *   title      Título del globo.
 *   body       Texto (HTML). Puede ser una función que recibe el contexto (ctx) y devuelve texto.
 *   target     Selector CSS del elemento a resaltar (usa T('nombre') para [data-tour="nombre"]).
 *              Sin target, el globo aparece centrado.
 *   click      Selector que se debe pulsar (si es distinto de target).
 *   advance    'next'                 → botón «Continuar».
 *              'click'                → avanza al pulsar el elemento resaltado.
 *              { event: 'nombre' }    → avanza cuando el simulador emite ese evento.
 *              { route: /regex/ }     → avanza cuando la dirección coincide.
 *              { check: fn, auto }    → «Continuar» se habilita cuando fn() es verdadero (auto = avanza solo).
 *   route      (opcional) Regex extra para avanzar por navegación, combinable con 'click'.
 *   allow      Selectores adicionales donde se permite hacer clic. '*' = permitir todo.
 *   hint       Pista que aparece si la persona hace clic en otro lugar.
 *   transient  true si el elemento vive en un menú/ventana temporal (al retroceder se salta).
 *   actions    Botones extra: [{ label, run(ctx) }].
 *   skipIf     fn(ctx) → true para saltar el paso.
 *   placement  'bottom' | 'top' | 'right' | 'left' | 'center' | 'corner'.
 */
(function (GH) {
  'use strict';
  const T = (n) => `[data-tour="${n}"]`;
  const S = () => GH.store;
  const term = (key, label) => `<button class="tb-term" data-term="${key}">${label}</button>`;
  const typeInto = (sel, text, append) => {
    const el = document.querySelector(sel); if (!el) return;
    el.focus();
    el.value = append ? el.value.replace(/\s*$/, '') + text : text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // ---------- Contexto y preparación ----------
  const ctx = {
    repo: () => S().tutorialRepo(),
    repoHash: () => { const r = ctx.repo(); return r ? `#/${r.owner}/${r.name}` : '#/'; },
    repoName: () => { const r = ctx.repo(); return r ? r.name : 'mi-primer-proyecto'; },
    full: () => { const r = ctx.repo(); return r ? `${r.owner}/${r.name}` : ''; },
    branch: () => S().state.tutorial.branch || 'mejoras-readme',
    vis: () => { const r = ctx.repo(); return r ? r.visibility : 'public'; }
  };
  function uniqueName(base) { let n = base, i = 2; while (S().raw(S().me(), n)) n = base + '-' + (i++); return n; }
  function ensureRepo() {
    let r = ctx.repo();
    if (!r) {
      r = S().createRepo({ name: uniqueName('mi-primer-proyecto'), description: 'Mi primer proyecto para aprender GitHub', visibility: 'public', readme: true });
      S().state.tutorial.repo = S().key(r); S().save();
    }
    if (!r.branches[r.defaultBranch] || !S().fileAt(r, r.defaultBranch, 'README.md')) {
      S().commit(r, r.defaultBranch, [{ path: 'README.md', content: `# ${r.name}\n\n${r.description || 'Mi primer proyecto.'}\n` }], 'Create README.md', '');
    }
    return r;
  }
  function ensureBranchWithChange() {
    const r = ensureRepo();
    const b = S().state.tutorial.branch;
    const ok = b && r.branches[b] && S().ahead(r, r.defaultBranch, b).length && !r.pulls.some(p => p.head === b && p.state !== 'closed');
    if (ok) return r;
    let name = 'mejoras-readme', i = 2; while (r.branches[name]) name = 'mejoras-readme-' + (i++);
    S().createBranch(r, name, r.defaultBranch);
    const f = S().fileAt(r, name, 'README.md');
    S().commit(r, name, [{ path: 'README.md', content: f.content.replace(/\s*$/, '\n') + '\nEste proyecto lo trabajamos en equipo.\n' }], 'Update README.md', '');
    S().state.tutorial.branch = name; S().save();
    return r;
  }

  // ---------- Bienvenida ----------
  const intro = [
    {
      icon: 'mortar-board', title: '¡Bienvenido a tu práctica de GitHub!',
      body: `<p>GitHub es un lugar en internet donde personas y equipos <strong>guardan sus proyectos</strong>, ven <strong>cómo cambian</strong> con el tiempo y <strong>trabajan juntos</strong> sin pisarse.</p>
        <div class="intro-cards">
          <div class="intro-card"><span class="ic" style="background:#1f6feb">${GH.icon('file-directory', 24)}</span><strong>Una carpeta en la nube</strong><span>Como Google Drive o OneDrive, pero pensada para proyectos.</span></div>
          <div class="intro-card"><span class="ic" style="background:#8957e5">${GH.icon('history', 24)}</span><strong>Con máquina del tiempo</strong><span>Guarda cada versión: puedes ver qué cambió, quién y cuándo.</span></div>
          <div class="intro-card"><span class="ic" style="background:#238636">${GH.icon('people', 24)}</span><strong>Y un sistema de propuestas</strong><span>Cada quien sugiere cambios y el equipo decide qué se integra.</span></div>
        </div>`
    },
    {
      icon: 'rocket', title: '¿Quién lo usa y para qué?',
      body: `<p>Más de cien millones de personas usan GitHub. Aunque nació para programadores, hoy también lo usan equipos que escriben documentos, manuales, políticas, investigaciones o páginas web.</p>
        <ul class="intro-list">
          <li>${GH.icon('book')} <span><strong>Documentación compartida</strong>: manuales y guías que todo el equipo mantiene al día.</span></li>
          <li>${GH.icon('browser')} <span><strong>Páginas web</strong>: GitHub puede publicar un sitio gratis (¡este simulador está publicado así!).</span></li>
          <li>${GH.icon('code')} <span><strong>Software</strong>: desde apps pequeñas hasta proyectos con miles de personas.</span></li>
          <li>${GH.icon('copilot')} <span><strong>Proyectos con IA</strong>: muchas herramientas de IA guardan y comparten su trabajo aquí.</span></li>
        </ul>
        <p class="muted">No necesitas saber programar para entender cómo funciona.</p>`
    },
    {
      icon: 'shield-check', title: 'Cómo funciona este simulador',
      body: `<p>Lo que verás es una <strong>réplica de la interfaz de GitHub</strong> en un entorno seguro: no usa cuentas, contraseñas ni proyectos reales. Todo ocurre en tu navegador y puedes equivocarte sin miedo.</p>
        <ul class="intro-list">
          <li>${GH.icon('light-bulb')} <span>Una guía te mostrará cada paso con un <strong>globo</strong> y un <strong>resaltado azul</strong>.</span></li>
          <li>${GH.icon('globe')} <span>La interfaz está en <strong>inglés</strong>, como el GitHub real. Te traduciré lo importante.</span></li>
          <li>${GH.icon('arrow-left')} <span>Puedes <strong>retroceder</strong>, <strong>repetir</strong> o <strong>reiniciar</strong> desde la barra inferior.</span></li>
        </ul>
        <label class="form-label mt-3" for="intro-name">¿Cómo te llamas? <span class="muted" style="font-weight:400">(opcional, para personalizar tu cuenta de práctica)</span></label>
        <input class="form-control" id="intro-name" placeholder="Ej.: Laura Gómez" autocomplete="off" maxlength="40">
        <p class="form-hint" id="intro-login-hint">Tu usuario de práctica será <strong>aprendiz</strong>.</p>`
    }
  ];

  // ---------- Módulos ----------
  const modules = [
    {
      id: 'm1', title: 'Bienvenido a GitHub', short: 'Inicio', icon: 'home',
      learn: ['Reconoces el Dashboard, tu página de inicio.', 'Sabes usar el buscador y el menú principal ≡.', 'Encontraste el botón + y tu perfil.'],
      prepare() { GH.router.go('#/'); },
      steps: [
        { title: 'Este es tu Dashboard', body: 'El <strong>Dashboard</strong> (tablero) es lo primero que ves al entrar a GitHub. Desde aquí llegas a tus proyectos y ves la actividad reciente.<br><br>Vamos a recorrer sus partes principales.', advance: 'next' },
        { title: 'El buscador', target: T('header-search'), body: 'Con la <strong>lupa</strong> buscas proyectos y personas en todo GitHub, o saltas directo a tus repositorios.<br><br>👉 Haz clic en la lupa.', advance: 'click', hint: 'Busca la lupa en la esquina superior derecha.' },
        { title: 'Buscar o saltar a…', target: T('palette'), transient: true, body: 'Aquí escribes lo que buscas y debajo aparecen sugerencias. La usaremos en el Módulo 3.<br><br>👉 Por ahora ciérrala con la tecla <kbd>Esc</kbd> o con la <strong>×</strong>.', advance: { event: 'palette:closed' }, allow: '*', placement: 'bottom' },
        { title: 'El menú principal', target: T('header-menu'), body: 'Las <strong>tres rayitas (≡)</strong> abren la navegación con todas las secciones de GitHub.<br><br>👉 Haz clic para abrirlo.', advance: 'click', hint: 'Es el botón con tres rayitas, arriba a la izquierda.' },
        { title: 'Las secciones de GitHub', target: T('drawer'), transient: true, placement: 'right', body: '<strong>Home</strong> te trae al inicio. <strong>Issues</strong> reúne tareas y reportes. <strong>Pull requests</strong> reúne propuestas de cambio. <strong>Repositories</strong> lista tus proyectos.<br><br>👉 Cierra el menú con la <strong>×</strong>.', advance: { event: 'drawer:closed' }, allow: [T('drawer-close'), '.drawer-backdrop'], hint: 'Cierra el menú con la × de la parte superior.' },
        { title: 'Tus repositorios', target: T('top-repos'), placement: 'right', body: () => S().myRepos().length ? 'En esta columna aparecen tus proyectos más usados para abrirlos con un clic.' : 'En esta columna aparecerán tus proyectos más usados. Ahora está vacía porque todavía no tienes ninguno: en el Módulo 2 crearás el primero.', advance: 'next' },
        { title: 'Crear algo nuevo', target: T('header-create'), body: 'El botón <strong>+</strong> sirve para crear cosas nuevas: repositorios, issues, proyectos… Lo usaremos en el siguiente módulo.', advance: 'next' },
        { title: 'Atajos rápidos', target: T('header-shortcuts'), body: 'Estos íconos te llevan a: tus <strong>issues</strong> (tareas), tus <strong>pull requests</strong> (propuestas), tus <strong>repositorios</strong> y tu <strong>bandeja</strong> de notificaciones.', advance: 'next' },
        { title: 'Tu cuenta', target: T('header-avatar'), body: 'Este círculo es tu foto de perfil (en el simulador es un dibujo generado).<br><br>👉 Haz clic para abrir el menú de tu cuenta.', advance: 'click', hint: 'Es el círculo de la esquina superior derecha.' },
        { title: 'El menú de tu cuenta', target: T('menu-profile'), transient: true, placement: 'left', body: 'Desde aquí llegas a tu perfil, tus repositorios y tus estrellas.<br><br>👉 Haz clic en <strong>Profile</strong> (perfil).', advance: 'click', route: /^#\/[^/?]+$/ },
        { title: 'Tu perfil público', target: T('profile-main'), placement: 'corner', body: 'Esto es lo que otras personas ven de ti: tu nombre, tus repositorios y un calendario que se pinta de verde cada día que guardas cambios.<br><br>Tu nombre de usuario también forma parte de la dirección de tus proyectos: <code>github.com/' + '<span data-me></span>/…</code>', advance: 'next' }
      ]
    },
    {
      id: 'm2', title: '¿Qué es un repositorio?', short: 'Repositorio', icon: 'repo',
      learn: ['Un repositorio es la carpeta de un proyecto con todo su historial.', 'Creaste uno con nombre, descripción, visibilidad y README.', 'Tu repositorio aparece en tu listado.'],
      prepare() { if (GH.resetNewRepoForm) GH.resetNewRepoForm(); GH.router.go('#/'); },
      steps: [
        { title: '¿Qué es un repositorio?', body: `Un ${term('repositorio', 'repositorio')} (o «repo») es la carpeta de un proyecto que guarda sus archivos <em>y toda su historia</em>.<br><br>Piensa en una carpeta compartida que, además, recuerda cada versión de cada archivo y quién la cambió. Puede contener un manual, una presentación, una página web o un recetario.`, advance: 'next' },
        { title: 'Empieza con el botón +', target: T('header-create'), body: '👉 Haz clic en <strong>+</strong> para crear algo nuevo.', advance: 'click', hint: 'El botón + está arriba a la derecha, junto a la lupa.' },
        { title: 'Nuevo repositorio', target: T('menu-new-repo'), transient: true, placement: 'left', body: '👉 Elige <strong>New repository</strong> (nuevo repositorio).', advance: 'click', route: /^#\/new$/ },
        {
          title: 'Ponle nombre', target: T('nr-name'), body: 'Escribe un nombre corto y sin espacios, por ejemplo <code>mi-primer-proyecto</code>. Si usas espacios, GitHub los cambia por guiones.<br><br>Debajo verás si el nombre está disponible.',
          advance: { check: () => { const b = document.querySelector(T('nr-create')); return b && !b.disabled; } }, allow: ['[data-action="nrSuggest"]'],
          actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('nr-name'), uniqueName('mi-primer-proyecto')) }], hint: 'Escribe el nombre en la casilla «Repository name».'
        },
        { title: 'Describe tu proyecto', target: T('nr-desc'), body: 'La descripción es opcional, pero una frase ayuda a otras personas a entender de qué se trata.<br><br>Ejemplo: <em>Mi primer proyecto para aprender GitHub</em>.', advance: 'next', actions: [{ label: 'Escribirla por mí', run: () => typeInto(T('nr-desc'), 'Mi primer proyecto para aprender GitHub') }] },
        { title: '¿Público o privado?', target: T('nr-visibility'), body: '<strong>Public</strong> (público): cualquiera en internet puede verlo, pero solo tú decides quién lo modifica.<br><strong>Private</strong> (privado): solo tú y las personas que invites.<br><br>Elige el que prefieras con el botón de la derecha; podrás cambiarlo después.', advance: 'next', allow: [T('nr-vis-btn'), T('nr-vis-menu')] },
        { title: 'Agrega un README', target: T('nr-readme-toggle'), body: `El ${term('readme', 'README')} es la portada del proyecto: un texto que explica qué es y cómo usarlo. Siempre es buena idea tener uno.<br><br>👉 Activa el interruptor <strong>Add README</strong>.`, advance: { check: () => { const t = document.querySelector(T('nr-readme-toggle')); return t && t.getAttribute('aria-checked') === 'true'; }, auto: true }, hint: 'Activa el interruptor que dice Off, junto a «Add README».' },
        { title: '¡A crearlo!', target: T('nr-create'), body: '👉 Haz clic en <strong>Create repository</strong> (crear repositorio).', advance: { event: 'repo:created' }, hint: 'El botón verde está abajo a la derecha.' },
        { title: '¡Tu repositorio existe! 🎉', target: T('readme'), body: () => `Esta es la página principal de <strong>${ctx.repoName()}</strong>. Arriba está la lista de archivos (por ahora solo <code>README.md</code>) y aquí abajo se muestra su contenido.`, advance: 'next', placement: 'top' },
        { title: 'Público o privado, a la vista', target: T('repo-title'), body: () => `La etiqueta junto al nombre indica la visibilidad: <strong>${ctx.vis() === 'private' ? 'Private' : 'Public'}</strong>. A la derecha están <strong>Watch</strong> (seguir novedades), <strong>Fork</strong> (copiar) y <strong>Star</strong> (marcar como favorito).`, advance: 'next' },
        { title: 'Vuelve al inicio', target: T('header-logo'), body: '👉 Haz clic en el logo para volver a tu Dashboard.', advance: 'click', route: /^#\/?$/ },
        { title: 'Ahí está tu proyecto', target: T('top-repos'), placement: 'right', body: () => `Tu nuevo repositorio <strong>${ctx.repoName()}</strong> ya aparece en tu lista. Así siempre lo encontrarás.`, advance: 'next' }
      ]
    },
    {
      id: 'm3', title: 'Explorar un proyecto', short: 'Explorar', icon: 'telescope',
      learn: ['Buscaste y abriste un proyecto de otras personas.', 'Navegaste carpetas, archivos y el README.', 'Copiaste la URL con el botón Code.', 'Un repositorio privado no se puede abrir sin permiso, aunque tengas el enlace.'],
      prepare() { GH.router.go('#/'); },
      steps: [
        { title: 'Vamos de visita', body: 'Ahora explorarás el proyecto de otras personas: un <strong>recetario</strong> que una comunidad construye entre todos. Primero hay que encontrarlo.', advance: 'next' },
        { title: 'Abre el buscador', target: T('header-search'), body: '👉 Haz clic en la lupa.', advance: 'click', hint: 'La lupa está arriba a la derecha.' },
        { title: 'Escribe «recetas»', target: T('palette-input'), transient: true, body: '👉 Escribe <strong>recetas</strong> en la caja de búsqueda.', advance: { check: () => !!document.querySelector(T('palette-repo-recetas-familiares')) && /rec/i.test((document.querySelector(T('palette-input')) || {}).value || ''), auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('palette-input'), 'recetas') }], hint: 'Escribe en la caja que dice «Search or jump to…».' },
        { title: 'Ábrelo', target: T('palette-repo-recetas-familiares'), transient: true, body: '👉 Haz clic en <strong>comunidad-demo/recetas-familiares</strong>.', advance: 'click', route: /recetas-familiares\/?$/ },
        { title: 'La página del proyecto', target: T('repo-title'), body: 'Su nombre completo es <strong>comunidad-demo/recetas-familiares</strong>: primero va el <em>dueño</em> (aquí, una organización) y luego el nombre del repositorio.', advance: 'next' },
        { title: 'Las pestañas', target: T('repo-tabs'), body: '<strong>Code</strong>: los archivos. <strong>Issues</strong>: tareas, ideas o problemas reportados. <strong>Pull requests</strong>: propuestas de cambio. <strong>Actions</strong>: automatizaciones. <strong>Insights</strong>: estadísticas.<br><br>¿Notas que no aparece <strong>Settings</strong>? Solo lo ven quienes administran el proyecto.', advance: 'next' },
        { title: 'Carpetas y archivos', target: T('file-table'), body: 'Las carpetas agrupan archivos, como en tu computador. En cada fila ves el mensaje del último cambio y hace cuánto se hizo.', advance: 'next', placement: 'top' },
        { title: 'Abre una carpeta', target: T('file-postres'), body: '👉 Abre la carpeta <strong>postres</strong>.', advance: 'click', route: /tree\/main\/postres$/ },
        { title: '¿Dónde estoy?', target: T('breadcrumb'), body: 'Esta ruta te dice dónde estás: <strong>recetas-familiares / postres</strong>. Puedes hacer clic en cualquier parte de ella para regresar.', advance: 'next' },
        { title: 'Abre un archivo', target: T('file-arroz-con-leche.md'), body: '👉 Abre la receta <strong>arroz-con-leche.md</strong>.', advance: 'click', route: /blob\/main\/postres\/arroz-con-leche\.md$/ },
        { title: 'Vista previa y texto original', target: T('blob-modes'), body: '<strong>Preview</strong> muestra el archivo con formato. <strong>Code</strong> muestra el texto tal como está escrito.<br><br>👉 Haz clic en <strong>Code</strong>.', advance: 'click', click: T('mode-code'), allow: [T('mode-preview'), T('mode-blame')] },
        { title: 'El texto «crudo»', target: T('blob-code'), placement: 'corner', body: `Los símbolos <code>#</code> y <code>-</code> dan formato (títulos y listas). Ese estilo de escritura se llama ${term('markdown', 'Markdown')}. Las líneas están numeradas para ubicarlas fácilmente.`, advance: 'next' },
        { title: 'Regresa al inicio del proyecto', target: T('crumb-root'), body: '👉 Haz clic en <strong>recetas-familiares</strong> para volver a la página principal del repositorio.', advance: 'click', route: /recetas-familiares\/tree\/main$/ },
        { title: 'El README', target: T('readme'), placement: 'top', body: 'El README aparece automáticamente debajo de los archivos: es la portada que explica el proyecto y cómo participar.', advance: 'next' },
        { title: 'El botón Code', target: T('code-btn'), body: 'El botón verde <strong>Code</strong> reúne las formas de descargar o conectar el proyecto.<br><br>👉 Haz clic en él.', advance: 'click', hint: 'Es el botón verde que dice Code.' },
        { title: 'Copia la dirección', target: T('clone-url'), click: T('clone-copy'), transient: true, placement: 'left', body: 'Esta es la dirección (URL) del repositorio.<br><br>👉 Haz clic en el ícono de <strong>copiar</strong> que está a la derecha.', advance: { event: 'copied' } },
        { title: 'Compartir el enlace', target: T('repo-title'), prepare: () => GH.ui.closeMenus(), body: 'Para compartir el proyecto, envía su dirección web: <code>https://github.com/comunidad-demo/recetas-familiares</code> (la misma que copiaste, sin el «.git» del final).<br><br>Como este repositorio es <strong>público</strong>, cualquiera con el enlace puede verlo.', advance: 'next' },
        { title: '¿Y si es privado?', body: 'Un repositorio privado solo lo ven las personas con permiso, <strong>aunque tengan el enlace</strong>.<br><br>Esta comunidad tiene uno privado: <code>comunidad-demo/presupuesto-2027</code>. Imagina que alguien te envió su enlace y ábrelo.', actions: [{ label: 'Abrir el enlace privado', primary: true, run: () => GH.router.go('#/comunidad-demo/presupuesto-2027') }], advance: { route: /presupuesto-2027/ } },
        { title: 'Error 404: no encontrado', target: T('not-found'), placement: 'corner', body: 'GitHub responde «no encontrado» y ni siquiera confirma que el proyecto existe. Así protege la información privada.<br><br>Para entrar, el dueño debe invitarte como colaborador. Lo harás tú mismo en el Módulo 7.', advance: 'next' }
      ]
    },
    {
      id: 'm4', title: 'Subir archivos y commits', short: 'Commits', icon: 'git-commit',
      learn: ['Subiste archivos con Add file → Upload files.', 'Un commit es un guardado con mensaje: qué cambió, quién y cuándo.', 'El historial conserva todas las versiones.'],
      prepare() { ensureRepo(); GH.router.go(ctx.repoHash()); },
      steps: [
        { title: '¿Qué es un commit?', body: `Un ${term('commit', 'commit')} es un «guardado con nota»: GitHub registra <strong>qué cambió</strong>, <strong>quién</strong>, <strong>cuándo</strong> y un <strong>mensaje</strong> que lo explica.<br><br>Es como tomarle una foto al proyecto: después puedes volver a cualquier foto anterior.`, advance: 'next' },
        { title: 'Agregar archivos', target: `${T('add-file-btn')}, ${T('empty-upload')}`, body: '👉 Haz clic en <strong>+</strong> (Add file) para agregar archivos a tu repositorio.', advance: 'click', route: /\/upload\//, hint: 'Es el botón + junto al botón verde Code.' },
        { title: 'Subir archivos', target: T('menu-upload'), transient: true, skipIf: () => /\/upload\//.test(location.hash), placement: 'left', body: '👉 Elige <strong>Upload files</strong> (subir archivos).', advance: 'click', route: /\/upload\// },
        { title: 'Elige qué subir', target: T('dropzone'), body: 'Normalmente arrastras archivos aquí o usas «choose your files». Para practicar, usa nuestros archivos de ejemplo: un plan de trabajo, un presupuesto y una imagen.<br><br><span class="muted">También puedes elegir archivos tuyos: nunca salen de tu computador.</span>', actions: [{ label: 'Usar archivos de ejemplo', primary: true, run: () => GH.addSampleUploads() }], advance: { event: 'upload:files-added' }, allow: [T('choose-files')] },
        { title: 'Listos para subir', target: T('upload-list'), body: 'Estos son los archivos que se agregarán. Si te equivocaste, puedes quitar uno con la <strong>×</strong>.', advance: { check: () => !!document.querySelector(T('upload-list')) }, allow: ['[data-action="upRemove"]'] },
        { title: 'Escribe el mensaje del commit', target: T('upload-msg'), body: 'Explica en pocas palabras qué estás guardando. Por ejemplo: <code>Agrego plan de trabajo y presupuesto</code>.<br><br>Un buen mensaje ayuda a tu equipo (y a ti en el futuro) a entender el historial.', advance: { check: () => ((document.querySelector(T('upload-msg')) || {}).value || '').trim().length > 2 }, allow: [T('upload-commit-box') + ' textarea'], actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('upload-msg'), 'Agrego plan de trabajo y presupuesto') }], hint: 'Escribe el mensaje en la casilla «Add files via upload».' },
        { title: '¿Dónde se guarda?', target: T('upload-target'), body: '«Commit directly to the <strong>main</strong> branch» guarda los cambios directamente en la versión principal del proyecto. En el Módulo 5 conocerás la otra opción.', advance: 'next' },
        { title: 'Guarda los cambios', target: T('upload-commit'), body: '👉 Haz clic en <strong>Commit changes</strong>.', advance: { event: 'commit:created' } },
        { title: '¡Archivos subidos!', target: T('file-table'), placement: 'top', body: 'Tus archivos ya están en el repositorio (los nuevos se resaltan un momento en verde). La barra de arriba muestra tu commit: tu usuario y tu mensaje.', advance: 'next' },
        { title: 'Ver el historial', target: T('history-link'), body: '👉 Haz clic en el <strong>reloj</strong> (Commits) para ver el historial.', advance: 'click', route: /\/commits\// },
        { title: 'El historial de versiones', target: T('commit-list'), placement: 'corner', body: 'Cada tarjeta es un commit, del más reciente al más antiguo. Abajo está «Initial commit», el que creó el repositorio con su README.', advance: 'next' },
        { title: 'Abre tu commit', target: T('commit-first-link'), body: '👉 Haz clic en el mensaje de tu commit (el de arriba).', advance: 'click', route: /\/commit\// },
        { title: '¿Qué cambió exactamente?', target: T('commit-diff'), placement: 'corner', body: 'Las líneas con fondo <span class="tb-add">verde</span> se agregaron; las <span class="tb-del">rojas</span> se eliminaron. Esta comparación se llama <em>diff</em> y permite revisar un cambio línea por línea.', advance: 'next' },
        { title: 'Viajar en el tiempo', target: T('browse-files'), body: 'Con <strong>Browse files</strong> ves el proyecto exactamente como estaba en ese commit. Por eso nada se pierde: cada versión queda guardada.', advance: 'next' }
      ]
    },
    {
      id: 'm5', title: 'Comprender las ramas', short: 'Ramas', icon: 'git-branch',
      learn: ['Una rama es una copia paralela para trabajar sin afectar main.', 'Creaste una rama y cambiaste entre ramas.', 'Los cambios en una rama no alteran las demás.'],
      prepare() { const r = ensureRepo(); GH.router.go(`#/${r.owner}/${r.name}/tree/${r.defaultBranch}`); },
      steps: [
        { title: '¿Qué es una rama?', body: `Una ${term('rama', 'rama')} (<em>branch</em>) es una copia paralela del proyecto donde haces cambios sin tocar la versión principal, llamada ${term('main', 'main')}.<br><br>Es como duplicar un documento para escribir un borrador: el original sigue intacto hasta que decidas unirlos.`, advance: 'next' },
        { title: 'El selector de ramas', target: T('branch-btn'), body: 'Este botón indica en qué rama estás: <strong>main</strong>.<br><br>👉 Haz clic en él.', advance: 'click' },
        { title: 'Crea tu rama', target: T('branch-filter'), transient: true, placement: 'right', body: '👉 Escribe el nombre de tu nueva rama, por ejemplo <code>mejoras-readme</code>.', advance: { check: () => !!document.querySelector(T('create-branch-item')), auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('branch-filter'), 'mejoras-readme') }] },
        { title: 'Confírmalo', target: T('create-branch-item'), transient: true, placement: 'right', body: '👉 Haz clic en <strong>Create branch … from main</strong>.', advance: { event: 'branch:created' } },
        { title: 'Ya estás en tu rama', target: T('branch-btn'), body: () => `El botón ahora dice <strong>${ctx.branch()}</strong>. Todo lo que cambies aquí no afectará a main.`, advance: 'next' },
        { title: 'Edita el README', target: T('readme-edit'), body: '👉 Haz clic en el <strong>lápiz</strong> para editar el README.', advance: 'click', route: /\/edit\// },
        { title: 'Escribe tu cambio', target: T('editor-textarea'), placement: 'corner', body: 'Agrega una línea al final, por ejemplo:<br><code>Este proyecto lo trabajamos en equipo.</code>', advance: { check: () => { const e = GH.editorState(); return e && e.content.trim() !== e.original.trim(); } }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('editor-textarea'), '\n\nEste proyecto lo trabajamos en equipo.\n', true) }], hint: 'Haz clic dentro del cuadro de texto y escribe al final.' },
        { title: 'Guarda en tu rama', target: T('editor-commit'), body: '👉 Haz clic en <strong>Commit changes...</strong>.', advance: 'click' },
        { title: 'Confirma el commit', target: T('commit-dialog'), click: T('cd-commit'), transient: true, placement: 'left', body: () => `GitHub propone el mensaje «Update README.md»; puedes dejarlo o mejorarlo. Fíjate que dice «Commit directly to the <strong>${ctx.branch()}</strong> branch»: el cambio queda solo en tu rama.<br><br>👉 Haz clic en <strong>Commit changes</strong>.`, advance: { event: 'commit:created' }, allow: [T('cd-msg'), T('cd-desc')] },
        { title: 'Tu cambio, en tu rama', target: T('blob-preview'), placement: 'corner', body: () => `Así se ve el README en la rama <strong>${ctx.branch()}</strong>, con tu línea nueva al final.`, advance: 'next' },
        { title: 'Vuelve a main', target: T('branch-btn'), body: '👉 Abre otra vez el selector de ramas.', advance: 'click' },
        { title: 'Elige main', target: T('branch-item-main'), transient: true, placement: 'right', body: '👉 Haz clic en <strong>main</strong>.', advance: 'click', route: /blob\/main\/README\.md$|tree\/main$/ },
        { title: 'main no cambió', target: T('blob-preview'), placement: 'corner', body: 'En <strong>main</strong> el README sigue igual: tu cambio vive solo en tu rama. Cada rama es independiente hasta que decidas unirlas… que es justo lo que harás en el próximo módulo.', advance: 'next' }
      ]
    },
    {
      id: 'm6', title: 'Pull requests y merge', short: 'Pull requests', icon: 'git-pull-request',
      learn: ['Un pull request propone integrar los cambios de una rama.', 'Revisaste las diferencias en Files changed.', 'Hiciste merge: los cambios llegaron a main.'],
      prepare() { const r = ensureBranchWithChange(); GH.router.go(`#/${r.owner}/${r.name}`); },
      steps: [
        { title: '¿Qué es un pull request?', body: `Un ${term('pullrequest', 'pull request')} (PR) es una propuesta: «hice estos cambios en mi rama, ¿los revisamos antes de unirlos a main?». El equipo puede comentar y revisar.<br><br>Unir los cambios se llama ${term('merge', 'merge')}.`, advance: 'next' },
        { title: 'GitHub te lo sugiere', target: T('compare-pr-btn'), body: () => `GitHub detectó cambios recientes en <strong>${ctx.branch()}</strong>.<br><br>👉 Haz clic en <strong>Compare &amp; pull request</strong>.`, advance: 'click', route: /\/compare\// },
        { title: 'La dirección importa', target: T('compare-range'), body: () => `<strong>base: main ← compare: ${ctx.branch()}</strong> significa: llevar los cambios <em>de tu rama</em> hacia <em>main</em>.<br><br>«<span class="color-success">Able to merge</span>» indica que no hay conflictos.`, advance: 'next' },
        { title: 'Un título claro', target: T('pr-title'), body: 'El título viene del último commit. Puedes mejorarlo para que se entienda la propuesta, por ejemplo: <code>Presento al equipo en el README</code>.', advance: { check: () => ((document.querySelector(T('pr-title')) || {}).value || '').trim().length > 0 } },
        { title: 'Explica tu propuesta', target: T('pr-body'), body: 'Cuenta qué cambiaste y por qué. Así quien revisa entiende el contexto.', advance: 'next', actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('pr-body'), 'Agregué una frase al README para presentar al equipo.') }] },
        { title: 'Revisa antes de proponer', target: T('compare-diff'), placement: 'top', body: 'Abajo se muestran las diferencias: en verde, la línea que agregaste.', advance: 'next' },
        { title: 'Crea el pull request', target: T('pr-create'), body: '👉 Haz clic en <strong>Create pull request</strong>.', advance: { event: 'pr:created' } },
        { title: 'Tu propuesta está abierta', target: T('pr-state'), body: 'La etiqueta verde <strong>Open</strong> indica que el pull request espera revisión. En un equipo real, tus compañeros recibirían un aviso para revisarlo.', advance: 'next' },
        { title: 'Revisar los cambios', target: T('pr-tab-files'), body: '👉 Abre la pestaña <strong>Files changed</strong> (archivos cambiados).', advance: 'click', route: /\/pull\/\d+\/files$/ },
        { title: 'Revisión línea por línea', target: T('pr-diff'), placement: 'corner', body: 'Aquí el equipo revisa cada cambio y puede dejar comentarios antes de aprobar.', advance: 'next' },
        { title: 'Volver a la conversación', target: T('pr-tab-conversation'), body: '👉 Regresa a <strong>Conversation</strong>.', advance: 'click', route: /\/pull\/\d+$/ },
        { title: 'Hora de unir los cambios', target: T('merge-btn'), body: 'GitHub confirma que no hay conflictos.<br><br>👉 Haz clic en <strong>Merge pull request</strong>.', advance: 'click' },
        { title: 'Confirma el merge', target: T('merge-confirm-box'), click: T('confirm-merge'), body: 'GitHub crea un commit especial que une las dos ramas.<br><br>👉 Haz clic en <strong>Confirm merge</strong>.', advance: { event: 'pr:merged' }, allow: ['#mg-title', '#mg-desc', '[data-action="cancelMerge"]'] },
        { title: '¡Merge completado! 🎉', target: T('delete-branch-btn'), body: 'Los cambios ya están en main y el pull request se marcó como <strong>Merged</strong> (morado). La rama cumplió su propósito, así que puedes borrarla sin perder nada.<br><br>👉 Haz clic en <strong>Delete branch</strong>.', advance: { event: 'branch:deleted' } },
        { title: 'Comprueba el resultado', target: T('tab-code'), body: '👉 Vuelve a la pestaña <strong>Code</strong>.', advance: 'click', route: /^#\/[^/]+\/[^/]+$/ },
        { title: 'main ya tiene tu cambio', target: T('readme-body'), placement: 'top', body: 'El README de main ahora incluye tu línea. Así se trabaja en equipo: cada quien en su rama, se revisa con un pull request y se une con un merge.', advance: 'next' }
      ]
    },
    {
      id: 'm7', title: 'Seguridad y administración', short: 'Seguridad', icon: 'shield-lock',
      learn: ['Settings solo lo ven los administradores.', 'Cambiaste la visibilidad del repositorio en la Danger Zone.', 'Invitaste a un colaborador y conociste los roles de acceso.'],
      prepare() { ensureRepo(); GH.router.go(ctx.repoHash()); },
      steps: [
        { title: 'Quién ve y quién cambia', body: 'Cada repositorio tiene su <strong>configuración</strong> (Settings), visible solo para dueños y administradores. Allí decides si es público o privado y a quién das acceso.', advance: 'next' },
        { title: 'Abre Settings', target: T('tab-settings'), body: '👉 Haz clic en la pestaña <strong>Settings</strong> (configuración).', advance: 'click', route: /\/settings$/ },
        { title: 'Las secciones de configuración', target: T('settings-nav'), placement: 'right', body: 'Nos interesan dos: <strong>General</strong> (donde está la visibilidad) y <strong>Collaborators</strong> (quién tiene acceso).', advance: 'next' },
        { title: 'La zona de peligro', target: T('danger-zone'), placement: 'top', body: 'La <strong>Danger Zone</strong> agrupa las decisiones importantes: cambiar la visibilidad, transferir, archivar o borrar el repositorio. GitHub pide varias confirmaciones para evitar errores.', advance: 'next' },
        { title: 'Cambiar la visibilidad', target: T('change-visibility-btn'), body: () => `Ahora tu repositorio es <strong>${ctx.vis()}</strong>.<br><br>👉 Haz clic en <strong>Change visibility</strong>.`, advance: 'click' },
        { title: 'Elige la opción', target: T('vis-change-item'), transient: true, placement: 'left', body: () => `👉 Elige <strong>Change to ${ctx.vis() === 'public' ? 'private' : 'public'}</strong>.`, advance: 'click' },
        { title: 'Primera confirmación', target: T('vis-step-1'), transient: true, placement: 'left', body: 'GitHub te avisa qué vas a cambiar.<br><br>👉 Confirma con el botón rojo.', advance: 'click' },
        { title: 'Lee los efectos', target: T('vis-dialog'), click: T('vis-step-2'), transient: true, placement: 'left', body: 'Antes de seguir, GitHub explica las consecuencias. Léelas con calma.<br><br>👉 Luego pulsa <strong>I have read and understand these effects</strong>.', advance: 'click' },
        { title: 'Escribe el nombre para confirmar', target: T('vis-confirm-input'), transient: true, placement: 'left', body: () => `Para evitar accidentes, GitHub pide escribir el nombre completo: <code>${ctx.full()}</code>`, advance: { check: () => { const b = document.getElementById('vis-apply'); return b && !b.disabled; }, auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('vis-confirm-input'), ctx.full()) }] },
        { title: 'Último paso', target: T('vis-step-3'), transient: true, placement: 'left', body: '👉 Haz clic en el botón rojo para aplicar el cambio.', advance: { event: 'repo:visibility' } },
        { title: 'Cambio aplicado', target: T('danger-visibility'), body: () => ctx.vis() === 'private' ? 'Tu repositorio ahora es <strong>private</strong>. Si alguien abre su enlace sin permiso verá el error 404 que conociste en el Módulo 3.' : 'Tu repositorio ahora es <strong>public</strong>: cualquiera con el enlace puede verlo, pero solo tú (y quienes invites) pueden cambiarlo.', advance: 'next' },
        { title: 'Gestionar accesos', target: T('settings-nav-access'), placement: 'right', body: '👉 Abre <strong>Collaborators</strong>.', advance: 'click', route: /\/settings\/access$/ },
        { title: '¿Quién tiene acceso?', target: T('who-has-access'), body: 'A la izquierda ves si el repositorio es público o privado; a la derecha, cuántas personas tienen acceso directo. Por ahora, solo tú.', advance: 'next' },
        { title: 'Invita a alguien', target: T('add-people-btn'), body: '👉 Haz clic en <strong>Add people</strong> (agregar personas).', advance: 'click' },
        { title: 'Busca a la persona', target: T('ap-search'), transient: true, placement: 'right', body: '👉 Escribe <strong>carlos</strong>. (En GitHub real buscarías por usuario o correo.)', advance: { check: () => !!document.querySelector(T('ap-person-carlos-demo')), auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('ap-search'), 'carlos') }] },
        { title: 'Selecciónala', target: T('ap-person-carlos-demo'), transient: true, placement: 'right', body: '👉 Haz clic en <strong>carlos-demo</strong>.', advance: { event: 'ap:picked' } },
        { title: 'Envía la invitación', target: T('ap-add'), transient: true, placement: 'right', body: '👉 Haz clic en <strong>Add carlos-demo to this repository</strong>.', advance: { event: 'collaborator:added' } },
        { title: 'Invitación enviada', target: T('collab-carlos-demo'), body: 'Carlos recibe una invitación. Cuando la acepte podrá ver el repositorio (aunque sea privado) y hacer lo que su <strong>rol</strong> permita:<br><strong>Read</strong>: solo ver · <strong>Write</strong>: subir cambios · <strong>Admin</strong>: control total.<br><br>Puedes cambiar el rol con el menú de la derecha o quitar el acceso con la papelera.', advance: 'next', allow: ['[data-onchange="collabRole"]'] },
        { title: 'En resumen', body: '<table class="tb-table"><tr><th></th><th>Público</th><th>Privado</th></tr><tr><td>¿Quién lo ve?</td><td>Cualquiera</td><td>Solo personas invitadas</td></tr><tr><td>¿Quién lo cambia?</td><td colspan="2">Solo tú y tus colaboradores, según su rol</td></tr><tr><td>Enlace sin permiso</td><td>Se abre</td><td>Error 404</td></tr></table><p class="mt-2">Regla de oro: si tiene información interna o personal, hazlo <strong>privado</strong>.</p>', advance: 'next' }
      ]
    },
    {
      id: 'm8', title: 'Explora por tu cuenta', short: 'Explorar', icon: 'rocket',
      learn: [],
      prepare() { const r = ctx.repo(); GH.router.go(r ? ctx.repoHash() : '#/'); },
      steps: [
        { title: '¡Completaste el recorrido! 🎓', body: 'Ya conoces lo esencial de GitHub: repositorios, commits, ramas, pull requests, merge y permisos.<br><br>Ahora navega libremente. En la barra inferior tienes <strong>Retos</strong> para practicar, el <strong>Glosario</strong> y el <strong>Recorrido</strong> para repetir cualquier módulo.', actions: [{ label: 'Empezar a explorar', primary: true, run: () => GH.tour.goFree('challenges') }], advance: { event: 'tour:free' } }
      ]
    }
  ];

  // ---------- Glosario ----------
  const glossary = [
    ['repositorio', 'Repositorio (repository)', 'La carpeta de un proyecto en GitHub: guarda sus archivos y todo su historial de cambios. Se identifica como <code>dueño/nombre</code>.'],
    ['commit', 'Commit', 'Un guardado con mensaje. Registra qué cambió, quién lo hizo y cuándo. Cada commit es una versión a la que puedes volver.'],
    ['rama', 'Rama (branch)', 'Una copia paralela del proyecto para trabajar sin afectar la versión principal. Cuando el trabajo está listo, se une con un merge.'],
    ['main', 'main', 'El nombre habitual de la rama principal: la versión «oficial» del proyecto.'],
    ['pullrequest', 'Pull request (PR)', 'Una propuesta para integrar los cambios de una rama en otra (normalmente en main). Permite revisar, comentar y aprobar antes de unir.'],
    ['merge', 'Merge (fusionar)', 'Unir los cambios de una rama con otra. Al hacer merge de un pull request, sus cambios pasan a formar parte de main.'],
    ['readme', 'README', 'El archivo de portada de un repositorio. GitHub lo muestra automáticamente debajo de la lista de archivos.'],
    ['visibilidad', 'Público / Privado', '<strong>Público</strong>: cualquiera puede verlo. <strong>Privado</strong>: solo las personas con permiso. En ambos casos, solo tú y tus colaboradores pueden cambiarlo.'],
    ['colaborador', 'Colaborador', 'Persona invitada a un repositorio. Su rol (Read, Triage, Write, Maintain, Admin) define qué puede hacer.'],
    ['issue', 'Issue', 'Una tarjeta para anotar una tarea, una idea o un problema del proyecto, y conversar sobre ella.'],
    ['fork', 'Fork', 'Una copia de un repositorio ajeno en tu propia cuenta, para experimentar o proponer cambios.'],
    ['clonar', 'Clonar / URL', 'Clonar es descargar una copia del repositorio a tu computador. La URL (dirección) del repositorio es <code>https://github.com/dueño/nombre</code>.'],
    ['diff', 'Diff', 'La comparación entre dos versiones: en verde lo agregado, en rojo lo eliminado.'],
    ['markdown', 'Markdown', 'Una forma sencilla de dar formato a un texto: <code>#</code> para títulos, <code>-</code> para listas, <code>**negrita**</code>.'],
    ['star', 'Star (estrella)', 'Marcar un repositorio como favorito para encontrarlo luego y mostrar aprecio a sus autores.'],
    ['actions', 'GitHub Actions', 'Automatizaciones que se ejecutan cuando algo cambia en el repositorio: por ejemplo, revisar o publicar el proyecto.']
  ];

  // ---------- Retos de exploración libre ----------
  const mine = () => S().myRepos();
  const challenges = [
    ['Marca un repositorio con una estrella ⭐', 'Abre el recetario de la comunidad y pulsa Star.', () => S().visibleRepos().some(r => r.starred)],
    ['Crea un issue para anotar una tarea', 'En tu repositorio: pestaña Issues → New issue.', () => S().visibleRepos().some(r => r.issues.some(i => i.author === S().me()))],
    ['Crea un archivo nuevo desde el navegador', 'Add file → Create new file, escribe algo y guarda con un commit.', () => mine().some(r => Object.values(r.commits).some(c => /^Create /.test(c.message) && c.message !== 'Create README.md'))],
    ['Haz un segundo pull request y su merge', 'Crea otra rama, cambia algo, propón el cambio y únelo.', () => mine().reduce((n, r) => n + r.pulls.filter(p => p.state === 'merged').length, 0) >= 2],
    ['Viaja en el tiempo', 'En el historial de commits pulsa Browse files o el ícono <> de un commit antiguo.', () => !!S().state.tutorial.timeTravel],
    ['Deja un comentario', 'Comenta en un issue o pull request (también en los del recetario).', () => S().visibleRepos().some(r => r.issues.concat(r.pulls).some(x => (x.comments || []).some(c => c.author === S().me())))],
    ['Haz un fork del recetario', 'Abre comunidad-demo/recetas-familiares y pulsa Fork.', () => mine().some(r => r.forkOf)]
  ];

  GH.tourContent = { intro, modules, glossary, challenges, ctx, T };
})(window.GH);
