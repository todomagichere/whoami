# whoami — portfolio-os

Portfolio de Roberto Pérez Villegas como un ordenador con escritorio inspirado en Linux. Pantalla de entrada, ventanas movibles, terminal didáctica y explorador de proyectos con capturas reales ampliables.

## Ver en local

```sh
python3 -m http.server 8081 --bind 127.0.0.1 --directory "$PWD/public"
```

Desde la raíz del repositorio, abre http://localhost:8081 y pulsa **Entrar a mi ordenador**. Sin dependencias ni compilación. Google Fonts es opcional; hay fuentes de sistema de respaldo.

## Qué probar

- `help`, `whoami`, `neofetch` y `contact`.
- `ls`, `cd proyectos`, `cd etimologia`, `cat README.md`, `cd ~`.
- `open etimologia` abre su ficha con captura y enlaces.
- `fibonacci 12` explica el cálculo.
- Tab para autocompletar, flechas para historial, Ctrl+L para limpiar.
- Mover, minimizar, cerrar y maximizar ventanas; reabrirlas desde el dock.
- Ampliar el monitor; Escape o el botón ↙ del panel para restaurarlo.

La terminal simula un sistema de archivos local. Nunca ejecuta comandos del sistema ni usa `eval`. Las entradas se muestran como texto. No se utilizan cookies, analítica ni almacenamiento persistente.

## Archivos

- `public/index.html`: estructura del ordenador y sus ventanas.
- `public/styles.css`: monitor, escritorio, ventanas y versión móvil.
- `public/app.js`: comandos, archivos virtuales, proyectos y gestión de ventanas.
- `public/assets/`: capturas reales de los proyectos.
- `docs/content-sources.md`: fuentes y datos pendientes de confirmar.
- `scripts/build.py`: prepara `dist/` para publicación estática.

## Comprobaciones realizadas

Pruebas en Chrome de entrada y bloqueo, navegación de carpetas, lectura de archivos, rutas inexistentes, Fibonacci y sus límites, salida segura de texto, historial, autocompletado, fichas de proyectos, ampliación de capturas, controles de ventanas y adaptación sin desbordamiento horizontal a 1440, 768, 390 y 320 px.
