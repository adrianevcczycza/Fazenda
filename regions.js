'use strict';

// Cada destino tem seus próprios objetos, obstáculos, personagens e colecionáveis.
// O motor em script.js consulta estes dados sem duplicar as regras de movimento.
const REGIONS = {
  farm: {
    name: 'Vale do Sol', subtitle: 'Onde toda estrada começa.', number: '01',
    category: 'INTERIOR', symbol: '☀', color: '#b76b3e', spawn: {x:300,y:315},
    note: 'Mila deixou sementes na sua mochila. O resto, você descobre pelo caminho.',
    activities: ['Uma horta para chamar de sua', 'O cavalo Pingo está no estábulo', 'Uma rodada de sorte na praça']
  },
  coast: {
    name: 'Porto Brisa', subtitle: 'Sal no cabelo. Histórias no cais.', number: '02',
    category: 'LITORAL', symbol: '≋', color: '#377d88', spawn: {x:185,y:345},
    note: 'O capitão Bento troca três conchas por 40 moedas. Ele sempre diz que é a última encomenda.',
    activities: ['Recolha conchas na areia', 'Entregue a encomenda do capitão', 'Lance a linha na ponta do cais'],
    buildings: [
      {x:96,y:146,w:120,h:83,roof:'#d07c56',name:'PENSÃO DA MARÉ'},
      {x:300,y:128,w:138,h:95,roof:'#598f9b',name:'ARMAZÉM DO CAIS'},
      {x:580,y:172,w:98,h:69,roof:'#ce9e52',name:'CASA DO BENTO'}
    ],
    solids: [{x:96,y:146,w:120,h:83},{x:300,y:128,w:138,h:95},{x:580,y:172,w:98,h:69},
      {x:720,y:34,w:240,h:380},{x:720,y:466,w:240,h:174}],
    trees: [{x:52,y:310},{x:488,y:165},{x:640,y:358},{x:80,y:592},{x:528,y:549}],
    objects: [
      {id:'coast-inn',x:156,y:247,kind:'home',label:'Dormir na pensão'},
      {id:'coast-shop',x:369,y:243,kind:'shop',label:'Entrar no armazém'},
      {id:'bento',x:563,y:296,kind:'localNpc',label:'Conversar com capitão Bento',color:'#355d7d'},
      {id:'mail',x:443,y:368,kind:'delivery',label:'Entregar conchas ao capitão'},
      {id:'sea-fish',x:865,y:442,kind:'fish',label:'Pescar no mar'},
      {id:'coast-chest',x:639,y:573,kind:'chest',label:'Abrir o baú da maré'},
      {id:'coast-road',x:117,y:454,kind:'travel',label:'Pegar a estrada'}
    ],
    pickups: [
      {id:'shell-1',x:300,y:469,type:'shell'},{id:'shell-2',x:395,y:535,type:'shell'},
      {id:'shell-3',x:608,y:445,type:'shell'},{id:'shell-4',x:678,y:509,type:'shell'},
      {id:'coast-coin',x:501,y:399,type:'coin'}
    ]
  },
  mountain: {
    name: 'Serra do Cobre', subtitle: 'Quem escuta a pedra encontra histórias.', number: '03',
    category: 'MONTANHA', symbol: '△', color: '#aa664b', spawn: {x:442,y:502},
    note: 'Ivo jura que a montanha tem nove bolsos. Escolha onde cavar. Três minérios viram uma barra na forja.',
    activities: ['Escave nove pontos na mina', 'Transforme minério em barras', 'Encontre o segredo da serra'],
    buildings: [
      {x:106,y:278,w:135,h:92,roof:'#77645b',name:'POUSO DO MINEIRO'},
      {x:570,y:249,w:144,h:101,roof:'#a75e43',name:'FORJA DO IVO'}
    ],
    solids: [{x:106,y:278,w:135,h:92},{x:570,y:249,w:144,h:101},
      {x:50,y:34,w:270,h:146},{x:640,y:34,w:280,h:132},{x:347,y:102,w:189,h:82}],
    trees: [{x:57,y:270},{x:280,y:278},{x:816,y:267},{x:80,y:560},{x:260,y:590},{x:738,y:574},{x:895,y:552}],
    objects: [
      {id:'mine',x:440,y:222,kind:'mine',label:'Explorar a mina'},
      {id:'forge',x:642,y:374,kind:'forge',label:'Trabalhar na forja'},
      {id:'ivo',x:548,y:416,kind:'localNpc',label:'Conversar com Ivo',color:'#ab6947'},
      {id:'mountain-inn',x:174,y:392,kind:'home',label:'Descansar no pouso'},
      {id:'mountain-shop',x:326,y:412,kind:'shop',label:'Comprar no carrinho de suprimentos'},
      {id:'mountain-chest',x:854,y:431,kind:'chest',label:'Abrir o baú da serra'},
      {id:'mountain-road',x:481,y:573,kind:'travel',label:'Descer a serra'}
    ],
    pickups: [{id:'ore-outside',x:588,y:191,type:'ore'},{id:'mountain-coin',x:375,y:467,type:'coin'}]
  },
  lantern: {
    name: 'Vila das Lanternas', subtitle: 'O forno aceso. A praça esperando.', number: '04',
    category: 'VILA', symbol: '✳', color: '#895d86', spawn: {x:470,y:526},
    note: 'Nina assa pão de maçã. À noite, o coreto repete quatro notas. Será que você consegue lembrar?',
    activities: ['Asse pão de maçã com Nina', 'Repita a sequência do coreto', 'Venda pães e descubra a vila'],
    buildings: [
      {x:99,y:149,w:146,h:98,roof:'#b46665',name:'PADARIA DA NINA'},
      {x:384,y:129,w:139,h:94,roof:'#846881',name:'CASA DOS VIAJANTES'},
      {x:693,y:162,w:140,h:94,roof:'#6d8e87',name:'FEIRA DA VILA'}
    ],
    solids: [{x:99,y:149,w:146,h:98},{x:384,y:129,w:139,h:94},{x:693,y:162,w:140,h:94},{x:419,y:337,w:100,h:56}],
    trees: [{x:53,y:350},{x:299,y:187},{x:597,y:175},{x:893,y:351},{x:168,y:505},{x:741,y:559},{x:866,y:576}],
    objects: [
      {id:'bakery',x:172,y:277,kind:'bakery',label:'Assar pão na padaria'},
      {id:'nina',x:279,y:334,kind:'localNpc',label:'Conversar com Nina',color:'#b76a79'},
      {id:'lantern-inn',x:453,y:244,kind:'home',label:'Descansar na hospedaria'},
      {id:'lantern-shop',x:762,y:279,kind:'shop',label:'Comprar farinha na feira'},
      {id:'bells',x:469,y:424,kind:'bells',label:'Tocar no coreto'},
      {id:'lantern-chest',x:81,y:556,kind:'chest',label:'Abrir baú do jardim'},
      {id:'lantern-road',x:539,y:559,kind:'travel',label:'Seguir viagem'}
    ],
    pickups: [{id:'lantern-apple',x:229,y:455,type:'apple'},{id:'lantern-herb',x:631,y:491,type:'herb'},{id:'lantern-coin',x:360,y:558,type:'coin'}]
  }
};

