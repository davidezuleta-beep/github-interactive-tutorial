/*
 * NARRACIÓN CON VOZ (ElevenLabs)
 * ------------------------------
 * Guiones de voz de la guía. Cada clave identifica un paso: '<id del módulo>:<título del paso>'.
 * Las claves especiales son: 'intro:0'…'intro:3' (bienvenida), 'done:<id del módulo>' (cierre),
 * 'hint:N' (pistas cuando se hace clic en otro lugar), 'cheer:N' (felicitaciones), 'welcome:0' (ventana inicial)
 * y 'badge:0', 'level:0', 'challenge:0', 'grad:0' (premios de la gamificación).
 *
 * Cada entrada tiene el texto que se envió a ElevenLabs. El audio se guarda en audio/<archivo>.mp3.
 * Si un paso no tiene audio, el recorrido sigue funcionando solo con texto.
 * Para agregar narración a un paso nuevo: añade aquí su texto, genera el MP3 con la misma voz
 * (Mariana, voice_id GUeHs6BPO7Btpp3ZjcQH, modelo eleven_v4) y guárdalo con el nombre indicado.
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
    ['m1:Este es tu Dashboard', 'm1-01', 'Empecemos. Esta es tu página de inicio en GitHub; se llama Dashboard. El cuadro grande del centro es Copilot, el asistente de inteligencia artificial, que aquí no está activo. Cuando termines de leer, pulsa Continuar.'],
    ['m1:Tu barra de control', 'm1-02', 'Mira abajo a la izquierda: es tu barra de control. Con ella puedes volver atrás, repetir un paso, ver el índice, abrir el glosario o pedir ayuda. Y con el botón Voz me enciendes o me apagas.'],
    ['m1:Las palabras subrayadas', 'm1-03', 'Ahora una práctica rápida. Las palabras con subrayado punteado tienen explicación. Te invito a hacer clic en la palabra Dashboard, dentro del globo.'],
    ['m1:Así funciona el glosario', 'm1-04', '¡Muy bien! A la derecha se abrió el glosario, un diccionario con todas las palabras nuevas. Puedes abrirlo cuando quieras. Pulsa Continuar y seguimos.'],
    ['m1:El buscador', 'm1-05', 'Arriba a la derecha está la lupa: el buscador. Sirve para encontrar proyectos y personas. Haz clic en la lupa.'],
    ['m1:Buscar o saltar a…', 'm1-06', 'Aquí escribirías lo que buscas. Lo usaremos más adelante. Por ahora, ciérralo con la tecla Escape o con la equis.'],
    ['m1:El menú principal', 'm1-07', 'Arriba a la izquierda hay un botón con tres rayitas. Es el menú principal. Ábrelo con un clic.'],
    ['m1:Las secciones de GitHub', 'm1-08', 'Estas son las secciones de GitHub: Home, Issues, Pull requests y Repositories. Las conocerás una a una. Cierra el menú con la equis.'],
    ['m1:Tus repositorios', 'm1-09', 'En esta columna aparecerán tus repositorios, que son tus proyectos. Todavía está vacía, pero muy pronto crearás el primero.'],
    ['m1:Crear algo nuevo', 'm1-10', 'Este botón con el signo más sirve para crear cosas nuevas, como un repositorio. Lo usaremos en el siguiente módulo.'],
    ['m1:Atajos rápidos', 'm1-11', 'Estos cuatro íconos son atajos: tus tareas, tus propuestas, tus repositorios y tus notificaciones.'],
    ['m1:Tu cuenta', 'm1-12', 'Este círculo es tu foto de perfil. Haz clic para abrir el menú de tu cuenta.'],
    ['m1:El menú de tu cuenta', 'm1-13', 'Desde aquí llegas a tu perfil, a tus repositorios y a tus favoritos. Elige Profile.'],
    ['m1:Tu perfil público', 'm1-14', 'Este es tu perfil: lo que otras personas ven de ti. Debajo de tu nombre está tu nombre de usuario, tu identificador único en GitHub. El calendario se pintará de verde cada día que guardes cambios.'],
    ['done:m1', 'done-m1', '¡Excelente! Terminaste el primer módulo. Ya conoces tu página de inicio, el buscador, el menú y tu perfil. Cuando quieras, pasemos al siguiente.'],

    // ---------- Módulo 2 ----------
    ['m2:¿Qué es un repositorio?', 'm2-01', 'Hablemos del concepto más importante: el repositorio. Es la carpeta de un proyecto que guarda sus archivos y también toda su historia: cada versión y quién la cambió.'],
    ['m2:Empieza con el botón +', 'm2-02', 'Vamos a crear tu primer repositorio. Haz clic en el botón con el signo más, arriba a la derecha.'],
    ['m2:Nuevo repositorio', 'm2-03', 'Elige New repository, que significa nuevo repositorio.'],
    ['m2:Ponle nombre', 'm2-04', 'Ponle un nombre corto y sin espacios, por ejemplo: mi primer proyecto, unido con guiones. Si no sabes qué escribir, usa el botón Escribirlo por mí.'],
    ['m2:Describe tu proyecto', 'm2-05', 'La descripción es opcional, pero una frase ayuda a entender de qué se trata tu proyecto. Luego pulsa Continuar.'],
    ['m2:¿Público o privado?', 'm2-06', 'Ahora decide quién puede verlo. Público: cualquiera en internet. Privado: solo tú y las personas que invites. Tranquilo, podrás cambiarlo después.'],
    ['m2:Agrega un README', 'm2-07', 'El README es la portada de tu proyecto: explica qué es y cómo usarlo. Activa el interruptor Add README. Las demás opciones puedes dejarlas como están.'],
    ['m2:¡A crearlo!', 'm2-08', 'Todo listo. Haz clic en el botón verde Create repository.'],
    ['m2:¡Tu repositorio existe! 🎉', 'm2-09', '¡Felicitaciones, ya tienes tu primer repositorio! Arriba está la lista de archivos y abajo se muestra el contenido del README.'],
    ['m2:La parte de arriba del repositorio', 'm2-10', 'Junto al nombre ves si es público o privado. A la derecha hay tres botones: Watch, para recibir avisos; Fork, para hacer tu propia copia; y Star, para marcarlo como favorito.'],
    ['m2:Vuelve al inicio', 'm2-11', 'Ahora vuelve al inicio haciendo clic en el logo del birrete, arriba a la izquierda.'],
    ['m2:Ahí está tu proyecto', 'm2-12', '¿Lo ves? Tu nuevo repositorio ya aparece en tu lista. Así siempre lo encontrarás.'],
    ['done:m2', 'done-m2', '¡Muy bien hecho! Creaste tu primer repositorio con nombre, descripción, visibilidad y README. En el próximo módulo vamos a explorar el proyecto de otras personas.'],

    // ---------- Módulo 3 ----------
    ['m3:Vamos de visita', 'm3-01', 'Ahora vamos de visita. Exploraremos el proyecto de otras personas: un recetario que una comunidad construye entre todos. Primero hay que encontrarlo.'],
    ['m3:Abre el buscador', 'm3-02', 'Abre el buscador con la lupa.'],
    ['m3:Escribe «recetas»', 'm3-03', 'Escribe la palabra recetas en la caja de búsqueda.'],
    ['m3:Ábrelo', 'm3-04', '¡Ahí está! Haz clic en el recetario de la comunidad.'],
    ['m3:La página del proyecto', 'm3-05', 'Fíjate en el nombre completo: primero va el dueño y luego el nombre del repositorio. Aquí el dueño es una organización, una cuenta compartida por un grupo.'],
    ['m3:Las pestañas', 'm3-06', 'Cada pestaña es una sección. Code son los archivos; Issues, las tareas; y Pull requests, las propuestas de cambio. No aparece Settings, porque solo lo ven quienes administran el proyecto.'],
    ['m3:Carpetas y archivos', 'm3-07', 'Esta tabla muestra carpetas y archivos, como en tu computador. En cada fila ves el último cambio y cuándo se hizo.'],
    ['m3:Abre una carpeta', 'm3-08', 'Vamos a entrar. Abre la carpeta postres.'],
    ['m3:¿Dónde estoy?', 'm3-09', 'Esta ruta te dice dónde estás. Puedes hacer clic en cualquier parte de ella para regresar.'],
    ['m3:Abre un archivo', 'm3-10', 'Abre la receta de arroz con leche.'],
    ['m3:Tres formas de ver un archivo', 'm3-11', 'Hay tres formas de ver un archivo. Preview lo muestra con formato; Code, tal como está escrito; y Blame, quién cambió cada línea. Haz clic en Code.'],
    ['m3:El texto «crudo»', 'm3-12', 'Este es el texto original. Los numerales crean títulos y los guiones crean listas. Esta forma sencilla de escribir se llama Markdown.'],
    ['m3:Regresa al inicio del proyecto', 'm3-13', 'Regresa a la página principal del proyecto: haz clic en su nombre, al comienzo de la ruta.'],
    ['m3:El README', 'm3-14', 'Debajo de los archivos aparece el README, la portada que explica el proyecto y cómo participar.'],
    ['m3:El botón Code', 'm3-15', 'El botón verde Code sirve para clonar el proyecto, es decir, descargar una copia, y para obtener su dirección. Haz clic en él.'],
    ['m3:Copia la dirección', 'm3-16', 'Esta es la dirección del repositorio. Cópiala con el ícono de copiar, a la derecha.'],
    ['m3:Compartir el enlace', 'm3-17', 'Para compartir un proyecto, basta con enviar su enlace. Como este repositorio es público, cualquiera puede abrirlo.'],
    ['m3:¿Y si es privado?', 'm3-18', 'Pero, ¿qué pasa con un repositorio privado? Te invito a probarlo: abre el enlace privado con el botón verde del globo.'],
    ['m3:Error 404: no encontrado', 'm3-19', 'GitHub responde con un error cuatrocientos cuatro: no encontrado. Ni siquiera confirma que el proyecto existe. Para entrar, el dueño tiene que invitarte como colaborador.'],
    ['done:m3', 'done-m3', '¡Muy bien! Ya sabes explorar un proyecto, abrir carpetas y archivos, copiar su dirección y entender los repositorios privados.'],

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
  const ready = new Set([
    'welcome-0', 'badge-0', 'level-0', 'challenge-0', 'grad-0',
    'intro-0', 'intro-1', 'intro-2', 'intro-3', 'm1-01', 'm1-02', 'm1-03', 'm1-04',
    'm1-05', 'm1-06', 'm1-07', 'm1-08', 'm1-09', 'm1-10', 'm1-11', 'm1-12',
    'm1-13', 'm1-14', 'done-m1', 'm2-01', 'm2-02', 'm2-03', 'm2-04', 'm2-05',
    'm2-06', 'm2-07', 'm2-08', 'm2-09', 'm2-10', 'm2-11', 'm2-12', 'done-m2',
    'm3-01', 'm3-02', 'm3-03', 'm3-04', 'm3-05', 'm3-06', 'm3-07', 'm3-08',
    'm3-09', 'm3-10', 'm3-11', 'm3-12', 'm3-13', 'm3-14', 'm3-15', 'm3-16',
    'm3-17', 'm3-18', 'm3-19', 'done-m3', 'hint-0', 'hint-1', 'hint-2', 'cheer-0',
    'cheer-1', 'cheer-2'
  ]);
  const map = {};
  lines.forEach(([key, file, text]) => { map[key] = { file, text, src: 'audio/' + file + '.mp3?v=' + (window.ASSET_V || '1'), ready: ready.has(file) }; });
  GH.narration = { lines, map, ready, voice: { name: 'Mariana', voice_id: 'GUeHs6BPO7Btpp3ZjcQH', model: 'eleven_v4' } };
})(window.GH);
