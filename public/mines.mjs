export class Minesweeper {
  constructor(random = Math.random) {
    this.random = random;
    this.size = 8;
    this.mineCount = 10;
    this.reset();
  }

  reset() {
    this.cells = Array.from({length: 64}, () => ({mine:false, open:false, flag:false, adjacent:0}));
    this.state = 'ready';
    this.exploded = -1;
  }

  neighbors(index) {
    const row = Math.floor(index / 8), column = index % 8, result = [];
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
      if ((x || y) && row+y >= 0 && row+y < 8 && column+x >= 0 && column+x < 8) result.push((row+y)*8+column+x);
    }
    return result;
  }

  plant(first) {
    const safe = new Set([first, ...this.neighbors(first)]);
    const candidates = this.cells.map((_, i) => i).filter(i => !safe.has(i));
    for (let i = candidates.length-1; i > 0; i--) {
      const j = Math.floor(this.random() * (i+1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    candidates.slice(0, this.mineCount).forEach(i => this.cells[i].mine = true);
    this.cells.forEach((cell,i) => cell.adjacent = this.neighbors(i).filter(n => this.cells[n].mine).length);
    this.state = 'playing';
  }

  reveal(index) {
    const cell = this.cells[index];
    if (!cell || cell.open || cell.flag || ['won','lost'].includes(this.state)) return;
    if (this.state === 'ready') this.plant(index);
    if (cell.mine) { cell.open = true; this.exploded = index; this.state = 'lost'; return; }
    const pending = [index];
    while (pending.length) {
      const i = pending.pop(), current = this.cells[i];
      if (current.open || current.flag || current.mine) continue;
      current.open = true;
      if (!current.adjacent) pending.push(...this.neighbors(i));
    }
    if (this.cells.every(c => c.mine || c.open)) {
      this.state = 'won';
      this.cells.forEach(c => { if(c.mine) c.flag = true; });
    }
  }

  flag(index) {
    const cell = this.cells[index];
    if (!cell || cell.open || ['won','lost'].includes(this.state)) return;
    if (!cell.flag && this.cells.filter(c=>c.flag).length >= this.mineCount) return;
    cell.flag = !cell.flag;
  }
}
