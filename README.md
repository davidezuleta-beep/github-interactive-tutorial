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
js/labels.js            ✏️ NOMBRES DE GITHUB: fuente única de botones, pestañas y secciones
js/store.js             Datos simulados (repositorios, ramas, commits, PR…) y datos de ejemplo
js/ui.js                Encabezado, menús, diálogos, buscador, avisos
js/router.js            Navegación por #/rutas
js/views-*.js           Pantallas (inicio, código, historial, pull requests, configuración…)
js/tour/content.js      ✏️ TEXTOS DEL RECORRIDO: bienvenida, módulos, pasos, glosario y retos
js/tour/engine.js       Motor del recorrido
js/tour/narration.js    🔊 GUIONES DE VOZ
js/tour/voice-manifest.js  Huella del texto de cada audio (la genera tools/voice.mjs)
js/tour/game.js         🏆 Motor de gamificación (puntos, niveles, insignias, desafíos, premio)
js/tour/voice.js        Reproductor de la voz
audio/                  Audios MP3 de la narración (ElevenLabs)
assets/biniac-logo.png  Logo de Biniac (foto de perfil y organización)
tools/check.mjs         Revisión automática del tutorial (ejecutar antes de publicar)
tools/voice.mjs         Estado y regeneración de los audios
tools/bump-version.py   Versión nueva de los archivos (evita la caché)
```

## Si GitHub cambia su interfaz

El tutorial está pensado para que estos cambios sean rápidos y baratos:

| Qué cambió en GitHub | Qué hacer |
|---|---|
| Un botón, una pestaña o una sección **cambió de nombre** | Cambia el texto en `js/labels.js` (una línea). Se actualizan solas las pantallas, los globos, el glosario y los guiones de voz. Revisa la traducción entre paréntesis que acompaña al nombre en los globos, si la hay. Después ejecuta `node tools/voice.mjs` para ver qué audios hay que regenerar. |
| Algo **cambió de lugar, de color o de forma** | Ajusta solo la pantalla correspondiente en `js/views-*.js`. El recorrido encuentra el elemento por su marca `data-tour`, así que los textos y la voz no cambian. |
| Cambió **cómo se hace algo** (más o menos pasos) | Edita los pasos del módulo en `js/tour/content.js` y sus guiones en `js/tour/narration.js`. Cada paso nuevo necesita un `id` fijo. |

Antes de publicar, en este orden:

```
node tools/check.mjs          # revisa ids, etiquetas, guiones y elementos resaltados
node tools/voice.mjs          # dice qué audios están desactualizados o faltan, y cuántos créditos costaría
python3 tools/bump-version.py # versión nueva para que los navegadores no usen archivos viejos
```

**Etiquetas (`js/labels.js`).** Cada nombre visible de GitHub se escribe una sola vez: `addPeople: 'Add people'`. Las pantallas lo usan como `L.addPeople`; los textos del recorrido y los guiones de voz, como `{{addPeople}}`. Algunas etiquetas aceptan un dato: `{{addToRepo:carlos-demo}}` → «Add carlos-demo to this repository». Si escribes una clave que no existe, `tools/check.mjs` lo avisa.

**Identificadores de los pasos.** Cada paso tiene un `id` fijo (por ejemplo `crea-tu-rama`) y su guion de voz se enlaza con `'m5:crea-tu-rama'`. Puedes reescribir el título de un paso sin perder su voz. No cambies un `id` existente.

**Voz con huellas.** Cada audio guarda la huella del texto con que se grabó (en `js/tour/voice-manifest.js`). Si un texto cambia, ya sea porque alguien lo editó o porque cambió una etiqueta, el audio queda desactualizado. Mientras no se regenere, ese paso funciona solo con texto, para no decir algo que ya no coincide con la pantalla.

```
node tools/voice.mjs                    # estado: al día, desactualizados, faltantes y costo estimado
ELEVENLABS_API_KEY=xxxx node tools/voice.mjs generate          # regenera solo lo necesario (pregunta antes de gastar)
node tools/voice.mjs generate --dry-run # muestra qué haría, sin gastar créditos
node tools/voice.mjs accept m7-14       # marca como al día un audio grabado por otra vía (web de ElevenLabs, etc.)
```

La clave de ElevenLabs se pasa solo como variable de entorno en el equipo de quien mantiene el tutorial. Nunca se guarda en el proyecto ni llega al sitio. El costo aproximado es de un crédito por carácter. Si la API no reconoce el modelo, usa `--model <id>` con el identificador que muestra ElevenLabs. Se necesita Node 18 o superior.

## Cómo actualizar o ampliar el tutorial

**Cambiar textos.** Todo el contenido educativo está en `js/tour/content.js`. Edita `title` y `body` de cualquier paso; el HTML básico está permitido (`<strong>`, `<code>`, `<br>`).

**Agregar un paso.** Inserta un objeto en el arreglo `steps` del módulo:

```js
{
  id: 'abre-issues',                  // fijo y único en el módulo
  title: 'Abre la pestaña Issues',
  target: T('tab-issues'),            // elemento con data-tour="tab-issues"
  body: '👉 Haz clic en <strong>{{tabIssues}}</strong>.',
  advance: 'click',                   // 'next' | 'click' | { event } | { route } | { check, auto }
  route: /\/issues$/,                 // opcional: también avanza si la dirección coincide
  hint: 'La pestaña {{tabIssues}} está junto a {{tabCode}}.'
}
```

Para resaltar un elemento nuevo, agrégale `data-tour="nombre"` en la vista correspondiente (`js/views-*.js`) y úsalo con `T('nombre')`. Los eventos disponibles para `advance: { event }` incluyen: `repo:created`, `commit:created`, `branch:created`, `branch:deleted`, `pr:created`, `pr:merged`, `issue:created`, `repo:visibility`, `collaborator:added`, `upload:files-added`, `copied`, `palette:closed`, `drawer:closed`.

**Agregar un módulo.** Añade un objeto a `modules` con `id`, `title`, `icon`, `learn` (resumen final), `prepare()` (deja la pantalla lista; usa `ensureRepo()` o `ensureBranchWithChange()` para crear lo necesario) y `steps`.

**Regla de oro: ningún concepto sin explicación.** Cada término nuevo se explica en palabras sencillas la primera vez que aparece y debe tener su entrada en el glosario.

**Glosario.** Cada entrada de `glossary` es `{ k: 'clave', t: 'Término', d: 'Definición', a: ['variantes', 'que se enlazan'] }`. Todas las variantes (`a`) se convierten automáticamente en enlaces (subrayado punteado) en los globos, los resúmenes, los retos y las definiciones del propio glosario. Una variante con mayúsculas solo se enlaza si coincide exactamente (por ejemplo `PR`, `Settings`); en minúsculas, sin importar mayúsculas. El glosario indica solo en qué módulo aparece cada término por primera vez.

**Instrucciones de uso.** El texto «Cómo usar este tutorial» (diapositiva de bienvenida y botón **Ayuda** de la barra) está en la constante `howTo` de `js/tour/content.js`.

**Narración con voz.** La guía habla con voces de ElevenLabs (voz *Mariana*, `voice_id` `GUeHs6BPO7Btpp3ZjcQH`, modelo `eleven_v4`). Los guiones están en `js/tour/narration.js`: cada línea es `[clave, archivo, texto]`. La clave es `'<id del módulo>:<id del paso>'` o una clave especial (`intro:N`, `done:<módulo>`, `hint:N`, `cheer:N`), y el audio va en `audio/<archivo>.mp3`. Para agregar o cambiar un audio, edita el texto y ejecuta `node tools/voice.mjs generate` (ver «Si GitHub cambia su interfaz»). Los pasos sin audio, o con un audio desactualizado, funcionan solo con texto. La persona puede apagar la voz con el botón **Voz** de la barra; la preferencia se recuerda en su navegador.

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
