/* Fictitious practice content. No data from the reference screenshots. */
window.GitSim = window.GitSim || {};
(function (G) {
  'use strict';
  G.USER = {login: 'alex-demo', name: 'Alex Rivera', initials: 'AR', bio: 'Aprendiendo a crear, compartir y colaborar. Un commit a la vez.', location: 'Planeta Tierra'};
  G.EXAMPLE_FILES = {
    'index.html': '<!doctype html>\n<html lang="es">\n<head>\n  <meta charset="utf-8">\n  <title>Mi primer proyecto</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>¡Hola, mundo!</h1>\n  <p>Este es mi primer proyecto en GitHub.</p>\n  <script src="app.js"></script>\n</body>\n</html>\n',
    'styles.css': 'body {\n  font-family: system-ui, sans-serif;\n  max-width: 720px;\n  margin: 64px auto;\n  color: #1f2328;\n}\n\nh1 { color: #0969da; }\n',
    'app.js': '// Cada proyecto comienza con una idea.\nconst saludo = "¡Hola, mundo!";\nconsole.log(saludo);\n'
  };
  G.GLOSSARY = [
    ['GitHub', 'Un lugar para guardar proyectos, seguir sus cambios y trabajar con otras personas. Puede alojar código, documentos y muchos otros archivos.', 'Como una carpeta compartida con memoria de cada cambio.'],
    ['Repositorio', 'La casa de un proyecto: reúne sus archivos, su historial y las conversaciones del equipo.', 'Una carpeta de recetas con todos sus ingredientes y versiones.'],
    ['README', 'El documento de bienvenida de un repositorio. Suele explicar qué contiene el proyecto y cómo usarlo. Se escribe habitualmente en Markdown.', 'La portada y las instrucciones de tu proyecto.'],
    ['Commit', 'Un registro de cambios guardado en el historial. Incluye un mensaje, un autor y un identificador. Permite saber qué cambió y recuperar una versión anterior.', 'Una foto del estado del proyecto, con una nota que explica el cambio.'],
    ['Rama', 'Una línea de trabajo que empieza a partir de otra. Puedes cambiar sus archivos sin modificar la rama original. La rama principal suele llamarse main.', 'Una copia de trabajo para probar una nueva receta sin cambiar la original.'],
    ['Pull request', 'Una propuesta para incorporar los cambios de una rama en otra. Permite conversar y revisar las diferencias antes de integrarlos.', 'Decirle al equipo: «Preparé estos cambios, ¿los revisamos?»'],
    ['Merge', 'La acción de integrar los cambios de una rama en otra. Si ambas cambiaron de manera incompatible el mismo archivo, primero hay que resolver el conflicto.', 'Unir una mejora revisada a la versión principal del proyecto.'],
    ['Público y privado', 'Un repositorio público puede ser visto por cualquier persona. En uno privado, solo acceden las personas autorizadas. Compartir una URL privada no concede permisos.', 'Público: una biblioteca abierta. Privado: una sala a la que necesitas invitación.'],
    ['Issue', 'Una conversación para registrar una tarea, una pregunta o un problema del proyecto. Se puede comentar y cerrar cuando está resuelto.', 'Una nota de tareas que todo el equipo puede conversar.'],
    ['Fork', 'Una copia de un repositorio en otra cuenta. Permite desarrollar una versión propia y proponer cambios al proyecto original.', 'Tomar una receta compartida y adaptarla en tu propio cuaderno.'],
    ['Git y GitHub', 'Git es la herramienta que registra versiones. GitHub es una plataforma que aloja proyectos Git y agrega colaboración, revisiones y otras funciones.', 'Git lleva la memoria; GitHub ofrece el lugar para compartirla.']
  ];
  G.initialState = function () {
    const files = {
      'src/index.html': G.EXAMPLE_FILES['index.html'],
      'src/styles.css': G.EXAMPLE_FILES['styles.css'],
      'docs/ideas.md': '# Ideas para nuestro proyecto\n\n- Crear una página de bienvenida.\n- Compartir lo que aprendemos.\n- Mejorar el proyecto en equipo.\n',
      '.gitignore': '# Archivos que Git no necesita guardar\n.DS_Store\nnode_modules/\n',
      'README.md': '# Hola, mundo 👋\n\nTodo gran proyecto empieza con un pequeño paso. Este es un espacio para aprender, experimentar y colaborar.\n\n## ¿Qué encontrarás aquí?\n\n- **src/**: los archivos de nuestra página web.\n- **docs/**: ideas y notas del proyecto.\n- **README.md**: esta bienvenida que estás leyendo.\n\n## Nuestro primer objetivo\n\nCrear una página que diga «¡Hola, mundo!» y mejorarla entre todos. No necesitas saber programar para explorar este repositorio.\n\n## Cómo participar\n\n1. Explora los archivos.\n2. Propón una idea en Issues.\n3. Prueba un cambio en una rama.\n4. Compártelo con un pull request.\n\nHecho con curiosidad y ganas de aprender.\n',
      'LICENSE': 'MIT License\n\nCopyright (c) 2026 Alex Demo\n\nEste archivo es un ejemplo educativo.\n'
    };
    const first = {id: 'a1b2c3d', message: 'Initial commit', author: G.USER.login, date: '2026-10-20T14:00:00.000Z', files: {'README.md': files['README.md']}, changes: ['README.md']};
    const second = {id: 'f4e5d6a', message: 'Organizar los archivos del proyecto', author: G.USER.login, date: '2026-10-21T16:30:00.000Z', files: {...files}, changes: Object.keys(files).filter(p => p !== 'README.md')};
    return {version: 1, theme: 'dark', welcomeSeen: false, currentRepo: 'hola',
      repos: [{id: 'hola', name: 'hola-mundo', owner: G.USER.login, description: 'Un pequeño proyecto. Muchas posibilidades.', visibility: 'public', currentBranch: 'main', branches: {main: {files, commits: [second, first], forkPoint: {...files}}}, prs: [], issues: [{id: 1, title: 'Agregar una sección sobre el equipo', body: 'Podemos presentarnos en el README para conocernos mejor.', author: 'sam-demo', state: 'open', comments: []}], collaborators: [], star: false, watch: false, pinned: false, runs: []},
      {id: 'notas', name: 'mis-notas', owner: G.USER.login, description: 'Mi cuaderno de aprendizaje.', visibility: 'private', currentBranch: 'main', branches: {main: {files: {'README.md': '# Mis notas\n\nHoy aprendí que un repositorio es la casa de un proyecto.\n'}, commits: [{id: 'd7a8b9c', message: 'Empezar mi cuaderno', author: G.USER.login, date: '2026-10-22T12:00:00.000Z', files: {'README.md': '# Mis notas\n\nHoy aprendí que un repositorio es la casa de un proyecto.\n'}, changes: ['README.md']}], forkPoint: {}}}, prs: [], issues: [], collaborators: [], star: false, watch: false, pinned: false, runs: []}],
      learning: {mode: 'free', module: 0, step: 0, completed: [], done: {}, repoId: null, branch: null, checkpoints: {}}, notifications: []};
  };
})(window.GitSim);
