'use strict';

const $ = selector => document.querySelector(selector);
const projects = [
  {id:'etimologia',title:'Etimología',repo:'etimologia',tag:'JavaScript · Juego diario',image:'assets/etimologia.png',site:'https://etimologia.es',description:'Un juego diario para descubrir las raíces de las palabras. Cada partida propone una palabra, permite explorar su origen y enlaza al Diccionario de la lengua española.',lesson:'Un producto pequeño con un reto diario, estadísticas locales y una experiencia completa en el navegador.'},
  {id:'mochila',title:'Prepara tu mochila',repo:'prepara-tu-mochila',tag:'Web · Preparación cotidiana',image:'assets/mochila.png',site:'https://preparatumochila.com',description:'Un portal en español sobre preparación del hogar y mochilas de salida de 72 horas.',lesson:'Organizar información práctica y convertirla en un recorrido que ayuda a preparar un kit.'},
  {id:'ibexa',title:'Ibexa · Content Type Info',repo:'ibexa-contenttype-info-tab',tag:'PHP · Ibexa',image:'assets/ibexa.png',description:'Una pestaña con la información del tipo de contenido en la vista de ubicación del back office de Ibexa. Evita buscar esa información navegando por varias pantallas.',lesson:'Una pequeña extensión puede resolver una fricción repetida en el trabajo de otros desarrolladores.'},
  {id:'gnome',title:'Instant Area Screenshot',repo:'gnome-instant-area-screenshot',tag:'JavaScript · GNOME Shell',symbol:'[ + ]',description:'Una extensión de GNOME que permite capturar un área al soltar el ratón. Cada arrastre crea una selección nueva y elimina el rectángulo de la captura anterior.',lesson:'Modificar el comportamiento del escritorio para que una tarea cotidiana requiera menos pasos.'},
  {id:'fibonacci',title:'Fibonacci',repo:'fibonacci',tag:'PHP · Algoritmos',symbol:'0 1 1 2 3 5 8',description:'Tres métodos para calcular Fibonacci y explorar complejidades exponencial, lineal y logarítmica.',lesson:'El mismo resultado no implica el mismo coste. Prueba «fibonacci 12» en la terminal.'}
];
const windows = [...document.querySelectorAll('.window')];
let entered = false;
let cwd = '/home/roberto';
let history = [];
let historyIndex = 0;
const home = '/home/roberto';
const input = $('#command-input');
const output = $('#terminal-output');
const commands = ['help','whoami','neofetch','ls','pwd','cd','cat','open','projects','contact','fibonacci','clear','history','date','echo','exit'];
const about = 'Roberto Pérez Villegas\nDesarrollador · @todomagichere\n\nMi GitHub reúne extensiones de Ibexa, herramientas para GNOME, juegos y experimentos. Me interesa explorar ideas construyéndolas: desde el origen de las palabras hasta pequeños cambios que hacen más cómodo el escritorio.\n\nEste portfolio también es un experimento. Puedes recorrerlo con el ratón o descubrirlo desde esta terminal.';
const files = {
  [`${home}/sobre-mi.md`]: about,
  [`${home}/contacto.md`]: 'Puedes encontrarme en GitHub y LinkedIn.\nEscribe contact para abrir los enlaces.',
  [`${home}/README.md`]: 'Bienvenido a mi ordenador.\n\n1. whoami — descubre quién soy\n2. ls proyectos — explora mis proyectos\n3. open etimologia — abre su captura y su historia\n4. help — aprende otros comandos\n\nTab completa comandos y rutas. Las flechas ↑ y ↓ recorren tu historial.'
};
projects.forEach(p => files[`${home}/proyectos/${p.id}/README.md`] = `${p.title}\n${p.tag}\n\n${p.description}\n\n${p.lesson}\n\nCódigo: https://github.com/todomagichere/${p.repo}`);
const directories = new Set([home,`${home}/proyectos`,...projects.map(p=>`${home}/proyectos/${p.id}`)]);
function resolvePath(raw='~') {
  const value = raw === '~' ? home : raw.startsWith('~/') ? home+raw.slice(1) : raw.startsWith('/') ? raw : `${cwd}/${raw}`;
  const parts=[];
  value.split('/').forEach(part=>{if(part==='..')parts.pop();else if(part&&part!=='.')parts.push(part)});
  return '/'+parts.join('/');
}
function shortPath(path=cwd) {return path===home?'~':path.startsWith(home+'/')?'~'+path.slice(home.length):path}
function updatePrompt(){ $('#prompt-path').textContent=shortPath();$('#terminal-title').textContent=`roberto@portfolio: ${shortPath()}`; }
function line(text,className='') { const p=document.createElement('p');p.textContent=text;p.className=className;output.append(p);return p; }
function explain(text){line(text,'explanation')}
function scrollTerminal(){const body=$('#terminal-body');body.scrollTop=body.scrollHeight}
function commandButton(command,label=command){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.command=command;return b}
function welcome(){
  line('┌─ ROBERTO PÉREZ ──────────────────┐\n│  Código, proyectos y curiosidad. │\n└─────────────────────────────────┘','accent');
  line('Bienvenido a mi ordenador. Estás en casa.','success');
  line('Escribe un comando o pulsa una sugerencia.\nEmpieza por help si es tu primera terminal.','muted');
  const p=line('');['whoami','ls proyectos','help'].forEach(c=>p.append(commandButton(c)));
}
function syncDock(){document.querySelectorAll('.dock [data-open]').forEach(b=>b.classList.toggle('running',!document.getElementById(b.dataset.open).hidden))}
function raise(win){windows.filter(w=>w!==win).sort((a,b)=>Number(a.style.zIndex||getComputedStyle(a).zIndex)-Number(b.style.zIndex||getComputedStyle(b).zIndex)).forEach((w,i)=>w.style.zIndex=String(i+2));win.style.zIndex='5';}
function showWindow(id,focus=true){const win=document.getElementById(id);win.hidden=false;raise(win);syncDock();if(focus){if(id==='terminal')input.focus({preventScroll:true});else win.querySelector('button')?.focus({preventScroll:true})}}
function enter(focus=true){entered=true;$('#login').hidden=true;$('#desktop').inert=false;syncDock();if(focus)showWindow('terminal');}
function lock(){entered=false;$('#login').hidden=false;$('#desktop').inert=true;$('#enter').focus();}
function projectGrid(){
 const area=$('#project-content');area.replaceChildren();const grid=document.createElement('div');grid.className='project-grid';
 projects.forEach(p=>{const button=document.createElement('button');button.className='project-tile';button.dataset.project=p.id;button.setAttribute('aria-label',`Abrir ${p.title}`);
 if(p.image){const img=document.createElement('img');img.src=p.image;img.alt=`Captura real de ${p.title}`;img.loading='lazy';button.append(img)}else{const art=document.createElement('div');art.className='code-preview';art.textContent=p.symbol;button.append(art)}
 const title=document.createElement('strong');title.textContent=p.title;const tag=document.createElement('small');tag.textContent=p.tag;button.append(title,tag);grid.append(button)});area.append(grid);area.scrollTop=0;
}
function projectDetail(id){
 const p=projects.find(p=>p.id===id);if(!p)return false;
 const area=$('#project-content');area.replaceChildren();const back=document.createElement('button');back.className='back-button';back.textContent='← Todos los proyectos';back.addEventListener('click',projectGrid);area.append(back);
 const detail=document.createElement('article');detail.className='project-detail';
 if(p.image){const b=document.createElement('button');b.className='screenshot-button';b.dataset.screenshot=p.id;const img=document.createElement('img');img.src=p.image;img.alt=`Captura real de ${p.title}`;const caption=document.createElement('span');caption.textContent='↗ Ampliar captura real';b.append(img,caption);detail.append(b)}
 const tag=document.createElement('p');tag.className='detail-tag';tag.textContent=p.tag;const h=document.createElement('h3');h.textContent=p.title;const description=document.createElement('p');description.textContent=p.description;const lesson=document.createElement('p');lesson.textContent=p.lesson;detail.append(tag,h,description,lesson);
 const links=document.createElement('div');links.className='project-links';const link=(title,url)=>{const a=document.createElement('a');a.textContent=title;a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a)};link('Ver código ↗',`https://github.com/todomagichere/${p.repo}`);if(p.site)link('Abrir web ↗',p.site);detail.append(links);area.append(detail);area.scrollTop=0;showWindow('files',false);back.focus({preventScroll:true});return true;
}
function listDirectory(path){
 if(files[path])return line(path.split('/').pop());
 if(!directories.has(path))return line(`ls: no existe «${path}». Prueba ls ~`,'error');
 const entries=new Set();[...directories,...Object.keys(files)].forEach(p=>{if(p.startsWith(path+'/')){const rest=p.slice(path.length+1);if(rest&&!rest.includes('/'))entries.add(rest+(directories.has(p)?'/':''))}});
 line([...entries].sort().join('   '),'accent');explain('ls lista el contenido de una carpeta. Usa cd para entrar y cat para leer un archivo.');
}
function run(raw){
 const command=raw.trim();if(!command)return;
 history.push(command);historyIndex=history.length;
 line(`visitante@roberto:${shortPath()}$ ${command}`,'command-echo');
 const tokens=command.match(/"[^"]*"|'[^']*'|\S+/g)?.map(t=>t.replace(/^(["'])(.*)\1$/,'$2'))||[];
 const [name,...args]=tokens;const arg=args.join(' ');
 switch(name){
 case 'help':
   line('TU MAPA DEL ESCRITORIO','success');
   line('whoami              Quién soy\nneofetch            Mi ficha de desarrollador\nls [carpeta]        Listar archivos\npwd                 Mostrar dónde estás\ncd proyectos        Entrar en una carpeta\ncd ..               Volver a la carpeta anterior\ncat sobre-mi.md     Leer un archivo\nopen etimologia     Abrir un proyecto\nprojects            Abrir el explorador\ncontact             Encontrarme en la red\nfibonacci 12        Calcular y aprender\nclear               Limpiar la terminal\nhistory             Ver tus comandos\nexit                Volver a la pantalla de entrada');
   explain('Tab autocompleta. ↑ y ↓ recorren el historial. Ctrl+L limpia. Los comandos son una simulación local para explorar el portfolio.');break;
 case 'whoami':line(about,'success');explain('En Linux, whoami devuelve el usuario actual. Aquí te presenta al dueño del escritorio.');break;
 case 'neofetch':line('      .--.       roberto@portfolio\n     |o_o |      ──────────────────────────\n     |:_/ |      Nombre   Roberto Pérez\n    //   \\ \\     GitHub   @todomagichere\n   (|     | )    Código   PHP · JavaScript\n  /\u0027\\_   _/\u0027\\   Taller   Ibexa · GNOME · Web\n  \\___)=(___/    Proyectos   5 seleccionados','accent');explain('neofetch suele mostrar información del sistema. Esta versión muestra mi perfil y los proyectos seleccionados.');break;
 case 'pwd':line(cwd,'accent');explain('pwd significa print working directory: muestra la carpeta en la que estás.');break;
 case 'ls':listDirectory(resolvePath(args.find(a=>!a.startsWith('-'))||'.'));break;
 case 'cd':{const path=resolvePath(arg||'~');if(directories.has(path)){cwd=path;updatePrompt();explain(`Ahora estás en ${shortPath()}. Prueba ls.`)}else line(`cd: no existe la carpeta «${arg}». Prueba cd ~/proyectos`,'error');break}
 case 'cat':{if(!arg){line('Uso: cat <archivo>. Por ejemplo: cat ~/sobre-mi.md','muted');break}const path=resolvePath(arg);if(Object.hasOwn(files,path)){line(files[path]);explain('cat muestra el contenido de un archivo de texto.')}else line(`cat: no existe «${arg}». Usa ls para ver los archivos de esta carpeta.`,'error');break}
 case 'projects':projectGrid();showWindow('files');line('Abriendo ~/proyectos…','success');break;
 case 'open':{const id=(arg||'proyectos').replace(/\/$/,'').split('/').pop();if(['proyectos','.'].includes(id)){projectGrid();showWindow('files');line('Abriendo el explorador…','success')}else if(projectDetail(id)){line(`Abriendo ${id}: captura, descripción y código.`,'success')}else line(`No encuentro «${arg}». Puedes abrir: ${projects.map(p=>p.id).join(', ')}.`,'error');break}
 case 'contact':{
   line('Hablemos de código, proyectos o esa idea que tienes en mente.');const p=line('');[['GitHub','https://github.com/todomagichere'],['LinkedIn','https://www.linkedin.com/in/robertoperezvillegas/']].forEach(([text,url])=>{const a=document.createElement('a');a.textContent=text+' ↗   ';a.href=url;a.target='_blank';a.rel='noopener noreferrer';p.append(a)});break}
 case 'fibonacci':{const n=Number(arg||'12');if(!Number.isInteger(n)||n<0||n>50){line('Prueba un número entero entre 0 y 50. Ejemplo: fibonacci 12','error');break}const values=[0,1];for(let i=2;i<=n;i++)values.push(values[i-1]+values[i-2]);line(`F(${n}) = ${values[n]}\n\n${values.slice(0,n+1).join(' → ')}`,'success');explain('Cada término suma los dos anteriores. Esta implementación recorre la secuencia una vez: tiempo O(n). Mi paquete PHP explora tres métodos. Abre open fibonacci.');break}
 case 'clear':output.replaceChildren();break;
 case 'history':line(history.map((c,i)=>`${i+1}  ${c}`).join('\n'));break;
 case 'date':line(new Date().toLocaleString('es-ES'));break;
 case 'echo':line(arg);break;
 case 'sudo':line('Aquí no hacen falta privilegios. Toda la curiosidad viene desbloqueada. Prueba help.','success');break;
 case 'exit':line('Hasta la próxima. Tu sesión se conserva mientras la página esté abierta.');lock();break;
 default:line(`No conozco «${name}». Escribe help para ver los comandos disponibles.`,'error');
 }
 while(output.childElementCount>160)output.firstElementChild.remove();
 scrollTerminal();
}
$('#command-form').addEventListener('submit',e=>{e.preventDefault();const command=input.value;input.value='';run(command)});
input.addEventListener('keydown',e=>{
 if(e.key==='ArrowUp'){e.preventDefault();historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex]||''}
 if(e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||''}
 if(e.ctrlKey&&e.key.toLowerCase()==='l'){e.preventDefault();output.replaceChildren()}
 if(e.ctrlKey&&e.key.toLowerCase()==='c'){e.preventDefault();line(`visitante@roberto:${shortPath()}$ ${input.value}^C`,'muted');input.value='';scrollTerminal()}
 if(e.key==='Tab'&&!e.shiftKey){
   const parts=input.value.split(/\s+/);const fragment=parts.at(-1);let candidates;
   if(parts.length===1)candidates=commands;else if(parts[0]==='open')candidates=['proyectos',...projects.map(p=>p.id)];else{
     const slash=fragment.lastIndexOf('/');const prefix=slash>=0?fragment.slice(0,slash+1):'';const base=resolvePath(prefix||'.');
     candidates=[...directories,...Object.keys(files)].filter(p=>p.startsWith(base+'/')&&!p.slice(base.length+1).includes('/')).map(p=>prefix+p.slice(base.length+1)+(directories.has(p)?'/':''));
   }
   const matches=candidates.filter(c=>c.startsWith(fragment));if(matches.length){e.preventDefault();if(matches.length===1){parts[parts.length-1]=matches[0];input.value=parts.join(' ')}else{line(matches.join('  '),'muted');scrollTerminal()}}
 }
});
$('#enter').addEventListener('click',()=>enter());$('#lock').addEventListener('click',lock);
$('#room-toggle').addEventListener('click',()=>{document.body.classList.toggle('expanded');$('#room-toggle').textContent=document.body.classList.contains('expanded')?'Reducir pantalla ↙':'Ampliar pantalla ↗';resetWindowPositions()});
// Escape always provides a way back from the enlarged computer view.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#screenshot-dialog').open){document.body.classList.remove('expanded');$('#room-toggle').textContent='Ampliar pantalla ↗';resetWindowPositions()}});
$('#exit-expanded').addEventListener('click',()=>{document.body.classList.remove('expanded');$('#room-toggle').textContent='Ampliar pantalla ↗';resetWindowPositions()});
$('#show-all').addEventListener('click',projectGrid);
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-open]');if(open){if(!entered)enter(false);showWindow(open.dataset.open)}
 const command=e.target.closest('[data-command],[data-entry-command]');if(command){if(!entered)enter(false);showWindow('terminal');run(command.dataset.command||command.dataset.entryCommand)}
 const project=e.target.closest('[data-project]');if(project)projectDetail(project.dataset.project);
 const shot=e.target.closest('[data-screenshot]');if(shot){const p=projects.find(p=>p.id===shot.dataset.screenshot);$('#screenshot-full').src=p.image;$('#screenshot-full').alt=`Captura real de ${p.title}`;$('#screenshot-caption').textContent=`${p.title} · ${p.id==='ibexa'?'Captura del README del repositorio':'Captura de la web pública'} · noviembre de 2026`;$('#screenshot-dialog').showModal()}
 const action=e.target.closest('[data-action]');if(action){const win=action.closest('.window');if(action.dataset.action==='maximize'){win.classList.toggle('maximized');action.setAttribute('aria-label',win.classList.contains('maximized')?'Restaurar ventana':'Maximizar ventana')}else{win.hidden=true;syncDock();document.querySelector(`.dock [data-open="${win.id}"]`)?.focus()}}
});
function resetWindowPositions(){windows.forEach(win=>{win.style.left='';win.style.top='';win.style.right=''})}
windows.forEach(win=>{
 win.addEventListener('pointerdown',()=>raise(win));
 const bar=win.querySelector('.titlebar');let drag;
 bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))win.classList.toggle('maximized')});
 bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||win.classList.contains('maximized')||matchMedia('(max-width:600px)').matches)return;const rect=win.getBoundingClientRect();const screen=$('#desktop').getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:rect.left-screen.left,top:rect.top-screen.top};bar.setPointerCapture(e.pointerId)});
 bar.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(0,Math.min($('#desktop').clientWidth-win.offsetWidth,drag.left+e.clientX-drag.x));const y=Math.max(30,Math.min($('#desktop').clientHeight-win.offsetHeight-70,drag.top+e.clientY-drag.y));win.style.left=x+'px';win.style.top=y+'px';win.style.right='auto'});
 bar.addEventListener('pointerup',()=>drag=null);bar.addEventListener('pointercancel',()=>drag=null);
});
window.addEventListener('resize',resetWindowPositions);
function clock(){const now=new Date();$('#clock').textContent=now.toLocaleDateString('es-ES',{day:'numeric',month:'short'})+' · '+now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});$('#login-time').textContent=now.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})+' · '+now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
clock();setInterval(clock,30000);projectGrid();welcome();syncDock();
