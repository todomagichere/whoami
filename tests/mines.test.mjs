import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Minesweeper} from '../public/mines.mjs';
const seeded=()=>{let seed=42;return()=>((seed=(seed*1664525+1013904223)>>>0)/2**32)};
test('every possible first click opens a safe area with exactly ten mines',()=>{
 for(let first=0;first<64;first++){
  const game=new Minesweeper(seeded());game.reveal(first);
  assert.equal(game.cells.filter(c=>c.mine).length,10);
  assert.equal(game.cells[first].adjacent,0);
  assert.equal(game.cells[first].open,true);
  assert.ok(![first,...game.neighbors(first)].some(i=>game.cells[i].mine));
  game.cells.forEach((cell,i)=>assert.equal(cell.adjacent,game.neighbors(i).filter(n=>game.cells[n].mine).length));
 }
});
test('flags protect cells, are capped at ten, and can be removed',()=>{
 const game=new Minesweeper(seeded());game.flag(0);game.reveal(0);assert.equal(game.state,'ready');
 for(let i=1;i<20;i++)game.flag(i);assert.equal(game.cells.filter(c=>c.flag).length,10);
 game.flag(0);game.reveal(0);assert.equal(game.cells[0].open,true);
});
test('a mine loses the game; completed games cannot mutate; reset starts fresh',()=>{
 const game=new Minesweeper(seeded());game.reveal(27);const mine=game.cells.findIndex(c=>c.mine);game.reveal(mine);assert.equal(game.state,'lost');assert.equal(game.exploded,mine);
 const before=JSON.stringify(game.cells);game.flag(0);game.reveal(63);assert.equal(JSON.stringify(game.cells),before);
 game.reset();assert.equal(game.state,'ready');assert.equal(game.cells.filter(c=>c.open||c.mine||c.flag).length,0);
});
test('revealing every safe cell wins and marks mines',()=>{
 const game=new Minesweeper(seeded());game.reveal(0);game.cells.forEach((c,i)=>{if(!c.mine)game.reveal(i)});
 assert.equal(game.state,'won');assert.equal(game.cells.filter(c=>c.open).length,54);assert.equal(game.cells.filter(c=>c.flag).length,10);
});
