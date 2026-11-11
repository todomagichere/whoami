'use strict';

const $ = selector => document.querySelector(selector);
const projects = [
  {id:'etimologia',title:'Etimología',repo:'etimologia',tag:'HTML · CSS · JavaScript',thumbnail:'assets/etimologia-cover.webp',image:'assets/etimologia.webp',site:'https://etimologia.es',role:'Desarrollo individual.',origin:'Creé Etimología después de hablar con varias personas y darme cuenta de que no siempre conocían la procedencia de las palabras. Como siempre me ha interesado su origen, decidí crear un juego que ayudara a recordarlo.',description:'Juego diario en español para identificar el significado de las raíces que forman una palabra y conocer su origen.',lesson:'Funciona íntegramente en el navegador, sin cuentas ni base de datos; el entorno local utiliza Docker.',features:['Un reto diario seleccionado a partir de la fecha y un banco de palabras.','Pista opcional, desglose de raíces y enlace a la entrada del DLE.','Estadísticas guardadas en el navegador y opciones para compartir el resultado.']},
  {id:'mochila',title:'Prepara tu mochila',repo:'prepara-tu-mochila',tag:'Web · Preparación cotidiana',image:'assets/mochila.webp',site:'https://preparatumochila.com',description:'Un portal en español sobre preparación del hogar y mochilas de salida de 72 horas.',lesson:'Organizar información práctica y convertirla en un recorrido que ayuda a preparar un kit.'},
  {id:'ibexa',title:'Ibexa · Content Type Info',repo:'ibexa-contenttype-info-tab',tag:'PHP · Ibexa',image:'assets/ibexa.webp',description:'Una pestaña con la información del tipo de contenido en la vista de ubicación del back office de Ibexa. Evita buscar esa información navegando por varias pantallas.',lesson:'Una pequeña extensión puede resolver una fricción repetida en el trabajo de otros desarrolladores.'},
  {id:'fibonacci',title:'Fibonacci',repo:'fibonacci',tag:'PHP · Algoritmos',symbol:'0 1 1 2 3 5 8',description:'Tres métodos para calcular Fibonacci y explorar complejidades exponencial, lineal y logarítmica.',lesson:'El mismo resultado no implica el mismo coste. Prueba «fibonacci 12» en la terminal.'},
  {"id": "la-gran-aventura-pirata", "title": "La gran aventura pirata", "repo": "la-gran-aventura-pirata", "tag": "Web · Invitación temática", "image": "assets/pirata.webp", "imageLabel": "Mapa del proyecto", "imageSource": "Recurso visual original del repositorio", "description": "Una invitación web con temática pirata para una fiesta de cumpleaños.", "lesson": "Una experiencia visual alrededor de una celebración, con un mapa del tesoro y recursos gráficos propios del proyecto."},
  {"id": "firefox-perplexity-translator", "title": "Perplexity Selection Translator", "repo": "firefox-perplexity-translator", "tag": "Firefox · Extensión", "symbol": "Aa → 文", "description": "Una extensión de Firefox que envía el texto seleccionado a Perplexity mediante el menú contextual, sin claves de API.", "lesson": "Permite elegir el idioma de destino y conservar esa preferencia con browser.storage.sync. Abre una ventana con el prompt de traducción."},
  {"id": "ibexa-breadcrumbs-bundle", "title": "Ibexa · Breadcrumbs Bundle", "repo": "ibexa-breadcrumbs-bundle", "tag": "PHP · Twig · Ibexa", "image": "assets/ibexa-breadcrumbs.webp", "imageSource": "Captura del README del repositorio", "description": "Un bundle para generar las migas de pan de Ibexa a partir de la ruta de una ubicación.", "lesson": "Se invoca desde Twig con get_breadcrumbs(location). Permite excluir ubicaciones y tipos de contenido, y personalizar su plantilla."},
  {"id": "risk-master", "title": "Risk Master", "repo": "risk-master", "tag": "React · TypeScript", "image": "assets/risk-master.webp", "imageSource": "Captura del README del repositorio", "description": "Un gestor de partidas de Risk para registrar el nombre y la fecha de cada partida, sus jugadores y sus colores.", "lesson": "Una interfaz para crear partidas, consultar las que están activas y gestionar sus jugadores."}
];
const windows = [...document.querySelectorAll('.window')];
let entered = false;
let cwd = '/home/roberto';
let history = [];
let historyIndex = 0;
const home = '/home/roberto';
const input = $('#command-input');
const output = $('#terminal-output');
const commands = ['help','whoami','neofetch','ls','pwd','cd','cat','open','projects','contact','fibonacci','snake','clear','history','date','echo','exit'];
const about = 'Roberto Pérez Villegas\nDesarrollador · @todomagichere\n\nSoy desarrollador de software con 15 años de experiencia. Trabajo principalmente con PHP, Symfony y JavaScript.\n\nEste portfolio reúne proyectos que he desarrollado, entre ellos extensiones para Ibexa y Firefox, juegos y aplicaciones web. Las fichas incluyen descripciones, enlaces al código y capturas cuando están disponibles.';
const files = {
  [`${home}/sobre-mi.md`]: about,
  [`${home}/contacto.md`]: 'Puedes encontrarme en GitHub y LinkedIn.\nEscribe contact para abrir los enlaces.',
  [`${home}/README.md`]: '# Guía del escritorio\n\n1. whoami — descubre quién soy\n2. ls proyectos — explora mis proyectos\n3. open etimologia — abre su captura y su historia\n4. help — aprende otros comandos\n\nTab completa comandos y rutas. Las flechas ↑ y ↓ recorren tu historial.'
};
projects.forEach(p => files[`${home}/proyectos/${p.id}/README.md`] = `${p.title}\n${p.tag}\n\n${p.description}${p.role?'\n\n'+p.role:''}${p.origin?'\n\nOrigen del proyecto:\n'+p.origin:''}\n\n${p.lesson}${p.features?.length?'\n\nCaracterísticas:\n'+p.features.map(feature=>'- '+feature).join('\n'):''}\n\nCódigo: https://github.com/todomagichere/${p.repo}`);
const directories = new Set([home,`${home}/proyectos`,...projects.map(p=>`${home}/proyectos/${p.id}`)]);
function resolvePath(raw='~') {
  const value = raw === '~' ? home : raw.startsWith('~/') ? home+raw.slice(1) : raw.startsWith('/') ? raw : `${cwd}/${raw}`;
  const parts=[];
  value.split('/').forEach(part=>{if(part==='..')parts.pop();else if(part&&part!=='.')parts.push(part)});
  return '/'+parts.join('/');
}
function shortPath(path=cwd) {return path===home?'~':path.startsWith(home+'/')?'~'+path.slice(home.length):path}
function updatePrompt(){ $('#prompt-path').textContent=shortPath();$('#terminal-title').textContent=`rperez@portfolio: ${shortPath()}`; }
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
function showWindow(id,focus=true){const win=document.getElementById(id);if(!win||!win.classList.contains('window'))return;$('#launcher').close();win.hidden=false;raise(win);syncDock();if(focus){if(id==='terminal')input.focus({preventScroll:true});else if(id==='editor')$('#editor-text').focus({preventScroll:true});else if(id==='snake')$('#snake-board').focus({preventScroll:true});else win.querySelector('button')?.focus({preventScroll:true})}}
const sessionKey='whoami.guest-session.v1';
function enter(focus=true){entered=true;try{localStorage.setItem(sessionKey,'active')}catch{}windows.forEach(win=>{win.hidden=true});$('#login').hidden=true;$('#desktop').inert=false;syncDock();if(focus)$('#applications').focus({preventScroll:true});}
function lock(){entered=false;try{localStorage.removeItem(sessionKey)}catch{}$('#login').hidden=false;$('#desktop').inert=true;$('#enter').focus();}
function projectGrid(){
 delete $('#project-content').dataset.userFolder;
 $('.file-status').textContent=projects.length+' proyectos · código abierto y experimentos';
 $('#file-address').textContent='⌂ /home/roberto/proyectos';
 const area=$('#project-content');area.replaceChildren();area.dataset.userFolder=home+'/proyectos';currentUserFolder=home+'/proyectos';const grid=document.createElement('div');grid.className='project-grid';
 projects.forEach(p=>{const button=document.createElement('button');button.className='project-tile';button.dataset.project=p.id;button.setAttribute('aria-label',`Abrir ${p.title}`);
 if(p.image){const img=document.createElement('img');img.src=p.thumbnail||p.image;img.alt=p.thumbnail?`Portada de ${p.title}`:`${p.imageLabel||'Captura real'} de ${p.title}`;img.loading='lazy';if(p.id==='ibexa-breadcrumbs-bundle')img.className='contained-image';button.append(img)}else{const art=document.createElement('div');art.className='code-preview';art.textContent=p.symbol;button.append(art)}
 const title=document.createElement('strong');title.textContent=p.title;const tag=document.createElement('small');tag.textContent=p.tag;button.append(title,tag);grid.append(button)});area.append(grid);
 const stored=document.createElement('div');stored.className='folder-grid';
 const prefix=home+'/proyectos/';
 userFiles.folders.filter(path=>path.startsWith(prefix)&&!path.slice(prefix.length).includes('/')).forEach(path=>{const b=document.createElement('button'),i=document.createElement('span');i.className='folder-icon';b.dataset.folder=path;b.append(i,document.createTextNode(path.slice(prefix.length)));makeFolderItemDraggable(b,path);stored.append(b)});
 Object.keys(userFiles.documents).filter(path=>path.startsWith(prefix)&&!path.slice(prefix.length).includes('/')).forEach(path=>{const b=document.createElement('button'),i=document.createElement('span');i.className='file-icon';i.textContent='#';b.dataset.userDocument=path;b.append(i,document.createTextNode(path.slice(prefix.length)));makeFolderItemDraggable(b,path);stored.append(b)});
 appendShortcuts(stored,home+'/proyectos');if(stored.childElementCount)area.append(stored);area.scrollTop=0;
}
function projectDetail(id){
 delete $('#project-content').dataset.userFolder;
 const p=projects.find(p=>p.id===id);if(!p)return false;
 const area=$('#project-content');area.replaceChildren();const back=document.createElement('button');back.className='back-button';back.textContent='← Todos los proyectos';back.addEventListener('click',projectGrid);area.append(back);
 const detail=document.createElement('article');detail.className='project-detail';
 if(p.image){const b=document.createElement('button');b.className='screenshot-button';b.dataset.screenshot=p.id;const img=document.createElement('img');img.src=p.image;img.alt=`${p.imageLabel||'Captura real'} de ${p.title}`;const caption=document.createElement('span');caption.textContent=p.imageLabel?'↗ Ampliar imagen del proyecto':'↗ Ampliar captura real';b.append(img,caption);detail.append(b)}
 const tag=document.createElement('p');tag.className='detail-tag';tag.textContent=p.tag;const h=document.createElement('h3');h.textContent=p.title;const description=document.createElement('p');description.textContent=p.description;const lesson=document.createElement('p');lesson.textContent=p.lesson;detail.append(tag,h,description);
 if(p.role){const role=document.createElement('p');role.textContent=p.role;detail.append(role)}
 if(p.origin){const heading=document.createElement('h4');heading.textContent='Origen del proyecto';const origin=document.createElement('p');origin.textContent=p.origin;detail.append(heading,origin)}
 detail.append(lesson);
 if(p.features?.length){const heading=document.createElement('h4');heading.textContent='Características';const list=document.createElement('ul');list.className='project-features';p.features.forEach(feature=>{const item=document.createElement('li');item.textContent=feature;list.append(item)});detail.append(heading,list)}
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
   line('COMANDOS DISPONIBLES','success');
   line('whoami              Quién soy\nneofetch            Mi ficha de desarrollador\nls [carpeta]        Listar archivos\npwd                 Mostrar dónde estás\ncd proyectos        Entrar en una carpeta\ncd ..               Volver a la carpeta anterior\ncat sobre-mi.md     Leer un archivo\nopen etimologia     Abrir un proyecto\nopen sobre-mi.md    Leer en el editor\nopen ajustes        Personalizar escritorio\nopen monitor        Ventanas abiertas\nsnake               Abrir la sala recreativa\nprojects            Abrir el explorador\ncontact             Encontrarme en la red\nfibonacci 12        Calcular y aprender\nclear               Limpiar la terminal\nhistory             Ver tus comandos\nexit                Volver a la pantalla de entrada');
   explain('Tab autocompleta. ↑ y ↓ recorren el historial. Ctrl+L limpia. Los comandos son una simulación local para explorar el portfolio.');break;
 case 'whoami':line(about,'success');explain('En Linux, whoami devuelve el usuario actual. Aquí te presenta al dueño del escritorio.');break;
 case 'neofetch':line('      .--.       rperez@portfolio\n     |o_o |      ──────────────────────────\n     |:_/ |      Nombre   Roberto Pérez\n    //   \\ \\     GitHub   @todomagichere\n   (|     | )    Código   PHP · Symfony · JavaScript\n     |           Experiencia   15 años\n  /\u0027\\_   _/\u0027\\   Taller   Ibexa · Firefox · Web\n  \\___)=(___/    Proyectos   '+projects.length+' seleccionados','accent');explain('neofetch suele mostrar información del sistema. Esta versión muestra mi perfil y los proyectos seleccionados.');break;
 case 'pwd':line(cwd,'accent');explain('pwd significa print working directory: muestra la carpeta en la que estás.');break;
 case 'ls':listDirectory(resolvePath(args.find(a=>!a.startsWith('-'))||'.'));break;
 case 'cd':{const path=resolvePath(arg||'~');if(directories.has(path)){cwd=path;updatePrompt();explain(`Ahora estás en ${shortPath()}. Prueba ls.`)}else line(`cd: no existe la carpeta «${arg}». Prueba cd ~/proyectos`,'error');break}
 case 'cat':{if(!arg){line('Uso: cat <archivo>. Por ejemplo: cat ~/sobre-mi.md','muted');break}const path=resolvePath(arg);if(Object.hasOwn(files,path)){line(files[path]);explain('cat muestra el contenido de un archivo de texto.')}else line(`cat: no existe «${arg}». Usa ls para ver los archivos de esta carpeta.`,'error');break}
 case 'snake':showWindow('snake');line('Snake abierto.','success');break;
 case 'projects':projectGrid();showWindow('files');line('Abriendo ~/proyectos…','success');break;
 case 'open':{if(Object.hasOwn(files,resolvePath(arg))||arg.endsWith('.md')){const path=resolvePath(arg);if(Object.hasOwn(files,path)){openDocument(path);line('Abriendo el editor de texto…','success')}else line('No existe ese documento. Prueba open ~/sobre-mi.md','error');break}const app={buscaminas:'mines',mines:'mines',ajustes:'settings',imagenes:'gallery',notas:'editor',monitor:'processes',contactos:'contact-app',editor:'editor'}[arg];if(app){showWindow(app);break}const id=(arg||'proyectos').replace(/\/$/,'').split('/').pop();if(['proyectos','.'].includes(id)){projectGrid();showWindow('files');line('Abriendo el explorador…','success')}else if(projectDetail(id)){line(`Abriendo ${id}: captura, descripción y código.`,'success')}else line(`No encuentro «${arg}». Puedes abrir: ${projects.map(p=>p.id).join(', ')}.`,'error');break}
 case 'contact':{
   line('Perfiles de contacto:');const p=line('');[['GitHub','https://github.com/todomagichere'],['LinkedIn','https://www.linkedin.com/in/robertoperezvillegas/']].forEach(([text,url])=>{const a=document.createElement('a');a.textContent=text+' ↗   ';a.href=url;a.target='_blank';a.rel='noopener noreferrer';p.append(a)});break}
 case 'fibonacci':{const n=Number(arg||'12');if(!Number.isInteger(n)||n<0||n>50){line('Prueba un número entero entre 0 y 50. Ejemplo: fibonacci 12','error');break}const values=[0,1];for(let i=2;i<=n;i++)values.push(values[i-1]+values[i-2]);line(`F(${n}) = ${values[n]}\n\n${values.slice(0,n+1).join(' → ')}`,'success');explain('Cada término suma los dos anteriores. Esta implementación recorre la secuencia una vez: tiempo O(n). Mi paquete PHP explora tres métodos. Abre open fibonacci.');break}
 case 'clear':output.replaceChildren();break;
 case 'history':line(history.map((c,i)=>`${i+1}  ${c}`).join('\n'));break;
 case 'date':line(new Date().toLocaleString('es-ES'));break;
 case 'echo':line(arg);break;
 case 'sudo':line('Este escritorio no ejecuta comandos con privilegios. Escribe help para ver los comandos disponibles.','success');break;
 case 'exit':line('Sesión bloqueada. Los datos de la sesión se conservan mientras la página esté abierta.');lock();break;
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
  e.target.closest('input,textarea,select,[data-terminal-exempt],[data-resize],[contenteditable]:not([contenteditable="false"])') ||
  (e.key===' ' && e.target.closest('button,a,[role="button"]'))) return;
 input.focus({preventScroll:true});
 input.setRangeText(e.key,input.selectionStart,input.selectionEnd,'end');
 input.dispatchEvent(new Event('input',{bubbles:true}));
 e.preventDefault();
});
$('#show-all').addEventListener('click',projectGrid);
document.addEventListener('click',e=>{
 const doc=e.target.closest('[data-document]');if(doc)openDocument(home+'/'+doc.dataset.document);
 const folder=e.target.closest('[data-folder]');if(folder)showFolder(folder.dataset.folder);
 const open=e.target.closest('[data-open]');if(open){if(!entered)enter(false);showWindow(open.dataset.open)}
 const command=e.target.closest('[data-command],[data-entry-command]');if(command){if(!entered)enter(false);showWindow('terminal');run(command.dataset.command||command.dataset.entryCommand)}
 const project=e.target.closest('[data-project]');if(project)projectDetail(project.dataset.project);
 const shot=e.target.closest('[data-screenshot]');if(shot){const p=projects.find(p=>p.id===shot.dataset.screenshot);$('#screenshot-full').src=p.image;$('#screenshot-full').alt=`${p.imageLabel||'Captura real'} de ${p.title}`;$('#screenshot-caption').textContent=`${p.title} · ${p.imageSource||(p.id==='ibexa'?'Captura del README del repositorio':'Captura de la web pública')} · noviembre de 2026`;$('#screenshot-dialog').showModal()}
 const action=e.target.closest('[data-action]');if(action){const win=action.closest('.window');if(action.dataset.action==='maximize'){win.classList.toggle('maximized');action.setAttribute('aria-label',win.classList.contains('maximized')?'Restaurar ventana':'Maximizar ventana')}else{win.hidden=true;syncDock();document.querySelector(`.dock [data-open="${win.id}"]`)?.focus()}focusTerminal()}
 if(!e.target.closest('button,a,input,textarea,select,[data-resize],[contenteditable]')) focusTerminal();
});
function resetWindowPositions(){windows.forEach(win=>{win.style.left='';win.style.top='';win.style.right=''})}
let refreshDesktopIcons=(createdPath,desktopPoint)=>{};
const shortcutTemplates=new Map();
const defaultDesktopShortcuts=new Set();
const shortcutId=button=>button.dataset.document?'document:'+button.dataset.document:button.dataset.open?'app:'+button.dataset.open:null;
function initDesktopIcons(){
 const desktop=$('#desktop'),container=$('.desktop-icons'),storageKey='whoami.desktop-icons.v1';
 function makeUserIcon(path,isFolder){
  const button=document.createElement('button'),image=document.createElement('img');
  image.className='desktop-image';image.src=isFolder?'assets/dock/files.webp':'assets/dock/editor.webp';image.alt='';
  button.append(image,document.createTextNode(path.slice(path.lastIndexOf('/')+1)));
  if(isFolder)button.dataset.folder=path;else button.dataset.userDocument=path;
  container.append(button);return button;
 }
 const prefix=desktopRoot+'/';
 container.querySelectorAll('button').forEach(button=>{
  const id=shortcutId(button);if(!id)return;
  shortcutTemplates.set(id,button.cloneNode(true));defaultDesktopShortcuts.add(id);
  if(userFiles.shortcuts[id]&&userFiles.shortcuts[id]!==desktopRoot)button.remove();
 });
 userFiles.folders.filter(path=>path.startsWith(prefix)&&!path.slice(prefix.length).includes('/')).forEach(path=>makeUserIcon(path,true));
 Object.keys(userFiles.documents).filter(path=>path.startsWith(prefix)&&!path.slice(prefix.length).includes('/')).forEach(path=>makeUserIcon(path,false));
 for(const name of ['tecnologias.md','README.md']){
  const button=document.createElement('button'),image=document.createElement('img');image.className='desktop-image';image.src='assets/dock/editor.webp';image.alt='';
  button.dataset.document=name;button.append(image,document.createTextNode(name));shortcutTemplates.set('document:'+name,button);
 }
 const icons=[...container.querySelectorAll('button')];
 const iconKey=icon=>icon.dataset.open||icon.dataset.document||icon.dataset.folder||icon.dataset.userDocument;
 const screen=desktop.getBoundingClientRect();
 const initial=icons.map(icon=>{const rect=icon.getBoundingClientRect();return {left:rect.left-screen.left,top:rect.top-screen.top}});
 let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}}catch{}
 const positions={};
 function bounds(icon){const top=$('.panel').offsetHeight;return {top,x:Math.max(0,desktop.clientWidth-icon.offsetWidth),y:Math.max(0,desktop.clientHeight-top-icon.offsetHeight)}}
 function clamp(value,min,max){return Math.min(max,Math.max(min,value))}
 function place(icon,x,y){const b=bounds(icon);icon.style.left=`${clamp(x,0,b.x)}px`;icon.style.top=`${clamp(y,b.top,b.top+b.y)}px`}
 function remember(icon){const b=bounds(icon),key=iconKey(icon);positions[key]={x:b.x?clamp(parseFloat(icon.style.left)/b.x,0,1):0,y:b.y?clamp((parseFloat(icon.style.top)-b.top)/b.y,0,1):0}}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(positions))}catch{}}
 function arrange(){icons.forEach(icon=>{const b=bounds(icon),pos=positions[iconKey(icon)];place(icon,pos.x*b.x,b.top+pos.y*b.y)})}
 container.classList.add('free-icons');
 function registerIcon(icon,index){
  const key=iconKey(icon),b=bounds(icon),pos=saved[key];
  positions[key]=pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.y)?{x:clamp(pos.x,0,1),y:clamp(pos.y,0,1)}:{x:b.x?clamp(initial[index].left/b.x,0,1):0,y:b.y?clamp((initial[index].top-b.top)/b.y,0,1):0};
  icon.setAttribute('aria-describedby','desktop-icon-help');
  let drag=null,suppressClick=false;
  icon.addEventListener('pointerdown',event=>{
   if(!event.isPrimary||event.button!==0)return;
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:parseFloat(icon.style.left),top:parseFloat(icon.style.top),moved:false};icon.setPointerCapture(event.pointerId);
  });
  icon.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
   if(!drag.moved&&Math.hypot(dx,dy)<6)return;
   drag.moved=true;icon.classList.add('dragging');place(icon,drag.left+dx,drag.top+dy);highlightDropTarget(icon,event.clientX,event.clientY);event.preventDefault();
  });
  icon.addEventListener('pointerup',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   if(drag.moved){
    const source=icon.dataset.folder||icon.dataset.userDocument||shortcutId(icon);
    const target=source&&findDropTarget(icon,event.clientX,event.clientY);
    clearDropTarget();
    if(target){
     const moved=shortcutTemplates.has(source)?moveShortcut(source,target.path):moveUserItem(source,target.path);
     if(moved){icon.remove();icons.splice(icons.indexOf(icon),1);delete positions[iconKey(icon)];save();refreshDesktopIcons();if($('#project-content').dataset.userFolder){if(currentUserFolder===home+'/proyectos')projectGrid();else if(!$('#files').hidden)showFolder(currentUserFolder)}}
     else place(icon,drag.left,drag.top);
    }else{remember(icon);save()}
    suppressClick=true;setTimeout(()=>{suppressClick=false},0);
   }
   drag=null;icon.classList.remove('dragging');
  });
  icon.addEventListener('pointercancel',()=>{drag=null;icon.classList.remove('dragging');clearDropTarget();arrange()});
  icon.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false}},true);
  icon.addEventListener('keydown',event=>{
   if(event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();const step=event.shiftKey?48:16,dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;
   place(icon,parseFloat(icon.style.left)+dx,parseFloat(icon.style.top)+dy);remember(icon);save();
  });
 }
 icons.forEach(registerIcon);
 refreshDesktopIcons=(createdPath,desktopPoint)=>{
  for(let i=icons.length-1;i>=0;i--){const key=iconKey(icons[i]);if(key.startsWith(prefix)&&!userFiles.folders.includes(key)&&!isUserDocument(key)){icons[i].remove();icons.splice(i,1);delete positions[key];save()}}
  for(let i=icons.length-1;i>=0;i--){const id=shortcutId(icons[i]);if(id&&userFiles.shortcuts[id]&&userFiles.shortcuts[id]!==desktopRoot){const key=iconKey(icons[i]);icons[i].remove();icons.splice(i,1);delete positions[key];save()}}
  const existing=new Set(icons.map(iconKey));
  shortcutTemplates.forEach((template,id)=>{
   const key=iconKey(template);if(existing.has(key)||(userFiles.shortcuts[id]&&userFiles.shortcuts[id]!==desktopRoot)||(!defaultDesktopShortcuts.has(id)&&userFiles.shortcuts[id]!==desktopRoot))return;
   const icon=template.cloneNode(true),index=icons.length;container.append(icon);icons.push(icon);
   initial[index]={left:8+index*12,top:$('.panel').offsetHeight+10+index*12};registerIcon(icon,index);
   const b=bounds(icon),pos=positions[iconKey(icon)];
   if(id===createdPath&&desktopPoint){place(icon,desktopPoint.x-icon.offsetWidth/2,desktopPoint.y);remember(icon);save()}
   else place(icon,pos.x*b.x,b.top+pos.y*b.y);
  });
  const add=(path,isFolder)=>{
   if(existing.has(path)||!path.startsWith(prefix)||path.slice(prefix.length).includes('/'))return;
   const icon=makeUserIcon(path,isFolder),index=icons.length;icons.push(icon);
   const height=icon.offsetHeight||80,width=icon.offsetWidth||104;
   const rows=Math.max(1,Math.floor((desktop.clientHeight-$('.panel').offsetHeight-100)/(height+8)));
   initial[index]={left:8+Math.floor(index/rows)*(width+8),top:$('.panel').offsetHeight+10+(index%rows)*(height+8)};
   registerIcon(icon,index);const b=bounds(icon),pos=positions[iconKey(icon)];
   if(path===createdPath&&desktopPoint){place(icon,desktopPoint.x-icon.offsetWidth/2,desktopPoint.y);remember(icon);save()}
   else place(icon,pos.x*b.x,b.top+pos.y*b.y);
  };
  userFiles.folders.forEach(path=>add(path,true));Object.keys(userFiles.documents).forEach(path=>add(path,false));
 };
 const menu=$('#desktop-context-menu'),organize=$('#desktop-organize-icons');
 function closeMenu(restoreFocus=false){if(menu.hidden)return;menu.hidden=true;if(restoreFocus)desktop.focus({preventScroll:true})}
 function organizeIcons(){
  const top=$('.panel').offsetHeight+10;
  const iconWidth=icons[0]?.offsetWidth||104,iconHeight=Math.max(...icons.map(icon=>icon.offsetHeight),1);
  const stepX=iconWidth+8,stepY=iconHeight+8;
  const usableHeight=Math.max(iconHeight,desktop.clientHeight-top-90);
  const rows=Math.max(1,Math.floor(usableHeight/stepY));
  const columns=Math.max(1,Math.floor((desktop.clientWidth-16)/stepX));
  const horizontal=matchMedia('(max-width:700px)').matches;
  icons.forEach((icon,index)=>{
   const column=horizontal?index%columns:Math.floor(index/rows);
   const row=horizontal?Math.floor(index/columns):index%rows;
   place(icon,8+column*stepX,top+row*stepY);remember(icon);
  });
  save();closeMenu();
 }
 desktop.addEventListener('contextmenu',event=>{
  const area=event.target.closest('#project-content');
  const folder=area?.dataset.userFolder;
  const onDesktop=!event.target.closest('.window,.panel,.dock,.desktop-hint,dialog,#desktop-context-menu') && (event.target===desktop||event.target.closest('.desktop-icons,.wallpaper'));
  if(!onDesktop&&!folder)return;
  event.preventDefault();
  contextCreationFolder=onDesktop?desktopRoot:folder;
  contextFromDesktop=Boolean(onDesktop);
  organize.hidden=!onDesktop;
  const rect=desktop.getBoundingClientRect();
  const targetRect=event.target.getBoundingClientRect();
  const x=(event.clientX||targetRect.left)-rect.left,y=(event.clientY||targetRect.bottom)-rect.top;
  contextDesktopPoint=onDesktop?{x,y}:null;
  menu.hidden=false;
  menu.style.left=`${clamp(x,0,Math.max(0,rect.width-menu.offsetWidth))}px`;
  menu.style.top=`${clamp(y,$('.panel').offsetHeight,Math.max($('.panel').offsetHeight,rect.height-menu.offsetHeight))}px`;
  menu.querySelector('[data-context-create]').focus({preventScroll:true});
 });
 organize.addEventListener('click',organizeIcons);
 menu.querySelectorAll('[data-context-create]').forEach(button=>button.addEventListener('click',()=>{
  currentUserFolder=contextCreationFolder;pendingUserKind=button.dataset.contextCreate;creationFromDesktop=contextFromDesktop;creationDesktopPoint=contextDesktopPoint;
  closeMenu();openCreateDialog();
 }));
 document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target))closeMenu()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){event.preventDefault();closeMenu(true)}});
 window.addEventListener('resize',()=>{closeMenu();arrange()});
 new MutationObserver(()=>{if(!$('#login').hidden)closeMenu()}).observe($('#login'),{attributes:true,attributeFilter:['hidden']});
 arrange();
}
windows.forEach(win=>{
 win.addEventListener('pointerdown',()=>raise(win));
 const edges=['n','e','s','w','ne','se','sw','nw'];
 edges.forEach(edge=>{
  const handle=document.createElement('span');handle.className=`resize-handle resize-${edge}`;handle.dataset.resize=edge;handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-label',`Redimensionar ${win.querySelector('.titlebar h1,.titlebar h2')?.textContent||'ventana'}`);handle.setAttribute('aria-orientation',['e','w'].includes(edge)?'vertical':'horizontal');win.append(handle);
  let resize=null;
  handle.addEventListener('pointerdown',e=>{
   if(win.classList.contains('maximized')||matchMedia('(max-width:700px)').matches)return;
   e.preventDefault();e.stopPropagation();raise(win);const rect=win.getBoundingClientRect(),screen=$('#desktop').getBoundingClientRect();resize={edge,x:e.clientX,y:e.clientY,left:rect.left-screen.left,top:rect.top-screen.top,width:rect.width,height:rect.height};handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove',e=>{
   if(!resize)return;
   const desktop=$('#desktop'),dx=e.clientX-resize.x,dy=e.clientY-resize.y,minWidth=Math.max(280,parseFloat(getComputedStyle(win).minWidth)||280),minHeight=180,maxWidth=desktop.clientWidth-resize.left,maxHeight=desktop.clientHeight-resize.top-60;
   let width=resize.width,height=resize.height,left=resize.left,top=resize.top;
   if(resize.edge.includes('e'))width=Math.min(maxWidth,Math.max(minWidth,resize.width+dx));
   if(resize.edge.includes('w')){width=Math.min(resize.left+resize.width,Math.max(minWidth,resize.width-dx));left=resize.left+resize.width-width}
   if(resize.edge.includes('s'))height=Math.min(maxHeight,Math.max(minHeight,resize.height+dy));
   if(resize.edge.includes('n')){height=Math.min(resize.top+resize.height,Math.max(minHeight,resize.height-dy));top=resize.top+resize.height-height}
   win.style.left=`${left}px`;win.style.top=`${top}px`;win.style.right='auto';win.style.width=`${width}px`;win.style.height=`${height}px`;win.style.maxHeight='none';
  });
  const stopResize=()=>{resize=null};handle.addEventListener('pointerup',stopResize);handle.addEventListener('pointercancel',stopResize);
  handle.addEventListener('keydown',e=>{
   if(!e.key.startsWith('Arrow')||win.classList.contains('maximized'))return;
   e.preventDefault();const amount=e.shiftKey?48:16,rect=win.getBoundingClientRect(),screen=$('#desktop').getBoundingClientRect();let width=rect.width,height=rect.height,left=rect.left-screen.left,top=rect.top-screen.top;
   if(e.key==='ArrowRight')width=Math.min($('#desktop').clientWidth-left,width+amount);
   if(e.key==='ArrowLeft')width=Math.max(280,width-amount);
   if(e.key==='ArrowDown')height=Math.min($('#desktop').clientHeight-top-60,height+amount);
   if(e.key==='ArrowUp')height=Math.max(180,height-amount);
   win.style.left=`${left}px`;win.style.top=`${top}px`;win.style.right='auto';win.style.width=`${width}px`;win.style.height=`${height}px`;win.style.maxHeight='none';
  });
 });
 const bar=win.querySelector('.titlebar');let drag;
 bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))win.classList.toggle('maximized')});
 bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||win.classList.contains('maximized')||matchMedia('(max-width:600px)').matches)return;const rect=win.getBoundingClientRect();const screen=$('#desktop').getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:rect.left-screen.left,top:rect.top-screen.top};bar.setPointerCapture(e.pointerId)});
 bar.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(0,Math.min($('#desktop').clientWidth-win.offsetWidth,drag.left+e.clientX-drag.x));const y=Math.max(44,Math.min($('#desktop').clientHeight-win.offsetHeight-70,drag.top+e.clientY-drag.y));win.style.left=x+'px';win.style.top=y+'px';win.style.right='auto'});
 bar.addEventListener('pointerup',()=>drag=null);bar.addEventListener('pointercancel',()=>drag=null);
});
window.addEventListener('resize',resetWindowPositions);
function clock(){const now=new Date();$('#clock').textContent=now.toLocaleDateString('es-ES',{day:'numeric',month:'short'})+' · '+now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});$('#login-time').textContent=now.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})+' · '+now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}