// As próximas seis cidades usam o mesmo contrato de dados, mas atividades e
// cenários específicos. A hospedaria permite renovar recursos do dia em qualquer lugar.
const MORE_CITIES = [
  {id:'grove',name:'Bosque dos Cogumelos',subtitle:'Nem tudo que brota vai para a cesta.',category:'BOSQUE',symbol:'♠',color:'#62846a',
    activity:'A cesta da botânica',npc:'Flora',note:'Flora procura cogumelos marrons com três pintas claras. Os vermelhos ficam onde estão.',
    activities:['Reconheça os cogumelos da Flora','Escolha três sem errar a espécie','Venda a coleta na cooperativa'],
    roofs:['#708d65','#956751'],trees:[{x:54,y:196},{x:327,y:185},{x:598,y:168},{x:887,y:165},{x:85,y:440},{x:321,y:517},{x:701,y:549},{x:903,y:487}]},
  {id:'coral',name:'Costa Coral',subtitle:'Mais um mergulho. Ou hora de voltar?',category:'ARQUIPÉLAGO',symbol:'◉',color:'#338c99',
    activity:'Mergulhar no recife',npc:'Marina',note:'O tanque só tem cinco cargas. Procure pérolas e volte à superfície antes de ficar sem ar.',
    activities:['Mergulhe entre os corais','Administre o ar do tanque','Suba com as pérolas que encontrou'],
    roofs:['#e39d6c','#6ea3a6'],trees:[{x:65,y:186},{x:315,y:185},{x:887,y:229},{x:92,y:467},{x:748,y:532}]},
  {id:'dunes',name:'Dunas de Âmbar',subtitle:'O vento apaga pegadas. Não memórias.',category:'DESERTO',symbol:'◈',color:'#b78440',
    activity:'Restaurar o mosaico',npc:'Amir',note:'Um mosaico antigo perdeu a ordem. Troque duas peças de lugar para reconstruir o sol das ruínas.',
    activities:['Entre na tenda do arqueólogo','Reorganize seis fragmentos','Leve a relíquia restaurada'],
    roofs:['#ae704b','#bb9259'],trees:[{x:69,y:268},{x:326,y:148},{x:885,y:314},{x:98,y:488},{x:736,y:538}]},
  {id:'garden',name:'Jardim Aurora',subtitle:'Cada buquê conta de alguém.',category:'JARDINS',symbol:'✿',color:'#a9677b',
    activity:'Montar um buquê',npc:'Rosa',note:'Rosa deixou um pedido na bancada. Monte exatamente a combinação de flores encomendada.',
    activities:['Leia o pedido da floricultura','Escolha a combinação de flores','Receba por um buquê sob medida'],
    roofs:['#b87784','#86996b'],trees:[{x:62,y:240},{x:339,y:202},{x:605,y:151},{x:885,y:236},{x:97,y:503},{x:753,y:553}]},
  {id:'frost',name:'Estação Geada',subtitle:'Um passo. E lá vai você.',category:'SERRA GELADA',symbol:'❄',color:'#65879a',
    activity:'Cruzar o lago de gelo',npc:'Olga',note:'No lago, você desliza até encontrar uma pedra. Planeje os movimentos para alcançar a bandeira.',
    activities:['Entre no desafio do gelo','Deslize até a bandeira','Conquiste um cristal de inverno'],
    roofs:['#789399','#916a66'],trees:[{x:60,y:210},{x:324,y:188},{x:608,y:157},{x:900,y:203},{x:80,y:517},{x:740,y:537}]},
  {id:'wind',name:'Alto Ventania',subtitle:'Segure a linha. Escute o vento.',category:'PLANALTO',symbol:'⚑',color:'#728462',
    activity:'Empinar a pipa',npc:'Caio',note:'A pipa cai quando a linha fica solta. Segure para subir; solte para descer e acompanhe a faixa de vento.',
    activities:['Leve sua pipa ao mirante','Equilibre a altura por oito segundos','Ganhe a fita dos bons ventos'],
    roofs:['#7b8b72','#b5825b'],trees:[{x:62,y:252},{x:320,y:188},{x:900,y:237},{x:109,y:521},{x:748,y:531}]}
];
MORE_CITIES.forEach((city,index)=>{
  const id=city.id;
  REGIONS[id]={...city,number:String(index+5).padStart(2,'0'),spawn:{x:478,y:511},
    buildings:[{x:115,y:163,w:139,h:96,roof:city.roofs[0],name:id==='dunes'?'CARAVANSARÁ':'CASA DOS VIAJANTES'},
      {x:711,y:192,w:133,h:91,roof:city.roofs[1],name:id==='grove'?'COOPERATIVA':'MERCADO LOCAL'}],
    solids:[{x:115,y:163,w:139,h:96},{x:711,y:192,w:133,h:91},{x:415,y:233,w:124,h:84}],
    objects:[{id:`${id}-inn`,x:184,y:282,kind:'home',label:'Descansar na hospedaria'},
      {id:`${id}-shop`,x:777,y:307,kind:'shop',label:'Visitar o mercado'},
      {id:`${id}-activity`,x:478,y:352,kind:'townActivity',label:city.activity},
      {id:`${id}-npc`,x:609,y:407,kind:'townNpc',label:`Conversar com ${city.npc}`,color:city.color},
      {id:`${id}-chest`,x:866,y:546,kind:'chest',label:'Abrir baú escondido'},
      {id:`${id}-road`,x:427,y:578,kind:'travel',label:'Seguir pela estrada'}],
    pickups:[{id:`${id}-coin`,x:329,y:437,type:'coin'},{id:`${id}-herb`,x:666,y:500,type:'herb'}]
  };
});

