/*
 * CONTENIDO DEL RECORRIDO EDUCATIVO
 * ---------------------------------
 * Aquí se definen la bienvenida, los 8 módulos, sus pasos, el glosario y los retos.
 * Para cambiar textos o agregar pasos solo necesitas editar este archivo.
 *
 * REGLA DE ORO: cada concepto se explica en palabras sencillas la primera vez que aparece
 * y tiene su entrada en el glosario (más abajo). Las palabras del glosario se convierten
 * automáticamente en enlaces (subrayado punteado) en todos los textos del recorrido.
 * Si agregas un concepto nuevo, agrégalo también al glosario con sus variantes (alias).
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
 *   prepare    fn(ctx) que se ejecuta al entrar al paso.
 *   placement  'bottom' | 'top' | 'right' | 'left' | 'center' | 'corner'.
 */
(function (GH) {
  'use strict';
  const T = (n) => `[data-tour="${n}"]`;
  const S = () => GH.store;
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
    full: () => { const r = ctx.repo(); return r ? `${r.owner}/${r.name}` : 'tu-usuario/mi-primer-proyecto'; },
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

  // ---------- Cómo usar el tutorial (se muestra en la bienvenida y con el botón «?») ----------
  const howTo = `
    <div class="howto-demo" aria-hidden="true">
      <div class="hd-screen"><span class="hd-btn">Create repository</span></div>
      <div class="hd-bubble"><div class="hd-guide">${GH.icon('mortar-board', 12)} Tu guía</div><strong>¡A crearlo!</strong><div>👉 Haz clic en <b>Create repository</b>.</div></div>
    </div>
    <ol class="howto-list">
      <li><span class="hl-ic">${GH.icon('unmute')}</span><span><strong>Escucha a tu guía.</strong> Te habla en cada paso, te explica y te invita a actuar. Con el botón ${GH.icon('play')} del globo repites lo que dijo; con <strong>Voz</strong> en la barra la apagas o la enciendes.</span></li>
      <li><span class="hl-ic">${GH.icon('comment')}</span><span><strong>Lee el globo.</strong> Te explica cada parte de GitHub y te dice qué hacer. Las instrucciones empiezan con 👉.</span></li>
      <li><span class="hl-ic hl-ring"></span><span><strong>Haz clic en lo que tiene borde azul brillante.</strong> Es el botón o la zona que debes usar en ese paso.</span></li>
      <li><span class="hl-ic">${GH.icon('arrow-right')}</span><span>Si el paso es solo para leer, pulsa <strong>Continuar</strong>.</span></li>
      <li><span class="hl-ic"><span class="hl-term">abc</span></span><span>Las <strong>palabras con subrayado punteado</strong> tienen explicación: haz clic y se abre el <strong>glosario</strong> (un diccionario de términos).</span></li>
      <li><span class="hl-ic">${GH.icon('pencil')}</span><span>Si no sabes qué escribir, usa el botón <strong>Escribirlo por mí</strong>.</span></li>
      <li><span class="hl-ic">${GH.icon('light-bulb')}</span><span>Si haces clic en otro lugar, verás una <strong>pista amarilla</strong>. No te preocupes: nada se rompe.</span></li>
      <li><span class="hl-ic">${GH.icon('dash')}</span><span>Si el globo tapa algo, minimízalo con el botón <strong>–</strong> de su esquina.</span></li>
    </ol>
    <div class="howto-dock">
      <div class="hdk-title">La barra de abajo a la izquierda te acompaña siempre:</div>
      <div class="hdk-row"><span class="hdk-k">${GH.icon('arrow-left')} Atrás</span><span>vuelve al paso anterior y deshace lo que hiciste en él.</span></div>
      <div class="hdk-row"><span class="hdk-k">${GH.icon('sync')} Repetir</span><span>empieza de nuevo el paso actual (útil si cerraste un menú sin querer).</span></div>
      <div class="hdk-row"><span class="hdk-k">${GH.icon('list-unordered')} Índice</span><span>muestra los 8 módulos para saltar a cualquiera.</span></div>
      <div class="hdk-row"><span class="hdk-k">${GH.icon('book')} Glosario</span><span>todas las palabras nuevas con su significado.</span></div>
      <div class="hdk-row"><span class="hdk-k">${GH.icon('question')} Ayuda</span><span>vuelve a mostrar estas instrucciones.</span></div>
      <div class="hdk-row"><span class="hdk-k">${GH.icon('unmute')} Voz</span><span>enciende o apaga la narración de la guía.</span></div>
      <div class="hdk-row"><span class="hdk-k">Explorar libre</span><span>sales del recorrido y navegas a tu ritmo; puedes volver cuando quieras.</span></div>
    </div>`;

  // ---------- Bienvenida ----------
  const intro = [
    {
      icon: 'mortar-board', title: '¡Bienvenido a tu práctica de GitHub!',
      body: `<div class="intro-voice">${GH.icon('unmute', 24)}<div><strong>Sube el volumen: tu guía te va a hablar.</strong><span>Si no escuchas nada, pulsa ${GH.icon('play')} arriba a la derecha. Puedes apagar la voz cuando quieras.</span></div></div>
        <p>GitHub es un sitio web donde personas y equipos <strong>guardan sus proyectos</strong>, ven <strong>cómo cambian</strong> con el tiempo y <strong>trabajan juntos</strong> sin pisarse.</p>
        <div class="intro-cards">
          <div class="intro-card"><span class="ic">${GH.icon('file-directory', 24)}</span><strong>Una carpeta en la nube</strong><span>Como Google Drive o OneDrive, pero pensada para proyectos.</span></div>
          <div class="intro-card"><span class="ic">${GH.icon('history', 24)}</span><strong>Con máquina del tiempo</strong><span>Guarda cada versión: puedes ver qué cambió, quién y cuándo.</span></div>
          <div class="intro-card"><span class="ic">${GH.icon('people', 24)}</span><strong>Y un sistema de propuestas</strong><span>Cada quien sugiere cambios y el equipo decide cuáles se aceptan.</span></div>
        </div>`
    },
    {
      icon: 'rocket', title: '¿Quién lo usa y para qué?',
      body: `<p>Más de cien millones de personas usan GitHub. Aunque nació para programadores (personas que escriben software), hoy también lo usan equipos que escriben documentos, manuales, políticas, investigaciones o páginas web.</p>
        <ul class="intro-list">
          <li>${GH.icon('book')} <span><strong>Documentación compartida</strong>: manuales y guías que todo el equipo mantiene al día.</span></li>
          <li>${GH.icon('browser')} <span><strong>Páginas web</strong>: GitHub puede publicar un sitio gratis (¡este simulador está publicado así!).</span></li>
          <li>${GH.icon('code')} <span><strong>Programas y aplicaciones</strong>: desde apps pequeñas hasta proyectos con miles de personas.</span></li>
          <li>${GH.icon('copilot')} <span><strong>Proyectos con inteligencia artificial</strong>: muchas herramientas de IA guardan y comparten su trabajo aquí.</span></li>
        </ul>
        <p class="muted">No necesitas saber programar para entender cómo funciona.</p>`
    },
    { icon: 'light-bulb', title: 'Cómo usar este tutorial', body: `<p>Aprenderás haciendo: usarás una copia de GitHub mientras una guía te acompaña paso a paso.</p>${howTo}` },
    {
      icon: 'shield-check', title: 'Antes de empezar',
      body: `<p>Lo que verás es una <strong>réplica de las pantallas de GitHub</strong> en un entorno seguro: no usa cuentas, contraseñas ni proyectos reales. Todo ocurre en tu navegador y puedes equivocarte sin miedo.</p>
        <ul class="intro-list">
          <li>${GH.icon('globe')} <span>Las pantallas están en <strong>inglés</strong>, como en el GitHub real. La guía te traduce cada botón importante.</span></li>
          <li>${GH.icon('mortar-board')} <span>Son <strong>8 módulos cortos</strong>. Cada uno toma entre 3 y 8 minutos y puedes hacerlos en el orden que quieras.</span></li>
          <li>${GH.icon('check-circle')} <span>Tu avance se guarda en este navegador: puedes cerrar y continuar después.</span></li>
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
      learn: ['Sabes usar el globo, el resaltado azul, la barra de control y el glosario.', 'Reconoces el Dashboard, tu página de inicio.', 'Sabes usar el buscador y el menú principal ≡.', 'Encontraste el botón + y tu perfil.'],
      prepare() { GH.router.go('#/'); },
      steps: [
        { title: 'Este es tu Dashboard', body: 'El <strong>Dashboard</strong> (tablero de inicio) es lo primero que ves al entrar a GitHub. Desde aquí llegas a tus proyectos y ves la actividad reciente.<br><br>El cuadro grande del centro es <strong>Copilot</strong>, el asistente de inteligencia artificial de GitHub. En este simulador no está activo.', advance: 'next' },
        { title: 'Tu barra de control', target: '.tour-dock', placement: 'top', body: 'Abajo a la izquierda está tu <strong>barra de control</strong>. Los puntos muestran tu avance en los 8 módulos y la línea de color, el avance del módulo actual.<br><br>Con sus botones puedes ir <strong>Atrás</strong>, <strong>Repetir</strong> un paso, abrir el <strong>Índice</strong>, el <strong>Glosario</strong> o la <strong>Ayuda</strong>, y <strong>Explorar libre</strong>.', advance: 'next' },
        { title: 'Las palabras subrayadas', prepare: () => GH.tour.closePanel(), body: 'Cuando veas una palabra con <strong>subrayado punteado</strong> en azul, haz clic en ella: se abre el glosario con su significado.<br><br>👉 Pruébalo ahora: haz clic en la palabra Dashboard.', advance: { event: 'tour:term-opened' }, hint: 'Haz clic en la palabra «Dashboard» de este globo: tiene un subrayado punteado.' },
        { title: 'Así funciona el glosario', target: '.tour-panel', placement: 'left', body: 'A la derecha se abrió el glosario con la definición. Puedes buscar cualquier término o abrirlo cuando quieras con el botón <strong>Glosario</strong> de la barra.<br><br>Pulsa Continuar y lo cerraremos por ahora.', advance: 'next' },
        { title: 'El buscador', prepare: () => GH.tour.closePanel(), target: T('header-search'), body: 'Con la <strong>lupa</strong> buscas proyectos y personas en todo GitHub. En GitHub cada proyecto se llama <strong>repositorio</strong>; lo verás a fondo en el Módulo 2.<br><br>👉 Haz clic en la lupa.', advance: 'click', hint: 'Busca la lupa en la esquina superior derecha.' },
        { title: 'Buscar o saltar a…', target: T('palette'), transient: true, body: 'Aquí escribes lo que buscas y debajo aparecen sugerencias. La usaremos en el Módulo 3.<br><br>👉 Por ahora ciérrala con la tecla <kbd>Esc</kbd> o con la <strong>×</strong>.', advance: { event: 'palette:closed' }, allow: '*', placement: 'bottom' },
        { title: 'El menú principal', target: T('header-menu'), body: 'Las <strong>tres rayitas (≡)</strong> abren el menú con todas las secciones de GitHub.<br><br>👉 Haz clic para abrirlo.', advance: 'click', hint: 'Es el botón con tres rayitas, arriba a la izquierda.' },
        { title: 'Las secciones de GitHub', target: T('drawer'), transient: true, placement: 'right', body: '<strong>Home</strong> te trae al inicio. <strong>Issues</strong> reúne tareas y problemas anotados. <strong>Pull requests</strong> reúne propuestas de cambio. <strong>Repositories</strong> lista tus repositorios. Los conocerás uno a uno en los próximos módulos.<br><br>👉 Cierra el menú con la <strong>×</strong>.', advance: { event: 'drawer:closed' }, allow: [T('drawer-close'), '.drawer-backdrop'], hint: 'Cierra el menú con la × de la parte superior.' },
        { title: 'Tus repositorios', target: T('top-repos'), placement: 'right', body: () => S().myRepos().length ? 'En esta columna aparecen tus repositorios más usados para abrirlos con un clic.' : 'En esta columna aparecerán tus repositorios más usados. Ahora está vacía porque todavía no tienes ninguno: en el Módulo 2 crearás el primero.', advance: 'next' },
        { title: 'Crear algo nuevo', target: T('header-create'), body: 'El botón <strong>+</strong> sirve para crear cosas nuevas, por ejemplo un repositorio o un issue. Lo usaremos en el siguiente módulo.', advance: 'next' },
        { title: 'Atajos rápidos', target: T('header-shortcuts'), body: 'Estos cuatro íconos te llevan a: tus issues (tareas), tus pull requests (propuestas), tus repositorios y tu bandeja de notificaciones (los avisos que GitHub te envía).', advance: 'next' },
        { title: 'Tu cuenta', target: T('header-avatar'), body: 'Este círculo es tu foto de perfil (en el simulador es un dibujo generado).<br><br>👉 Haz clic para abrir el menú de tu cuenta.', advance: 'click', hint: 'Es el círculo de la esquina superior derecha.' },
        { title: 'El menú de tu cuenta', target: T('menu-profile'), transient: true, placement: 'left', body: 'Desde aquí llegas a tu perfil, a tus repositorios y a tus estrellas (los repositorios que marcaste como favoritos).<br><br>👉 Haz clic en <strong>Profile</strong> (perfil).', advance: 'click', route: /^#\/[^/?]+$/ },
        { title: 'Tu perfil público', target: T('profile-main'), placement: 'corner', body: 'Esto es lo que otras personas ven de ti: tu nombre, tus repositorios y un calendario que se pinta de verde cada día que guardas cambios.<br><br>Debajo de tu nombre está tu <strong>nombre de usuario</strong> (<code><span data-me></span></code>): tu identificador único en GitHub. Forma parte de la dirección web de tus repositorios: <code>github.com/<span data-me></span>/…</code>', advance: 'next' }
      ]
    },
    {
      id: 'm2', title: '¿Qué es un repositorio?', short: 'Repositorio', icon: 'repo',
      learn: ['Un repositorio es la carpeta de un proyecto con todo su historial.', 'Creaste uno con nombre, descripción, visibilidad y README.', 'Tu repositorio aparece en tu listado.'],
      prepare() { if (GH.resetNewRepoForm) GH.resetNewRepoForm(); GH.router.go('#/'); },
      steps: [
        { title: '¿Qué es un repositorio?', body: 'Un <strong>repositorio</strong> (o «repo») es la carpeta de un proyecto que guarda sus archivos <em>y toda su historia</em>.<br><br>Piensa en una carpeta compartida que, además, recuerda cada versión de cada archivo y quién la cambió. Puede contener un manual, una presentación, una página web o un recetario.', advance: 'next' },
        { title: 'Empieza con el botón +', target: T('header-create'), body: '👉 Haz clic en <strong>+</strong> para crear algo nuevo.', advance: 'click', hint: 'El botón + está arriba a la derecha, junto a la lupa.' },
        { title: 'Nuevo repositorio', target: T('menu-new-repo'), transient: true, placement: 'left', body: 'El menú muestra todo lo que puedes crear.<br><br>👉 Elige <strong>New repository</strong> (nuevo repositorio).', advance: 'click', route: /^#\/new$/ },
        {
          title: 'Ponle nombre', target: T('nr-name'), body: 'A la izquierda, <strong>Owner</strong> (dueño) muestra tu nombre de usuario: el repositorio será tuyo.<br><br>Escribe un nombre corto y sin espacios, por ejemplo <code>mi-primer-proyecto</code>. Si usas espacios, GitHub los cambia por guiones. Debajo verás si el nombre está disponible.',
          advance: { check: () => { const b = document.querySelector(T('nr-create')); return b && !b.disabled; } }, allow: ['[data-action="nrSuggest"]'],
          actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('nr-name'), uniqueName('mi-primer-proyecto')) }], hint: 'Escribe el nombre en la casilla «Repository name».'
        },
        { title: 'Describe tu proyecto', target: T('nr-desc'), body: 'La descripción (<strong>Description</strong>) es opcional, pero una frase ayuda a otras personas a entender de qué se trata.<br><br>Ejemplo: <em>Mi primer proyecto para aprender GitHub</em>.', advance: 'next', actions: [{ label: 'Escribirla por mí', run: () => typeInto(T('nr-desc'), 'Mi primer proyecto para aprender GitHub') }] },
        { title: '¿Público o privado?', target: T('nr-visibility'), body: 'La <strong>visibilidad</strong> decide quién puede ver el repositorio:<br><strong>Public</strong> (público): cualquiera en internet puede verlo, pero solo tú decides quién lo modifica.<br><strong>Private</strong> (privado): solo tú y las personas que invites.<br><br>Elige con el botón de la derecha; podrás cambiarlo después.', advance: 'next', allow: [T('nr-vis-btn'), T('nr-vis-menu')] },
        { title: 'Agrega un README', target: T('nr-readme-toggle'), body: 'El <strong>README</strong> («léeme») es la portada del proyecto: un texto que explica qué es y cómo usarlo. Siempre conviene tener uno.<br><br>Las otras opciones (plantilla, .gitignore y licencia) son para casos avanzados; puedes dejarlas como están.<br><br>👉 Activa el interruptor <strong>Add README</strong>.', advance: { check: () => { const t = document.querySelector(T('nr-readme-toggle')); return t && t.getAttribute('aria-checked') === 'true'; }, auto: true }, hint: 'Activa el interruptor que dice Off, junto a «Add README».' },
        { title: '¡A crearlo!', target: T('nr-create'), body: '👉 Haz clic en <strong>Create repository</strong> (crear repositorio).', advance: { event: 'repo:created' }, hint: 'El botón verde está abajo a la derecha.' },
        { title: '¡Tu repositorio existe! 🎉', target: T('readme'), body: () => `Esta es la página principal de <strong>${ctx.repoName()}</strong>. Arriba está la lista de archivos: por ahora solo <code>README.md</code>. La terminación .md indica un texto con formato sencillo (Markdown), que conocerás en el Módulo 3.<br><br>Aquí abajo se muestra el contenido del README.`, advance: 'next', placement: 'top' },
        { title: 'La parte de arriba del repositorio', target: T('repo-title'), body: () => `La etiqueta junto al nombre indica la visibilidad: <strong>${ctx.vis() === 'private' ? 'Private' : 'Public'}</strong>.<br><br>A la derecha hay tres botones: <strong>Watch</strong> (recibir avisos de sus cambios), <strong>Fork</strong> (hacer tu propia copia del proyecto de otra persona) y <strong>Star</strong> (marcarlo como favorito con una estrella).`, advance: 'next' },
        { title: 'Vuelve al inicio', target: T('header-logo'), body: '👉 Haz clic en el logo (el birrete) para volver a tu Dashboard.', advance: 'click', route: /^#\/?$/ },
        { title: 'Ahí está tu proyecto', target: T('top-repos'), placement: 'right', body: () => `Tu nuevo repositorio <strong>${ctx.repoName()}</strong> ya aparece en tu lista. Así siempre lo encontrarás.`, advance: 'next' }
      ]
    },
    {
      id: 'm3', title: 'Explorar un proyecto', short: 'Explorar', icon: 'telescope',
      learn: ['Buscaste y abriste un proyecto de otras personas.', 'Navegaste carpetas, archivos y el README.', 'Copiaste la URL con el botón Code.', 'Un repositorio privado no se puede abrir sin permiso, aunque tengas el enlace.'],
      prepare() { GH.router.go('#/'); },
      steps: [
        { title: 'Vamos de visita', body: 'Ahora explorarás el repositorio de otras personas: un <strong>recetario</strong> que una comunidad construye entre todos. Primero hay que encontrarlo.', advance: 'next' },
        { title: 'Abre el buscador', target: T('header-search'), body: '👉 Haz clic en la lupa.', advance: 'click', hint: 'La lupa está arriba a la derecha.' },
        { title: 'Escribe «recetas»', target: T('palette-input'), transient: true, body: '👉 Escribe <strong>recetas</strong> en la caja de búsqueda.', advance: { check: () => !!document.querySelector(T('palette-repo-recetas-familiares')) && /rec/i.test((document.querySelector(T('palette-input')) || {}).value || ''), auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('palette-input'), 'recetas') }], hint: 'Escribe en la caja que dice «Search or jump to…».' },
        { title: 'Ábrelo', target: T('palette-repo-recetas-familiares'), transient: true, body: '👉 Haz clic en <strong>comunidad-demo/recetas-familiares</strong>.', advance: 'click', route: /recetas-familiares\/?$/ },
        { title: 'La página del proyecto', target: T('repo-title'), body: 'Su nombre completo es <strong>comunidad-demo/recetas-familiares</strong>: primero va el dueño y luego el nombre del repositorio. Aquí el dueño es una organización: una cuenta compartida por un grupo de personas, como una empresa o una comunidad.', advance: 'next' },
        { title: 'Las pestañas', target: T('repo-tabs'), body: 'Cada pestaña es una sección del repositorio:<br><strong>Code</strong>: los archivos. <strong>Issues</strong>: tareas, ideas o problemas anotados. <strong>Pull requests</strong>: propuestas de cambio. <strong>Actions</strong>: tareas automáticas. <strong>Projects</strong>: tableros para planear. <strong>Wiki</strong>: páginas de documentación. <strong>Security and quality</strong>: seguridad. <strong>Insights</strong>: estadísticas.<br><br>No aparece <strong>Settings</strong> (configuración) porque solo la ven quienes administran el proyecto.', advance: 'next' },
        { title: 'Carpetas y archivos', target: T('file-table'), body: 'Las carpetas agrupan archivos, como en tu computador. En cada fila ves el mensaje que explica el último cambio y hace cuánto se hizo. Esos cambios guardados se llaman <strong>commits</strong>; los conocerás en el Módulo 4.', advance: 'next', placement: 'top' },
        { title: 'Abre una carpeta', target: T('file-postres'), body: '👉 Abre la carpeta <strong>postres</strong>.', advance: 'click', route: /tree\/main\/postres$/ },
        { title: '¿Dónde estoy?', target: T('breadcrumb'), body: 'Esta ruta te dice dónde estás: <strong>recetas-familiares / postres</strong>. Puedes hacer clic en cualquier parte de ella para regresar.', advance: 'next' },
        { title: 'Abre un archivo', target: T('file-arroz-con-leche.md'), body: '👉 Abre la receta <strong>arroz-con-leche.md</strong>.', advance: 'click', route: /blob\/main\/postres\/arroz-con-leche\.md$/ },
        { title: 'Tres formas de ver un archivo', target: T('blob-modes'), body: '<strong>Preview</strong> muestra el archivo con formato. <strong>Code</strong> muestra el texto tal como está escrito. <strong>Blame</strong> muestra quién cambió cada línea.<br><br>👉 Haz clic en <strong>Code</strong>.', advance: 'click', click: T('mode-code'), allow: [T('mode-preview'), T('mode-blame')] },
        { title: 'El texto «crudo»', target: T('blob-code'), placement: 'corner', body: 'Los símbolos <code>#</code> y <code>-</code> dan formato: <code>#</code> crea títulos y <code>-</code> crea listas. Esta forma sencilla de escribir texto con formato se llama <strong>Markdown</strong>; por eso el archivo termina en .md.<br><br>Las líneas están numeradas para ubicarlas fácilmente.', advance: 'next' },
        { title: 'Regresa al inicio del proyecto', target: T('crumb-root'), body: '👉 Haz clic en <strong>recetas-familiares</strong>, al comienzo de la ruta, para volver a la página principal del repositorio.', advance: 'click', route: /recetas-familiares\/tree\/main$/ },
        { title: 'El README', target: T('readme'), placement: 'top', body: 'El README aparece automáticamente debajo de los archivos: es la portada que explica el proyecto y cómo participar.', advance: 'next' },
        { title: 'El botón Code', target: T('code-btn'), body: 'El botón verde <strong>Code</strong> sirve para <strong>clonar</strong> el proyecto, es decir, descargar una copia a tu computador, y para obtener su dirección.<br><br>👉 Haz clic en él.', advance: 'click', hint: 'Es el botón verde que dice Code.' },
        { title: 'Copia la dirección', target: T('clone-url'), click: T('clone-copy'), transient: true, placement: 'left', body: 'Esta es la dirección (<strong>URL</strong>) del repositorio. Las pestañas HTTPS, SSH y GitHub CLI son formas técnicas de conectarse; HTTPS es la más común y la que verás casi siempre.<br><br>👉 Haz clic en el ícono de <strong>copiar</strong> que está a la derecha.', advance: { event: 'copied' } },
        { title: 'Compartir el enlace', target: T('repo-title'), prepare: () => GH.ui.closeMenus(), body: 'Para compartir el proyecto, envía su dirección web: <code>https://github.com/comunidad-demo/recetas-familiares</code>. Es la misma que copiaste sin el «.git» del final; esa versión con .git la usan los programas para clonar.<br><br>Como este repositorio es <strong>público</strong>, cualquiera con el enlace puede verlo.', advance: 'next' },
        { title: '¿Y si es privado?', body: 'Un repositorio privado solo lo ven las personas con permiso, <strong>aunque tengan el enlace</strong>.<br><br>Esta comunidad tiene uno privado: <code>comunidad-demo/presupuesto-2027</code>. Imagina que alguien te envió su enlace y ábrelo.', actions: [{ label: 'Abrir el enlace privado', primary: true, run: () => GH.router.go('#/comunidad-demo/presupuesto-2027') }], advance: { route: /presupuesto-2027/ } },
        { title: 'Error 404: no encontrado', target: T('not-found'), placement: 'corner', body: 'GitHub muestra el error 404 («no encontrado») y ni siquiera confirma que el proyecto existe. Así protege la información privada.<br><br>Para entrar, el dueño tiene que invitarte como <strong>colaborador</strong>: una persona con permiso para ver y cambiar el repositorio. Lo harás tú en el Módulo 7.', advance: 'next' }
      ]
    },
    {
      id: 'm4', title: 'Subir archivos y commits', short: 'Commits', icon: 'git-commit',
      learn: ['Subiste archivos con Add file → Upload files.', 'Un commit es un guardado con mensaje: qué cambió, quién y cuándo.', 'El historial conserva todas las versiones.'],
      prepare() { ensureRepo(); GH.router.go(ctx.repoHash()); },
      steps: [
        { title: '¿Qué es un commit?', body: 'Un <strong>commit</strong> es un «guardado con nota»: GitHub registra <strong>qué cambió</strong>, <strong>quién</strong>, <strong>cuándo</strong> y un <strong>mensaje</strong> que lo explica.<br><br>Es como tomarle una foto al proyecto: después puedes volver a cualquier foto anterior.', advance: 'next' },
        { title: 'Agregar archivos', target: `${T('add-file-btn')}, ${T('empty-upload')}`, body: 'Estás en tu repositorio.<br><br>👉 Haz clic en <strong>+</strong> (Add file, agregar archivo) para agregar archivos.', advance: 'click', route: /\/upload\//, hint: 'Es el botón + junto al botón verde Code.' },
        { title: 'Subir archivos', target: T('menu-upload'), transient: true, skipIf: () => /\/upload\//.test(location.hash), placement: 'left', body: '<strong>Create new file</strong> crea un archivo escribiéndolo aquí mismo; <strong>Upload files</strong> sube archivos de tu computador.<br><br>👉 Elige <strong>Upload files</strong> (subir archivos).', advance: 'click', route: /\/upload\// },
        { title: 'Elige qué subir', target: T('dropzone'), body: 'Normalmente arrastras archivos a este recuadro o usas «choose your files» (elegir archivos). Para practicar, usa nuestros archivos de ejemplo: un plan de trabajo, un presupuesto y una imagen.<br><br><span class="muted">También puedes elegir archivos tuyos: nunca salen de tu computador.</span>', actions: [{ label: 'Usar archivos de ejemplo', primary: true, run: () => GH.addSampleUploads() }], advance: { event: 'upload:files-added' }, allow: [T('choose-files')] },
        { title: 'Listos para subir', target: T('upload-list'), body: 'Estos son los archivos que se agregarán. Si te equivocaste, puedes quitar uno con la <strong>×</strong>.', advance: { check: () => !!document.querySelector(T('upload-list')) }, allow: ['[data-action="upRemove"]'] },
        { title: 'Escribe el mensaje del commit', target: T('upload-msg'), body: 'Para guardar los archivos harás un commit, y todo commit lleva un mensaje. Explica en pocas palabras qué estás guardando, por ejemplo: <code>Agrego plan de trabajo y presupuesto</code>.<br><br>Un buen mensaje ayuda a tu equipo (y a ti en el futuro) a entender el historial: la lista de todos los cambios.', advance: { check: () => ((document.querySelector(T('upload-msg')) || {}).value || '').trim().length > 2 }, allow: [T('upload-commit-box') + ' textarea'], actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('upload-msg'), 'Agrego plan de trabajo y presupuesto') }], hint: 'Escribe el mensaje en la casilla «Add files via upload».' },
        { title: '¿Dónde se guarda?', target: T('upload-target'), body: 'Todo proyecto tiene una versión principal llamada <strong>main</strong>. «Commit directly to the main branch» significa «guardar directamente en la versión principal».<br><br>La palabra <em>branch</em> quiere decir rama: una versión paralela del proyecto. La otra opción crea una; la conocerás en el Módulo 5.', advance: 'next' },
        { title: 'Guarda los cambios', target: T('upload-commit'), body: '👉 Haz clic en <strong>Commit changes</strong> (guardar los cambios).', advance: { event: 'commit:created' } },
        { title: '¡Archivos subidos!', target: T('file-table'), placement: 'top', body: 'Tus archivos ya están en el repositorio (los nuevos se resaltan un momento en verde). La barra de arriba muestra tu commit: tu nombre de usuario y tu mensaje.', advance: 'next' },
        { title: 'Ver el historial', target: T('history-link'), body: '👉 Haz clic en el <strong>reloj</strong> (Commits) para ver el historial.', advance: 'click', route: /\/commits\// },
        { title: 'El historial de versiones', target: T('commit-list'), placement: 'corner', body: 'Cada tarjeta es un commit, del más reciente al más antiguo. Abajo está «Initial commit» (commit inicial), el que creó el repositorio con su README.<br><br>A la derecha de cada commit hay un código como <code>fd7a664</code>: es su identificador único, llamado SHA. La etiqueta <strong>Verified</strong> indica que GitHub confirmó quién lo hizo.', advance: 'next' },
        { title: 'Abre tu commit', target: T('commit-first-link'), body: '👉 Haz clic en el mensaje de tu commit (el de arriba).', advance: 'click', route: /\/commit\// },
        { title: '¿Qué cambió exactamente?', target: T('commit-diff'), placement: 'corner', body: 'Las líneas con fondo <span class="tb-add">verde</span> se agregaron; las <span class="tb-del">rojas</span> se eliminaron. Esta comparación se llama <strong>diff</strong> y permite revisar un cambio línea por línea.', advance: 'next' },
        { title: 'Viajar en el tiempo', target: T('browse-files'), body: 'Con <strong>Browse files</strong> (explorar archivos) ves el proyecto exactamente como estaba en ese commit. Por eso nada se pierde: cada versión queda guardada.', advance: 'next' }
      ]
    },
    {
      id: 'm5', title: 'Comprender las ramas', short: 'Ramas', icon: 'git-branch',
      learn: ['Una rama es una copia paralela para trabajar sin afectar main.', 'Creaste una rama y cambiaste entre ramas.', 'Los cambios en una rama no alteran las demás.'],
      prepare() { const r = ensureRepo(); GH.router.go(`#/${r.owner}/${r.name}/tree/${r.defaultBranch}`); },
      steps: [
        { title: '¿Qué es una rama?', body: 'Una <strong>rama</strong> (<em>branch</em>) es una copia paralela del proyecto donde haces cambios sin tocar la versión principal, llamada <strong>main</strong>.<br><br>Es como duplicar un documento para escribir un borrador: el original sigue intacto hasta que decidas unirlos.', advance: 'next' },
        { title: 'El selector de ramas', target: T('branch-btn'), body: 'Este botón indica en qué rama estás: <strong>main</strong>.<br><br>👉 Haz clic en él.', advance: 'click' },
        { title: 'Crea tu rama', target: T('branch-filter'), transient: true, placement: 'right', body: 'En esta lista puedes cambiar de rama o crear una nueva.<br><br>👉 Escribe el nombre de tu nueva rama, por ejemplo <code>mejoras-readme</code>.', advance: { check: () => !!document.querySelector(T('create-branch-item')), auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('branch-filter'), 'mejoras-readme') }] },
        { title: 'Confírmalo', target: T('create-branch-item'), transient: true, placement: 'right', body: 'Dice «crear la rama … a partir de main»: tu rama empieza como una copia exacta de main.<br><br>👉 Haz clic en <strong>Create branch … from main</strong>.', advance: { event: 'branch:created' } },
        { title: 'Ya estás en tu rama', target: T('branch-btn'), body: () => `El botón ahora dice <strong>${ctx.branch()}</strong>. Todo lo que cambies aquí no afectará a main.`, advance: 'next' },
        { title: 'Edita el README', target: T('readme-edit'), body: '👉 Haz clic en el <strong>lápiz</strong> para editar el README.', advance: 'click', route: /\/edit\// },
        { title: 'Escribe tu cambio', target: T('editor-textarea'), placement: 'corner', body: 'Este es el editor: aquí cambias el texto del archivo.<br><br>Agrega una línea al final, por ejemplo:<br><code>Este proyecto lo trabajamos en equipo.</code>', advance: { check: () => { const e = GH.editorState(); return e && e.content.trim() !== e.original.trim(); } }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('editor-textarea'), '\n\nEste proyecto lo trabajamos en equipo.\n', true) }], hint: 'Haz clic dentro del cuadro de texto y escribe al final.' },
        { title: 'Guarda en tu rama', target: T('editor-commit'), body: 'Para guardar el cambio harás un commit, igual que en el Módulo 4.<br><br>👉 Haz clic en <strong>Commit changes...</strong>.', advance: 'click' },
        { title: 'Confirma el commit', target: T('commit-dialog'), click: T('cd-commit'), transient: true, placement: 'left', body: () => `GitHub propone el mensaje «Update README.md» («actualizo el README»); puedes dejarlo o mejorarlo. <strong>Extended description</strong> es una explicación más larga y opcional.<br><br>Fíjate que dice «Commit directly to the <strong>${ctx.branch()}</strong> branch»: el cambio queda solo en tu rama.<br><br>👉 Haz clic en <strong>Commit changes</strong>.`, advance: { event: 'commit:created' }, allow: [T('cd-msg'), T('cd-desc')] },
        { title: 'Tu cambio, en tu rama', target: T('blob-preview'), placement: 'corner', body: () => `Así se ve el README en la rama <strong>${ctx.branch()}</strong>, con tu línea nueva al final.`, advance: 'next' },
        { title: 'Vuelve a main', target: T('branch-btn'), body: '👉 Abre otra vez el selector de ramas.', advance: 'click' },
        { title: 'Elige main', target: T('branch-item-main'), transient: true, placement: 'right', body: 'La etiqueta <strong>default</strong> indica que main es la rama principal.<br><br>👉 Haz clic en <strong>main</strong>.', advance: 'click', route: /blob\/main\/README\.md$|tree\/main$/ },
        { title: 'main no cambió', target: T('blob-preview'), placement: 'corner', body: 'En <strong>main</strong> el README sigue igual: tu cambio vive solo en tu rama. Cada rama es independiente hasta que decidas unirlas… y eso es justo lo que harás en el próximo módulo.', advance: 'next' }
      ]
    },
    {
      id: 'm6', title: 'Pull requests y merge', short: 'Pull requests', icon: 'git-pull-request',
      learn: ['Un pull request propone integrar los cambios de una rama.', 'Revisaste las diferencias en Files changed.', 'Hiciste merge: los cambios llegaron a main.'],
      prepare() { const r = ensureBranchWithChange(); GH.router.go(`#/${r.owner}/${r.name}`); },
      steps: [
        { title: '¿Qué es un pull request?', body: 'Un <strong>pull request</strong> (PR) es una propuesta: «hice estos cambios en mi rama, ¿los revisamos antes de unirlos a main?». El equipo puede comentar y revisar.<br><br>Cuando todos están de acuerdo, se unen los cambios. Esa unión se llama <strong>merge</strong> (fusionar).', advance: 'next' },
        { title: 'GitHub te lo sugiere', target: T('compare-pr-btn'), body: () => `GitHub detectó cambios recientes en tu rama <strong>${ctx.branch()}</strong> y te ofrece compararlos con main y proponerlos.<br><br>👉 Haz clic en <strong>Compare &amp; pull request</strong> (comparar y crear pull request).`, advance: 'click', route: /\/compare\// },
        { title: 'Hacia dónde van los cambios', target: T('compare-range'), body: () => `<strong>base: main ← compare: ${ctx.branch()}</strong> significa: llevar los cambios <em>de tu rama</em> (compare) hacia <em>main</em> (base).<br><br>«<span class="color-success">Able to merge</span>» indica que se pueden unir sin conflictos. Un conflicto ocurre cuando dos personas cambiaron la misma línea de formas distintas.`, advance: 'next' },
        { title: 'Un título claro', target: T('pr-title'), body: 'El título viene del mensaje de tu último commit. Puedes mejorarlo para que se entienda la propuesta, por ejemplo: <code>Presento al equipo en el README</code>.', advance: { check: () => ((document.querySelector(T('pr-title')) || {}).value || '').trim().length > 0 } },
        { title: 'Explica tu propuesta', target: T('pr-body'), body: 'Cuenta qué cambiaste y por qué. Así quien revisa entiende el contexto.', advance: 'next', actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('pr-body'), 'Agregué una frase al README para presentar al equipo.') }] },
        { title: 'Revisa antes de proponer', target: T('compare-diff'), placement: 'top', body: 'Abajo se muestra el diff (la comparación): en verde, la línea que agregaste.', advance: 'next' },
        { title: 'Crea el pull request', target: T('pr-create'), body: '👉 Haz clic en <strong>Create pull request</strong>.', advance: { event: 'pr:created' } },
        { title: 'Tu propuesta está abierta', target: T('pr-state'), body: 'La etiqueta verde <strong>Open</strong> (abierto) indica que el pull request espera revisión. En un equipo real, tus compañeros recibirían una notificación para revisarlo.', advance: 'next' },
        { title: 'Las pestañas del pull request', target: T('pr-tab-files'), body: '<strong>Conversation</strong>: los comentarios. <strong>Commits</strong>: los cambios guardados. <strong>Checks</strong>: revisiones automáticas. <strong>Files changed</strong>: los archivos cambiados.<br><br>👉 Abre <strong>Files changed</strong>.', advance: 'click', route: /\/pull\/\d+\/files$/ },
        { title: 'Revisión línea por línea', target: T('pr-diff'), placement: 'corner', body: 'Aquí el equipo revisa cada cambio y puede dejar comentarios antes de aprobar.', advance: 'next' },
        { title: 'Volver a la conversación', target: T('pr-tab-conversation'), body: '👉 Regresa a <strong>Conversation</strong> (conversación).', advance: 'click', route: /\/pull\/\d+$/ },
        { title: 'Hora de unir los cambios', target: T('merge-btn'), body: 'GitHub confirma que no hay conflictos.<br><br>👉 Haz clic en <strong>Merge pull request</strong>.', advance: 'click' },
        { title: 'Confirma el merge', target: T('merge-confirm-box'), click: T('confirm-merge'), body: 'Al hacer merge, GitHub crea un commit especial que une las dos ramas; aquí puedes ver su mensaje.<br><br>👉 Haz clic en <strong>Confirm merge</strong> (confirmar).', advance: { event: 'pr:merged' }, allow: ['#mg-title', '#mg-desc', '[data-action="cancelMerge"]'] },
        { title: '¡Merge completado! 🎉', target: T('delete-branch-btn'), body: 'Los cambios ya están en main y el pull request quedó como <strong>Merged</strong> (unido), en morado. La rama cumplió su propósito, así que puedes borrarla sin perder nada: sus cambios ya viven en main.<br><br>👉 Haz clic en <strong>Delete branch</strong> (borrar rama).', advance: { event: 'branch:deleted' } },
        { title: 'Comprueba el resultado', target: T('tab-code'), body: '👉 Vuelve a la pestaña <strong>Code</strong>.', advance: 'click', route: /^#\/[^/]+\/[^/]+$/ },
        { title: 'main ya tiene tu cambio', target: T('readme-body'), placement: 'top', body: 'El README de main ahora incluye tu línea. Así se trabaja en equipo: cada quien en su rama, se revisa con un pull request y se une con un merge.', advance: 'next' }
      ]
    },
    {
      id: 'm7', title: 'Seguridad y administración', short: 'Seguridad', icon: 'shield-lock',
      learn: ['Settings solo lo ven los administradores.', 'Cambiaste la visibilidad del repositorio en la Danger Zone.', 'Invitaste a un colaborador y conociste los roles de acceso.'],
      prepare() { ensureRepo(); GH.router.go(ctx.repoHash()); },
      steps: [
        { title: 'Quién ve y quién cambia', body: 'Cada repositorio tiene su configuración, llamada <strong>Settings</strong>. Solo la ven el dueño y los administradores (personas con control total del repositorio). Allí se decide si es público o privado y quién tiene acceso.<br><br>Como el repositorio es tuyo, tú eres su administrador.', advance: 'next' },
        { title: 'Abre Settings', target: T('tab-settings'), body: '👉 Haz clic en la pestaña <strong>Settings</strong> (configuración).', advance: 'click', route: /\/settings$/ },
        { title: 'Las secciones de configuración', target: T('settings-nav'), placement: 'right', body: 'Nos interesan dos: <strong>General</strong> (donde está la visibilidad) y <strong>Collaborators</strong> (colaboradores: quién tiene acceso). Las demás son para usos avanzados.', advance: 'next' },
        { title: 'La zona de peligro', target: T('danger-zone'), placement: 'top', body: 'La <strong>Danger Zone</strong> («zona de peligro») agrupa decisiones importantes: cambiar la visibilidad, transferir el repositorio a otra cuenta, archivarlo (dejarlo solo para consulta) o borrarlo. GitHub pide varias confirmaciones para evitar errores.', advance: 'next' },
        { title: 'Cambiar la visibilidad', target: T('change-visibility-btn'), body: () => `Ahora tu repositorio es <strong>${ctx.vis() === 'private' ? 'privado (private)' : 'público (public)'}</strong>.<br><br>👉 Haz clic en <strong>Change visibility</strong> (cambiar visibilidad).`, advance: 'click' },
        { title: 'Elige la opción', target: T('vis-change-item'), transient: true, placement: 'left', body: () => `👉 Elige <strong>Change to ${ctx.vis() === 'public' ? 'private' : 'public'}</strong> (cambiar a ${ctx.vis() === 'public' ? 'privado' : 'público'}).`, advance: 'click' },
        { title: 'Primera confirmación', target: T('vis-step-1'), transient: true, placement: 'left', body: 'GitHub te avisa qué vas a cambiar.<br><br>👉 Confirma con el botón rojo.', advance: 'click' },
        { title: 'Lee los efectos', target: T('vis-dialog'), click: T('vis-step-2'), transient: true, placement: 'left', body: 'Antes de seguir, GitHub explica las consecuencias del cambio. Léelas con calma.<br><br>👉 Luego pulsa <strong>I have read and understand these effects</strong> («he leído y entiendo estos efectos»).', advance: 'click' },
        { title: 'Escribe el nombre para confirmar', target: T('vis-confirm-input'), transient: true, placement: 'left', body: () => `Para evitar accidentes, GitHub pide escribir el nombre completo del repositorio: <code>${ctx.full()}</code>`, advance: { check: () => { const b = document.getElementById('vis-apply'); return b && !b.disabled; }, auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('vis-confirm-input'), ctx.full()) }] },
        { title: 'Último paso', target: T('vis-step-3'), transient: true, placement: 'left', body: '👉 Haz clic en el botón rojo para aplicar el cambio.', advance: { event: 'repo:visibility' } },
        { title: 'Cambio aplicado', target: T('danger-visibility'), body: () => ctx.vis() === 'private' ? 'Tu repositorio ahora es <strong>privado</strong>. Si alguien abre su enlace sin permiso verá el error 404 que conociste en el Módulo 3.' : 'Tu repositorio ahora es <strong>público</strong>: cualquiera con el enlace puede verlo, pero solo tú (y quienes invites) pueden cambiarlo.', advance: 'next' },
        { title: 'Gestionar accesos', target: T('settings-nav-access'), placement: 'right', body: '👉 Abre <strong>Collaborators</strong> para decidir quién tiene acceso.', advance: 'click', route: /\/settings\/access$/ },
        { title: '¿Quién tiene acceso?', target: T('who-has-access'), body: 'A la izquierda ves si el repositorio es público o privado. A la derecha, cuántas personas tienen acceso directo, es decir, invitadas por nombre. Por ahora, solo tú.', advance: 'next' },
        { title: 'Invita a alguien', target: T('add-people-btn'), body: '👉 Haz clic en <strong>Add people</strong> (agregar personas).', advance: 'click' },
        { title: 'Busca a la persona', target: T('ap-search'), transient: true, placement: 'right', body: '👉 Escribe <strong>carlos</strong>. En GitHub real buscarías a la persona por su nombre de usuario o su correo.', advance: { check: () => !!document.querySelector(T('ap-person-carlos-demo')), auto: true }, actions: [{ label: 'Escribirlo por mí', run: () => typeInto(T('ap-search'), 'carlos') }] },
        { title: 'Selecciónala', target: T('ap-person-carlos-demo'), transient: true, placement: 'right', body: '👉 Haz clic en <strong>carlos-demo</strong>.', advance: { event: 'ap:picked' } },
        { title: 'Envía la invitación', target: T('ap-add'), transient: true, placement: 'right', body: '👉 Haz clic en <strong>Add carlos-demo to this repository</strong> (agregar a carlos-demo a este repositorio).', advance: { event: 'collaborator:added' } },
        { title: 'Invitación enviada', target: T('collab-carlos-demo'), body: 'Carlos recibe una invitación (<strong>Pending Invite</strong>, pendiente). Cuando la acepte podrá ver el repositorio, aunque sea privado, y hacer lo que su <strong>rol</strong> permita. El rol es el nivel de permiso:<br><strong>Read</strong>: solo ver · <strong>Triage</strong>: organizar issues · <strong>Write</strong>: subir cambios · <strong>Maintain</strong>: administrar sin acciones peligrosas · <strong>Admin</strong>: control total.<br><br>Puedes cambiar el rol con el menú de la derecha o quitar el acceso con la papelera.', advance: 'next', allow: ['[data-onchange="collabRole"]'] },
        { title: 'En resumen', body: '<table class="tb-table"><tr><th></th><th>Público</th><th>Privado</th></tr><tr><td>¿Quién lo ve?</td><td>Cualquiera</td><td>Solo personas invitadas</td></tr><tr><td>¿Quién lo cambia?</td><td colspan="2">Solo tú y tus colaboradores, según su rol</td></tr><tr><td>Enlace sin permiso</td><td>Se abre</td><td>Error 404</td></tr></table><p class="mt-2">Regla de oro: si tiene información interna o personal, hazlo <strong>privado</strong>.</p>', advance: 'next' }
      ]
    },
    {
      id: 'm8', title: 'Explora por tu cuenta', short: 'Explorar', icon: 'rocket',
      learn: [],
      prepare() { const r = ctx.repo(); GH.router.go(r ? ctx.repoHash() : '#/'); },
      steps: [
        { title: '¡Completaste el recorrido! 🎓', body: 'Ya conoces lo esencial de GitHub: repositorios, commits, ramas, pull requests, merge, visibilidad y colaboradores.<br><br>Ahora navega libremente. En la barra de abajo tienes <strong>Retos</strong> para practicar, el <strong>Glosario</strong> con todas las palabras nuevas y el <strong>Recorrido guiado</strong> para repetir cualquier módulo.', actions: [{ label: 'Empezar a explorar', primary: true, run: () => GH.tour.goFree('challenges') }], advance: { event: 'tour:free' } }
      ]
    }
  ];

  // ---------- Glosario ----------
  // k: clave · t: término · d: definición · a: variantes que se enlazan automáticamente en los textos
  // (una variante con mayúsculas solo se enlaza si coincide exactamente; en minúsculas, sin importar mayúsculas).
  const glossary = [
    { k: 'dashboard', t: 'Dashboard (tablero de inicio)', d: 'Tu página de inicio en GitHub. Muestra tus repositorios, tus pull requests y la actividad reciente.', a: ['Dashboard'] },
    { k: 'copilot', t: 'Copilot', d: 'El asistente de inteligencia artificial de GitHub: responde preguntas y ayuda a escribir. No está activo en este simulador.', a: ['Copilot'] },
    { k: 'usuario', t: 'Nombre de usuario', d: 'Tu identificador único en GitHub (por ejemplo, <code>laura-gomez</code>). Aparece en la dirección de tus repositorios: <code>github.com/usuario/repositorio</code>.', a: ['nombre de usuario', 'usuario'] },
    { k: 'perfil', t: 'Perfil', d: 'Tu página pública en GitHub: nombre, foto, repositorios y un calendario de actividad.', a: ['perfil', 'Profile'] },
    { k: 'notificaciones', t: 'Notificaciones', d: 'Avisos que GitHub te envía, por ejemplo cuando alguien te pide revisar un pull request o comenta en tu issue. Llegan a tu bandeja.', a: ['notificaciones', 'notificación', 'bandeja'] },
    { k: 'repositorio', t: 'Repositorio (repository)', d: 'La carpeta de un proyecto en GitHub: guarda sus archivos y todo su historial de cambios. Se identifica como <code>dueño/nombre</code>. También se le dice «repo».', a: ['repositorios', 'repositorio', 'repo', 'Repositories'] },
    { k: 'propietario', t: 'Dueño (owner) y organización', d: 'El dueño es la cuenta a la que pertenece un repositorio. Puede ser una persona o una organización: una cuenta compartida por un grupo, como una empresa o una comunidad.', a: ['organización', 'organizaciones', 'dueño', 'Owner'] },
    { k: 'visibilidad', t: 'Visibilidad: público o privado', d: '<strong>Público</strong> (Public): cualquiera puede verlo. <strong>Privado</strong> (Private): solo las personas invitadas. En ambos casos, solo tú y tus colaboradores pueden cambiarlo.', a: ['visibilidad', 'público', 'pública', 'privado', 'privada', 'Public', 'Private'] },
    { k: 'readme', t: 'README', d: 'El archivo de portada de un repositorio («léeme»). Explica qué es el proyecto y cómo usarlo. GitHub lo muestra automáticamente debajo de la lista de archivos.', a: ['README'] },
    { k: 'markdown', t: 'Markdown (.md)', d: 'Una forma sencilla de escribir texto con formato usando símbolos: <code>#</code> para títulos, <code>-</code> para listas, <code>**texto**</code> para negrita. Los archivos de Markdown terminan en <code>.md</code>.', a: ['Markdown', '.md'] },
    { k: 'plantilla', t: 'Plantilla (template)', d: 'Un repositorio modelo que se copia para empezar uno nuevo con la misma estructura. Opción avanzada.', a: ['plantilla', 'Template'] },
    { k: 'gitignore', t: '.gitignore', d: 'Un archivo con la lista de archivos que no se deben guardar en el repositorio (por ejemplo, archivos temporales). Opción avanzada, usada sobre todo en programación.', a: ['.gitignore'] },
    { k: 'licencia', t: 'Licencia (license)', d: 'Un texto que explica qué pueden hacer otras personas con tu proyecto (usarlo, copiarlo, modificarlo). Opción avanzada.', a: ['licencia', 'license'] },
    { k: 'watch', t: 'Watch (seguir)', d: 'Botón para recibir notificaciones de lo que pasa en un repositorio.', a: ['Watch'] },
    { k: 'fork', t: 'Fork (copia propia)', d: 'Una copia del repositorio de otra persona en tu propia cuenta, para experimentar o proponer cambios sin tocar el original.', a: ['fork'] },
    { k: 'star', t: 'Star (estrella)', d: 'Marcar un repositorio como favorito para encontrarlo luego y mostrar aprecio a sus autores.', a: ['Star', 'estrellas', 'estrella'] },
    { k: 'issue', t: 'Issue', d: 'Una tarjeta para anotar una tarea, una idea o un problema del proyecto, y conversar sobre ella. Se ven en la pestaña Issues.', a: ['issues', 'issue'] },
    { k: 'pullrequest', t: 'Pull request (PR)', d: 'Una propuesta para integrar los cambios de una rama en otra (normalmente en main). Permite revisar, comentar y aprobar antes de unir.', a: ['pull requests', 'pull request', 'PR'] },
    { k: 'actions', t: 'Actions (tareas automáticas)', d: 'Automatizaciones de GitHub: tareas que se ejecutan solas cuando algo cambia en el repositorio, por ejemplo revisar o publicar el proyecto.', a: ['Actions', 'automatizaciones'] },
    { k: 'projects', t: 'Projects (tableros)', d: 'Tableros para planear el trabajo, con tarjetas que se mueven entre columnas como «Por hacer», «En curso» y «Hecho».', a: ['Projects'] },
    { k: 'wiki', t: 'Wiki', d: 'Un espacio de páginas de documentación dentro del repositorio.', a: ['Wiki'] },
    { k: 'security', t: 'Security and quality (seguridad)', d: 'La sección donde GitHub muestra alertas de seguridad y calidad del repositorio.', a: ['Security and quality'] },
    { k: 'insights', t: 'Insights (estadísticas)', d: 'Estadísticas de actividad del repositorio: cuántos cambios, quién participa, etc.', a: ['Insights'] },
    { k: 'settings', t: 'Settings (configuración)', d: 'La configuración de un repositorio: nombre, visibilidad, colaboradores y más. Solo la ven el dueño y los administradores.', a: ['Settings', 'configuración'] },
    { k: 'ruta', t: 'Ruta (breadcrumb)', d: 'La línea que muestra dónde estás dentro del repositorio, por ejemplo <code>recetas / postres / arroz.md</code>. Cada parte se puede pulsar para regresar.', a: ['ruta'] },
    { k: 'blame', t: 'Blame', d: 'Vista de un archivo que muestra, junto a cada línea, quién la cambió por última vez y en qué commit.', a: ['Blame'] },
    { k: 'url', t: 'URL (dirección web)', d: 'La dirección de una página en internet. La de un repositorio es <code>https://github.com/dueño/nombre</code>. Compartir esa URL es compartir el enlace.', a: ['URL', 'dirección web', 'enlace'] },
    { k: 'clonar', t: 'Clonar', d: 'Descargar una copia completa del repositorio a tu computador, con todo su historial. Se hace con la dirección que termina en <code>.git</code>.', a: ['clonar', '.git'] },
    { k: 'https', t: 'HTTPS, SSH y GitHub CLI', d: 'Tres formas técnicas de conectar tu computador con GitHub para clonar. HTTPS es la más común; SSH y GitHub CLI se usan sobre todo en programación.', a: ['HTTPS', 'SSH', 'GitHub CLI'] },
    { k: 'error404', t: 'Error 404', d: 'El mensaje «no encontrado». GitHub lo muestra cuando una dirección no existe o cuando el repositorio es privado y no tienes permiso, para no revelar que existe.', a: ['404'] },
    { k: 'colaborador', t: 'Colaborador', d: 'Una persona invitada a un repositorio. Puede verlo (aunque sea privado) y hacer lo que su rol permita. Se gestionan en Settings → Collaborators.', a: ['colaboradores', 'colaborador', 'Collaborators'] },
    { k: 'roles', t: 'Roles y administradores', d: 'El rol es el nivel de permiso de cada colaborador: <strong>Read</strong> (solo ver), <strong>Triage</strong> (organizar issues), <strong>Write</strong> (subir cambios), <strong>Maintain</strong> (administrar sin acciones peligrosas) y <strong>Admin</strong> (control total). Quien tiene rol Admin es administrador.', a: ['roles', 'rol', 'administradores', 'administrador', 'administran', 'Admin', 'Triage', 'Maintain'] },
    { k: 'dangerzone', t: 'Danger Zone (zona de peligro)', d: 'La parte de Settings con las acciones importantes y difíciles de deshacer: cambiar la visibilidad, transferir, archivar o borrar el repositorio.', a: ['Danger Zone', 'zona de peligro'] },
    { k: 'commit', t: 'Commit', d: 'Un guardado con mensaje. Registra qué cambió, quién lo hizo y cuándo. Cada commit es una versión a la que puedes volver. El botón para hacerlo suele decir <strong>Commit changes</strong>.', a: ['commits', 'commit'] },
    { k: 'historial', t: 'Historial', d: 'La lista de todos los commits de un proyecto, del más reciente al más antiguo. Con <strong>Browse files</strong> ves el proyecto como estaba en cualquier commit.', a: ['historial', 'Browse files'] },
    { k: 'sha', t: 'SHA (código del commit)', d: 'El identificador único de cada commit, como <code>fd7a664</code>. Sirve para referirse a una versión exacta.', a: ['SHA'] },
    { k: 'verified', t: 'Verified', d: 'Etiqueta que indica que GitHub confirmó la identidad de quien hizo el commit.', a: ['Verified'] },
    { k: 'diff', t: 'Diff (comparación)', d: 'La comparación entre dos versiones: en verde lo agregado y en rojo lo eliminado. En un pull request está en la pestaña <strong>Files changed</strong>.', a: ['diff', 'Files changed'] },
    { k: 'main', t: 'main', d: 'El nombre habitual de la rama principal: la versión «oficial» del proyecto. En la lista de ramas lleva la etiqueta <em>default</em>.', a: ['main'] },
    { k: 'rama', t: 'Rama (branch)', d: 'Una copia paralela del proyecto para trabajar sin afectar la versión principal (main). Cuando el trabajo está listo, se une con un merge.', a: ['ramas', 'rama', 'branch'] },
    { k: 'basecompare', t: 'base y compare', d: 'Al comparar ramas, <strong>base</strong> es la rama que recibirá los cambios (normalmente main) y <strong>compare</strong> es la rama que los propone.', a: ['Compare'] },
    { k: 'conflicto', t: 'Conflicto', d: 'Ocurre cuando dos ramas cambiaron la misma parte de un archivo de formas distintas. Hay que decidir a mano qué versión queda antes de unirlas.', a: ['conflictos', 'conflicto'] },
    { k: 'merge', t: 'Merge (fusionar)', d: 'Unir los cambios de una rama con otra. Al hacer merge de un pull request, sus cambios pasan a formar parte de main y el PR queda como <strong>Merged</strong>.', a: ['merge', 'Merged'] },
    { k: 'checks', t: 'Checks', d: 'Revisiones automáticas (hechas con Actions) que comprueban un pull request antes de unirlo.', a: ['Checks'] }
  ];

  // ---------- Retos de exploración libre ----------
  const mine = () => S().myRepos();
  const challenges = [
    ['Marca un repositorio con una estrella ⭐', 'Abre el recetario de la comunidad y pulsa Star.', () => S().visibleRepos().some(r => r.starred)],
    ['Crea un issue para anotar una tarea', 'En tu repositorio: pestaña Issues → New issue.', () => S().visibleRepos().some(r => r.issues.some(i => i.author === S().me()))],
    ['Crea un archivo nuevo desde el navegador', 'Add file → Create new file, escribe algo y guárdalo con un commit.', () => mine().some(r => Object.values(r.commits).some(c => /^Create /.test(c.message) && c.message !== 'Create README.md'))],
    ['Haz un segundo pull request y su merge', 'Crea otra rama, cambia algo, propón el cambio y únelo.', () => mine().reduce((n, r) => n + r.pulls.filter(p => p.state === 'merged').length, 0) >= 2],
    ['Viaja en el tiempo', 'En el historial pulsa Browse files o el ícono &lt;&gt; de un commit antiguo.', () => !!S().state.tutorial.timeTravel],
    ['Deja un comentario', 'Comenta en un issue o pull request (también en los del recetario).', () => S().visibleRepos().some(r => r.issues.concat(r.pulls).some(x => (x.comments || []).some(c => c.author === S().me())))],
    ['Haz un fork del recetario', 'Abre comunidad-demo/recetas-familiares y pulsa Fork.', () => mine().some(r => r.forkOf)]
  ];

  GH.tourContent = { intro, modules, glossary, challenges, ctx, T, howTo };
})(window.GH);