const applications = [
 {id:'computer',name:'Mi PC',icon:'▣',description:'Almacenamiento del escritorio'},
 {id:'terminal',name:'Terminal',icon:'>_',description:'Comandos y navegación'},
 {id:'files',name:'Archivos',icon:'▱',description:'Proyectos y documentos'},
 {id:'editor',name:'Editor de texto',icon:'▤',description:'Sobre mí, tecnologías y notas'},
 {id:'gallery',name:'Imágenes',icon:'▧',description:'Capturas reales de proyectos'},
 {id:'settings',name:'Ajustes',icon:'⚙',description:'Tu escritorio, a tu gusto'},
 {id:'processes',name:'Monitor de aplicaciones',icon:'▥',description:'Gestiona las ventanas abiertas'},
 {id:'contact-app',name:'Contactos',icon:'↗',description:'GitHub y LinkedIn'},
 {id:'mines',name:'Buscaminas',icon:'✹',description:'8 × 8 · diez minas, una pausa'},
 {id:'snake',name:'Snake',icon:'▦',description:'Arcade · flechas, WASD y píxeles'},
 {id:'guide',name:'Ayuda',icon:'?',description:'Aprende a usar la terminal'}
];
files[home+'/sobre-mi.md']='# Roberto Pérez Villegas\n\nDesarrollador · @todomagichere\n\n## Perfil\n\n'+about.split('\n\n').slice(1).join('\n\n')+'\n';
files[home+'/tecnologias.md']='# Tecnologías entre mis proyectos\n\n## Tecnologías principales\n\nPHP, Symfony y JavaScript. 15 años de experiencia en desarrollo de software.\n\n## PHP e Ibexa\n\nExtensiones para el back office y experimentos con algoritmos.\nProyectos: ibexa-contenttype-info-tab, ibexa-breadcrumbs-bundle y fibonacci.\n\n## JavaScript y navegador\n\nJuegos diarios, herramientas e interfaces interactivas.\nProyecto: etimologia.\n\n## Firefox\n\nTraducción de texto seleccionado mediante Perplexity.\nProyecto: firefox-perplexity-translator.\n\n## React y TypeScript\n\nGestión de partidas y jugadores.\nProyecto: risk-master.\n\n## HTML, CSS y Docker\n\nPortales estáticos y entornos de desarrollo reproducibles.\nProyectos: prepara-tu-mochila y la-gran-aventura-pirata.\n';
files[home+'/notas.md']='# Cuaderno del visitante\n\nEste documento es tuyo mientras exploras el escritorio.\nEscribe aquí y léelo con cat ~/notas.md.\n\nTus notas se guardan automáticamente en este navegador.\n\n## Comandos para probar\n\nls proyectos\ncd proyectos/etimologia\ncat README.md\nopen etimologia\n\n## Tus ideas\n\n';
const notesKey='whoami.fs.v2.notes';
const legacyNotesKey='whoami.notes.v1';
let notesStorageAvailable=true;
try{
 const saved=localStorage.getItem(notesKey),legacy=localStorage.getItem(legacyNotesKey);
 if(saved!==null){const note=JSON.parse(saved);if(typeof note.content!=='string')throw new Error('Invalid note');files[home+'/notas.md']=note.content}
 else if(legacy!==null){
  files[home+'/notas.md']=legacy;
  try{localStorage.setItem(notesKey,JSON.stringify({type:'file',title:'notas.md',content:legacy,parent:'system:'+home+'/Documentos'}));localStorage.removeItem(legacyNotesKey)}catch{notesStorageAvailable=false}
 }
}catch{notesStorageAvailable=false}
const documentsRoot=home+'/Documentos';
const desktopRoot=home+'/Escritorio';
let fileStorage;
try{fileStorage=new PortfolioFileSystemStorage(window.localStorage)}catch{fileStorage=new PortfolioFileSystemStorage(null)}
let userFiles=fileStorage.load();
directories.add(documentsRoot);
directories.add(desktopRoot);
userFiles.folders.forEach(path=>directories.add(path));
Object.entries(userFiles.documents).forEach(([path,content])=>{files[path]=content});
function persistUserFiles(next,options){fileStorage.write(next,options);userFiles=next}
function isUserDocument(path){return Object.hasOwn(userFiles.documents,path)}
let currentDocument=home+'/sobre-mi.md';
const drafts=new Map();
let highlightedDropTarget=null;
let fileMessageTimer=0;
function fileMessage(message){
 const status=$('#file-move-status');status.textContent=message;status.hidden=false;
 clearTimeout(fileMessageTimer);fileMessageTimer=setTimeout(()=>{status.hidden=true},4000);
}
function folderPath(button){
 if(button?.dataset.open==='files')return home+'/proyectos';
 const path=button?.dataset.folder;
 if(path==='projects')return home+'/proyectos';
 if(path==='documents')return documentsRoot;
 if(path==='home')return home;
 return path&&directories.has(path)?path:null;
}
function findDropTarget(source,x,y){
 for(const element of document.elementsFromPoint(x,y)){
  if(element===source||source.contains(element))continue;
  const button=element.closest('button[data-folder],.desktop-icons button[data-open=files],.folder-grid button[data-open=files]');
  if(button&&button!==source){const path=folderPath(button);if(path)return {element:button,path}}
  if(element.closest('.window,.dock,.panel'))return null;
  if(!source.closest('.desktop-icons')&&element.matches('#desktop,.wallpaper'))return {element,path:desktopRoot,desktop:true};
 }
 return null;
}
function clearDropTarget(){if(highlightedDropTarget)highlightedDropTarget.classList.remove('drop-target');highlightedDropTarget=null}
function highlightDropTarget(source,x,y){
 const target=findDropTarget(source,x,y);clearDropTarget();
 if(target&&!target.desktop){highlightedDropTarget=target.element;highlightedDropTarget.classList.add('drop-target')}
}
function shortcutNameTaken(destination,name,except){
 return [...shortcutTemplates].some(([id,template])=>id!==except&&(userFiles.shortcuts[id]||(defaultDesktopShortcuts.has(id)?desktopRoot:null))===destination&&template.textContent.trim()===name);
}
function moveShortcut(id,destination){
 if(!shortcutTemplates.has(id)||!directories.has(destination))return false;
 if(id==='app:files'&&(destination===home+'/proyectos'||destination.startsWith(home+'/proyectos/'))){fileMessage('No puedes mover una carpeta dentro de sí misma.');return false}
 const template=shortcutTemplates.get(id),name=template.textContent.trim();
 if((userFiles.shortcuts[id]||desktopRoot)===destination)return false;
 const conflict=shortcutNameTaken(destination,name,id);
 if(conflict||directories.has(destination+'/'+name)||Object.hasOwn(files,destination+'/'+name)){fileMessage('Ya existe un archivo o carpeta con ese nombre.');return false}
 try{persistUserFiles({...userFiles,shortcuts:{...userFiles.shortcuts,[id]:destination}})}catch{fileMessage('No se pudo mover: comprueba el almacenamiento del navegador.');return false}
 fileMessage('Elemento movido a '+destination.slice(destination.lastIndexOf('/')+1)+'.');return true;
}
function appendShortcuts(grid,path){
 shortcutTemplates.forEach((template,id)=>{
  if(userFiles.shortcuts[id]!==path||(path===documentsRoot&&id.startsWith('document:')&&['sobre-mi.md','notas.md','tecnologias.md','README.md'].includes(id.slice(9))))return;
  const button=template.cloneNode(true);button.className='folder-shortcut';
  const image=button.querySelector('img');if(image)image.className='folder-shortcut-image';
  makeFolderItemDraggable(button,id);grid.append(button);
 });
}
function moveUserItem(source,destination){
 const isFolder=userFiles.folders.includes(source);
 if(!isFolder&&!isUserDocument(source))return false;
 if(source===destination||destination.startsWith(source+'/')){fileMessage('No puedes mover una carpeta dentro de sí misma.');return false}
 if(!directories.has(destination)){fileMessage('La carpeta de destino no existe.');return false}
 const nextPath=destination+'/'+source.slice(source.lastIndexOf('/')+1);
 if(nextPath===source)return false;
 if(directories.has(nextPath)||Object.hasOwn(files,nextPath)||shortcutNameTaken(destination,source.slice(source.lastIndexOf('/')+1))){fileMessage('Ya existe un archivo o carpeta con ese nombre.');return false}
 const remap=path=>path===source||path.startsWith(source+'/')?nextPath+path.slice(source.length):path;
 const next={folders:userFiles.folders.map(remap),documents:{},shortcuts:{}};
 Object.entries(userFiles.shortcuts).forEach(([key,path])=>{next.shortcuts[key]=remap(path)});
 Object.entries(userFiles.documents).forEach(([path,content])=>{next.documents[remap(path)]=content});
 try{persistUserFiles(next,{remap})}catch{fileMessage('No se pudo mover: comprueba el almacenamiento del navegador.');return false}
 // Update all in-memory paths only after the entire change has been saved.
 for(const path of [...directories])if(path===source||path.startsWith(source+'/')){directories.delete(path);directories.add(remap(path))}
 for(const path of Object.keys(files))if(path===source||path.startsWith(source+'/')){files[remap(path)]=files[path];delete files[path]}
 for(const [path,text] of [...drafts])if(path===source||path.startsWith(source+'/')){drafts.delete(path);drafts.set(remap(path),text)}
 if(currentDocument===source||currentDocument.startsWith(source+'/')){
  currentDocument=remap(currentDocument);
  const name=currentDocument.slice(home.length+1);$('#editor-tab-name').textContent=name;$('#editor-title').textContent=name+' — gedit';
 }
 for(const option of $('#editor-file').options){const path=home+'/'+option.value;const updated=remap(path);if(updated!==path){option.value=updated.slice(home.length+1);option.textContent=option.value}}
 if(currentDocument===nextPath||currentDocument.startsWith(nextPath+'/'))$('#editor-file').value=currentDocument.slice(home.length+1);
 if(cwd===source||cwd.startsWith(source+'/')){cwd=remap(cwd);updatePrompt()}
 if(currentUserFolder===source||currentUserFolder.startsWith(source+'/'))currentUserFolder=remap(currentUserFolder);
 fileMessage('Elemento movido a '+destination.slice(destination.lastIndexOf('/')+1)+'.');
 return true;
}
function makeFolderItemDraggable(button,source){
 button.classList.add('user-file-draggable');
 let drag=null,suppressClick=false;
 function stop(){
  document.removeEventListener('pointermove',move);
  document.removeEventListener('pointerup',up);
  document.removeEventListener('pointercancel',cancel);
  drag=null;button.classList.remove('dragging-file');clearDropTarget();
 }
 function move(event){
  if(!drag||drag.id!==event.pointerId)return;
  if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;
  drag.moved=true;button.classList.add('dragging-file');highlightDropTarget(button,event.clientX,event.clientY);event.preventDefault();
 }
 function up(event){
  if(!drag||drag.id!==event.pointerId)return;
  if(drag.moved){
   const target=findDropTarget(button,event.clientX,event.clientY);clearDropTarget();
   if(target&&(shortcutTemplates.has(source)?moveShortcut(source,target.path):moveUserItem(source,target.path))){
    const rect=$('#desktop').getBoundingClientRect();
    const point=target.desktop?{x:event.clientX-rect.left,y:event.clientY-rect.top}:null;
    const created=target.desktop?(shortcutTemplates.has(source)?source:desktopRoot+'/'+source.slice(source.lastIndexOf('/')+1)):undefined;
    refreshDesktopIcons(created,point);if(currentUserFolder===home+'/proyectos')projectGrid();else showFolder(currentUserFolder);
   }
   suppressClick=true;setTimeout(()=>{suppressClick=false},0);
  }
  stop();
 }
 function cancel(event){if(drag&&drag.id===event.pointerId)stop()}
 button.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
  document.addEventListener('pointermove',move);
  document.addEventListener('pointerup',up);
  document.addEventListener('pointercancel',cancel);
  button.setPointerCapture(event.pointerId);
 });
 button.addEventListener('dragstart',event=>event.preventDefault());
 button.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation()}},true);
}

