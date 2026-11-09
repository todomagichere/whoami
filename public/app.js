'use strict';

const $ = selector => document.querySelector(selector);
const projects = [
  {id:'etimologia',title:'Etimología',repo:'etimologia',tag:'JavaScript · Juego diario',image:'assets/etimologia.png',site:'https://etimologia.es',description:'Un juego diario para descubrir las raíces de las palabras. Cada partida propone una palabra, permite explorar su origen y enlaza al Diccionario de la lengua española.',lesson:'Un producto pequeño con un reto diario, estadísticas locales y una experiencia completa en el navegador.'},
  {id:'mochila',title:'Prepara tu mochila',repo:'prepara-tu-mochila',tag:'Web · Preparación cotidiana',image:'assets/mochila.png',site:'https://preparatumochila.com',description:'Un portal en español sobre preparación del hogar y mochilas de salida de 72 horas.',lesson:'Organizar información práctica y convertirla en un recorrido que ayuda a preparar un kit.'},
  {id:'ibexa',title:'Ibexa · Content Type Info',repo:'ibexa-contenttype-info-tab',tag:'PHP · Ibexa',image:'assets/ibexa.png',description:'Una pestaña con la información del tipo de contenido en la vista de ubicación del back office de Ibexa. Evita buscar esa información navegando por varias pantallas.',lesson:'Una pequeña extensión puede resolver una fricción repetida en el trabajo de otros desarrolladores.'},
  {id:'fibonacci',title:'Fibonacci',repo:'fibonacci',tag:'PHP · Algoritmos',symbol:'0 1 1 2 3 5 8',description:'Tres métodos para calcular Fibonacci y explorar complejidades exponencial, lineal y logarítmica.',lesson:'El mismo resultado no implica el mismo coste. Prueba «fibonacci 12» en la terminal.'},
  {"id": "la-gran-aventura-pirata", "title": "La gran aventura pirata", "repo": "la-gran-aventura-pirata", "tag": "Web · Invitación temática", "image": "assets/pirata.webp", "imageLabel": "Mapa del proyecto", "imageSource": "Recurso visual original del repositorio", "description": "Una invitación web con temática pirata para una fiesta de cumpleaños.", "lesson": "Una experiencia visual alrededor de una celebración, con un mapa del tesoro y recursos gráficos propios del proyecto."},
  {"id": "firefox-perplexity-translator", "title": "Perplexity Selection Translator", "repo": "firefox-perplexity-translator", "tag": "Firefox · Extensión", "symbol": "Aa → 文", "description": "Una extensión de Firefox que envía el texto seleccionado a Perplexity mediante el menú contextual, sin claves de API.", "lesson": "Permite elegir el idioma de destino y conservar esa preferencia con browser.storage.sync. Abre una ventana con el prompt de traducción."},
  {"id": "ibexa-breadcrumbs-bundle", "title": "Ibexa · Breadcrumbs Bundle", "repo": "ibexa-breadcrumbs-bundle", "tag": "PHP · Twig · Ibexa", "image": "assets/ibexa-breadcrumbs.png", "imageSource": "Captura del README del repositorio", "description": "Un bundle para generar las migas de pan de Ibexa a partir de la ruta de una ubicación.", "lesson": "Se invoca desde Twig con get_breadcrumbs(location). Permite excluir ubicaciones y tipos de contenido, y personalizar su plantilla."},
  {"id": "risk-master", "title": "Risk Master", "repo": "risk-master", "tag": "React · TypeScript", "image": "assets/risk-master.png", "imageSource": "Captura del README del repositorio", "description": "Un gestor de partidas de Risk para registrar el nombre y la fecha de cada partida, sus jugadores y sus colores.", "lesson": "Una interfaz para crear partidas, consultar las que están activas y gestionar sus jugadores."}
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
const about = 'Roberto Pérez Villegas\nDesarrollador · @todomagichere\n\nMi GitHub reúne extensiones de Ibexa, extensiones de Firefox, invitaciones web y juegos. Me interesa explorar ideas construyéndolas: desde el origen de las palabras hasta herramientas para navegar y organizar partidas.\n\nEste portfolio también es un experimento. Puedes recorrerlo con el ratón o descubrirlo desde esta terminal.';
const files = {
  [`${home}/sobre-mi.md`]: about,
  [`${home}/contacto.md`]: 'Puedes encontrarme en GitHub y LinkedIn.\nEscribe contact para abrir los enlaces.',
  [`${home}/README.md`]: '# Guía del escritorio\n\n1. whoami — descubre quién soy\n2. ls proyectos — explora mis proyectos\n3. open etimologia — abre su captura y su historia\n4. help — aprende otros comandos\n\nTab completa comandos y rutas. Las flechas ↑ y ↓ recorren tu historial.'
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
  line('Escribe un comando o pulsa una sugerencia.\nEmpieza por help si es tu primera terminal.','muted');
  const p=line('');['whoami','ls proyectos','help'].forEach(c=>p.append(commandButton(c)));
}
function syncDock(){document.querySelectorAll('.dock [data-open]').forEach(b=>b.classList.toggle('running',!document.getElementById(b.dataset.open).hidden));renderProcesses()}
function raise(win){windows.filter(w=>w!==win).sort((a,b)=>Number(a.style.zIndex||getComputedStyle(a).zIndex)-Number(b.style.zIndex||getComputedStyle(b).zIndex)).forEach((w,i)=>w.style.zIndex=String(i+2));win.style.zIndex=String(windows.length+2);}
function terminalIsForeground(){
 return entered && !$('#terminal').hidden && !document.querySelector('dialog[open]') &&
  windows.filter(win=>!win.hidden).every(win=>Number(getComputedStyle(win).zIndex)<=Number(getComputedStyle($('#terminal')).zIndex));
}
function focusTerminal(){
 if(terminalIsForeground() && !window.getSelection()?.toString()) input.focus({preventScroll:true});
}
function showWindow(id,focus=true){const win=document.getElementById(id);if(!win||!win.classList.contains('window'))return;$('#launcher').close();win.hidden=false;raise(win);syncDock();if(focus){if(id==='terminal')input.focus({preventScroll:true});else if(id==='editor')$('#editor-text').focus({preventScroll:true});else win.querySelector('button')?.focus({preventScroll:true})}}
function enter(focus=true){entered=true;$('#login').hidden=true;$('#desktop').inert=false;syncDock();if(focus)showWindow('terminal');}
function lock(){entered=false;$('#login').hidden=false;$('#desktop').inert=true;$('#enter').focus();}
function projectGrid(){
 $('.file-status').textContent=projects.length+' proyectos · código abierto y experimentos';
 $('#file-address').textContent='⌂ /home/roberto/proyectos';
 const area=$('#project-content');area.replaceChildren();const grid=document.createElement('div');grid.className='project-grid';
 projects.forEach(p=>{const button=document.createElement('button');button.className='project-tile';button.dataset.project=p.id;button.setAttribute('aria-label',`Abrir ${p.title}`);
 if(p.image){const img=document.createElement('img');img.src=p.image;img.alt=`${p.imageLabel||'Captura real'} de ${p.title}`;img.loading='lazy';if(p.id==='ibexa-breadcrumbs-bundle')img.className='contained-image';button.append(img)}else{const art=document.createElement('div');art.className='code-preview';art.textContent=p.symbol;button.append(art)}
 const title=document.createElement('strong');title.textContent=p.title;const tag=document.createElement('small');tag.textContent=p.tag;button.append(title,tag);grid.append(button)});area.append(grid);area.scrollTop=0;
}
function projectDetail(id){
 const p=projects.find(p=>p.id===id);if(!p)return false;
 const area=$('#project-content');area.replaceChildren();const back=document.createElement('button');back.className='back-button';back.textContent='← Todos los proyectos';back.addEventListener('click',projectGrid);area.append(back);
 const detail=document.createElement('article');detail.className='project-detail';
 if(p.image){const b=document.createElement('button');b.className='screenshot-button';b.dataset.screenshot=p.id;const img=document.createElement('img');img.src=p.image;img.alt=`${p.imageLabel||'Captura real'} de ${p.title}`;const caption=document.createElement('span');caption.textContent=p.imageLabel?'↗ Ampliar imagen del proyecto':'↗ Ampliar captura real';b.append(img,caption);detail.append(b)}
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
   line('whoami              Quién soy\nneofetch            Mi ficha de desarrollador\nls [carpeta]        Listar archivos\npwd                 Mostrar dónde estás\ncd proyectos        Entrar en una carpeta\ncd ..               Volver a la carpeta anterior\ncat sobre-mi.md     Leer un archivo\nopen etimologia     Abrir un proyecto\nopen sobre-mi.md    Leer en el editor\nopen ajustes        Personalizar escritorio\nopen monitor        Ventanas abiertas\nprojects            Abrir el explorador\ncontact             Encontrarme en la red\nfibonacci 12        Calcular y aprender\nclear               Limpiar la terminal\nhistory             Ver tus comandos\nexit                Volver a la pantalla de entrada');
   explain('Tab autocompleta. ↑ y ↓ recorren el historial. Ctrl+L limpia. Los comandos son una simulación local para explorar el portfolio.');break;
 case 'whoami':line(about,'success');explain('En Linux, whoami devuelve el usuario actual. Aquí te presenta al dueño del escritorio.');break;
 case 'neofetch':line('      .--.       roberto@portfolio\n     |o_o |      ──────────────────────────\n     |:_/ |      Nombre   Roberto Pérez\n    //   \\ \\     GitHub   @todomagichere\n   (|     | )    Código   PHP · JavaScript\n  /\u0027\\_   _/\u0027\\   Taller   Ibexa · Firefox · Web\n  \\___)=(___/    Proyectos   '+projects.length+' seleccionados','accent');explain('neofetch suele mostrar información del sistema. Esta versión muestra mi perfil y los proyectos seleccionados.');break;
 case 'pwd':line(cwd,'accent');explain('pwd significa print working directory: muestra la carpeta en la que estás.');break;
 case 'ls':listDirectory(resolvePath(args.find(a=>!a.startsWith('-'))||'.'));break;
 case 'cd':{const path=resolvePath(arg||'~');if(directories.has(path)){cwd=path;updatePrompt();explain(`Ahora estás en ${shortPath()}. Prueba ls.`)}else line(`cd: no existe la carpeta «${arg}». Prueba cd ~/proyectos`,'error');break}
 case 'cat':{if(!arg){line('Uso: cat <archivo>. Por ejemplo: cat ~/sobre-mi.md','muted');break}const path=resolvePath(arg);if(Object.hasOwn(files,path)){line(files[path]);explain('cat muestra el contenido de un archivo de texto.')}else line(`cat: no existe «${arg}». Usa ls para ver los archivos de esta carpeta.`,'error');break}
 case 'projects':projectGrid();showWindow('files');line('Abriendo ~/proyectos…','success');break;
 case 'open':{if(arg.endsWith('.md')){const path=resolvePath(arg);if(Object.hasOwn(files,path)){openDocument(path);line('Abriendo el editor de texto…','success')}else line('No existe ese documento. Prueba open ~/sobre-mi.md','error');break}const app={buscaminas:'mines',mines:'mines',ajustes:'settings',imagenes:'gallery',notas:'editor',monitor:'processes',contactos:'contact-app',editor:'editor'}[arg];if(app){showWindow(app);break}const id=(arg||'proyectos').replace(/\/$/,'').split('/').pop();if(['proyectos','.'].includes(id)){projectGrid();showWindow('files');line('Abriendo el explorador…','success')}else if(projectDetail(id)){line(`Abriendo ${id}: captura, descripción y código.`,'success')}else line(`No encuentro «${arg}». Puedes abrir: ${projects.map(p=>p.id).join(', ')}.`,'error');break}
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
   if(parts.length===1)candidates=commands;else if(parts[0]==='open')candidates=['proyectos','sobre-mi.md','ajustes','imagenes','editor','monitor','contactos','buscaminas',...projects.map(p=>p.id)];else{
     const slash=fragment.lastIndexOf('/');const prefix=slash>=0?fragment.slice(0,slash+1):'';const base=resolvePath(prefix||'.');
     candidates=[...directories,...Object.keys(files)].filter(p=>p.startsWith(base+'/')&&!p.slice(base.length+1).includes('/')).map(p=>prefix+p.slice(base.length+1)+(directories.has(p)?'/':''));
   }
   const matches=candidates.filter(c=>c.startsWith(fragment));if(matches.length){e.preventDefault();if(matches.length===1){parts[parts.length-1]=matches[0];input.value=parts.join(' ')}else{line(matches.join('  '),'muted');scrollTerminal()}}
 }
});
$('#enter').addEventListener('click',()=>enter());$('#lock').addEventListener('click',lock);
$('#room-toggle').addEventListener('click',()=>{document.body.classList.toggle('expanded');$('#room-toggle').textContent=document.body.classList.contains('expanded')?'Reducir pantalla ↙':'Ampliar pantalla ↗';resetWindowPositions()});
// Escape always provides a way back from the enlarged computer view.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){document.body.classList.remove('expanded');$('#room-toggle').textContent='Ampliar pantalla ↗';resetWindowPositions()}});
// Typing belongs to the frontmost terminal, even after clicking the desktop.
// Keep text selection, other editors, button activation and browser shortcuts intact.
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey ||
  e.key.length!==1 || !terminalIsForeground() || window.getSelection()?.toString() ||
  e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])') ||
  (e.key===' ' && e.target.closest('button,a,[role="button"]'))) return;
 input.focus({preventScroll:true});
 input.setRangeText(e.key,input.selectionStart,input.selectionEnd,'end');
 input.dispatchEvent(new Event('input',{bubbles:true}));
 e.preventDefault();
});
$('#exit-expanded').addEventListener('click',()=>{document.body.classList.remove('expanded');$('#room-toggle').textContent='Ampliar pantalla ↗';resetWindowPositions()});
$('#show-all').addEventListener('click',projectGrid);
document.addEventListener('click',e=>{
 const doc=e.target.closest('[data-document]');if(doc)openDocument(home+'/'+doc.dataset.document);
 const folder=e.target.closest('[data-folder]');if(folder)showFolder(folder.dataset.folder);
 const open=e.target.closest('[data-open]');if(open){if(!entered)enter(false);showWindow(open.dataset.open)}
 const command=e.target.closest('[data-command],[data-entry-command]');if(command){if(!entered)enter(false);showWindow('terminal');run(command.dataset.command||command.dataset.entryCommand)}
 const project=e.target.closest('[data-project]');if(project)projectDetail(project.dataset.project);
 const shot=e.target.closest('[data-screenshot]');if(shot){const p=projects.find(p=>p.id===shot.dataset.screenshot);$('#screenshot-full').src=p.image;$('#screenshot-full').alt=`${p.imageLabel||'Captura real'} de ${p.title}`;$('#screenshot-caption').textContent=`${p.title} · ${p.imageSource||(p.id==='ibexa'?'Captura del README del repositorio':'Captura de la web pública')} · noviembre de 2026`;$('#screenshot-dialog').showModal()}
 const action=e.target.closest('[data-action]');if(action){const win=action.closest('.window');if(action.dataset.action==='maximize'){win.classList.toggle('maximized');action.setAttribute('aria-label',win.classList.contains('maximized')?'Restaurar ventana':'Maximizar ventana')}else{win.hidden=true;syncDock();document.querySelector(`.dock [data-open="${win.id}"]`)?.focus()}focusTerminal()}
 if(!e.target.closest('button,a,input,textarea,select,[contenteditable]')) focusTerminal();
});
function resetWindowPositions(){windows.forEach(win=>{win.style.left='';win.style.top='';win.style.right=''})}
windows.forEach(win=>{
 win.addEventListener('pointerdown',()=>raise(win));
 const bar=win.querySelector('.titlebar');let drag;
 bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))win.classList.toggle('maximized')});
 bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||win.classList.contains('maximized')||matchMedia('(max-width:600px)').matches)return;const rect=win.getBoundingClientRect();const screen=$('#desktop').getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:rect.left-screen.left,top:rect.top-screen.top};bar.setPointerCapture(e.pointerId)});
 bar.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(0,Math.min($('#desktop').clientWidth-win.offsetWidth,drag.left+e.clientX-drag.x));const y=Math.max(44,Math.min($('#desktop').clientHeight-win.offsetHeight-70,drag.top+e.clientY-drag.y));win.style.left=x+'px';win.style.top=y+'px';win.style.right='auto'});
 bar.addEventListener('pointerup',()=>drag=null);bar.addEventListener('pointercancel',()=>drag=null);
});
window.addEventListener('resize',resetWindowPositions);
function clock(){const now=new Date();$('#clock').textContent=now.toLocaleDateString('es-ES',{day:'numeric',month:'short'})+' · '+now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});$('#login-time').textContent=now.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})+' · '+now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}

