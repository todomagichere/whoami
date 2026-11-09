'use strict';

const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');
filters.forEach(button => {
  button.addEventListener('click', () => {
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    let visible = 0;
    projects.forEach(project => {
      project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
      if (!project.hidden) visible++;
    });
    document.querySelector('#count').textContent = `${visible} proyectos`;
  });
});

const slider = document.querySelector('#sequence-input');
function updateSequence() {
  const n = Number(slider.value);
  const values = [0, 1];
  for (let i = 2; i <= n; i++) values.push(values[i - 1] + values[i - 2]);
  document.querySelector('#n-label').textContent = n;
  document.querySelector('#n-value').textContent = n;
  document.querySelector('#result').textContent = values[n].toLocaleString('es-ES');
  slider.setAttribute('aria-valuetext', `n igual a ${n}, Fibonacci igual a ${values[n]}`);
  document.querySelector('#sequence').textContent = values.join(' · ');
  const bars = values.slice(1).map(value => {
    const bar = document.createElement('span');
    bar.style.height = `${Math.max(3, value / values[n] * 100)}%`;
    return bar;
  });
  document.querySelector('#bars').replaceChildren(...bars);
}
slider.addEventListener('input', updateSequence);
updateSequence();
document.querySelector('#year').textContent = new Date().getFullYear();