const TRAVEL_SIGN = {id:'farm-road',x:685,y:586,kind:'travel',label:'Viajar para outra cidade'};
let activityToken = 0;
let arrivalTimer;
let audioContext;

function currentRegion() { return REGIONS[state.world] || REGIONS.farm; }
function worldObjects() { return state.world === 'farm' ? [...OBJECTS,TRAVEL_SIGN] : currentRegion().objects; }
function worldPlots() { return state.world === 'farm' ? PLOTS : []; }
function worldPickups() { return state.world === 'farm' ? PICKUPS : currentRegion().pickups; }
function worldSolids() { return state.world === 'farm' ? SOLIDS : currentRegion().solids; }
function worldTrees() { return state.world === 'farm' ? TREES : currentRegion().trees; }

function renderRegionUI() {
  const region = currentRegion();
  document.body.dataset.region = state.world;
  $('#map-title').textContent = region.name;
  $('#map-description').textContent = region.subtitle;
  $('#map-number').textContent = `${region.number} / ${region.category}`;
  $('#region-symbol').textContent = region.symbol;
  $('#region-stamp').textContent = `${region.category} · ${region.number}`;
  $('#region-note').textContent = region.note;
  $('#visit-count').textContent = `${state.visited.length} / 10`;
  // Estes elementos são texto, não botões que seriam recriados durante o foco.
  $('#local-activities').innerHTML = region.activities.map((a,i) => `<p><span>0${i+1}</span>${a}</p>`).join('');
  document.querySelectorAll('[data-destination]').forEach(button => {
    const selected = button.dataset.destination === state.world;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-current', selected ? 'location' : 'false');
  });
}

function travelTo(destination) {
  if (!REGIONS[destination] || modalLocked) return;
  if (destination === state.world) { closeDialog(); return; }
  state.world = destination;
  state.player = {...REGIONS[destination].spawn};
  if (!state.visited.includes(destination)) {
    state.visited.push(destination);
    rewardStat('travel');
  }
  keys.clear();
  closeDialog();
  commit();
  const arrival = $('#arrival');
  arrival.textContent = `Você chegou a ${REGIONS[destination].name}`;
  arrival.classList.add('visible');
  clearTimeout(arrivalTimer);
  arrivalTimer = setTimeout(() => arrival.classList.remove('visible'), 2600);
  canvas.focus();
}

