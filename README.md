# GitHub Interactive Tutorial

Simulador educativo de GitHub en español. Reconstruye su interfaz con HTML, CSS y JavaScript y permite practicar sin cuenta, contraseñas, tokens ni repositorios reales.

**[Abrir el simulador](https://davidezuleta-beep.github.io/github-interactive-tutorial/)** · **[Código fuente](https://github.com/davidezuleta-beep/github-interactive-tutorial)**

## Usarlo

Abre el sitio y elige **Comenzar recorrido** o **Prefiero explorar**. El recorrido tiene ocho módulos: bienvenida, repositorios, archivos, commits, ramas, pull requests y merge, seguridad y práctica libre. Las etiquetas principales de la interfaz conservan los nombres que encontrarás en GitHub.

Los cambios y el progreso se conservan en `localStorage`, en la clave `github-educativo-v1`. **Reiniciar** restaura los proyectos ficticios. Los datos son independientes para cada navegador y dispositivo. Si el navegador bloquea el almacenamiento o se llena, aparece un aviso.

La carga de archivos es local: máximo 20 archivos por selección, 256 KB por archivo y 1 MB por selección. Puedes usar el proyecto de ejemplo sin seleccionar archivos de tu equipo. Los documentos cargados se muestran como texto y no se ejecutan. La descarga ZIP incluye los archivos de la rama seleccionada.

## Ejecutarlo localmente

No requiere instalación de dependencias ni compilación. Desde esta carpeta, con Python 3:

```sh
python -m http.server 8000
```

Abre `http://localhost:8000`. También sirve cualquier servidor estático. Es recomendable servirlo por HTTP, ya que el comportamiento del almacenamiento y del portapapeles con `file://` varía entre navegadores.

## Estructura y mantenimiento

| Archivo | Función |
| --- | --- |
| `index.html` | Entrada de la aplicación; carga los recursos locales. |
| `styles.css` | Estilos similares a GitHub, temas oscuro y claro y adaptación de ventanas. |
| `data.js` | Usuario, repositorios, archivos de ejemplo y glosario ficticios. |
| `model.js` | Estado, almacenamiento, validaciones, commits, ramas y merge. |
| `lessons.js` | Los ocho módulos: textos, objetivos, pistas y eventos de avance. |
| `app.js` | Pantallas, navegación, menús, formularios y guía contextual. |
| `icons.js` | Selección local de Primer Octicons. |
| `tests.cjs` | Comprobaciones del modelo; se ejecuta con Node.js sin dependencias. |
| `.nojekyll` | Publicación directa de los recursos estáticos en GitHub Pages. |

Esta versión carga los archivos de la raíz enumerados arriba. Las carpetas `css/` y `js/`, si están presentes en el repositorio, pertenecen a la versión anterior y no se cargan. Su historial se conserva para facilitar comparaciones y recuperaciones.

Para **cambiar una explicación**, edita el texto y la pista del paso correspondiente en `lessons.js`.

Para **agregar un paso**, utiliza la función `s(título, texto, objetivo, evento, pista, preparación)`. `objetivo` coincide con un atributo `data-guide` de la pantalla; `evento` coincide con una llamada `record(...)` en `app.js`. Un evento nulo crea un paso informativo. `preparación` permite llevar al participante a la pantalla adecuada. Los diálogos de merge y visibilidad avanzan automáticamente al paso de confirmación al abrirse, para que el formulario pueda completarse sin cerrar la ventana.

Para **agregar una pantalla**, define su función de renderizado en `app.js` e inclúyela en el mapa de rutas. La navegación utiliza hashes, por lo que funciona en la subcarpeta de un repositorio de GitHub Pages. Mantén todos los recursos con rutas relativas.

Para **cambiar los ejemplos**, edita `data.js`. No reutilices nombres, archivos ni datos privados de capturas de referencia. Si cambias el esquema de almacenamiento, incrementa su versión y añade una migración o una restauración explícita de los datos de práctica.

## Pruebas

```sh
node tests.cjs
```

Las comprobaciones cubren creación y validación, carga de archivos, aislamiento de ramas, pull requests, integración de cambios independientes, conflictos, restauración, persistencia y reinicio. El recorrido completo también se verificó mediante interacciones reales en Chrome: creación privada, navegación, copia de URL, subida, commit, edición en una rama, revisión, merge, visibilidad, colaborador, issue, comentario y glosario.

Después de editar un paso, pruébalo también desde **Ver módulos** y desde **Repetir módulo**. Comprueba la exploración libre, la vuelta al recorrido, el teclado, la recarga y ventanas de poca altura. La guía se aparta cuando un objetivo podría quedar tapado.

## Publicación y actualizaciones

La aplicación está preparada para un repositorio público llamado `github-interactive-tutorial`. En **Settings → Pages**, selecciona **Deploy from a branch**, la rama **main** y la carpeta **/(root)**. Los archivos de esta carpeta deben estar en la raíz del repositorio. Guarda los cambios y espera a que termine el despliegue de Pages.

Para actualizarla, modifica los archivos, repite las pruebas y guarda un nuevo commit en `main`. GitHub Pages volverá a publicar automáticamente. Verifica el enlace público desde una ventana de incógnito.

## Alcance de la simulación

Los commits conservan instantáneas de archivos; las ramas mantienen archivos e historial propios. El merge combina cambios desde el punto de creación de la rama y exige resolver las modificaciones incompatibles de un mismo archivo. La comparación de texto es ilustrativa por líneas; no implementa todos los algoritmos ni funciones de Git.

Issues, comentarios, estrellas, seguimiento, forks de práctica, tablero, colaboradores y releases producen cambios locales. Las ejecuciones de Actions son ilustrativas y están identificadas como tales. Copilot muestra explicaciones predefinidas. Codespaces, Desktop, Packages y el análisis de seguridad se explican sin conectar servicios. Las URL de clonación representan proyectos ficticios; no corresponden a repositorios creados por la aplicación.

## Referencias y créditos

La investigación visual utilizó capturas aportadas por el usuario y la interfaz pública actual de GitHub. No se distribuyen las capturas ni sus datos.

- [Primer: componentes](https://primer.style/product/components/)
- [Primer: Dialog](https://primer.style/product/components/dialog/)
- [Primer Octicons](https://github.com/primer/octicons)
- [GitHub Docs: añadir archivos](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [GitHub Docs: crear pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request)
- [GitHub Docs: visibilidad de repositorios](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)

Experiencia educativa independiente, sin afiliación ni respaldo de GitHub, Inc. GitHub y sus marcas pertenecen a sus respectivos titulares. La licencia de Primer Octicons se incluye en `THIRD_PARTY_LICENSES.txt`.
