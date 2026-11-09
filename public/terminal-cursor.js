(() => {
  const input = document.querySelector('#command-input');
  const cursor = document.querySelector('#terminal-cursor');
  const field = document.querySelector('.command-field');
  const measure = document.createElement('canvas').getContext('2d');
  let frame = 0;
  let composing = false;

  function update() {
    frame = 0;
    cursor.hidden = document.activeElement !== input || composing ||
      input.selectionStart !== input.selectionEnd;
    if (cursor.hidden) return;

    const style = getComputedStyle(input);
    measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    cursor.style.font = measure.font;
    const before = input.value.slice(0, input.selectionStart);
    const position = measure.measureText(before).width - input.scrollLeft + parseFloat(style.paddingLeft);
    cursor.style.left = `${position}px`;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  // Keep the native input for keyboard, selection, clipboard and accessibility.
  // Only its visual caret is replaced, including after history/autocomplete updates.
  for (const event of ['input', 'keyup', 'click', 'submit', 'change', 'focusin', 'focusout', 'selectionchange']) {
    document.addEventListener(event, schedule);
  }
  input.addEventListener('scroll', schedule);
  input.addEventListener('compositionstart', () => { composing = true; schedule(); });
  input.addEventListener('compositionend', () => { composing = false; schedule(); });
  new ResizeObserver(schedule).observe(field);
  document.fonts.ready.then(schedule);
  schedule();
})();