function openAtlas(destination) {
  if (activeModal || modalLocked) return;
  openDialog('Tem estrada pela frente.', 'Dez cidades, uma mochila. As viagens são gratuitas, e sua horta continua crescendo enquanto você explora.', [], 'MAPA DOBRADO · REGIÃO DO SOL');
  $('#dialog-body').innerHTML = `<svg class="atlas" viewBox="0 0 380 150" aria-hidden="true"><path d="M0 125Q80 10 180 84T380 42" fill="none" stroke="#bf9970" stroke-width="2" stroke-dasharray="5 5"/><path d="M267 0Q246 60 294 94T305 150" fill="none" stroke="#7daaaa" stroke-width="23" opacity=".35"/><path d="M36 54l18-29 18 29m-6 0 21-40 23 40" fill="#a6a780"/><text x="47" y="100">03</text><text x="151" y="73">01</text><text x="228" y="118">04</text><text x="328" y="41">02</text></svg>`;
  for (const [id,region] of Object.entries(REGIONS)) {
    const button = document.createElement('button');
    button.className = `destination ${id === destination ? 'recommended' : ''}`;
    button.innerHTML = `<span class="destination-symbol" style="color:${region.color}">${region.symbol}</span><span><b>${region.name}</b><small>${region.activities[0]}</small></span><em>${state.world===id?'Você está aqui':'Viajar →'}</em>`;
    button.disabled = state.world === id;
    button.addEventListener('click', () => travelTo(id));
    $('#dialog-body').append(button);
  }
}

function interactRegion(object) {
  switch (object.kind) {
    case 'travel': openAtlas(); return true;
    case 'localNpc': talkLocal(object.id); return true;
    case 'delivery': openDelivery(); return true;
    case 'mine': openMine(); return true;
    case 'forge': openForge(); return true;
    case 'bakery': openBakery(); return true;
    case 'bells': openBells(); return true;
    case 'townActivity': openTownActivity(); return true;
    case 'townNpc': openDialog(`${currentRegion().npc}, de ${currentRegion().name}`,currentRegion().note,[{label:'Vou experimentar',run:closeDialog}],'GENTE DO CAMINHO'); return true;
    default: return false;
  }
}

function talkLocal(id) {
  const people = {
    bento: ['Bento, capitão aposentado', 'Meu barco? Está de férias. Eu agora coleciono conchas. Três por dia, 40 moedas, negócio fechado. Deixe no caixote azul ali no caminho.'],
    ivo: ['Ivo, ferreiro da serra', 'Cada pedra tem um som. Na mina você escolhe nove pontos para escavar. Traga três minérios e eu ensino a fazer uma barra. Amanhã aparecem novos veios.'],
    nina: ['Nina, padeira e maestrina', 'Minha receita não é segredo: duas farinhas e uma maçã. Rende dois pães! Depois passa no coreto. As lanternas mostram as notas antes de você tocar.']
  };
  const [name,line] = people[id];
  openDialog(name,line,[{label:'Até daqui a pouco',run:closeDialog}],currentRegion().name.toUpperCase());
}

function openDelivery() {
  const done = state.daily.delivery === state.day;
  openDialog('Uma encomenda da maré',done ? 'Bento já guardou as conchas de hoje. Amanhã tem outra encomenda.' : `Traga 3 conchas da praia. Bento paga 40 moedas. Você tem ${state.inventory.shell} conchas na mochila.`,[
    {label:done?'Entrega concluída':'Entregar 3 conchas · +40 moedas',disabled:done||state.inventory.shell<3,run:()=>{
      if(state.inventory.shell<3||state.daily.delivery===state.day)return;
      state.inventory.shell-=3;state.coins+=40;state.daily.delivery=state.day;
      commit();closeDialog();toast('Bento recebeu as conchas. +40 moedas!');
    }}
  ],'PORTO BRISA · ENCOMENDA DIÁRIA');
}

// Mineração: nove escolhas por dia. A distribuição é estável para impedir
// que fechar o menu ou recarregar a página altere uma pedra já escolhida.
function openMine() {
  openDialog('A montanha tem seus bolsos.', 'Escolha uma pedra para escavar. Algumas guardam cobre, outras cristais ou apenas cascalho. Novos veios aparecem amanhã.', [], 'SERRA DO COBRE · MINERAÇÃO');
  const grid = document.createElement('div');
  grid.className = 'mine-grid';
  for(let i=0;i<9;i++) {
    const button = document.createElement('button');
    const excavated = state.mined.includes(i);
    const outcome = (i*7+state.day*3)%9;
    button.disabled = excavated;
    button.className = excavated ? 'dug' : '';
    button.setAttribute('aria-label',`Escavar pedra ${i+1}${excavated?', já explorada':''}`);
    button.innerHTML = excavated ? `<span>${outcome===0?'◇':outcome<7?'◆':'·'}</span><small>explorada</small>` : `<span class="rock-icon"></span><small>VEIO 0${i+1}</small>`;
    button.addEventListener('click',()=>{
      if(state.mined.includes(i))return;
      state.mined.push(i);
      let message;
      if(outcome===0){state.inventory.crystal++;message='Um cristal entre as pedras!';}
      else if(outcome<7){state.inventory.ore+=2;message='Veio de cobre! +2 minérios.';}
      else{state.coins+=3;message='Cascalho… e 3 moedas antigas.';}
      commit();openMine();toast(message);
    });
    grid.append(button);
  }
  $('#dialog-body').append(grid);
  addAction('Voltar à serra',closeDialog,true);
}

