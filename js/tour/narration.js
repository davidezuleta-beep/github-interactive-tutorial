/*
 * 🔊 NARRACIÓN CON VOZ (ElevenLabs) — guiones de la guía.
 * --------------------------------------------------------
 * Cada línea es  [clave, archivo, texto]:
 *  - clave: '<id del módulo>:<id del paso>' (el «id» fijo de cada paso en content.js, p. ej. 'm5:crea-tu-rama'),
 *    o una clave especial: 'intro:0'…'intro:3' (bienvenida), 'done:<módulo>' (cierre), 'hint:N' (pistas),
 *    'cheer:N' (felicitaciones), 'welcome:0' (ventana inicial), 'badge:0', 'level:0', 'challenge:0', 'grad:0' (premios).
 *  - archivo: nombre del MP3 en audio/ (sin extensión).
 *  - texto: lo que dice la voz. Puede usar {{clave}} de js/labels.js, por ejemplo «Haz clic en {{addPeople}}».
 *
 * Después de cambiar un texto o una etiqueta, ejecuta  `node tools/voice.mjs`  para ver qué audios quedaron
 * desactualizados y cuántos créditos costaría regenerarlos (ver README). Un audio desactualizado no suena:
 * el paso sigue funcionando solo con texto hasta que se regenere.
 */
