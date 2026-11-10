# whoami — portfolio-os

Portfolio de Roberto Pérez Villegas como un ordenador con escritorio inspirado en Linux. Escritorio ampliado, ventanas movibles y redimensionables, terminal didáctica y diez aplicaciones: Archivos, Terminal, Editor de texto, Imágenes, Ajustes, Monitor de aplicaciones, Contactos, Ayuda, Buscaminas y Snake.

## Ver en local

```sh
python3 -m http.server 8081 --bind 127.0.0.1 --directory "$PWD/public"
```

Desde la raíz del repositorio, abre http://localhost:8081. La primera visita muestra el inicio de sesión de invitado. Al entrar, el navegador recuerda la sesión y abre el escritorio ampliado con la terminal lista para escribir; el botón de encendido cierra la sesión. Sin dependencias ni compilación. La interfaz usa Ubuntu Sans, la terminal y el editor JetBrains Mono, y el fondo Bricolage Grotesque. Google Fonts es opcional; hay fuentes de sistema de respaldo.

## Qué probar

- `help`, `whoami`, `neofetch` y `contact`.
- `ls`, `cd proyectos`, `cd etimologia`, `cat README.md`, `cd ~`.
- `open etimologia` abre su ficha con captura y enlaces.
- `open sobre-mi.md` abre el documento en el editor inspirado en gedit.
- Editor: documentos, ajuste de líneas, posición del cursor, edición y guardado; las notas se guardan automáticamente en localStorage y los demás documentos duran durante la visita; Ctrl+S guarda. `cat ~/notas.md` permite leer la nota guardada.
- Menú Aplicaciones con búsqueda; galería de capturas reales; monitor para mostrar o cerrar ventanas.
- Ajustes: diseños Linux, Windows 11 y Windows 3.1; texto pequeño, cómodo o grande (grande por defecto); fondos de color, tres ilustraciones WebP, selector de color libre e imagen propia del dispositivo; reducción de animaciones. Las imágenes se usan localmente, sin subirlas a un servidor.
- Buscaminas: 8×8, diez minas, primer clic seguro, apertura de áreas vacías, banderas, cronómetro, reinicio, victoria y derrota. Clic derecho o F marca; las flechas navegan. En móvil hay un modo banderas. También se abre con `open buscaminas`.
- Snake: partida arcade en una cuadrícula de 16×16, puntuación récord local, controles de flechas o WASD, pausa con espacio y controles táctiles. Se abre con `snake` o `open snake`.
- `fibonacci 12` explica el cálculo.
- Tab para autocompletar, flechas para historial, Ctrl+L para limpiar.
- Mover, minimizar, cerrar y maximizar ventanas; reabrirlas desde el dock.
- Ampliar el monitor; Escape o el botón ↙ del panel para restaurarlo.

La terminal simula un sistema de archivos local. Nunca ejecuta comandos del sistema ni usa `eval`. Las entradas se muestran como texto. No se utilizan cookies ni analítica. `notas.md` se guarda automáticamente en `localStorage` bajo `whoami.notes.v1`, se restaura al cargar y permanece en ese navegador. Si el almacenamiento falla, el editor conserva el texto y muestra que no se ha podido guardar. Los demás documentos, ajustes y fondos personalizados duran hasta recargar la página.

## Archivos

- `public/index.html`: estructura del ordenador y sus ventanas.
- `public/styles.css`: monitor, escritorio, ventanas y versión móvil.
- `public/app.js`: comandos, archivos virtuales, proyectos, almacenamiento de notas, fondos y gestión de ventanas.
- `public/mines.mjs`: lógica del Buscaminas.
- `public/mines-ui.js`: interfaz, controles y cronómetro del Buscaminas.
- `public/snake.js`: partida y controles de Snake.
- `tests/mines.test.mjs`: pruebas de generación, primer clic seguro, banderas, victoria, derrota y reinicio (`node --test tests/mines.test.mjs`).
- `public/assets/`: capturas de proyectos, iconos SVG del dock y fondos WebP.
- `docs/content-sources.md`: fuentes y datos pendientes de confirmar.
- `scripts/build.py`: prepara `dist/` para publicación estática.

## Comprobaciones realizadas

Pruebas en Chrome de entrada y bloqueo, navegación de carpetas, lectura de archivos, rutas inexistentes, Fibonacci y sus límites, salida segura de texto, historial, autocompletado, fichas de proyectos, ampliación de capturas, controles de ventanas y adaptación sin desbordamiento horizontal a 1440, 768, 390 y 320 px.

## Selección y legibilidad

Ocho proyectos: Etimología, Prepara tu mochila, Ibexa Content Type Info, Fibonacci, La gran aventura pirata, Firefox Perplexity Translator, Ibexa Breadcrumbs Bundle y Risk Master. El explorador, la terminal y la galería se generan desde `projects` en `public/app.js`.

No usar tamaños de letra inferiores a **10 px**, tampoco en las reglas para móvil. Los textos principales mantienen tamaños mayores; 10 px es únicamente el mínimo permitido.
