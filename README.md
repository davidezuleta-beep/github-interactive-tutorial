# Simulador interactivo de GitHub

Simulador educativo para que personas sin conocimientos técnicos aprendan a usar GitHub **sin cuenta, sin contraseñas y sin riesgos**. Reproduce la interfaz de GitHub y la acompaña con un recorrido guiado en español.

> Simulador educativo independiente. No está afiliado a GitHub, Inc. Todo ocurre en el navegador de la persona: no hay backend, base de datos ni conexión con repositorios reales.

## Qué incluye

- **Bienvenida** amable: qué es GitHub, para qué sirve, **cómo usar el tutorial** y cómo funciona el simulador (con nombre personalizable).
- **8 módulos guiados** (108 pasos): Dashboard, repositorios, explorar un proyecto, subir archivos y commits, ramas, pull requests y merge, seguridad y administración, y exploración libre.
- **Globos contextuales** con resaltado del elemento, **pistas** cuando se hace clic en el lugar equivocado, y botones **Atrás**, **Repetir paso**, **Repetir módulo** y **Reiniciar todo**.
- **Glosario de 44 términos** enlazado automáticamente: cada palabra nueva se puede pulsar para ver su significado.
- **Narración con voz** (ElevenLabs): la guía habla en la bienvenida y en cada paso de los 8 módulos (130 audios), da pistas en voz alta y felicita al terminar. Se puede pausar, repetir o apagar con el botón **Voz**.
- **Experiencia gamificada diseñada por Biniac**: al entrar, una ventana explica que hay **voz** y que es un **juego** con puntos, misiones (narrativa), niveles, insignias, desafíos y un premio final.
- **Exploración libre** con 7 **retos** que se marcan solos, glosario y acceso al índice de módulos.
- **Simulación funcional**: crear repositorios, subir archivos (de ejemplo o propios, que nunca salen del equipo), editar archivos, commits e historial, ver versiones antiguas, ramas, comparar, pull requests, merge, borrar ramas, issues, comentarios, estrellas, forks, cambiar visibilidad, renombrar, invitar colaboradores y roles.

## Estructura

```
index.html              Página única
css/tokens.css          Colores y tipografía (Primer Primitives, tema oscuro)
css/github.css          Componentes con aspecto de GitHub
css/tour.css            Capa educativa (globos, barra de progreso, panel, bienvenida)
js/icons.js             Subconjunto de Octicons (licencia MIT)
js/util.js              Utilidades: eventos, Markdown, diffs, fechas, almacenamiento
js/store.js             Datos simulados (repositorios, ramas, commits, PR…) y datos de ejemplo
js/ui.js                Encabezado, menús, diálogos, buscador, avisos
js/router.js            Navegación por #/rutas
js/views-*.js           Pantallas (inicio, código, historial, pull requests, configuración…)
js/tour/content.js      ✏️ TEXTOS DEL RECORRIDO: bienvenida, módulos, pasos, glosario y retos
js/tour/engine.js       Motor del recorrido
js/tour/narration.js    🔊 GUIONES DE VOZ y lista de audios disponibles
js/tour/game.js         🏆 Motor de gamificación (puntos, niveles, insignias, desafíos, premio)
js/tour/voice.js        Reproductor de la voz
audio/                  Audios MP3 de la narración (ElevenLabs)
assets/biniac-logo.png  Logo de Biniac (foto de perfil y organización)
```

## Cómo actualizar o ampliar el tutorial

**Cambiar textos.** Todo el contenido educativo está en `js/tour/content.js`. Edita `title` y `body` de cualquier paso; el HTML básico está permitido (`<strong>`, `<code>`, `<br>`).

**Agregar un paso.** Inserta un objeto en el arreglo `steps` del módulo:

```js
{
  title: 'Abre la pestaña Issues',
  target: T('tab-issues'),            // elemento con data-tour="tab-issues"
  body: '👉 Haz clic en <strong>Issues</strong>.',
  advance: 'click',                   // 'next' | 'click' | { event } | { route } | { check, auto }
  route: /\/issues$/,                 // opcional: también avanza si la dirección coincide
  hint: 'La pestaña Issues está junto a Code.'
}
```

Para resaltar un elemento nuevo, agrégale `data-tour="nombre"` en la vista correspondiente (`js/views-*.js`) y úsalo con `T('nombre')`. Los eventos disponibles para `advance: { event }` incluyen: `repo:created`, `commit:created`, `branch:created`, `branch:deleted`, `pr:created`, `pr:merged`, `issue:created`, `repo:visibility`, `collaborator:added`, `upload:files-added`, `copied`, `palette:closed`, `drawer:closed`.