(function (GH) {
  'use strict';
  const lines = [
    // ---------- Ventana inicial: experiencia con voz y gamificada (Biniac) ----------
    ['welcome:0', 'welcome-0', '¡Hola! Soy Mariana, tu guía de Biniac. Esta experiencia tiene voz: te voy a hablar en cada paso, así que sube el volumen. Y también es un juego: cada paso te da puntos, cada misión te da una insignia y, al final, tendrás desafíos y un premio. Cuando estés listo o lista, pulsa: ¡Acepto la misión!'],
    // ---------- Premios ----------
    ['badge:0', 'badge-0', '¡Misión cumplida! Ganaste una insignia nueva.'],
    ['level:0', 'level-0', '¡Subiste de nivel! Vas muy bien, sigue así.'],
    ['challenge:0', 'challenge-0', '¡Desafío superado! Sumaste puntos.'],
    ['grad:0', 'grad-0', '¡Felicitaciones! Completaste las ocho misiones. Ya eres parte de la comunidad. Abre tus logros para ver tus insignias y tu reconocimiento de Biniac.'],

    // ---------- Bienvenida ----------
    ['intro:0', 'intro-0', '¡Hola! Bienvenido a tu práctica de GitHub. Soy tu guía y voy a acompañarte paso a paso. GitHub es un sitio web donde las personas y los equipos guardan sus proyectos, ven cómo cambian con el tiempo y trabajan juntos sin pisarse.'],
    ['intro:1', 'intro-1', 'Aunque GitHub nació para programadores, hoy lo usan equipos de todo tipo: para manuales, documentos, páginas web y proyectos con inteligencia artificial. Tranquilo: no necesitas saber programar.'],
    ['intro:2', 'intro-2', 'Así funciona: yo te hablo y, al mismo tiempo, un globo te muestra el texto. Haz clic en lo que tenga un borde azul brillante. Si una palabra está subrayada, tócala para ver qué significa. Te recomiendo dejar el sonido encendido; si prefieres leer en silencio, apágalo con el botón Voz de la barra de abajo.'],
    ['intro:3', 'intro-3', 'Esto es un simulador seguro: puedes equivocarte sin miedo. Si quieres, escribe tu nombre para personalizar tu cuenta de práctica, y luego pulsa Empezar el recorrido guiado.'],

    // ---------- Módulo 1 ----------
    ['m1:este-es-tu-dashboard', 'm1-01', 'Empecemos. Esta es tu página de inicio en GitHub; se llama {{dashboard}}. El cuadro grande del centro es Copilot, el asistente de inteligencia artificial, que aquí no está activo. Cuando termines de leer, pulsa Continuar.'],
    ['m1:tu-barra-de-control', 'm1-02', 'Mira abajo a la izquierda: es tu barra de control. Con ella puedes volver atrás, repetir un paso, ver el índice, abrir el glosario o pedir ayuda. Y con el botón Voz me enciendes o me apagas.'],
    ['m1:las-palabras-subrayadas', 'm1-03', 'Ahora una práctica rápida. Las palabras con subrayado punteado tienen explicación. Te invito a hacer clic en la palabra {{dashboard}}, dentro del globo.'],
    ['m1:asi-funciona-el-glosario', 'm1-04', '¡Muy bien! A la derecha se abrió el glosario, un diccionario con todas las palabras nuevas. Puedes abrirlo cuando quieras. Pulsa Continuar y seguimos.'],
    ['m1:el-buscador', 'm1-05', 'Arriba a la derecha está la lupa: el buscador. Sirve para encontrar proyectos y personas. Haz clic en la lupa.'],
    ['m1:buscar-o-saltar-a', 'm1-06', 'Aquí escribirías lo que buscas. Lo usaremos más adelante. Por ahora, ciérralo con la tecla Escape o con la equis.'],
    ['m1:el-menu-principal', 'm1-07', 'Arriba a la izquierda hay un botón con tres rayitas. Es el menú principal. Ábrelo con un clic.'],
    ['m1:las-secciones-de-github', 'm1-08', 'Estas son las secciones de GitHub: {{home}}, {{tabIssues}}, {{tabPulls}} y {{repositories}}. Las conocerás una a una. Cierra el menú con la equis.'],
    ['m1:tus-repositorios', 'm1-09', 'En esta columna aparecerán tus repositorios, que son tus proyectos. Todavía está vacía, pero muy pronto crearás el primero.'],
    ['m1:crear-algo-nuevo', 'm1-10', 'Este botón con el signo más sirve para crear cosas nuevas, como un repositorio. Lo usaremos en el siguiente módulo.'],
    ['m1:atajos-rapidos', 'm1-11', 'Estos cuatro íconos son atajos: tus tareas, tus propuestas, tus repositorios y tus notificaciones.'],
    ['m1:tu-cuenta', 'm1-12', 'Este círculo es tu foto de perfil. Haz clic para abrir el menú de tu cuenta.'],
    ['m1:el-menu-de-tu-cuenta', 'm1-13', 'Desde aquí llegas a tu perfil, a tus repositorios y a tus favoritos. Elige {{profile}}.'],
    ['m1:tu-perfil-publico', 'm1-14', 'Este es tu perfil: lo que otras personas ven de ti. Debajo de tu nombre está tu nombre de usuario, tu identificador único en GitHub. El calendario se pintará de verde cada día que guardes cambios.'],
    ['done:m1', 'done-m1', '¡Excelente! Terminaste el primer módulo. Ya conoces tu página de inicio, el buscador, el menú y tu perfil. Cuando quieras, pasemos al siguiente.'],

    // ---------- Módulo 2 ----------
    ['m2:que-es-un-repositorio', 'm2-01', 'Hablemos del concepto más importante: el repositorio. Es la carpeta de un proyecto que guarda sus archivos y también toda su historia: cada versión y quién la cambió.'],
    ['m2:empieza-con-el-boton', 'm2-02', 'Vamos a crear tu primer repositorio. Haz clic en el botón con el signo más, arriba a la derecha.'],
    ['m2:nuevo-repositorio', 'm2-03', 'Elige {{newRepo}}, que significa nuevo repositorio.'],
    ['m2:ponle-nombre', 'm2-04', 'Ponle un nombre corto y sin espacios, por ejemplo: mi primer proyecto, unido con guiones. Si no sabes qué escribir, usa el botón Escribirlo por mí.'],
    ['m2:describe-tu-proyecto', 'm2-05', 'La descripción es opcional, pero una frase ayuda a entender de qué se trata tu proyecto. Luego pulsa Continuar.'],
    ['m2:publico-o-privado', 'm2-06', 'Ahora decide quién puede verlo. Público: cualquiera en internet. Privado: solo tú y las personas que invites. Tranquilo, podrás cambiarlo después.'],
    ['m2:agrega-un-readme', 'm2-07', 'El README es la portada de tu proyecto: explica qué es y cómo usarlo. Activa el interruptor {{addReadme}}. Las demás opciones puedes dejarlas como están.'],
    ['m2:a-crearlo', 'm2-08', 'Todo listo. Haz clic en el botón verde {{createRepo}}.'],
    ['m2:tu-repositorio-existe', 'm2-09', '¡Felicitaciones, ya tienes tu primer repositorio! Arriba está la lista de archivos y abajo se muestra el contenido del README.'],
    ['m2:la-parte-de-arriba-del-repositorio', 'm2-10', 'Junto al nombre ves si es público o privado. A la derecha hay tres botones: {{watch}}, para recibir avisos; {{fork}}, para hacer tu propia copia; y {{star}}, para marcarlo como favorito.'],
    ['m2:vuelve-al-inicio', 'm2-11', 'Ahora vuelve al inicio haciendo clic en el logo del birrete, arriba a la izquierda.'],
    ['m2:ahi-esta-tu-proyecto', 'm2-12', '¿Lo ves? Tu nuevo repositorio ya aparece en tu lista. Así siempre lo encontrarás.'],
    ['done:m2', 'done-m2', '¡Muy bien hecho! Creaste tu primer repositorio con nombre, descripción, visibilidad y README. En el próximo módulo vamos a explorar el proyecto de otras personas.'],

    // ---------- Módulo 3 ----------
    ['m3:vamos-de-visita', 'm3-01', 'Ahora vamos de visita. Exploraremos el proyecto de otras personas: un recetario que una comunidad construye entre todos. Primero hay que encontrarlo.'],
    ['m3:abre-el-buscador', 'm3-02', 'Abre el buscador con la lupa.'],
    ['m3:escribe-recetas', 'm3-03', 'Escribe la palabra recetas en la caja de búsqueda.'],
    ['m3:abrelo', 'm3-04', '¡Ahí está! Haz clic en el recetario de la comunidad.'],
    ['m3:la-pagina-del-proyecto', 'm3-05', 'Fíjate en el nombre completo: primero va el dueño y luego el nombre del repositorio. Aquí el dueño es una organización, una cuenta compartida por un grupo.'],
    ['m3:las-pestanas', 'm3-06', 'Cada pestaña es una sección. {{tabCode}} son los archivos; {{tabIssues}}, las tareas; y {{tabPulls}}, las propuestas de cambio. No aparece {{tabSettings}}, porque solo lo ven quienes administran el proyecto.'],
    ['m3:carpetas-y-archivos', 'm3-07', 'Esta tabla muestra carpetas y archivos, como en tu computador. En cada fila ves el último cambio y cuándo se hizo.'],
    ['m3:abre-una-carpeta', 'm3-08', 'Vamos a entrar. Abre la carpeta postres.'],
    ['m3:donde-estoy', 'm3-09', 'Esta ruta te dice dónde estás. Puedes hacer clic en cualquier parte de ella para regresar.'],
    ['m3:abre-un-archivo', 'm3-10', 'Abre la receta de arroz con leche.'],
    ['m3:tres-formas-de-ver-un-archivo', 'm3-11', 'Hay tres formas de ver un archivo. {{preview}} lo muestra con formato; {{tabCode}}, tal como está escrito; y {{blame}}, quién cambió cada línea. Haz clic en {{tabCode}}.'],
    ['m3:el-texto-crudo', 'm3-12', 'Este es el texto original. Los numerales crean títulos y los guiones crean listas. Esta forma sencilla de escribir se llama Markdown.'],
    ['m3:regresa-al-inicio-del-proyecto', 'm3-13', 'Regresa a la página principal del proyecto: haz clic en su nombre, al comienzo de la ruta.'],
    ['m3:el-readme', 'm3-14', 'Debajo de los archivos aparece el README, la portada que explica el proyecto y cómo participar.'],
    ['m3:el-boton-code', 'm3-15', 'El botón verde {{codeBtn}} sirve para clonar el proyecto, es decir, descargar una copia, y para obtener su dirección. Haz clic en él.'],
    ['m3:copia-la-direccion', 'm3-16', 'Esta es la dirección del repositorio. Cópiala con el ícono de copiar, a la derecha.'],
    ['m3:compartir-el-enlace', 'm3-17', 'Para compartir un proyecto, basta con enviar su enlace. Como este repositorio es público, cualquiera puede abrirlo.'],
    ['m3:y-si-es-privado', 'm3-18', 'Pero, ¿qué pasa con un repositorio privado? Te invito a probarlo: abre el enlace privado con el botón verde del globo.'],
    ['m3:error-404-no-encontrado', 'm3-19', 'GitHub responde con un error cuatrocientos cuatro: no encontrado. Ni siquiera confirma que el proyecto existe. Para entrar, el dueño tiene que invitarte como colaborador.'],
    ['done:m3', 'done-m3', '¡Muy bien! Ya sabes explorar un proyecto, abrir carpetas y archivos, copiar su dirección y entender los repositorios privados.'],

    // ---------- Módulo 4 ----------
    ['m4:que-es-un-commit', 'm4-01', 'Empieza una nueva misión: dejar tu huella. Un commit es un guardado con nota: GitHub registra qué cambió, quién lo hizo, cuándo y un mensaje que lo explica. Es como tomarle una foto al proyecto.'],
    ['m4:agregar-archivos', 'm4-02', 'Estás en tu repositorio. Haz clic en el botón con el signo más, que dice {{addFile}}, para agregar archivos.'],
    ['m4:subir-archivos', 'm4-03', '{{createNewFile}} crea un archivo escribiéndolo aquí mismo. {{uploadFiles}} sube archivos de tu computador. Elige {{uploadFiles}}.'],
    ['m4:elige-que-subir', 'm4-04', 'Normalmente arrastrarías tus archivos a este recuadro. Para practicar, usa nuestros archivos de ejemplo: un plan de trabajo, un presupuesto y una imagen.'],
    ['m4:listos-para-subir', 'm4-05', 'Estos son los archivos que se van a agregar. Si te equivocaste, puedes quitar uno con la equis.'],
    ['m4:escribe-el-mensaje-del-commit', 'm4-06', 'Todo commit lleva un mensaje. Explica en pocas palabras qué estás guardando, por ejemplo: agrego plan de trabajo y presupuesto. Un buen mensaje ayuda a todo tu equipo.'],
    ['m4:donde-se-guarda', 'm4-07', 'Todo proyecto tiene una versión principal llamada main. Esta opción guarda directamente en ella. La palabra branch significa rama; la conocerás en la próxima misión.'],
    ['m4:guarda-los-cambios', 'm4-08', 'Haz clic en el botón verde {{commitChanges}} para guardar los cambios.'],
    ['m4:archivos-subidos', 'm4-09', '¡Listo, tus archivos ya están en el repositorio! Arriba ves tu commit, con tu nombre de usuario y tu mensaje.'],
    ['m4:ver-el-historial', 'm4-10', 'Ahora veamos el historial. Haz clic en el reloj que dice {{commits}}.'],
    ['m4:el-historial-de-versiones', 'm4-11', 'Cada tarjeta es un commit, del más reciente al más antiguo. A la derecha hay un código corto: es su identificador único, llamado SHA.'],
    ['m4:abre-tu-commit', 'm4-12', 'Haz clic en el mensaje de tu commit, el que está arriba.'],
    ['m4:que-cambio-exactamente', 'm4-13', 'Las líneas en verde se agregaron y las rojas se eliminaron. Esta comparación se llama diff y permite revisar un cambio línea por línea.'],
    ['m4:viajar-en-el-tiempo', 'm4-14', 'Con {{browseFiles}} ves el proyecto exactamente como estaba en ese commit. Por eso nada se pierde: cada versión queda guardada.'],
    ['done:m4', 'done-m4', "¡Misión cumplida! Ya sabes subir archivos, guardar cambios con commits y viajar por el historial. Nada se pierde en GitHub."],

    // ---------- Módulo 5 ----------
    ['m5:que-es-una-rama', 'm5-01', 'Nueva misión: un espacio para probar. Una rama es una copia paralela del proyecto donde haces cambios sin tocar la versión principal, main. Es como escribir un borrador.'],
    ['m5:el-selector-de-ramas', 'm5-02', 'Este botón indica en qué rama estás: main. Haz clic en él.'],
    ['m5:crea-tu-rama', 'm5-03', 'Aquí puedes cambiar de rama o crear una nueva. Escribe el nombre de tu rama, por ejemplo: mejoras readme, unido con un guion.'],
    ['m5:confirmalo', 'm5-04', 'Tu rama empezará como una copia exacta de main. Haz clic en {{createBranch}}.'],
    ['m5:ya-estas-en-tu-rama', 'm5-05', '¡Muy bien! El botón ahora muestra el nombre de tu rama. Todo lo que cambies aquí no afectará a main.'],
    ['m5:edita-el-readme', 'm5-06', 'Vamos a cambiar algo. Haz clic en el lápiz para editar el README.'],
    ['m5:escribe-tu-cambio', 'm5-07', 'Este es el editor. Agrega una línea al final, por ejemplo: Este proyecto lo trabajamos en equipo.'],
    ['m5:guarda-en-tu-rama', 'm5-08', 'Para guardar el cambio harás un commit, como en la misión anterior. Haz clic en {{commitChanges}}.'],
    ['m5:confirma-el-commit', 'm5-09', 'GitHub te propone un mensaje; puedes dejarlo o mejorarlo. Fíjate que el cambio quedará solo en tu rama. Haz clic en {{commitChanges}}.'],
    ['m5:tu-cambio-en-tu-rama', 'm5-10', 'Así se ve el README en tu rama, con tu línea nueva al final.'],
    ['m5:vuelve-a-main', 'm5-11', 'Ahora comprobemos la rama principal. Abre otra vez el selector de ramas.'],
    ['m5:elige-main', 'm5-12', 'La etiqueta {{defaultLabel}} indica que main es la rama principal. Haz clic en main.'],
    ['m5:main-no-cambio', 'm5-13', 'En main el README sigue igual: tu cambio vive solo en tu rama. Cada rama es independiente hasta que decidas unirlas, y eso harás en la próxima misión.'],
    ['done:m5', 'done-m5', "¡Excelente! Ya sabes crear una rama y trabajar en ella sin tocar la versión principal. En la próxima misión vas a unir tus cambios."],

    // ---------- Módulo 6 ----------
    ['m6:que-es-un-pull-request', 'm6-01', 'Nueva misión: propón y une. Un pull request es una propuesta: hice estos cambios en mi rama, ¿los revisamos antes de unirlos a main? Esa unión se llama merge.'],
    ['m6:github-te-lo-sugiere', 'm6-02', 'GitHub detectó cambios recientes en tu rama y te ofrece proponerlos. Haz clic en Compare and pull request.'],
    ['m6:hacia-donde-van-los-cambios', 'm6-03', 'Esto significa: llevar los cambios de tu rama hacia main. {{ableToMerge}} indica que se pueden unir sin conflictos.'],
    ['m6:un-titulo-claro', 'm6-04', 'Dale a tu propuesta un título claro, por ejemplo: Presento al equipo en el README.'],
    ['m6:explica-tu-propuesta', 'm6-05', 'Cuenta qué cambiaste y por qué. Así quien revisa entiende el contexto.'],
    ['m6:revisa-antes-de-proponer', 'm6-06', 'Abajo se muestra la comparación: en verde, la línea que agregaste.'],
    ['m6:crea-el-pull-request', 'm6-07', 'Todo listo. Haz clic en {{createPr}}.'],
    ['m6:tu-propuesta-esta-abierta', 'm6-08', '¡Tu propuesta está abierta! La etiqueta verde {{open}} indica que espera revisión. En un equipo real, tus compañeros recibirían un aviso.'],
    ['m6:las-pestanas-del-pull-request', 'm6-09', 'Cada pestaña muestra algo distinto: la conversación, los commits, las revisiones automáticas y los archivos cambiados. Abre {{filesChanged}}.'],
    ['m6:revision-linea-por-linea', 'm6-10', 'Aquí el equipo revisa cada cambio y puede dejar comentarios antes de aprobar.'],
    ['m6:volver-a-la-conversacion', 'm6-11', 'Regresa a la pestaña {{conversation}}.'],
    ['m6:hora-de-unir-los-cambios', 'm6-12', 'GitHub confirma que no hay conflictos. Haz clic en {{mergePr}}.'],
    ['m6:confirma-el-merge', 'm6-13', 'Al hacer merge, GitHub crea un commit especial que une las dos ramas. Haz clic en {{confirmMerge}}.'],
    ['m6:merge-completado', 'm6-14', '¡Merge completado! Los cambios ya están en main. Tu rama cumplió su propósito, así que puedes borrarla sin perder nada. Haz clic en {{deleteBranch}}.'],
    ['m6:comprueba-el-resultado', 'm6-15', 'Comprobemos el resultado. Vuelve a la pestaña {{tabCode}}.'],
    ['m6:main-ya-tiene-tu-cambio', 'm6-16', 'El README de main ahora incluye tu línea. Así se trabaja en equipo: cada quien en su rama, se revisa con un pull request y se une con un merge.'],
    ['done:m6', 'done-m6', "¡Muy bien! Propusiste un cambio con un pull request y lo uniste con un merge. Así trabajan los equipos en GitHub."],

    // ---------- Módulo 7 ----------
    ['m7:quien-ve-y-quien-cambia', 'm7-01', 'Nueva misión: guardián del proyecto. Cada repositorio tiene su configuración, llamada {{tabSettings}}. Solo la ven el dueño y los administradores, y como el repositorio es tuyo, tú lo administras.'],
    ['m7:abre-settings', 'm7-02', 'Haz clic en la pestaña {{tabSettings}}.'],
    ['m7:las-secciones-de-configuracion', 'm7-03', 'Nos interesan dos secciones: {{general}}, donde está la visibilidad, y {{collaborators}}, donde decides quién tiene acceso.'],
    ['m7:la-zona-de-peligro', 'm7-04', 'La {{dangerZone}} agrupa las decisiones importantes, como cambiar la visibilidad o borrar el repositorio. Por eso GitHub pide varias confirmaciones.'],
    ['m7:cambiar-la-visibilidad', 'm7-05', 'Vamos a cambiar quién puede ver tu repositorio. Haz clic en {{changeVisibility}}.'],
    ['m7:elige-la-opcion', 'm7-06', 'Elige la opción que te muestra el globo.'],
    ['m7:primera-confirmacion', 'm7-07', 'GitHub te avisa qué vas a cambiar. Confirma con el botón rojo.'],
    ['m7:lee-los-efectos', 'm7-08', 'Antes de seguir, GitHub explica las consecuencias del cambio. Léelas con calma y luego pulsa: {{iUnderstand}}.'],
    ['m7:escribe-el-nombre-para-confirmar', 'm7-09', 'Para evitar accidentes, GitHub pide escribir el nombre completo del repositorio. Escríbelo tal como aparece en el globo, o usa el botón Escribirlo por mí.'],
    ['m7:ultimo-paso', 'm7-10', 'Haz clic en el botón rojo para aplicar el cambio.'],
    ['m7:cambio-aplicado', 'm7-11', '¡Cambio aplicado! La etiqueta junto al nombre muestra la nueva visibilidad de tu repositorio.'],
    ['m7:gestionar-accesos', 'm7-12', 'Ahora decidamos quién tiene acceso. Abre {{collaborators}}.'],
    ['m7:quien-tiene-acceso', 'm7-13', 'A la izquierda ves si el repositorio es público o privado. A la derecha, cuántas personas tienen acceso directo. Por ahora, solo tú.'],
    ['m7:invita-a-alguien', 'm7-14', 'Vamos a invitar a alguien. Haz clic en {{addPeople}}.'],
    ['m7:busca-a-la-persona', 'm7-15', 'Escribe carlos. En GitHub real buscarías a la persona por su nombre de usuario o su correo.'],
    ['m7:seleccionala', 'm7-16', 'Haz clic en carlos demo.'],
    ['m7:envia-la-invitacion', 'm7-17', 'Haz clic en el botón para agregar a Carlos a este repositorio.'],
    ['m7:invitacion-enviada', 'm7-18', 'Carlos recibió una invitación. Cuando la acepte podrá hacer lo que su rol permita: desde solo ver, con {{roleRead}}, hasta el control total, con {{roleAdmin}}.'],
    ['m7:en-resumen', 'm7-19', 'En resumen: un repositorio público lo ve cualquiera; uno privado, solo las personas invitadas. Regla de oro: si tiene información interna o personal, hazlo privado.'],
    ['done:m7', 'done-m7', "¡Misión cumplida! Ya sabes cambiar la visibilidad de tu repositorio e invitar colaboradores. Ahora tú decides quién ve y quién cambia."],

    // ---------- Módulo 8 ----------
    ['m8:completaste-el-recorrido', 'm8-01', '¡Completaste el recorrido! Ya conoces lo esencial de GitHub. Ahora explora a tu ritmo: en la barra tienes tus logros con los desafíos, el glosario y el recorrido guiado.'],

    // ---------- Frases de apoyo ----------
    ['hint:0', 'hint-0', 'Ese no es el lugar. Busca el elemento con el borde azul brillante.'],
    ['hint:1', 'hint-1', 'Casi. Mira el globo: ahí te digo exactamente dónde hacer clic.'],
    ['hint:2', 'hint-2', 'No te preocupes, no se rompió nada. Intenta con lo que está resaltado en azul.'],
    ['cheer:0', 'cheer-0', '¡Muy bien!'],
    ['cheer:1', 'cheer-1', '¡Perfecto, así se hace!'],
    ['cheer:2', 'cheer-2', '¡Excelente, sigamos!']
  ];
  // Audios ya grabados y guardados en audio/. Solo estos pasos muestran el botón de voz;
  // los demás funcionan con texto. Al agregar un MP3 nuevo, añade aquí su nombre de archivo.
  const voice = { name: 'Mariana', voice_id: 'GUeHs6BPO7Btpp3ZjcQH', model: 'eleven_v4' };

  // Huella de un guion: si cambia el texto (o la voz, o el modelo), cambia la huella.
  // La misma función la usa tools/voice.mjs para saber qué audios quedaron desactualizados.
  function fingerprint(text) {
    const str = voice.voice_id + '|' + voice.model + '|' + String(text).normalize('NFC').trim();
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  // Los guiones pueden usar {{clave}} (js/labels.js); aquí se convierten en el texto que se graba.
  lines.forEach((l) => { l[2] = GH.labels.text(l[2]); });

  // Un audio solo suena si su huella grabada (js/tour/voice-manifest.js) coincide con el guion actual.
  // Si alguien cambia un texto y aún no regenera el audio, ese paso queda solo con texto en vez de decir algo desactualizado.
  const manifest = GH.voiceManifest || {};
  const map = {};
  lines.forEach(([key, file, text]) => {
    const rec = manifest[file];
    map[key] = { file, text, src: 'audio/' + file + '.mp3?v=' + (window.ASSET_V || '1'), ready: !!rec && rec.h === fingerprint(text) };
  });
  GH.narration = { lines, map, voice, fingerprint };
})(window.GH);