function openForge() {
  openDialog('Do minério à barra.',`O fogo já está aceso. Três minérios rendem uma barra de cobre, que vale 45 moedas na loja. Seus minérios: ${state.inventory.ore}.`,[
    {label:'Fundir 3 minérios',disabled:state.inventory.ore<3,run:()=>{
      if(state.inventory.ore<3)return;
      state.inventory.ore-=3;state.inventory.ingot++;
      toast('Uma barra de cobre pronta. Ivo aprova!');rewardStat('forge');commit();openForge();
    }},
    {label:'Guardar para depois',run:closeDialog,secondary:true}
  ],'OFICINA DO IVO');
  $('#dialog-body').innerHTML='<div class="recipe"><span>3 × ◆<small>minério</small></span><b>→</b><span>1 × ▰<small>barra de cobre</small></span></div>';
}

function openBakery() {
  openDialog('Pão de maçã da Nina',`Misture 2 farinhas e 1 maçã. A receita rende 2 pães, vendidos por 25 moedas cada. Na mochila: ${state.inventory.flour} farinhas e ${state.inventory.apple} maçãs.`,[
    {label:'Assar dois pães',disabled:state.inventory.flour<2||state.inventory.apple<1,run:()=>{
      if(state.inventory.flour<2||state.inventory.apple<1)return;
      state.inventory.flour-=2;state.inventory.apple--;state.inventory.bread+=2;
      toast('Cheirinho de pão pela vila. +2 pães!');rewardStat('bake');commit();openBakery();
    }},
    {label:'Voltar à praça',run:closeDialog,secondary:true}
  ],'PADARIA · RECEITA DE FAMÍLIA');
  $('#dialog-body').innerHTML='<div class="recipe"><span>2 + 1<small>farinha + maçã</small></span><b>→</b><span>2 × ▱<small>pães de maçã</small></span></div><p class="game-caption">A feira ao leste vende farinha. Maçãs também crescem no Vale do Sol.</p>';
}

// O áudio é gerado no navegador após um clique. O jogo também funciona sem som.
function playNote(index) {
  try {
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    audioContext.resume().catch(()=>{});
    const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
    oscillator.type='sine';oscillator.frequency.value=[261.63,329.63,392,523.25][index];
    gain.gain.setValueAtTime(.10,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.42);
    oscillator.connect(gain);gain.connect(audioContext.destination);
    oscillator.start();oscillator.stop(audioContext.currentTime+.45);
  }catch{/* Lanternas e rótulos oferecem a mesma pista visual. */}
}

function openBells() {
  openDialog('A canção das lanternas', 'Observe quatro notas, depois toque na mesma ordem. Acerte para ganhar 25 moedas e 2 ervas; o prêmio vale uma vez por dia.', [], 'CORETO DA VILA · MEMÓRIA MUSICAL');
  const token=activityToken;
  const sequence=Array.from({length:4},()=>Math.floor(Math.random()*4));
  const board=document.createElement('div');board.className='bells-board';
  const status=document.createElement('p');status.className='game-caption';status.setAttribute('aria-live','polite');
  status.textContent='Aperte Ouvir para começar.';
  let listening=true,index=0;
  const pads=['DÓ','MI','SOL','DÓ ↑'].map((note,i)=>{
    const button=document.createElement('button');button.textContent=note;button.disabled=true;
    button.setAttribute('aria-label',`Nota ${i+1}: ${note}`);
    button.addEventListener('click',()=>{
      if(listening||token!==activityToken)return;
      flash(i);playNote(i);
      if(i!==sequence[index]){
        listening=true;pads.forEach(p=>p.disabled=true);
        status.textContent='Essa nota saiu diferente. Ouça e tente de novo.';start.disabled=false;return;
      }
      index++;status.textContent=`${index} de 4 notas certas.`;
      if(index===sequence.length){
        listening=true;pads.forEach(p=>p.disabled=true);
        if(state.daily.bells!==state.day){state.daily.bells=state.day;state.coins+=25;state.inventory.herb+=2;commit();status.textContent='A vila aplaude! +25 moedas e 2 ervas na mochila.';}
        else status.textContent='Perfeito! Amanhã a vila oferece um novo prêmio.';
        start.disabled=false;
      }
    });
    board.append(button);return button;
  });
  function flash(i){pads[i].classList.add('lit');setTimeout(()=>{if(token===activityToken)pads[i].classList.remove('lit')},430);}
  $('#dialog-body').append(board,status);
  const start=addAction('Ouvir as quatro notas',()=>{
    listening=true;index=0;start.disabled=true;pads.forEach(p=>p.disabled=true);
    status.textContent='Ouça e observe…';playNote(sequence[0]);flash(sequence[0]);
    for(let n=1;n<4;n++)setTimeout(()=>{if(token!==activityToken)return;playNote(sequence[n]);flash(sequence[n]);},n*700);
    setTimeout(()=>{if(token!==activityToken)return;listening=false;pads.forEach(p=>p.disabled=false);status.textContent='Sua vez. Toque as quatro notas na ordem.';pads[0].focus();},2800);
  });
  addAction('Sair do coreto',closeDialog,true);
}

