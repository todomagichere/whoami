# whoami

Primera iteración del portfolio de Roberto Pérez Villegas: un taller editorial con proyectos públicos, filtros y un experimento interactivo de Fibonacci.

## Ver en local

No necesita dependencias ni compilación:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory public
```

Abre http://localhost:8080. También se puede servir `public/` con cualquier servidor estático. Google Fonts es opcional; hay fuentes de sistema de respaldo.

## Editar

- `public/index.html`: textos, proyectos y enlaces.
- `public/styles.css`: dirección visual y adaptación móvil.
- `public/app.js`: filtros y visualización de Fibonacci.
- `docs/content-sources.md`: procedencia y contenido pendiente de confirmar.

Se respetan las preferencias de movimiento reducido y la navegación con teclado. La web no usa analítica, cookies ni credenciales. El contenido está incluido en HTML para que los proyectos se puedan leer sin JavaScript.
