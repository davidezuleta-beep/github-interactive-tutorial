/* Edit this file to extend the guided course. Events come from app.js. */
(function (G) {
  'use strict';
  const s = (title, text, target, event, hint, place) => ({title, text, target, event, hint, place});
  G.LESSONS = [
    {title: 'Bienvenido a GitHub', icon: 'home', minutes: 3, intro: 'Ubícate en tu nuevo espacio de trabajo.', steps: [
      s('Tu próximo proyecto empieza aquí', 'GitHub es un lugar para guardar proyectos, recordar sus cambios y colaborar. Piensa en una carpeta compartida que conserva su historia. Aquí puedes practicar con tranquilidad: todo es ficticio.', null, null, null, 'home'),
      s('Un menú para orientarte', 'Abre el menú de las tres líneas. Desde ahí puedes volver al inicio y encontrar tus repositorios, tareas y propuestas.', 'global-menu', 'open-nav', 'Busca las tres líneas en la esquina superior izquierda.', 'home'),
      s('Encuentra lo que necesitas', 'Cierra el menú y abre el buscador. Escribe hola para encontrar un proyecto de ejemplo. También puedes buscar archivos.', 'global-search', 'search', 'Pulsa el buscador de la barra superior o la tecla /.', 'home'),
      s('Este es tu perfil de práctica', 'Abre el avatar de la esquina superior derecha. Tu perfil reúne tu identidad y tus proyectos. En este entorno eres Alex: no hay una cuenta real.', 'user-menu', 'open-user', 'Busca el círculo con las letras AR.', 'home')
    ]},
    {title: 'Tu primer repositorio', icon: 'repo', minutes: 4, intro: 'Dale una casa a tu proyecto.', steps: [
      s('Una casa para tus ideas', 'Un repositorio reúne los archivos y las versiones de un proyecto. Abre el menú + y elige New repository.', 'global-create', 'new-repo', 'Pulsa + arriba a la derecha y después New repository.', 'home'),
      s('Hazlo tuyo', 'Escribe un nombre, por ejemplo mi-primer-proyecto, y una descripción. Elige Public o Private, activa Add README y pulsa Create repository. El README será la bienvenida de tu proyecto.', 'repo-name', 'repo-created', 'El nombre puede llevar letras, números y guiones. Un repositorio privado necesita permisos para verlo.', 'new'),
      s('¡Tu proyecto ya tiene una casa!', 'Tu repositorio aparece en tu listado y el README ya tiene su primer commit. No has publicado nada en Internet: lo que hagas aquí permanece en este navegador.', 'repo-title', null, null, 'work')
    ]},
    {title: 'Explorar un proyecto', icon: 'file-directory-fill', minutes: 5, intro: 'Carpetas, archivos y un enlace para compartir.', steps: [
      s('Vamos a abrir una carpeta', 'Ahora visitamos hola-mundo, un proyecto de ejemplo que ya tiene archivos. Abre la carpeta src: guarda la página web del proyecto.', 'folder-src', 'folder-opened', 'Haz clic en src en la lista de archivos.', 'demo'),
      s('Mira dentro de un archivo', 'Abre index.html. Verás su contenido y los números de línea. Leer un archivo no cambia el proyecto.', 'file-src-index', 'file-opened', 'Dentro de src, elige index.html.', 'demo-src'),
      s('El README te da la bienvenida', 'Vuelve a la raíz y abre README.md. Es el lugar ideal para entender qué hace un proyecto y cómo participar.', 'root-link', 'readme-opened', 'Pulsa hola-mundo en la ruta del archivo y luego README.md.', 'demo-file'),
      s('Encuentra el botón Code', 'El botón verde Code reúne las opciones para descargar o clonar un repositorio. Ábrelo para ver la URL.', 'code-button', 'code-opened', 'Vuelve a Code y busca el botón verde sobre los archivos.', 'demo'),
      s('Copia y comparte', 'Copia la URL con el botón de los dos cuadrados. En GitHub real, compartir el enlace de un repositorio privado no concede acceso: la otra persona también necesita una invitación.', 'copy-url', 'url-copied', 'Pulsa el icono de copiar al lado de la URL. En este simulador el enlace representa un proyecto ficticio.', 'demo-code-menu')
    ]},
    {title: 'Archivos y commits', icon: 'upload', minutes: 5, intro: 'Guarda tu trabajo y conserva su historia.', steps: [
      s('Sube tu primer proyecto', 'Volvemos a tu repositorio. Abre Add file y elige Upload files, igual que al subir un proyecto manualmente a GitHub.', 'add-file', 'upload-opened', 'Add file está junto al botón verde Code.', 'work'),
      s('Elige tus archivos', 'Puedes elegir archivos de tu equipo o usar el proyecto de ejemplo. Los archivos se leen solo en este navegador. Todavía no se han guardado en el repositorio.', 'example-files', 'files-selected', 'Pulsa Usar proyecto de ejemplo para practicar sin buscar archivos.', 'work-upload'),
      s('Un commit es una versión con una nota', 'Escribe un mensaje que explique el cambio, por ejemplo Agregar mi primera página, y pulsa Commit changes. Así guardarás estos archivos y una nueva versión.', 'commit-message', 'upload-committed', 'Elige un mensaje que ayude a tu equipo a entender qué agregaste.', 'work-upload'),
      s('Tu proyecto tiene memoria', 'Abre el historial de commits. Cada registro tiene un mensaje y un identificador. Puedes abrir uno para ver sus cambios y consultar esa versión.', 'history-button', 'history-opened', 'Busca el icono del reloj junto al número de commits.', 'work')
    ]},
    {title: 'Trabajar con ramas', icon: 'git-branch', minutes: 6, intro: 'Experimenta sin cambiar la versión principal.', steps: [
      s('Un espacio para experimentar', 'Una rama es una línea de trabajo independiente. Abre el selector main para ver las ramas del proyecto.', 'branch-button', 'branch-opened', 'Busca main encima de la lista de archivos.', 'work-main'),
      s('Crea tu rama', 'Escribe mejora-bienvenida en el buscador de ramas y pulsa Create branch. Empezarás con los mismos archivos que main.', 'branch-search', 'branch-created', 'Escribe un nombre nuevo sin espacios y elige Create branch.', 'work-branch-menu'),
      s('Edita la bienvenida', 'Estás en tu nueva rama. Abre README.md y pulsa el lápiz para editarlo.', 'readme-file', 'edit-opened', 'Abre README.md y después Edit file, el botón con un lápiz.', 'work'),
      s('Guarda una mejora en esta rama', 'Agrega una frase al README, por ejemplo «Estoy aprendiendo a colaborar». Escribe un mensaje y confirma con Commit changes.', 'file-editor', 'edit-committed', 'Cambia el texto antes de guardar. El commit se guardará en la rama que aparece arriba.', 'work-edit'),
      s('Comprueba la independencia', 'Cambia a main y abre README.md. Tu nueva frase no está allí: por ahora vive solo en tu rama.', 'branch-button', 'main-checked', 'En el selector de ramas elige main. Luego abre README.md.', 'work'),
      s('Vuelve a tu mejora', 'Selecciona otra vez tu rama. Ahí encontrarás la versión que acabas de guardar. A continuación la propondremos para integrarla en main.', 'branch-button', 'feature-selected', 'Abre el selector de ramas y vuelve a la que creaste.', 'work')
    ]},
    {title: 'Pull requests y merge', icon: 'git-pull-request', minutes: 6, intro: 'Propón, revisa e integra tus cambios.', steps: [
      s('Comparte una propuesta', 'Un pull request propone integrar una rama en otra. Abre la pestaña Pull requests y pulsa New pull request.', 'tab-pulls', 'compare-opened', 'Pull requests está en la navegación del repositorio.', 'work-feature'),
      s('Explica tu cambio', 'Comprueba que base sea main y compare sea tu rama. Escribe un título y una breve explicación, y pulsa Create pull request.', 'pr-title', 'pr-created', 'El título puede ser Mejorar la bienvenida. Las diferencias aparecen debajo.', 'work-compare'),
      s('Revisa antes de integrar', 'Abre Files changed. Verde significa contenido agregado y rojo contenido retirado. Una revisión ayuda al equipo a comprender y comprobar el cambio.', 'files-changed-tab', 'diff-opened', 'En la propuesta, pulsa Files changed.', 'work-pr'),
      s('Es hora de hacer merge', 'Regresa a Conversation y pulsa Merge pull request. Si no hay conflictos, podrás confirmar la integración. El cambio llegará a main.', 'merge-button', 'merge-opened', 'Merge pull request aparece al final de Conversation.', 'work-pr'),
      s('Confirma la integración', 'Pulsa Confirm merge. El simulador integrará los cambios, registrará un commit de merge y marcará la propuesta como Merged.', 'confirm-merge', 'pr-merged', 'Revisa la rama de destino y confirma.', 'work-merge'),
      s('Una mejora, ahora en main', 'Abre README.md en main y comprueba que contiene tu frase. La rama de trabajo sigue disponible, y la historia del cambio quedó registrada.', 'readme-file', 'merged-readme-opened', 'Abre README.md en la lista de archivos.', 'work-main')
    ]},
    {title: 'Seguridad y administración', icon: 'gear', minutes: 4, intro: 'Decide quién puede ver y colaborar.', steps: [
      s('La administración está en Settings', 'Abre Settings. Aquí se configura el repositorio. En GitHub real, estas opciones dependen de tus permisos.', 'tab-settings', 'settings-opened', 'Settings es la última pestaña del repositorio.', 'work'),
      s('Público o privado', 'En General, busca Danger Zone y pulsa Change visibility. Público significa visible para cualquiera; privado requiere acceso autorizado.', 'change-visibility', 'visibility-opened', 'Desplázate hasta Danger Zone al final de General.', 'work-settings'),
      s('Practica cambiar la visibilidad', 'Elige la otra visibilidad, escribe el nombre del repositorio para confirmar y aplica el cambio. Solo cambiará este proyecto simulado.', 'visibility-name', 'visibility-changed', 'Escribe exactamente el nombre que aparece en el diálogo.', 'work-visibility'),
      s('Un enlace no es una invitación', 'Abre Collaborators y añade a sam-demo. Podrás asignarle lectura o escritura. En un repositorio privado, esta invitación es la que permite acceder; la URL por sí sola no basta.', 'collaborators-nav', 'collaborator-added', 'En Collaborators pulsa Add people y usa un nombre ficticio, como sam-demo.', 'work-settings')
    ]},
    {title: 'Explora por tu cuenta', icon: 'rocket', minutes: 4, intro: 'Tu espacio para practicar con confianza.', steps: [
      s('Pon una idea sobre la mesa', 'Ahora puedes explorar. Prueba a crear un issue con una idea para tu proyecto: abre Issues y pulsa New issue. Las tareas también forman parte de la colaboración.', 'tab-issues', 'issue-created', 'Dale un título a tu idea y pulsa Submit new issue.', 'work'),
      s('Las palabras, siempre a mano', 'Abre el Glosario de la barra educativa. Allí puedes repasar repositorio, commit, rama, pull request y merge con ejemplos cotidianos.', 'glossary-button', 'glossary-opened', 'Glosario está en la pequeña barra superior.'),
      s('Ya puedes seguir por tu cuenta', 'Has practicado el ciclo completo: crear, subir, guardar, experimentar, proponer e integrar. Puedes repetir cualquier módulo o explorar libremente. Tu progreso se conserva en este navegador.', null, null)
    ]}
  ];
})(window.GitSim);