**Agregar un módulo.** Añade un objeto a `modules` con `id`, `title`, `icon`, `learn` (resumen final), `prepare()` (deja la pantalla lista; usa `ensureRepo()` o `ensureBranchWithChange()` para crear lo necesario) y `steps`.

**Regla de oro: ningún concepto sin explicación.** Cada término nuevo se explica en palabras sencillas la primera vez que aparece y debe tener su entrada en el glosario.

**Glosario.** Cada entrada de `glossary` es `{ k: 'clave', t: 'Término', d: 'Definición', a: ['variantes', 'que se enlazan'] }`. Todas las variantes (`a`) se convierten automáticamente en enlaces (subrayado punteado) en los globos, los resúmenes, los retos y las definiciones del propio glosario. Una variante con mayúsculas solo se enlaza si coincide exactamente (por ejemplo `PR`, `Settings`); en minúsculas, sin importar mayúsculas. El glosario indica solo en qué módulo aparece cada término por primera vez.

**Instrucciones de uso.** El texto «Cómo usar este tutorial» (diapositiva de bienvenida y botón **Ayuda** de la barra) está en la constante `howTo` de `js/tour/content.js`.

**Narración con voz.** La guía habla con voces de ElevenLabs (voz *Mariana*, `voice_id` `GUeHs6BPO7Btpp3ZjcQH`, modelo `eleven_v4`). Los guiones están en `js/tour/narration.js`: cada línea es `[clave, archivo, texto]`, donde la clave es `'<id del módulo>:<título exacto del paso>'` (o `intro:N`, `done:<módulo>`, `hint:N`, `cheer:N`). El audio va en `audio/<archivo>.mp3`. Para activar un audio nuevo: genera el MP3 con el mismo texto y la misma voz, guárdalo en `audio/` y añade su nombre de archivo a la lista `ready` de `narration.js`. Los pasos sin audio funcionan solo con texto y no muestran el botón de voz. Si cambias el título de un paso, actualiza también su clave en `narration.js`. La persona puede apagar la voz con el botón **Voz** de la barra (se recuerda en su navegador).

**Gamificación.** Los valores y textos están en la constante `game` de `js/tour/content.js`:
- `story` (la narrativa), `guide` (nombre de la guía) y `missions` (una misión por módulo, con nombre e historia).
- `points`: puntos por paso (`step`), extra por lograrlo a la primera sin pistas (`firstTry`), por misión (`module`) y por desafío (`challenge`).
- `levels`: nombre, ícono y puntos mínimos de cada nivel.
- `badges`: insignias. Las que tienen `module` se ganan al completar esa misión; las que tienen `when` usan una condición (por ejemplo, abrir 8 palabras del glosario).
El progreso del juego se guarda en el navegador (`ghsim:game:v1`) y se borra con **Ajustes → Reiniciar todo**. El premio final (reconocimiento de práctica de Biniac) se desbloquea al completar las 8 misiones.

**Desafíos.** Edita `challenges` (`[título, descripción, función que devuelve true cuando se cumple]`).

**Datos de ejemplo.** El recetario de la comunidad y los demás datos ficticios se definen en la función `seed()` de `js/store.js`.

## Probar localmente

Es un sitio estático: abre `index.html` directamente o sírvelo con cualquier servidor, por ejemplo:

```
python3 -m http.server 8000
```

El progreso se guarda en el `localStorage` del navegador. Desde el panel de ayuda (**Ajustes → Reiniciar todo**) se vuelve al estado inicial.

## Publicación

El sitio se publica con GitHub Pages desde la rama `main` (carpeta raíz). Cualquier cambio que se suba a `main` se publica automáticamente en uno o dos minutos.

**Antes de cada publicación**, ejecuta `python3 tools/bump-version.py`. Pone un número de versión nuevo en los enlaces a estilos, scripts, audios y logo (`?v=…`), así los navegadores descargan los archivos nuevos en lugar de usar los que guardaron en caché.

## Créditos y licencias

- Iconos: [Octicons](https://github.com/primer/octicons) — MIT License, © GitHub Inc. (ver `OCTICONS-LICENSE.txt`).
- Colores: [Primer Primitives](https://github.com/primer/primitives) — MIT License.
- Tipografía: Mona Sans (SIL Open Font License), servida por Google Fonts, con tipografías del sistema como respaldo.
- Logo de Biniac (`assets/biniac-logo.png`): © Biniac, usado por la propia Biniac para firmar la experiencia. Aparece como foto de perfil de la cuenta de práctica y en su perfil (empresa y organización). Para cambiarlo, reemplaza ese archivo o la constante `GH.brandLogo` de `js/util.js`.
- Todos los usuarios, organizaciones y proyectos del simulador son ficticios.
