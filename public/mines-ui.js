import { Minesweeper } from './mines.mjs';

const game = new Minesweeper();
const board = document.querySelector('#mines-board');
const status = document.querySelector('#mines-status');
const flagMode = document.querySelector('#mines-flag-mode');
let marking = false, startedAt = null, timer = null;
const buttons = Array.from({length:64}, (_,index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mine-cell';
  button.tabIndex = index===0 ? 0 : -1;
  button.addEventListener('focus', () => buttons.forEach((b,i) => b.tabIndex=i===index?0:-1));
  button.addEventListener('click', () => act(index, marking));
  button.addEventListener('contextmenu', e => {e.preventDefault(); act(index, true)});
  button.addEventListener('keydown', e => {
    if (e.key.toLowerCase()==='f' && !e.ctrlKey && !e.metaKey && !e.altKey) {e.preventDefault(); act(index,true);return;}
    const row=Math.floor(index/8),col=index%8;
    const destination={ArrowLeft:row*8+Math.max(0,col-1),ArrowRight:row*8+Math.min(7,col+1),ArrowUp:Math.max(0,row-1)*8+col,ArrowDown:Math.min(7,row+1)*8+col}[e.key];
    if(destination!==undefined){e.preventDefault();buttons[destination].focus();}
  });
  board.append(button);
  return button;
});

function tick(){document.querySelector('#mines-time').textContent=String(Math.floor((Date.now()-startedAt)/1000)).padStart(3,'0')}
function act(index, flag){
  if(flag)game.flag(index);else game.reveal(index);
  if(game.state!=='ready' && startedAt===null){startedAt=Date.now();timer=setInterval(tick,1000)}
  if(['won','lost'].includes(game.state)){clearInterval(timer);timer=null;tick()}
  render();
}
function render(){
  const ended=['won','lost'].includes(game.state);
  buttons.forEach((button,index)=>{
    const cell=game.cells[index];
    const visible=cell.open || (ended&&cell.mine);
    const wrong=game.state==='lost'&&cell.flag&&!cell.mine;
    button.className='mine-cell'+(visible?' revealed':'')+(index===game.exploded?' exploded':'')+(cell.flag?' flagged':'');
    button.dataset.number=cell.adjacent;
    button.textContent=wrong?'×':cell.flag?'⚑':visible?(cell.mine?'✹':cell.adjacent||''):'';
    const label=cell.flag?'bandera':visible?(cell.mine?'mina':cell.adjacent?`${cell.adjacent} minas cercanas`:'vacía'):'sin descubrir';
    button.setAttribute('aria-label',`Fila ${Math.floor(index/8)+1}, columna ${index%8+1}: ${label}`);
    button.setAttribute('aria-disabled',String(ended||cell.open));
  });
  document.querySelector('#mines-flags').textContent=`${game.cells.filter(c=>c.flag).length} / 10`;
  status.textContent={ready:'10 minas. Tu primer clic siempre es seguro.',playing:'Descubre las casillas libres y marca las minas.',won:'¡Tablero despejado! Has ganado.',lost:'Había una mina. ¿Otra partida?'}[game.state];
}
flagMode.addEventListener('click',()=>{marking=!marking;flagMode.setAttribute('aria-pressed',String(marking));flagMode.textContent=`⚑ Modo banderas: ${marking?'activado':'desactivado'}`});
document.querySelector('#mines-new').addEventListener('click',()=>{
  clearInterval(timer);timer=null;startedAt=null;game.reset();marking=false;flagMode.setAttribute('aria-pressed','false');flagMode.textContent='⚑ Modo banderas: desactivado';document.querySelector('#mines-time').textContent='000';render();buttons[0].focus();
});
render();