// ---------------------------------------------------------------------------
// Direção de arte: silhuetas próprias para cada cidade e detalhes feitos à mão.
// Somente primitivas Canvas: não há downloads de imagens ou fontes.
// ---------------------------------------------------------------------------
function polygon(points,color) {
  ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
}
function pathTiles(x,y,w,h,base='#d8bd86') {
  rect(x,y,w,h,base);
  for(let row=0;row<h;row+=12)for(let col=0;col<w;col+=25){
    const shift=(row/12%2)*9;
    if(col+shift+12<w)rect(x+col+shift+3,y+row+4,8+(col%3),2,'#7d624019');
  }
}
function drawPine(x,y) {
  shadow(x,y,36);rect(x-4,y-26,8,29,'#67574d');
  polygon([[x,y-91],[x-23,y-48],[x-13,y-48],[x-33,y-18],[x+32,y-18],[x+13,y-49],[x+22,y-49]],'#3f6659');
  polygon([[x,y-86],[x-20,y-47],[x,y-51],[x-24,y-24],[x+3,y-29]],'#618676');
  rect(x-14,y-40,8,3,'#8fa090');
}
function drawPalm(x,y) {
  shadow(x,y,44);rect(x-4,y-47,9,47,'#ae8458');rect(x-1,y-63,8,26,'#c49b63');
  for(let i=0;i<5;i++)rect(x-3,y-i*9,8,3,'#8f704d');
  polygon([[x+3,y-58],[x-18,y-77],[x-44,y-68],[x-25,y-69],[x-6,y-52]],'#4a9277');
  polygon([[x,y-57],[x+24,y-77],[x+48,y-62],[x+27,y-66],[x+10,y-50]],'#4a9277');
  polygon([[x,y-59],[x-23,y-52],[x-30,y-30],[x-14,y-46],[x+4,y-50]],'#33765f');
  polygon([[x+2,y-57],[x+27,y-50],[x+34,y-31],[x+17,y-44],[x+3,y-48]],'#33765f');
  rect(x+1,y-55,8,9,'#987044');
}
function drawLantern(x,y,color='#d79465') {
  rect(x-1,y-21,2,9,'#574f49');rect(x-6,y-14,12,17,color);rect(x-9,y-10,18,10,color);
  rect(x-2,y-12,4,13,'#f5d799');rect(x-4,y+3,8,2,'#785947');rect(x,y+5,2,5,'#d4a766');
  if(state.time>=120){ctx.fillStyle='#ffcc6c15';ctx.beginPath();ctx.arc(x,y-5,28,0,Math.PI*2);ctx.fill();}
}
function drawCart(x,y,color='#a56a4d') {
  rect(x-29,y-35,58,30,'#b39061');rect(x-32,y-39,64,7,color);
  rect(x-31,y-67,62,18,'#eed6a0');
  for(let i=0;i<4;i++)rect(x-31+i*16,y-67,8,18,color);
  rect(x-26,y-50,3,17,'#815c44');rect(x+23,y-50,3,17,'#815c44');
  rect(x-23,y-6,10,10,'#595e52');rect(x+12,y-6,10,10,'#595e52');
}
function drawSignpost(x,y) {
  rect(x-3,y-34,6,39,'#6e6144');
  polygon([[x-24,y-37],[x+19,y-37],[x+29,y-29],[x+19,y-21],[x-24,y-21]],'#efe0af');
  rect(x-22,y-36,40,2,'#b3a274');text('VIAJAR',x,y-26,'#626344',8);
  polygon([[x+18,y-18],[x-21,y-18],[x-28,y-11],[x-21,y-4],[x+18,y-4]],'#b78351');
  text('←  →',x,y-7,'#fae3b6',9);
}
function drawPickup(item) {
  if(state.pickups.includes(item.id))return;
  const {x,y}=item;
  if(item.type==='shell'){
    polygon([[x-9,y-5],[x-6,y-12],[x+5,y-13],[x+10,y-6],[x+2,y+1],[x-3,y+1]],'#f2d2b6');
    for(let i=-4;i<6;i+=3)rect(x+i,y-9,1,7,'#c68c81');
  }else if(item.type==='ore'){
    polygon([[x-10,y],[x-7,y-11],[x+5,y-14],[x+11,y-3],[x+5,y+2]],'#887c6f');rect(x-3,y-9,7,6,'#d5a071');
  }else if(item.type==='herb'){
    rect(x,y-14,3,16,'#68854d');rect(x-6,y-10,7,5,'#94b276');rect(x+2,y-6,7,5,'#839d64');
  }else if(item.type==='apple'){
    rect(x-6,y-10,12,10,'#c46e55');rect(x,y-14,4,5,'#688352');rect(x-4,y-8,3,3,'#e5a573');
  }else{
    const bob=Math.round(Math.sin(animationTime*2+x)*2);rect(x-4,y-12+bob,9,12,'#bd8d44');rect(x-3,y-13+bob,7,10,'#f2c969');rect(x,y-11+bob,2,6,'#ffebb0');
  }
}