function rememberDraft(){if(currentDocument&&$('#editor-text').value!==files[currentDocument])drafts.set(currentDocument,$('#editor-text').value);else drafts.delete(currentDocument)}
function loadDocument(path){
 currentDocument=path;$('#editor-text').value=drafts.get(path)??files[path];
 const name=path.slice(home.length+1);$('#editor-tab-name').textContent=name;$('#editor-title').textContent=name+' — gedit';
 const select=$('#editor-file');if(![...select.options].some(o=>o.value===name)){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option)}select.value=name;
 $('#editor-save-status').textContent=path===home+'/notas.md'?(notesStorageAvailable?'Notas guardadas en este navegador':'Almacenamiento no disponible; copia tus notas'):isUserDocument(path)?'Guardado en este navegador':'Borrador de esta sesión';$('#editor-text').setSelectionRange(0,0);$('#editor-text').scrollTop=0;$('#editor-text').scrollLeft=0;updateEditor();
}
function openDocument(path){if(!Object.hasOwn(files,path))return;rememberDraft();loadDocument(path);showWindow('editor')}
function updateEditor(){
 const text=$('#editor-text');const before=text.value.slice(0,text.selectionStart);const lines=before.split('\n');$('#editor-position').textContent=`Ln ${lines.length}, Col ${lines.at(-1).length+1}`;
 $('#editor-lines').textContent=Array.from({length:text.value.split('\n').length},(_,i)=>i+1).join('\n');$('#editor-lines').scrollTop=text.scrollTop;
 $('#editor-dirty').textContent=text.value===files[currentDocument]?'':'● Sin guardar';
}
$('#editor-text').addEventListener('input',()=>{rememberDraft();if(currentDocument===home+'/notas.md'||isUserDocument(currentDocument))saveDocument();else updateEditor()});['click','keyup','select'].forEach(event=>$('#editor-text').addEventListener(event,updateEditor));
$('#editor-text').addEventListener('scroll',()=>$('#editor-lines').scrollTop=$('#editor-text').scrollTop);
function saveDocument(){
 const value=$('#editor-text').value;
 let status='Guardado en esta sesión';
 if(isUserDocument(currentDocument)){
  try{persistUserFiles({...userFiles,documents:{...userFiles.documents,[currentDocument]:value}});files[currentDocument]=value;drafts.delete(currentDocument);status='Guardado en este navegador'}
  catch{status='No se pudo guardar; copia el texto antes de salir'}
  $('#editor-save-status').textContent=status;updateEditor();return;
 }
 files[currentDocument]=value;drafts.delete(currentDocument);
 if(currentDocument===home+'/notas.md'){
  try{localStorage.setItem(notesKey,JSON.stringify({type:'file',title:'notas.md',content:files[currentDocument],parent:'system:'+home+'/Documentos'}));localStorage.removeItem(legacyNotesKey);notesStorageAvailable=true;status='Guardado en este navegador'}
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
let currentUserFolder=documentsRoot;
let pendingUserKind='';
let contextCreationFolder=desktopRoot,contextFromDesktop=false,creationFromDesktop=false,contextDesktopPoint=null,creationDesktopPoint=null;
function showFolder(folder){
 if(folder==='projects'){projectGrid();showWindow('files');return}
 const area=$('#project-content');area.replaceChildren();delete area.dataset.userFolder;
 const isHome=folder==='home';
 const path=isHome?home:folder==='documents'?documentsRoot:folder;
 if(!isHome&&!directories.has(path))return;
 currentUserFolder=path;area.dataset.userFolder=path;
 $('#file-address').textContent='⌂ '+(isHome?home:path);
 const grid=document.createElement('div');grid.className='folder-grid';
 function addEntry(name,target,type){
  const button=document.createElement('button');const icon=document.createElement('span');icon.className=type==='folder'||type==='gallery'?'folder-icon':'file-icon';icon.textContent=type==='folder'||type==='gallery'?'':'#';
  const title=document.createElement('span');title.textContent=name;button.append(icon,title);
  if(type==='builtin')button.dataset.document=name;
  else if(type==='gallery')button.dataset.open='gallery';
  else if(type==='folder')button.dataset.folder=target;
  else button.dataset.userDocument=target;
  if((type==='folder'&&userFiles.folders.includes(target))||type==='document')makeFolderItemDraggable(button,target);
  if(type==='builtin'&&shortcutTemplates.has('document:'+name))makeFolderItemDraggable(button,'document:'+name);
  grid.append(button);
 }
 {
  if(isHome){addEntry('Proyectos','projects','folder');addEntry('Documentos','documents','folder');addEntry('Escritorio',desktopRoot,'folder');addEntry('Imágenes','gallery','gallery')}
  const toolbar=document.createElement('div');toolbar.className='user-files-toolbar';
  if(!isHome&&path!==documentsRoot&&path!==desktopRoot){const back=document.createElement('button');back.textContent='← Carpeta anterior';back.dataset.folder=path.slice(0,path.lastIndexOf('/'));toolbar.append(back)}
  for(const [label,kind] of [['Nueva carpeta','folder'],['Nuevo documento','document']]){const button=document.createElement('button');button.textContent=label;button.dataset.createUserFile=kind;toolbar.append(button)}
  area.append(toolbar);
  if(path===documentsRoot)for(const name of ['sobre-mi.md','tecnologias.md','notas.md','README.md']){const location=userFiles.shortcuts['document:'+name];if(!location||location===documentsRoot)addEntry(name,null,'builtin')}
  const prefix=path+'/';
  userFiles.folders.filter(item=>item.startsWith(prefix)&&!item.slice(prefix.length).includes('/')).sort((a,b)=>a.localeCompare(b,'es')).forEach(item=>addEntry(item.slice(prefix.length),item,'folder'));
  Object.keys(userFiles.documents).filter(item=>item.startsWith(prefix)&&!item.slice(prefix.length).includes('/')).sort((a,b)=>a.localeCompare(b,'es')).forEach(item=>addEntry(item.slice(prefix.length),item,'document'));
 }
 appendShortcuts(grid,path);area.append(grid);showWindow('files');
}
const createDialog=$('#create-user-file-dialog'),createForm=$('#create-user-file-form'),createName=$('#create-user-file-name'),createError=$('#create-user-file-error');
document.addEventListener('click',event=>{
 const open=event.target.closest('[data-user-document]');if(open)openDocument(open.dataset.userDocument);
 const create=event.target.closest('[data-create-user-file]');if(!create)return;
 pendingUserKind=create.dataset.createUserFile;creationFromDesktop=false;openCreateDialog();
});
function openCreateDialog(){
 createName.value='';createError.textContent='';
 $('#create-user-file-title').textContent=pendingUserKind==='folder'?'Nueva carpeta':'Nuevo documento';
 createDialog.showModal();createName.focus();
}
createForm.addEventListener('submit',event=>{
 event.preventDefault();
 const name=createName.value.trim();
 if(!name||name==='.'||name==='..'||/[\/\\\x00-\x1f]/.test(name)){createError.textContent='Escribe un nombre válido, sin barras.';return}
 const path=currentUserFolder+'/'+name;
 if((currentUserFolder===home&&['Proyectos','Documentos','Escritorio','Imágenes'].includes(name))||directories.has(path)||Object.hasOwn(files,path)){createError.textContent='Ya existe un elemento con ese nombre.';return}
 try{
  if(pendingUserKind==='folder'){persistUserFiles({...userFiles,folders:[...userFiles.folders,path]});directories.add(path)}
  else {persistUserFiles({...userFiles,documents:{...userFiles.documents,[path]:''}});files[path]=''}
 }catch{createError.textContent='No se pudo guardar. Comprueba el espacio disponible en el navegador.';return}
 createDialog.close();refreshDesktopIcons(path,creationFromDesktop?creationDesktopPoint:null);if(!creationFromDesktop)showFolder(currentUserFolder);
 if(pendingUserKind==='document')openDocument(path);
});
$('#create-user-file-cancel').addEventListener('click',()=>createDialog.close());
document.querySelectorAll('button[data-layout-style]').forEach(button=>button.addEventListener('click',()=>{document.body.dataset.layoutStyle=button.dataset.layoutStyle;document.querySelectorAll('button[data-layout-style]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)))}));
document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{document.body.classList.remove('small-text','large-text');if(button.dataset.size==='small')document.body.classList.add('small-text');if(button.dataset.size==='large')document.body.classList.add('large-text');document.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));
$('#reduce-motion').checked=matchMedia('(prefers-reduced-motion:reduce)').matches;$('#reduce-motion').addEventListener('change',()=>document.body.classList.toggle('reduce-motion',$('#reduce-motion').checked));
clock();setInterval(clock,30000);projectGrid();welcome();loadDocument(home+'/sobre-mi.md');renderGallery();renderApps();syncDock();initDesktopIcons();projectGrid();
let sessionActive=false;try{sessionActive=localStorage.getItem(sessionKey)==='active'}catch{}
if(sessionActive)enter();else $('#enter').focus({preventScroll:true});
