'use strict';

(() => {
  const board = document.querySelector('#snake-board');
  const startButton = document.querySelector('#snake-start');
  const scoreOutput = document.querySelector('#snake-score');
  const bestOutput = document.querySelector('#snake-best');
  const status = document.querySelector('#snake-status');
  const width = 16;
  const cells = Array.from({length: width * width}, () => {
    const cell = document.createElement('i');
    cell.className = 'snake-cell';
    cell.setAttribute('aria-hidden', 'true');
    board.append(cell);
    return cell;
  });
  const vectors = {
    up: {x: 0, y: -1},
    right: {x: 1, y: 0},
    down: {x: 0, y: 1},
    left: {x: -1, y: 0}
  };
  const names = {
    ArrowUp: 'up', w: 'up',
    ArrowRight: 'right', d: 'right',
    ArrowDown: 'down', s: 'down',
    ArrowLeft: 'left', a: 'left'
  };
  const bestKey = 'whoami.snake.best.v1';
  let snake;
  let food;
  let direction;
  let nextDirection;
  let score = 0;
  let best = 0;
  let state = 'ready';
  let timer = null;
  let turnLocked = false;

  try { best = Number(localStorage.getItem(bestKey)) || 0; } catch { /* Storage is optional. */ }
  bestOutput.value = String(best).padStart(3, '0');

  function placeFood() {
    const available = cells.map((_, index) => index).filter(index => !snake.includes(index));
    food = available.length ? available[Math.floor(Math.random() * available.length)] : null;
  }

  function render() {
    cells.forEach(cell => { cell.className = 'snake-cell'; });
    snake.slice(1).forEach(index => cells[index].classList.add('snake-body'));
    if (snake.length) cells[snake[0]].classList.add('snake-head');
    if (food !== null) cells[food].classList.add('snake-food');
    scoreOutput.value = String(score).padStart(3, '0');
  }

  function reset() {
    clearInterval(timer);
    timer = null;
    snake = [136, 135, 134];
    direction = 'right';
    nextDirection = 'right';
    turnLocked = false;
    score = 0;
    state = 'ready';
    placeFood();
    startButton.textContent = 'Empezar partida';
    status.textContent = 'Pulsa Empezar partida. Flechas o WASD para dirigir.';
    render();
  }

  function finish(message) {
    clearInterval(timer);
    timer = null;
    state = 'over';
    startButton.textContent = 'Nueva partida';
    status.textContent = `${message} Puntuación: ${score}. Pulsa Nueva partida para volver a jugar.`;
  }

  function tick() {
    direction = nextDirection;
    turnLocked = false;
    const vector = vectors[direction];
    const head = snake[0];
    const x = head % width + vector.x;
    const y = Math.floor(head / width) + vector.y;
    const next = y * width + x;
    const eating = next === food;
    const body = eating ? snake : snake.slice(0, -1);

    if (x < 0 || x >= width || y < 0 || y >= width || body.includes(next)) {
      finish('Fin de la partida.');
      return;
    }

    snake.unshift(next);
    if (eating) {
      score += 10;
      if (score > best) {
        best = score;
        bestOutput.value = String(best).padStart(3, '0');
        try { localStorage.setItem(bestKey, String(best)); } catch { /* Play without storage. */ }
      }
      if (snake.length === cells.length) {
        render();
        finish('¡Has llenado el tablero!');
        return;
      }
      placeFood();
    } else {
      snake.pop();
    }
    render();
  }

  function startOrPause() {
    if (state === 'running') {
      clearInterval(timer);
      timer = null;
      state = 'paused';
      startButton.textContent = 'Continuar';
      status.textContent = 'Partida en pausa.';
      return;
    }
    if (state === 'paused') {
      state = 'running';
      startButton.textContent = 'Pausar';
      status.textContent = 'En marcha. ¡No choques contigo!';
      timer = setInterval(tick, 125);
      board.focus({preventScroll: true});
      return;
    }
    reset();
    state = 'running';
    startButton.textContent = 'Pausar';
    status.textContent = 'En marcha. ¡No choques contigo!';
    timer = setInterval(tick, 125);
    board.focus({preventScroll: true});
  }

  function turn(name) {
    if (state !== 'running' || turnLocked || !vectors[name]) return;
    const current = vectors[direction];
    const requested = vectors[name];
    if (current.x + requested.x === 0 && current.y + requested.y === 0) return;
    nextDirection = name;
    turnLocked = true;
  }

  board.addEventListener('keydown', event => {
    const name = names[event.key] || names[event.key.toLowerCase()];
    if (name) {
      event.preventDefault();
      turn(name);
    } else if (event.code === 'Space' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      if (state !== 'over') startOrPause();
    }
  });
  startButton.addEventListener('click', startOrPause);
  document.querySelectorAll('[data-snake-direction]').forEach(button => {
    button.addEventListener('click', () => turn(button.dataset.snakeDirection));
  });
  reset();
})();