function drawCoastGround() {
  rect(0,0,960,640,'#dfcea1');rect(0,0,706,321,'#9fae83');
  polygon([[0,322],[164,300],[287,335],[420,299],[611,314],[707,290],[745,640],[0,640]],'#e5d2a3');
  pathTiles(118,250,591,50,'#c9ba90');pathTiles(145,274,45,329,'#c9ba90');
  rect(720,0,240,640,'#3c8593');rect(718,0,17,640,'#75b1ae');
  for(let i=0;i<31;i++){
    const x=743+(i*67)%209,y=(i*53)%640;
    rect(x+Math.sin(animationTime*.7+i)*4,y,17+i%13,2,i%3?'#68a6ac':'#92c5bd');
  }
  for(let i=0;i<14;i++){rect(708+(i%2)*3,i*47,15,26,'#f2e7be');rect(721,i*47+4,6,17,'#b2d2c0');}
  rect(662,415,253,51,'#775f4a');for(let x=665;x<914;x+=14)rect(x,418,11,44,'#b99b6b');
  for(const x of [666,738,812,902]){rect(x,410,7,62,'#76664d');rect(x,408,7,5,'#dac08a');}
  // Bateau à voile, phare et cordages en petits blocs.
  polygon([[800,254],[933,254],[911,285],[823,282]],'#77543e');rect(810,249,115,6,'#e6b77d');
  rect(857,160,5,95,'#d4bf92');polygon([[852,166],[802,239],[852,239]],'#f8e7b6');polygon([[865,183],[865,239],[911,239]],'#dba96d');
  rect(836,86,43,74,'#e7dec1');rect(836,108,43,13,'#b77359');rect(832,75,51,16,'#5f7b7b');
  polygon([[828,74],[858,53],[888,74]],'#9b6051');rect(850,83,16,18,'#e8c26c');
  for(let i=0;i<43;i++)rect(24+(i*79)%672,353+(i*47)%272,3,2,'#baab7b66');
  rect(428,337,30,28,'#628f9a');rect(428,336,30,5,'#315c6c');rect(440,339,7,14,'#ecc58c');text('BENTO',443,382,'#826d4e',8);
  drawCart(270,375,'#518592');labelSign('PRAIA DAS CONCHAS',490,578);
}
function drawMountainGround() {
  rect(0,0,960,640,'#b5ad91');
  polygon([[0,0],[960,0],[960,182],[815,169],[713,211],[584,167],[444,216],[294,173],[153,209],[0,171]],'#82867a');
  for(let i=0;i<11;i++){
    const x=i*94;
    polygon([[x-38,145],[x+40,12+(i%3)*17],[x+115,145]],i%2?'#656f68':'#778076');
    polygon([[x+40,12+(i%3)*17],[x+36,115],[x+115,145]],'#565f5955');
    if(i%2)polygon([[x+29,33+(i%3)*17],[x+40,12+(i%3)*17],[x+52,35+(i%3)*17],[x+39,29+(i%3)*17]],'#c8c4ac');
  }
  pathTiles(415,194,57,408,'#cab895');pathTiles(169,385,671,49,'#cab895');
  for(let i=0;i<64;i++){const x=(i*137+13)%960,y=219+(i*53)%410;rect(x,y,6,3,'#928c7150');}
  // Mouth of the mine, timbers and a short rail line.
  polygon([[332,184],[344,103],[377,80],[506,80],[546,113],[553,184]],'#777263');
  rect(368,112,139,75,'#423f3c');rect(362,104,13,92,'#aa855d');rect(502,104,13,92,'#aa855d');rect(357,100,164,14,'#bf9c6c');
  for(const x of [403,465])rect(x,164,5,75,'#77756a');for(let y=178;y<240;y+=15)rect(396,y,80,5,'#8e704f');
  labelSign('MINA DO COBRE',440,93);
  drawCart(326,412,'#927762');
  for(const [x,y] of [[741,363],[786,482],[69,401],[325,234]]){
    polygon([[x-19,y],[x-14,y-18],[x+7,y-26],[x+22,y-11],[x+21,y]],'#7b7c70');rect(x-5,y-17,9,5,'#b38c66');
  }
  rect(722,316,26,30,'#5c574e');rect(727,321,16,17,'#df9154');rect(732,320+Math.sin(animationTime*4)*2,7,11,'#f9cd73');
  for(let i=0;i<4;i++)rect(736+i*4,297-i*13-Math.round(animationTime*5%13),10,7,'#dfd6bf44');
}
function drawLanternGround() {
  rect(0,0,960,640,'#a8b68a');
  rect(48,100,869,426,'#a0ac82');
  pathTiles(129,273,692,62,'#c9b89a');pathTiles(436,230,60,367,'#c9b89a');pathTiles(132,449,672,47,'#c9b89a');
  rect(380,319,181,130,'#b4a88d');
  for(let y=324;y<447;y+=17)for(let x=385;x<558;x+=23)rect(x+(y%2)*4,y,19,13,'#c3b799');
  // Octagonal bandstand with velvet roof and four lanterns.
  polygon([[407,383],[430,398],[510,398],[533,383],[533,340],[407,340]],'#92715c');
  rect(417,339,105,49,'#b79068');for(const x of [421,510])rect(x,294,7,93,'#886b53');
  polygon([[399,303],[423,270],[467,254],[511,270],[539,303]],'#8a5870');rect(398,300,142,6,'#614d58');
  polygon([[418,296],[467,261],[467,298]],'#b57d85');rect(412,386,111,6,'#d0b184');rect(425,393,85,6,'#c7a276');
  for(const y of [286,451]){
    ctx.strokeStyle='#827452';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(72,y-24);ctx.quadraticCurveTo(477,y+22,890,y-24);ctx.stroke();
    for(let i=0;i<11;i++)drawLantern(82+i*79,y+Math.sin(i/10*Math.PI)*21,['#c7856a','#cfa35f','#9c7894'][i%3]);
  }
  for(let i=0;i<22;i++)drawFlower(55+i*40,599+(i%3)*8,['#cb8d97','#f0cf8c','#a397b3'][i%3]);
  for(const [x,y]of [[319,381],[574,381]]){rect(x,y,44,8,'#a7815b');rect(x+3,y-12,38,7,'#bc9a6c');rect(x+4,y+8,5,10,'#70644c');rect(x+34,y+8,5,10,'#70644c');}
}