const applications = [
 {id:'terminal',name:'Terminal',icon:'>_',description:'Comandos y descubrimientos'},
 {id:'files',name:'Archivos',icon:'▱',description:'Proyectos y documentos'},
 {id:'editor',name:'Editor de texto',icon:'▤',description:'Sobre mí, tecnologías y notas'},
 {id:'gallery',name:'Imágenes',icon:'▧',description:'Capturas reales de proyectos'},
 {id:'settings',name:'Ajustes',icon:'⚙',description:'Tu escritorio, a tu gusto'},
 {id:'processes',name:'Monitor de aplicaciones',icon:'▥',description:'Gestiona las ventanas abiertas'},
 {id:'contact-app',name:'Contactos',icon:'↗',description:'GitHub y LinkedIn'},
 {id:'mines',name:'Buscaminas',icon:'✹',description:'8 × 8 · diez minas, una pausa'},
 {id:'guide',name:'Ayuda',icon:'?',description:'Aprende a usar la terminal'}
];
files[home+'/sobre-mi.md']='# Roberto Pérez Villegas\n\nDesarrollador · @todomagichere\n\n## Lo que me mueve\n\n'+about.split('\n\n').slice(1).join('\n\n')+'\n\n## Por dónde empezar\n\n- Etimología: un juego sobre el origen de las palabras.\n- Ibexa: información del contenido, a un clic.\n- La gran aventura pirata: una invitación con temática de aventura.\n\nAbre la carpeta Proyectos para ver las capturas y el código.\n';
files[home+'/tecnologias.md']='# Tecnologías entre mis proyectos\n\n## PHP e Ibexa\n\nExtensiones para el back office y experimentos con algoritmos.\nProyectos: ibexa-contenttype-info-tab, ibexa-breadcrumbs-bundle y fibonacci.\n\n## JavaScript y navegador\n\nJuegos diarios, herramientas e interfaces interactivas.\nProyecto: etimologia.\n\n## Firefox\n\nTraducción de texto seleccionado mediante Perplexity.\nProyecto: firefox-perplexity-translator.\n\n## React y TypeScript\n\nGestión de partidas y jugadores.\nProyecto: risk-master.\n\n## HTML, CSS y Docker\n\nPortales estáticos y entornos de desarrollo reproducibles.\nProyectos: prepara-tu-mochila y la-gran-aventura-pirata.\n';
files[home+'/notas.md']='# Cuaderno del visitante\n\nEste documento es tuyo mientras exploras el escritorio.\nEscribe aquí y léelo con cat ~/notas.md.\n\nTus notas se guardan automáticamente en este navegador.\n\n## Comandos para probar\n\nls proyectos\ncd proyectos/etimologia\ncat README.md\nopen etimologia\n\n## Tus ideas\n\n';
const notesKey='whoami.notes.v1';
let notesStorageAvailable=true;
try{const saved=localStorage.getItem(notesKey);if(saved!==null)files[home+'/notas.md']=saved}catch{notesStorageAvailable=false}
let currentDocument=home+'/sobre-mi.md';
const drafts=new Map();
function rememberDraft(){if(currentDocument&&$('#editor-text').value!==files[currentDocument])drafts.set(currentDocument,$('#editor-text').value);else drafts.delete(currentDocument)}
function loadDocument(path){
 currentDocument=path;$('#editor-text').value=drafts.get(path)??files[path];
 const name=path.slice(home.length+1);$('#editor-tab-name').textContent=name;$('#editor-title').textContent=name+' — gedit';
 const select=$('#editor-file');if(![...select.options].some(o=>o.value===name)){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option)}select.value=name;
 $('#editor-save-status').textContent=path===home+'/notas.md'?(notesStorageAvailable?'Notas guardadas en este navegador':'Almacenamiento no disponible; copia tus notas'):'Borrador de esta sesión';$('#editor-text').setSelectionRange(0,0);$('#editor-text').scrollTop=0;$('#editor-text').scrollLeft=0;updateEditor();
}
function openDocument(path){if(!Object.hasOwn(files,path))return;rememberDraft();loadDocument(path);showWindow('editor')}
function updateEditor(){
 const text=$('#editor-text');const before=text.value.slice(0,text.selectionStart);const lines=before.split('\n');$('#editor-position').textContent=`Ln ${lines.length}, Col ${lines.at(-1).length+1}`;
 $('#editor-lines').textContent=Array.from({length:text.value.split('\n').length},(_,i)=>i+1).join('\n');$('#editor-lines').scrollTop=text.scrollTop;
 $('#editor-dirty').textContent=text.value===files[currentDocument]?'':'● Sin guardar';
}
$('#editor-text').addEventListener('input',()=>{rememberDraft();if(currentDocument===home+'/notas.md')saveDocument();else updateEditor()});['click','keyup','select'].forEach(event=>$('#editor-text').addEventListener(event,updateEditor));
$('#editor-text').addEventListener('scroll',()=>$('#editor-lines').scrollTop=$('#editor-text').scrollTop);
function saveDocument(){
 files[currentDocument]=$('#editor-text').value;drafts.delete(currentDocument);
 let status='Guardado en esta sesión';
 if(currentDocument===home+'/notas.md'){
  try{localStorage.setItem(notesKey,files[currentDocument]);notesStorageAvailable=true;status='Guardado en este navegador'}
  catch{notesStorageAvailable=false;status='No se pudo guardar; copia tus notas antes de salir'}
 }
 $('#editor-save-status').textContent=status;updateEditor();
}
$('#editor-save').addEventListener('click',saveDocument);
$('#editor-wrap').addEventListener('change',()=>{const wrap=$('#editor-wrap').checked;$('#editor').classList.toggle('wrapped',wrap);$('#editor-text').wrap=wrap?'soft':'off'});
$('#editor-undo').addEventListener('click',()=>{drafts.delete(currentDocument);loadDocument(currentDocument);$('#editor-text').focus()});
$('#editor-file').addEventListener('change',()=>openDocument(home+'/'+$('#editor-file').value));
$('#editor-text').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveDocument()}});
function renderApps(){const query=$('#app-search').value.toLocaleLowerCase('es');const grid=$('#app-grid');grid.replaceChildren();applications.filter(app=>(app.name+' '+app.description).toLocaleLowerCase('es').includes(query)).forEach(app=>{const button=document.createElement('button');button.dataset.open=app.id;const icon=document.createElement('span');icon.className='app-icon';icon.textContent=app.icon;const title=document.createElement('strong');title.textContent=app.name;const description=document.createElement('small');description.textContent=app.description;button.append(icon,title,description);grid.append(button)});$('#app-empty').hidden=grid.childElementCount>0}
function showApplications(){if(!entered)enter(false);$('#app-search').value='';renderApps();$('#launcher').showModal();$('#app-search').focus()}
$('#applications').addEventListener('click',showApplications);$('#dock-applications').addEventListener('click',showApplications);$('#app-search').addEventListener('input',renderApps);
function renderGallery(){$('#gallery-count').textContent=projects.filter(p=>p.image).length+' imágenes de proyectos';const grid=$('#gallery-grid');projects.filter(p=>p.image).forEach(p=>{const button=document.createElement('button');button.dataset.screenshot=p.id;const img=document.createElement('img');img.src=p.image;img.alt=(p.imageLabel||'Captura')+' de '+p.title;const title=document.createElement('strong');title.textContent=p.title;button.append(img,title);grid.append(button)})}
function renderProcesses(){if(typeof applications==='undefined')return;const list=$('#process-list');list.replaceChildren();applications.filter(app=>!document.getElementById(app.id).hidden).forEach(app=>{const row=document.createElement('div');const title=document.createElement('span');title.textContent=app.icon+'  '+app.name;const open=document.createElement('button');open.textContent='Mostrar';open.dataset.open=app.id;const close=document.createElement('button');close.textContent='Cerrar';close.setAttribute('aria-label','Cerrar '+app.name);close.addEventListener('click',()=>{document.getElementById(app.id).hidden=true;syncDock();focusTerminal()});row.append(title,open,close);list.append(row)})}
function showFolder(folder){
 if(folder==='projects'){projectGrid();showWindow('files');return}
 const area=$('#project-content');area.replaceChildren();$('#file-address').textContent=folder==='home'?'⌂ /home/roberto':'⌂ /home/roberto/Documentos';
 const grid=document.createElement('div');grid.className='folder-grid';
 const entries=folder==='home'?[['Proyectos','projects'],['Documentos','documents'],['Imágenes','gallery']]:[['sobre-mi.md'],['tecnologias.md'],['notas.md'],['README.md']];
 entries.forEach(([name,target])=>{const button=document.createElement('button');const icon=document.createElement('span');icon.className=target?'folder-icon':'file-icon';icon.textContent=target?'':'#';const title=document.createElement('span');title.textContent=name;button.append(icon,title);if(target==='gallery')button.dataset.open='gallery';else if(target)button.dataset.folder=target;else button.dataset.document=name;grid.append(button)});area.append(grid);showWindow('files');
}
document.querySelectorAll('button[data-theme]').forEach(button=>button.addEventListener('click',()=>{clearWallpaper();document.body.dataset.theme=button.dataset.theme;$('.wallpaper').style.backgroundColor='';document.querySelectorAll('button[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));
document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{document.body.classList.toggle('large-text',button.dataset.size==='large');document.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));
$('#reduce-motion').checked=matchMedia('(prefers-reduced-motion:reduce)').matches;$('#reduce-motion').addEventListener('change',()=>document.body.classList.toggle('reduce-motion',$('#reduce-motion').checked));
let wallpaperUrl='';
let wallpaperRequest=0;
function clearWallpaper(){wallpaperRequest++;if(wallpaperUrl)URL.revokeObjectURL(wallpaperUrl);wallpaperUrl='';$('.wallpaper').style.backgroundImage='none';$('#wallpaper-file').value='';$('#wallpaper-status').textContent='La imagen se queda en tu navegador durante esta visita.'}
$('#wallpaper-file').addEventListener('change',async()=>{
 const file=$('#wallpaper-file').files[0];if(!file)return;
 const request=++wallpaperRequest;
 if(!['image/png','image/jpeg','image/webp','image/gif','image/avif'].includes(file.type)){$('#wallpaper-status').textContent='Elige una imagen PNG, JPG, WebP, GIF o AVIF.';return}
 const url=URL.createObjectURL(file);const image=new Image();image.src=url;
 try{await image.decode();if(request!==wallpaperRequest){URL.revokeObjectURL(url);return}if(wallpaperUrl)URL.revokeObjectURL(wallpaperUrl);wallpaperUrl=url;$('.wallpaper').style.backgroundImage=`url("${url}")`;document.querySelectorAll('button[data-theme]').forEach(b=>b.setAttribute('aria-pressed','false'));$('#wallpaper-status').textContent=file.name+' · imagen local';}
 catch{URL.revokeObjectURL(url);if(request===wallpaperRequest)$('#wallpaper-status').textContent='No se puede abrir esa imagen. Prueba con otra.'}
});
$('#wallpaper-reset').addEventListener('click',clearWallpaper);
$('#wallpaper-color').addEventListener('input',()=>{clearWallpaper();$('.wallpaper').style.backgroundColor=$('#wallpaper-color').value;document.querySelectorAll('button[data-theme]').forEach(b=>b.setAttribute('aria-pressed','false'))});
clock();setInterval(clock,30000);projectGrid();welcome();loadDocument(home+'/sobre-mi.md');renderGallery();renderApps();syncDock();enter();