function drawRegionWorld() {
  if(state.world==='coast')drawCoastGround();
  else if(state.world==='mountain')drawMountainGround();
  else if(state.world==='lantern')drawLanternGround();
  else drawOtherGround();
  const region=currentRegion();
  // Scenery and actors share one depth order, so walking behind a roof works.
  const sprites=region.buildings.map(b=>({y:b.y+b.h,draw:()=>drawBuilding(b.x,b.y,b.w,b.h,b.roof,b.name)}));
  for(const t of region.trees)sprites.push({y:t.y,draw:()=>drawRegionalTree(t.x,t.y)});
  for(const item of worldPickups())drawPickup(item);
  for(const o of worldObjects()){
    if(o.kind==='localNpc'||o.kind==='townNpc')sprites.push({y:o.y,draw:()=>{drawPerson(o.x,o.y,o.color);text('···',o.x,o.y-47,'#fff2ce',16);}});
    if(o.kind==='travel')sprites.push({y:o.y,draw:()=>drawSignpost(o.x,o.y)});
    if(o.kind==='chest')sprites.push({y:o.y,draw:()=>drawChest(o.x,o.y,state.chests.includes(o.id))});
  }
  sprites.push({y:state.player.y,draw:drawPlayer});
  sprites.sort((a,b)=>a.y-b.y).forEach(s=>s.draw());
  if(state.time>=120){rect(0,0,960,640,state.world==='lantern'?'#39264d30':'#253f5930');}
}
function drawPlayer() {
  const p=state.player;
  if(state.mounted){drawHorse(p.x,p.y,walk>0);drawPerson(p.x-2,p.y-21,'#447e77',true,walk>0);}
  else drawPerson(p.x,p.y,'#447e77',true,walk>0);
  rect(p.x-2,p.y-(state.mounted?78:58),5,4,'#fff0b7');
}
function drawWorld() {
  if(state.world==='farm'){drawFarmWorld();drawSignpost(TRAVEL_SIGN.x,TRAVEL_SIGN.y);}
  else drawRegionWorld();
  const near=nearest();
  if(near&&!activeModal&&!paused){
    // Tiny ground brackets point to the exact interaction instead of floating labels everywhere.
    const x=near.x,y=near.y;
    rect(x-19,y+8,9,2,'#fff4b8');rect(x+10,y+8,9,2,'#fff4b8');
    rect(x-19,y+4,2,5,'#fff4b8');rect(x+17,y+4,2,5,'#fff4b8');
  }
  // Sparse drifting flecks: petals in the village, sea birds at the harbor.
  if(state.world==='coast'){
    for(let i=0;i<3;i++){const x=(animationTime*14+i*187)%910+10,y=45+i*22;rect(x,y,6,2,'#fff2d5');rect(x+8,y,6,2,'#fff2d5');rect(x+6,y+2,2,2,'#fff2d5');}
  }
  if(paused){rect(0,0,960,640,'#263b3b88');text('ESTACIONE UM POUCO.',480,310,'#fff0ce',22);text('Continuar para pegar a estrada',480,340,'#e7d6b5',12);}
}

function initializeRegions() {
  for(const city of MORE_CITIES){
    const button=document.createElement('button');button.dataset.destination=city.id;
    button.innerHTML=`<span>${REGIONS[city.id].number}</span> ${city.name}`;
    $('.route-bar').insertBefore(button,$('#atlas-button'));
  }
  document.querySelectorAll('[data-destination]').forEach(button=>button.addEventListener('click',()=>openAtlas(button.dataset.destination)));
  $('#atlas-button').addEventListener('click',()=>openAtlas());
  $('#journal-map').addEventListener('click',()=>openAtlas());
  renderRegionUI();
}
