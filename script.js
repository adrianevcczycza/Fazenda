'use strict';
// VALE DO SOL — sem bibliotecas. Dados, regras, interface e desenho separados.
// Para criar uma atividade: adicione um ponto em OBJECTS e um caso em interact().
const $ = selector => document.querySelector(selector);
const canvas = $('#world');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const WIDTH = 960, HEIGHT = 640, DAY_SECONDS = 180;
const SAVE_KEY = 'vale-do-sol-v1';
const ITEMS = {
  shell: {name:'Concha',icon:'◒',price:8},
  ore: {name:'Minério',icon:'◆',price:10},
  ingot: {name:'Cobre',icon:'▰',price:45},
  flour: {name:'Farinha',icon:'▧'},
  bread: {name:'Pão',icon:'▱',price:25},
  herb: {name:'Erva',icon:'♧',price:12},
  pearl: {name:'Pérola',icon:'○',price:30},
  mushroom: {name:'Cogumelo',icon:'♠',price:14},
  relic: {name:'Relíquia',icon:'◈',price:65},
  bouquet: {name:'Buquê',icon:'✿',price:35},
  snowflake: {name:'Cristal gelo',icon:'❄',price:40},
  ribbon: {name:'Fita do céu',icon:'⚑',price:30},
  carrotSeed: {
    name:'S. cenoura', icon:'♧'
  }, cornSeed: {
    name:'S. milho',icon:'♧'
  },
  carrot: {
    name:'Cenoura',icon:'◢',price:12
  }, corn: {
    name:'Milho',icon:'▥',price:20
  },
  apple: {
    name:'Maçã',icon:'●'
  }, feed: {
    name:'Ração',icon:'▧'
  },
  fish: {
    name:'Peixe',icon:'⋊',price:18
  }, egg: {
    name:'Ovo',icon:'◯',price:9
  },
  milk: {
    name:'Leite',icon:'▤',price:14
  }, crystal: {
    name:'Cristal',icon:'◇',price:50
  }
};
const CROPS = {
  carrot: {
    name:'Cenoura',seed:'carrotSeed',seconds:42
  },
  corn: {
    name:'Milho',seed:'cornSeed',seconds:70
  }
};
const QUESTS = [
{id:'travel',title:'Dez carimbos no mapa',goal:10,reward:150,icon:'⌁',detail:'Visite as 10 cidades'},
{id:'forge',title:'Aprendiz de Ivo',goal:2,reward:45,icon:'◆',detail:'Forje 2 barras de cobre'},
{id:'bake',title:'A receita da Nina',goal:2,reward:40,icon:'▱',detail:'Asse 2 receitas de pão'},
{
  id:'harvest',title:'Da terra para a mesa',goal:3,reward:35,icon:'♧',detail:'Colha 3 plantas'
},
{
  id:'fish',title:'Histórias de pescador',goal:2,reward:40,icon:'≈',detail:'Pesque 2 peixes'
},
{
  id:'feed',title:'Amigos do estábulo',goal:3,reward:30,icon:'♡',detail:'Alimente animais 3 vezes'
},
{
  id:'chest',title:'Um segredo do vale',goal:2,reward:50,icon:'◇',detail:'Encontre os 2 baús'
}
];
function initialState() {
  return {
    version:1,world:'farm',visited:['farm'],mined:[],daily:{},coins:80,day:1,time:0,player: {
      x:300,y:315
    },mounted:false,
    inventory: {
      carrotSeed:5,cornSeed:3,apple:2,feed:4,carrot:0,corn:0,fish:0,egg:0,milk:0,crystal:0,shell:0,ore:0,ingot:0,flour:2,bread:0,herb:0,pearl:0,mushroom:0,relic:0,bouquet:0,snowflake:0,ribbon:0
    },
    plots:Array.from( {
      length:8
    },()=>null),stats: {
      harvest:0,fish:0,feed:0,chest:0,travel:1,forge:0,bake:0
    },
    claimed:[],chests:[],pickups:[],fed: {
    },wheelDay:0,boots:false,lucky:false,boost:0
  };
}
// Validação impede que um salvamento incompleto quebre o jogo.
function load() {
  const base=initialState();
  try {
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!raw || raw.version!==1)return base;
    base.world = Object.hasOwn(REGIONS, raw.world) ? raw.world : 'farm';
    base.visited = [...new Set(['farm', ...(Array.isArray(raw.visited) ? raw.visited.filter(id => Object.hasOwn(REGIONS,id)) : []), base.world])];
    base.mined = Array.isArray(raw.mined) ? raw.mined.filter(i => Number.isInteger(i) && i >= 0 && i < 9) : [];
    if(raw.daily && typeof raw.daily === 'object') for(const [key,value] of Object.entries(raw.daily)) if(Number.isFinite(value)) base.daily[key] = value;
    for(const key of ['coins','day','time','wheelDay','boost'])if(Number.isFinite(raw[key])&&raw[key]>=0)base[key]=raw[key];
    base.day=Math.max(1,Math.floor(base.day));
    base.time=Math.min(base.time,DAY_SECONDS-.01);
    for(const group of ['inventory','stats'])for(const key in base[group])if(Number.isFinite(raw[group]?.[key])&&raw[group][key]>=0)base[group][key]=Math.floor(raw[group][key]);
    if(Number.isFinite(raw.player?.x)&&Number.isFinite(raw.player?.y))base.player= {
      x:Math.max(18,Math.min(942,raw.player.x)),y:Math.max(35,Math.min(620,raw.player.y))
    };
    for(const key of ['mounted','boots','lucky'])base[key]=raw[key]===true;
    for(const key of ['claimed','chests','pickups'])if(Array.isArray(raw[key]))base[key]=raw[key].filter(v=>typeof v==='string');
    if(raw.fed&&typeof raw.fed==='object')for(const id of ['cow','hen'])if(Number.isFinite(raw.fed[id]))base.fed[id]=raw.fed[id];
    if(Array.isArray(raw.plots)&&raw.plots.length===8)base.plots=raw.plots.map(p=>p&&CROPS[p.type]&&Number.isFinite(p.growth)? {
      type:p.type,growth:Math.max(0,p.growth),watered:!!p.watered
    }
    :null);
  }
  catch {
    /* Sem localStorage: ainda é possível jogar normalmente. */
  }
  base.stats.travel = base.visited.length;
  return base;
}
let state=load(),paused=false,activeModal=false,modalLocked=false,previousFocus=null;
let toastTimer,mini=null,lastTime=0,saveClock=0,uiClock=0,animationTime=0,walk=0;
const keys=new Set();
function save() {
  try {
    localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    $('#save-status').textContent='Progresso salvo neste navegador'
  }
  catch {
    $('#save-status').textContent='Sem acesso ao salvamento · mantenha a página aberta'
  }
}
function toast(message) {
  $('#toast').textContent=message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200)
}
function commit() {
  renderUI();
  save()
}
function rewardStat(id) {
  state.stats[id]++;
  const quest=QUESTS.find(q=>q.id===id);
  if(state.stats[id]>=quest.goal&&!state.claimed.includes(id)) {
    state.claimed.push(id);
    state.coins+=quest.reward;
    toast(`Missão concluída: ${quest.title}! +${quest.reward} moedas.`)
  }
}
// Pontos de interação; cada posição é o ponto ao qual o jogador se aproxima.
const OBJECTS=[
{
  id:'home',x:154,y:194,label:'Descansar em casa',kind:'home'
},
{
  id:'horse',x:432,y:188,label:'Montar no cavalo',kind:'horse'
},
{
  id:'cow',x:564,y:175,label:'Alimentar Mimosa',kind:'animal'
},
{
  id:'hen',x:604,y:235,label:'Alimentar as galinhas',kind:'animal'
},
{
  id:'shop',x:787,y:198,label:'Visitar a lojinha',kind:'shop'
},
{
  id:'mila',x:223,y:400,label:'Conversar com Mila',kind:'npc'
},
{
  id:'tomas',x:478,y:303,label:'Conversar com Tomás',kind:'npc'
},
{
  id:'luna',x:718,y:470,label:'Conversar com Luna',kind:'npc'
},
{
  id:'wheel',x:572,y:337,label:'Girar a roda da sorte',kind:'wheel'
},
{
  id:'fish',x:773,y:415,label:'Pescar no lago',kind:'fish'
},
{
  id:'game',x:343,y:462,label:'Jogar: cesta de maçãs',kind:'game'
},
{
  id:'chest-a',x:75,y:540,label:'Abrir baú escondido',kind:'chest'
},
{
  id:'chest-b',x:894,y:566,label:'Abrir baú escondido',kind:'chest'
}
];
const PLOTS=Array.from( {
  length:8
},(_,i)=>( {
  id:`plot-${i}`,kind:'plot',index:i,x:99+(i%4)*47,y:270+Math.floor(i/4)*47,label:'Cuidar do canteiro'
}));
const PICKUPS=[ {
  id:'c1',x:356,y:240,type:'coin'
}, {
  id:'c2',x:638,y:310,type:'coin'
}, {
  id:'c3',x:410,y:525,type:'coin'
}, {
  id:'c4',x:676,y:536,type:'coin'
}, {
  id:'c5',x:872,y:268,type:'coin'
}, {
  id:'a1',x:187,y:474,type:'apple'
}, {
  id:'a2',x:144,y:558,type:'apple'
}, {
  id:'a3',x:288,y:575,type:'apple'
}];
// Obstáculos retangulares mantêm as colisões previsíveis e fáceis de editar.
const SOLIDS=[ {
  x:85,y:94,w:141,h:91
}, {
  x:351,y:75,w:160,h:83
}, {
  x:722,y:89,w:141,h:96
}, {
  x:741,y:439,w:172,h:87
}, {
  x:785,y:385,w:128,h:65
}, {
  x:770,y:520,w:114,h:24
}, {
  x:440,y:356,w:50,h:30
}];
const TREES=[ {
  x:41,y:116
}, {
  x:265,y:93
}, {
  x:302,y:153
}, {
  x:670,y:91
}, {
  x:903,y:117
}, {
  x:906,y:335
}, {
  x:43,y:426
}, {
  x:98,y:457
}, {
  x:154,y:433
}, {
  x:59,y:584
}, {
  x:199,y:577
}, {
  x:256,y:519
}, {
  x:316,y:587
}, {
  x:900,y:608
}, {
  x:936,y:543
}, {
  x:670,y:590
}, {
  x:391,y:598
}, {
  x:594,y:600
}];
function blocked(x,y) {
  return x<15||x>945||y<34||y>625||worldSolids().some(r=>x+8>r.x&&x-8<r.x+r.w&&y+3>r.y&&y-5<r.y+r.h)||worldTrees().some(t=>Math.abs(x-t.x)<14&&Math.abs(y-t.y)<11)
}
if(blocked(state.player.x,state.player.y))state.player= {
  x:300,y:315
};
function nearest() {
  let result=null,distance=53;
  for(const o of [...worldObjects(),...worldPlots()]) {
    if(o.kind==='horse'&&state.mounted)continue;
    if(o.kind==='chest'&&state.chests.includes(o.id))continue;
    const d=Math.hypot(state.player.x-o.x,state.player.y-o.y);
    if(d<distance) {
      result=o;
      distance=d
    }
  }
  return result
}
function locationName() {
  if(state.world !== 'farm')return currentRegion().name;
  const {
    x,y
  }
  =state.player;
  if(x>690&&y>350)return 'Lago dos lírios';
  if(y>435&&x<370)return 'Floresta das maçãs';
  if(y<255&&x>310&&x<655)return 'Estábulo do Tomás';
  if(x>700&&y<265)return 'Lojinha da vila';
  if(x<320&&y<410)return 'Sua fazenda';
  return 'Praça do girassol'
}
function renderUI() {
  renderRegionUI();
  $('#coins').textContent=state.coins;
  const phase=Math.floor(state.time/60);
  $('#day').textContent=`Dia ${state.day} · ${['Manhã','Tarde','Noite'][phase]}`;
  $('#time-icon').textContent=['☀','◒','☾'][phase];
  $('#time-progress').style.width=`${state.time/DAY_SECONDS*100}%`;
  $('#location').textContent=locationName();
  $('#mount-status').textContent=state.mounted?'A cavalo · velocidade ×1,75':state.boost>0?'Passos leves · maçã ativa':'A pé';
  $('#dismount').disabled=!state.mounted;
  $('#quest-count').textContent=`${state.claimed.length}/${QUESTS.length}`;
  $('#quests').innerHTML=QUESTS.map(q=>`<div class="quest ${state.claimed.includes(q.id)?'done':''}"><span class="quest-icon">${state.claimed.includes(q.id)?'✓':q.icon}</span><div><strong>${q.title}</strong><small>${q.detail} · ${Math.min(state.stats[q.id],q.goal)}/${q.goal} · +${q.reward} ●</small></div></div>`).join('');
  const bag=Object.entries(state.inventory).filter(([,n])=>n>0);
  $('#bag-count').textContent=`${bag.reduce((sum,[,n])=>sum+n,0)} itens`;
  $('#inventory').innerHTML=bag.map(([id,n])=>`<div class="item" title="${ITEMS[id].name}"><i>${ITEMS[id].icon}</i><b>${n}</b><small>${ITEMS[id].name}</small></div>`).join('')||'<small>Mochila vazia. Explore o vale!</small>';
  $('#eat').disabled=state.inventory.apple<1;
  const nearby=nearest();
  $('#interaction').hidden=!nearby||activeModal||paused;
  if(nearby)$('#interaction span').textContent=nearby.label;
}
// Diálogos nativos HTML: botões acessíveis, foco contido e mundo pausado.
function openDialog(title,text,actions=[],eyebrow='UM MOMENTO NO VALE') {
  activityToken++;
  if(!activeModal)previousFocus=document.activeElement;
  keys.clear();
  mini=null;
  activeModal=true;
  modalLocked=false;
  $('#modal').hidden=false;
  $('#dialog-title').textContent=title;
  $('#dialog-text').textContent=text;
  $('#dialog-eyebrow').textContent=eyebrow;
  $('#dialog-body').replaceChildren();
  $('#dialog-actions').replaceChildren();
  $('#close-dialog').disabled=false;
  for(const action of actions)addAction(action.label,action.run,action.secondary,action.disabled);
  $('#close-dialog').focus();
  renderUI();
}
function addAction(label,run,secondary=false,disabled=false) {
  const b=document.createElement('button');
  b.textContent=label;
  b.className=secondary?'secondary':'';
  b.disabled=!!disabled;
  b.addEventListener('click',run);
  $('#dialog-actions').append(b);
  return b
}
function closeDialog() {
  if(modalLocked)return;
  activityToken++;
  mini=null;
  activeModal=false;
  $('#modal').hidden=true;
  keys.clear();
  (previousFocus||canvas).focus();
  renderUI()
}
$('#close-dialog').addEventListener('click',closeDialog);
$('#modal').addEventListener('click',e=> {
  if(e.target===$('#modal'))closeDialog()
});
function spend(amount) {
  if(state.coins<amount) {
    toast('Faltam moedas. Colete pelo mapa ou venda itens na loja.');
    return false
  }
  state.coins-=amount;
  return true
}
function interact() {
  if(activeModal||paused)return;
  const o=nearest();
  if(!o) {
    toast('Aproxime-se de um canteiro, personagem ou atividade.');
    return
  }
  if(interactRegion(o))return;
  switch(o.kind) {
    case 'home':openDialog('Um merecido descanso','Dormir inicia uma nova manhã. As plantas continuam crescendo e os animais podem ser alimentados novamente.',[ {
      label:'Dormir até amanhã',run:()=> {
        nextDay();
        closeDialog();
        commit()
      }
    }, {
      label:'Ainda quero explorar',run:closeDialog,secondary:true
    }]);
    break;
    case 'horse':state.mounted=true;
    commit();
    toast('Vamos passear! Use M ou Desmontar para voltar a pé.');
    break;
    case 'animal':feedAnimal(o);
    break;
    case 'plot':openPlot(o.index);
    break;
    case 'shop':openShop();
    break;
    case 'npc':talk(o.id);
    break;
    case 'wheel':openWheel();
    break;
    case 'fish':startMini('fish');
    break;
    case 'game':startMini('apple');
    break;
    case 'chest':state.chests.push(o.id);
    state.coins+=25;
    state.inventory.crystal++;
    toast('Tesouro encontrado! +25 moedas e um cristal especial.');
    rewardStat('chest');
    commit();
    break;
  }
}
function dismount() {
  if(!state.mounted)return;
  state.mounted=false;
  commit();
  toast('Seu cavalo voltou ao estábulo. Ele espera por você lá!')
}
function feedAnimal(o) {
  const isCow=o.id==='cow',name=isCow?'Mimosa':'Pipoca e suas amigas';
  if(state.fed[o.id]===state.day) {
    openDialog(name,'Barriguinha cheia por hoje. Volte amanhã para cuidar de mim!',[ {
      label:'Até amanhã!',run:closeDialog
    }]);
    return
  }
  openDialog(name,'Um punhado de ração faz toda a diferença. Você recebe '+(isCow?'leite':'ovos')+' em agradecimento.',[ {
    label:'Dar 1 ração',disabled:state.inventory.feed<1,run:()=> {
      if(state.inventory.feed<1||state.fed[o.id]===state.day)return;
      state.inventory.feed--;
      state.fed[o.id]=state.day;
      state.inventory[isCow?'milk':'egg']+=isCow?1:2;
      toast(isCow?'Mimosa agradece! +1 leite.':'Cocoricó! +2 ovos na mochila.');
      rewardStat('feed');
      commit();
      closeDialog()
    }
  }, {
    label:'Depois eu volto',run:closeDialog,secondary:true
  }]);
}
function openPlot(index) {
  const p=state.plots[index];
  if(!p) {
    openDialog('Um pedacinho de terra','Escolha uma semente da mochila. As plantas crescem enquanto você explora; regar adianta a colheita.',Object.entries(CROPS).map(([id,c])=>( {
      label:`Plantar ${c.name.toLowerCase()} (${state.inventory[c.seed]})`,disabled:state.inventory[c.seed]<1,run:()=> {
        if(state.plots[index]||state.inventory[c.seed]<1)return;
        state.inventory[c.seed]--;
        state.plots[index]= {
          type:id,growth:0,watered:false
        };
        commit();
        closeDialog();
        toast(`${c.name} plantada. Volte daqui a pouquinho!`)
      }
    })));
    return
  }
  const crop=CROPS[p.type],ready=p.growth>=crop.seconds;
  openDialog(ready?'Hora da colheita!':`${crop.name} crescendo`,ready?'Sua dedicação virou comida fresquinha. Colha para guardar na mochila.':`Faltam ${Math.ceil(crop.seconds-p.growth)} segundos de exploração. ${p.watered?'Este canteiro já foi regado.':'Regar adianta 15 segundos.'}`,[ready? {
    label:`Colher ${crop.name.toLowerCase()}`,run:()=> {
      if(state.plots[index]!==p)return;
      state.inventory[p.type]++;
      state.plots[index]=null;
      toast(`+1 ${crop.name.toLowerCase()} na mochila!`);
      rewardStat('harvest');
      commit();
      closeDialog()
    }
  }
  : {
    label:p.watered?'Já está regada':'Regar a plantinha',disabled:p.watered,run:()=> {
      if(p.watered)return;
      p.watered=true;
      p.growth+=15;
      commit();
      closeDialog();
      toast('Água fresquinha! A colheita está mais perto.')
    }
  }]);
}
const SHOP=[{id:'flour',name:'Farinha da Nina',detail:'3 porções · ingrediente da padaria',price:9,amount:3}, {
  id:'carrotSeed',name:'Sementes de cenoura',detail:'3 sementes · crescem em 42s',price:8,amount:3
}, {
  id:'cornSeed',name:'Sementes de milho',detail:'3 sementes · crescem em 70s',price:12,amount:3
}, {
  id:'feed',name:'Ração dos animais',detail:'3 porções para os seus amigos',price:7,amount:3
}, {
  id:'apple',name:'Maçãs fresquinhas',detail:'2 maçãs · energia para correr',price:6,amount:2
}, {
  id:'boots',name:'Botas de caminhada',detail:'Melhoria permanente: +25% de velocidade',price:90
}, {
  id:'lucky',name:'Amuleto do pescador',detail:'Melhoria: área de acerto maior na pesca',price:70
}];
function openShop() {
  openDialog('A lojinha da vila',`Olá! Você tem ${state.coins} moedas. Sementes para plantar, comidinhas para levar e achados para facilitar a vida.`,[ {
    label:'Vender produtos',run:sellProducts
  }, {
    label:'Até logo',run:closeDialog,secondary:true
  }],'DONA CÉLIA · ABERTA TODOS OS DIAS');
  for(const item of SHOP) {
    const row=document.createElement('div');
    row.className='shop-row';
    const owned=!item.amount&&state[item.id];
    row.innerHTML=`<div>${item.name}<small>${item.detail}</small></div>`;
    const button=document.createElement('button');
    button.textContent=owned?'Comprado':`${item.price} ●`;
    button.disabled=owned||state.coins<item.price;
    button.addEventListener('click',()=> {
      if(!item.amount&&state[item.id])return;
      if(!spend(item.price))return;
      if(item.amount)state.inventory[item.id]+=item.amount;
      else state[item.id]=true;
      commit();
      openShop();
      toast(`${item.name}: compra realizada!`)
    });
    row.append(button);
    $('#dialog-body').append(row)
  }
}
function sellProducts() {
  let total=0;
  for(const [id,item]of Object.entries(ITEMS))if(item.price) {
    total+=state.inventory[id]*item.price;
    state.inventory[id]=0
  }
  if(!total) {
    toast('Traga colheitas, peixes, ovos, leite ou cristais para vender.');
    return
  }
  state.coins+=total;
  commit();
  openShop();
  toast(`Produtos vendidos por ${total} moedas!`)
}
const conversations= {
  mila:['Oi, vizinho! Que bom ver alguém cuidando dessa horta. Plante três vezes, colha e você já completa sua primeira missão.','Cenouras crescem depressa. Milho demora um pouco mais, mas vale 20 moedas na loja.','Não precisa ter pressa. Suas plantas não morrem. Regue uma vez para adiantar a colheita.'],
  tomas:['O cavalo ali no estábulo é o Pingo. Pode montar! Ele conhece cada cantinho do vale.','Mimosa e as galinhas adoram ração. Você pode alimentar cada uma uma vez por dia.','A casa com telhado vermelho é sua. Descanse lá quando quiser começar um novo dia.'],
  luna:['Você já reparou nas bolhinhas perto do píer? Aperte Puxar quando a marca estiver na faixa verde.','Dizem que existem dois baús no vale. Procure entre as árvores e atrás do lago.','A primeira rodada da roda da sorte é grátis a cada dia. Talvez hoje seja o seu dia!']
};
const conversationIndex= {
  mila:0,tomas:0,luna:0
};
function talk(id) {
  const names= {
    mila:'Mila, a jardineira',tomas:'Tomás, o fazendeiro',luna:'Luna, a pescadora'
  };
  const lines=conversations[id];
  openDialog(names[id],lines[conversationIndex[id]++%lines.length],[ {
    label:'Conversar mais',run:()=>talk(id)
  }, {
    label:'Até mais!',run:closeDialog,secondary:true
  }],'AMIGOS DO VALE')
}
function nextDay() {
  const remaining=DAY_SECONDS-state.time;
  grow(remaining);
  state.day++;
  state.mined=[];
  state.time=0;
  state.pickups=[];
  state.boost=0;
  toast(`Bom dia! Dia ${state.day}: animais descansados e uma rodada grátis na roda.`);
}
function grow(seconds) {
  for(const p of state.plots)if(p)p.growth=Math.min(CROPS[p.type].seconds,p.growth+seconds)
}
// Roda: cada setor tem a mesma probabilidade. Prêmio é salvo antes da animação.
const PRIZES=[ {
  label:'30 ●',text:'30 moedas',apply:()=>state.coins+=30
}, {
  label:'3 🌱',text:'3 sementes de cenoura',apply:()=>state.inventory.carrotSeed+=3
}, {
  label:'2 🍎',text:'2 maçãs',apply:()=>state.inventory.apple+=2
}, {
  label:'3 🌾',text:'3 porções de ração',apply:()=>state.inventory.feed+=3
}, {
  label:'💎',text:'1 cristal especial',apply:()=>state.inventory.crystal++
}, {
  label:'15 ●',text:'15 moedas',apply:()=>state.coins+=15
}];
function openWheel() {
  const cost=state.wheelDay===state.day?10:0;
  openDialog('Um giro de sorte',cost?'Mais uma tentativa? Cada giro extra custa 10 moedas.':'Seu primeiro giro do dia é por nossa conta. Boa sorte!',[], 'PRAÇA DO GIRASSOL');
  $('#dialog-body').innerHTML='<div class="wheel-wrap"><span class="wheel-pointer">▼</span><div class="wheel">'+PRIZES.map((p,i)=>`<span class="wheel-label" style="--a:${i*60+30}deg">${p.label}</span>`).join('')+'</div><span class="wheel-center">✦</span></div><p class="game-caption">Moedas, sementes, alimentos e cristais</p>';
  const button=addAction(cost?'Girar · 10 moedas':'Girar grátis',()=> {
    if(modalLocked||!spend(cost))return;
    const index=Math.floor(Math.random()*PRIZES.length);
    state.wheelDay=state.day;
    PRIZES[index].apply();
    commit();
    modalLocked=true;
    button.disabled=true;
    $('#close-dialog').disabled=true;
    $('#dialog-text').textContent='A sorte está girando…';
    $('.wheel').style.transform=`rotate(${2160+360-(index*60+30)}deg)`;
    setTimeout(()=> {
      modalLocked=false;
      $('#close-dialog').disabled=false;
      $('#dialog-text').textContent=`Você ganhou ${PRIZES[index].text}! O prêmio já está na sua mochila.`;
      $('#dialog-actions').replaceChildren();
      addAction('Que sorte!',closeDialog);
      addAction('Girar novamente',openWheel,true);
    },2500);
  },false,state.coins<cost);
}
// Dois minijogos usam o mesmo medidor. A pescaria aceita um acerto;
// a cesta concede uma recompensa proporcional aos três lançamentos.
function startMini(type) {
  openDialog(type==='fish'?'O que o lago esconde?':'Cesta de maçãs',type==='fish'?'Pare a marca na faixa verde para puxar um peixe. Você pode tentar quantas vezes quiser.':'Acerte a faixa verde para pegar maçãs. São três tentativas; cada acerto vale uma maçã e 5 moedas.',[],type==='fish'?'PESCARIA NO LAGO':'MINIJOGO DO POMAR');
  const width=type==='fish'&&state.lucky?34:24;
  $('#dialog-body').innerHTML=`<div class="minigame-track"><div class="target-zone" style="left:${50-width/2}%;width:${width}%"></div><div class="marker"></div></div><p class="game-caption" id="mini-score">${type==='fish'?'Aguarde a marca passar pelo verde.':'Tentativa 1 de 3'}</p>`;
  mini= {
    type,t:0,pos:0,width,round:0,hits:0
  };
  addAction(type==='fish'?'Puxar a linha!':'Pegar maçã!',resolveMini);
  addAction('Voltar ao mapa',closeDialog,true);
}
function resolveMini() {
  if(!mini)return;
  const m=mini;
  const hit=Math.abs(m.pos-50)<=m.width/2;
  if(m.type==='fish') {
    if(hit) {
      state.inventory.fish++;
      toast('Fisgou! +1 peixe na mochila.');
      rewardStat('fish');
      commit();
      openDialog('Boa pescaria!','Um peixe fresquinho para vender na loja. Cada peixe vale 18 moedas.',[ {
        label:'Pescar de novo',run:()=>startMini('fish')
      }, {
        label:'Voltar ao mapa',run:closeDialog,secondary:true
      }])
    }
    else {
      openDialog('Quase lá…','O peixe escapou. Tente parar a marca dentro da faixa verde.',[ {
        label:'Tentar novamente',run:()=>startMini('fish')
      }, {
        label:'Voltar',run:closeDialog,secondary:true
      }])
    }
    return
  }
  m.round++;
  if(hit) {
    m.hits++;
    state.inventory.apple++;
    state.coins+=5;
    commit()
  }
  if(m.round===3) {
    const hits=m.hits;
    openDialog('Fim da brincadeira!',`Você pegou ${hits} de 3 maçãs e ganhou ${hits*5} moedas. Cada maçã pode ser comida para andar mais rápido.`,[ {
      label:'Jogar novamente',run:()=>startMini('apple')
    }, {
      label:'Explorar o vale',run:closeDialog,secondary:true
    }])
  }
  else {
    m.t=0;
    m.pos=0;
    $('#mini-score').textContent=`${hit?'Pegou!':'Passou pertinho!'} Tentativa ${m.round+1} de 3 · ${m.hits} acertos`
  }
}
// Controles de teclado e toque; menus, foco perdido e pausa soltam as teclas.
const keyMap= {
  w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'
};
document.addEventListener('keydown',e=> {
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  if(activeModal) {
    if(key==='Escape') {
      e.preventDefault();
      closeDialog()
    }
    if(key==='Tab') {
      const buttons=[...$('#modal').querySelectorAll('button:not(:disabled)')];
      if(!buttons.length) {
        e.preventDefault();
        return
      }
      const first=buttons[0],last=buttons.at(-1);
      if(e.shiftKey&&document.activeElement===first) {
        e.preventDefault();
        last.focus()
      }
      else if(!e.shiftKey&&document.activeElement===last) {
        e.preventDefault();
        first.focus()
      }
    }
    return
  }
  if(keyMap[key]) {
    e.preventDefault();
    keys.add(keyMap[key])
  }
  if(e.repeat)return;
  if(key==='e') {
    e.preventDefault();
    interact()
  }
  if(key==='m')dismount();
  if(key==='Escape')togglePause();
});
document.addEventListener('keyup',e=>keys.delete(keyMap[e.key.length===1?e.key.toLowerCase():e.key]));
window.addEventListener('blur',()=> {
  keys.clear();
  save()
});
document.addEventListener('visibilitychange',()=> {
  keys.clear();
  lastTime=0;
  if(document.hidden)save()
});
window.addEventListener('pagehide',save);
document.querySelectorAll('[data-move]').forEach(button=> {
  button.addEventListener('pointerdown',e=> {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    keys.add(button.dataset.move)
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.move))
});
$('#touch-interact').addEventListener('click',interact);
$('#dismount').addEventListener('click',dismount);
function togglePause() {
  paused=!paused;
  keys.clear();
  $('#pause').textContent=paused?'▶ Continuar':'Ⅱ Pausar';
  renderUI();
  save()
}
$('#pause').addEventListener('click',togglePause);
$('#eat').addEventListener('click',()=> {
  if(state.inventory.apple<1)return;
  state.inventory.apple--;
  state.boost=45;
  commit();
  toast('Que delícia! Passos mais rápidos por 45 segundos de exploração.')
});
function showHelp() {
  openDialog('Bem-vindo ao Vale do Sol','O vale é pequeno, mas está cheio de coisas para fazer. Escolha seu próprio caminho.',[ {
    label:'Vamos explorar!',run:closeDialog
  }]);
  $('#dialog-body').innerHTML='<ul class="instructions"><li><b>Mapa / placas VIAJAR:</b> viaje grátis entre dez cidades, cada uma com uma atividade própria.</li><li><b>WASD ou setas:</b> caminhar. No celular, use os botões abaixo do mapa.</li><li><b>E / Interagir:</b> conversar ou usar o objeto mais próximo.</li><li><b>Cavalo:</b> procure no estábulo ao norte. M desmonta.</li><li><b>Horta:</b> plante, regue e volte para colher.</li><li><b>Lago:</b> pesque no píer, acertando a faixa verde.</li><li><b>Praça:</b> rode a roda da sorte; o primeiro giro diário é grátis.</li><li><b>Floresta:</b> jogue a cesta de maçãs e procure baús.</li><li><b>Loja:</b> compre sementes e melhorias; venda seus produtos.</li><li>Cada dia dura 3 minutos, com manhã, tarde e noite. Menus e pausa param o relógio.</li><li>O progresso é salvo automaticamente neste navegador. Nada cresce com a página fechada.</li></ul>'
}
$('#help').addEventListener('click',showHelp);
$('#reset').addEventListener('click',()=>openDialog('Uma nova história?','Isso apaga somente o progresso do Vale do Sol neste navegador. Não é possível desfazer.',[ {
  label:'Cancelar',run:closeDialog,secondary:true
}, {
  label:'Sim, começar de novo',run:()=> {
    state=initialState();
    paused=false;
    $('#pause').textContent='Ⅱ Pausar';
    closeDialog();
    commit();
    toast('Um novo começo. O vale espera por você!')
  }
}]));
// PIXEL ART: coordenadas inteiras, blocos de cor e poucas animações.
function rect(x,y,w,h,color) {
  ctx.fillStyle=color;
  ctx.fillRect(Math.round(x),Math.round(y),w,h)
}
function text(label,x,y,color='#46634c',size=10) {
  ctx.fillStyle=color;
  ctx.font=`${size}px monospace`;
  ctx.textAlign='center';
  ctx.fillText(label,Math.round(x),Math.round(y))
}
function shadow(x,y,w=27) {
  rect(x-w/2,y-3,w,7,'#51674b35')
}
function drawTree(x,y,apple=false) {
  shadow(x,y,45);
  rect(x-5,y-30,10,32,'#876244');
  rect(x+2,y-26,4,27,'#a78353');
  rect(x-23,y-63,46,33,'#477b53');
  rect(x-31,y-53,62,25,'#477b53');
  rect(x-17,y-76,35,18,'#477b53');
  rect(x-21,y-61,42,24,'#64945d');
  rect(x-27,y-52,40,18,'#64945d');
  rect(x-13,y-71,28,17,'#7ba768');
  rect(x-17,y-56,12,7,'#90b779');
  rect(x+13,y-38,12,8,'#396c4b');
  if(apple) {
    rect(x-18,y-45,6,6,'#df8564');
    rect(x+11,y-60,6,6,'#e6926a');
    rect(x+6,y-34,6,6,'#c96651')
  }
}
function drawBuilding(x,y,w,h,roof,name) {
  // Briques, tuiles et ombre portée donnent de la matière sans image externe.
  rect(x+8,y+h-5,w+10,15,'#384b3533');
  rect(x,y,w,h,'#c4ab7d');
  rect(x+5,y+6,w-18,h-6,'#e5d2a0');
  rect(x+w-15,y+5,15,h-5,'#b29b73');
  rect(x-3,y+h-7,w+6,10,'#93866a');
  for(let i=0;i<w;i+=22)rect(x+i,y+h-6,18,5,'#b2a382');
  for(let row=14;row<h-7;row+=17){
    rect(x+5,y+row,w-21,1,'#bba17255');
    for(let col=12;col<w-15;col+=35)rect(x+col+(row%2)*7,y+row-11,1,10,'#c4ac8055');
  }
  rect(x+20,y-50,16,34,'#9d8064');rect(x+17,y-53,22,6,'#d0b68a');
  rect(x-13,y-6,w+27,17,'#6b614a');
  polygon([[x-14,y-7],[x+22,y-49],[x+w-18,y-49],[x+w+15,y-7]],roof);
  for(let row=0;row<4;row++){
    const inset=22-row*9,yy=y-46+row*10;
    rect(x+inset,yy,w-inset*2,2,'#fff1cf25');
    for(let col=inset+9;col<w-inset;col+=20)rect(x+col+(row%2)*3,yy+2,2,7,'#513e3722');
  }
  rect(x-14,y-7,w+29,4,'#ffffff22');
  rect(x+w/2-15,y+h-41,30,39,'#695d46');
  rect(x+w/2-10,y+h-35,20,33,'#9a7d53');
  rect(x+w/2+5,y+h-20,3,4,'#eed08a');
  rect(x+w/2-18,y+h+2,37,5,'#c8b386');
  for(const wx of [x+17,x+w-41]) {
    rect(wx-3,y+20,29,28,'#87704d');
    rect(wx,y+21,23,23,'#597b75');
    rect(wx+2,y+23,9,9,'#a9c2a3');rect(wx+13,y+23,8,9,'#c9d5ad');
    rect(wx+10,y+21,3,23,'#e9d7a6');rect(wx,y+31,23,3,'#e9d7a6');
    rect(wx-4,y+46,31,5,'#90714f');
    for(let i=0;i<4;i++){rect(wx+i*7,y+44,5,4,'#74935d');if(i%2)rect(wx+i*7,y+41,4,4,'#d9a574');}
  }
  text(name,x+w/2,y+h+19,'#4e6047',9);
}
function drawPerson(x,y,color,hat=false,moving=false) {
  const step=moving?Math.sin(walk)*2:0;
  shadow(x,y,22);
  rect(x-7,y-11,5,10+step,'#4f5950');
  rect(x+2,y-11,5,10-step,'#4f5950');
  rect(x-9,y-22,18,14,color);
  rect(x-12,y-21,4,12,'#dfb78d');
  rect(x+8,y-21,4,12,'#dfb78d');
  rect(x-8,y-38,16,16,'#e5bc92');
  rect(x-9,y-39,18,7,'#655647');
  rect(x-9,y-34,4,10,'#655647');
  rect(x+3,y-31,2,3,'#4b4c40');
  if(hat) {
    rect(x-16,y-38,32,5,'#e7c56b');
    rect(x-10,y-48,21,11,'#efd889');
    rect(x-10,y-40,21,3,'#b28855')
  }
}
function drawHorse(x,y,moving=false) {
  shadow(x,y,45);
  const step=moving?Math.sin(walk)*3:0;
  rect(x-19,y-27,34,17,'#a37955');
  rect(x-17,y-13,5,14+step,'#715a47');
  rect(x+8,y-13,5,14-step,'#715a47');
  rect(x+9,y-40,12,24,'#ae8157');
  rect(x+15,y-42,17,12,'#b58c62');
  rect(x+12,y-47,4,8,'#8a6348');
  rect(x+8,y-39,5,20,'#644f40');
  rect(x+25,y-38,2,3,'#3e4a3b');
  rect(x-24,y-27,7,18,'#66503e');
  rect(x-8,y-29,19,7,'#648985');
  rect(x-3,y-24,7,11,'#e1ba7a')
}
function drawCow(x,y) {
  shadow(x,y,40);
  rect(x-22,y-28,36,23,'#f4edcf');
  rect(x-15,y-26,10,12,'#665f54');
  rect(x+4,y-15,8,9,'#665f54');
  rect(x-19,y-6,5,8,'#655e4a');
  rect(x+8,y-6,5,8,'#655e4a');
  rect(x+9,y-32,18,19,'#fff4d8');
  rect(x+9,y-16,21,7,'#d99d8c');
  rect(x+12,y-34,4,5,'#b59b72');
  rect(x+24,y-34,4,5,'#b59b72');
  rect(x+23,y-26,2,3,'#514e42')
}
function drawHen(x,y) {
  shadow(x,y,17);
  rect(x-8,y-14,16,12,'#f8eed4');
  rect(x+3,y-20,8,12,'#fff5da');
  rect(x+4,y-23,5,4,'#d88267');
  rect(x+11,y-15,4,3,'#d6ac58');
  rect(x+8,y-18,2,2,'#514e40');
  rect(x-4,y-2,3,5,'#c49952');
  rect(x+3,y-2,3,5,'#c49952')
}
function drawFence(x,y,count) {
  for(let i=0; i<count; i++) {
    rect(x+i*18,y-17,5,22,'#b29c6c');
    rect(x+i*18,y-20,5,4,'#e8d6a1');
    rect(x+i*18,y-13,18,4,'#e6d3a0');
    rect(x+i*18,y-3,18,4,'#d6bd85')
  }
}
function drawFlower(x,y,color) {
  rect(x,y,2,9,'#6b915a');
  rect(x-3,y-3,8,6,color);
  rect(x-1,y-5,4,10,color);
  rect(x,y-1,2,2,'#f7e4a3')
}
function drawChest(x,y,open) {
  shadow(x,y,29);
  rect(x-14,y-18,28,19,'#8e6946');
  rect(x-13,y-23-(open?7:0),26,10,'#b38b51');
  rect(x-14,y-12,28,3,'#ddbe70');
  rect(x-10,y-21,3,22,'#ddbe70');
  rect(x+7,y-21,3,22,'#ddbe70');
  rect(x-2,y-12,5,7,'#f3d283')
}
function labelSign(label,x,y) {
  const w=label.length*6+18;
  rect(x-2,y,4,16,'#977c51');
  rect(x-w/2,y-14,w,20,'#c6ab73');
  rect(x-w/2+2,y-12,w-4,16,'#efdfb2');
  text(label,x,y,'#7e714e',9)
}
function drawFarmWorld() {
  rect(0,0,WIDTH,HEIGHT,'#91ad70');
  rect(0,406,337,234,'#7f9d63');
  // Textura estável: evita cintilação entre quadros.
  for(let i=0; i<260; i++) {
    const x=(i*137+29)%960,y=(i*83+47)%640;
    rect(x,y,3,2,i%3?'#819f62':'#adc582');
    if(i%5===0) {
      rect(x+3,y-3,2,4,'#86aa70')
    }
  }
  rect(284,165,49,418,'#d8c595');
  rect(150,195,647,48,'#dbc998');
  rect(308,294,483,49,'#dbc998');
  rect(448,240,44,305,'#dbc998');
  rect(319,437,448,37,'#dbc998');
  rect(282,568,418,35,'#dbc998');
  for(let i=0; i<53; i++) {
    const x=296+(i*97)%480,y=306+(i%3)*12;
    rect(x,y,6,3,'#cbb986')
  }
  // Lago com bordas em blocos, reflexos e um pequeno píer.
  rect(785,377,123,12,'#b5cf9c');
  rect(774,386,145,151,'#c6d5a5');
  rect(738,432,181,93,'#c6d5a5');
  rect(755,414,150,124,'#80b1ad');
  rect(791,390,114,130,'#80b1ad');
  rect(741,442,166,75,'#80b1ad');
  rect(771,427,132,98,'#74a8a7');
  for(let i=0; i<12; i++) {
    const x=782+(i*29)%106,y=444+(i*17)%65;
    rect(x+Math.sin(animationTime+i)*3,y,13,2,'#a1cfbf')
  }
  rect(741,397,65,32,'#977c54');
  for(let i=0; i<6; i++)rect(744+i*10,398,8,28,'#d3b27b');
  rect(741,394,5,37,'#b39864');
  rect(802,394,5,37,'#b39864');
  rect(835,508,13,5,'#739c69');
  rect(840,505,5,5,'#edc7bb');
  rect(882,440,13,5,'#739c69');
  rect(887,437,4,4,'#f4dfbb');
  // Horta e cercas com passagens livres.
  rect(68,246,219,113,'#b7c88d');
  drawFence(68,366,12);
  drawFence(529,107,7);
  drawFence(529,275,7);
  drawFence(37,398,11);
  drawBuilding(85,94,141,91,'#b47d65','CASA');
  drawBuilding(351,75,160,83,'#ac8b62','ESTÁBULO');
  drawBuilding(722,89,141,96,'#739a82','LOJINHA');
  // Toldos e vasos da loja.
  for(let i=0; i<7; i++)rect(718+i*22,144,22,12,i%2?'#eee3b5':'#a0b18a');
  rect(708,173,11,15,'#b58a62');
  drawFlower(713,165,'#edcf8c');
  rect(866,173,11,15,'#b58a62');
  drawFlower(871,165,'#e4ad9a');
  labelSign('FAZENDA',133,220);
  labelSign('PASTO',595,88);
  labelSign('LAGO',860,363);
  labelSign('FLORESTA',113,412);
  for(const plot of PLOTS) {
    const p=state.plots[plot.index];
    rect(plot.x-20,plot.y-18,39,35,'#8f7352');
    rect(plot.x-18,plot.y-16,35,30,'#a08058');
    for(let i=0; i<4; i++)rect(plot.x-17,plot.y-11+i*7,33,2,'#b08d60');
    if(p) {
      const ready=p.growth>=CROPS[p.type].seconds;
      for(const dx of [-9,8]) {
        rect(plot.x+dx,plot.y-8,3,16,'#5a864e');
        rect(plot.x+dx-5,plot.y-9,6,4,'#739d51');
        rect(plot.x+dx+2,plot.y-5,6,4,'#86aa5b');
        if(ready) {
          rect(plot.x+dx-2,plot.y+1,7,9,p.type==='carrot'?'#eaa063':'#ebd173');
          rect(plot.x+dx,plot.y+9,3,4,p.type==='carrot'?'#db8b55':'#ddbd5f')
        }
      }
      if(p.watered)rect(plot.x+12,plot.y+10,4,4,'#8bc5bf');
      if(ready) {
        rect(plot.x-18,plot.y-17,35,2,'#e7d88a')
      }
    }
    else {
      text('+',plot.x,plot.y+3,'#c2a376',14)
    }
  }
  // Fonte, bancos e roda da praça.
  rect(435,351,60,33,'#b1b39a');
  rect(440,355,50,24,'#7da8a0');
  rect(454,337,22,28,'#bfc2a6');
  rect(450,334,30,7,'#d7d5b7');
  rect(461,326,7,11,'#9fbdac');
  rect(460,344,3,10,'#b7d9c3');
  for(const bx of [391,515]) {
    rect(bx,390,34,6,'#ab8b60');
    rect(bx,379,34,6,'#bd9e6b');
    rect(bx+3,394,4,8,'#7e7856');
    rect(bx+27,394,4,8,'#7e7856')
  }
  rect(568,317,7,20,'#93764f');
  rect(555,332,34,5,'#a58c5d');
  const colors=['#e5be6e','#92b877','#cf9775','#8ebcb0','#b7a1be','#e8b293'];
  ctx.save();
  ctx.translate(572,300);
  for(let i=0; i<6; i++) {
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,27,i*Math.PI/3,(i+1)*Math.PI/3);
    ctx.closePath();
    ctx.fillStyle=colors[i];
    ctx.fill()
  }
  ctx.restore();
  rect(568,295,8,10,'#f5e6ac');
  rect(569,269,6,7,'#657b50');
  text('SORTE',572,352,'#677454',9);
  rect(328,445,28,20,'#b98e5c');
  rect(330,447,24,4,'#dfbe83');
  rect(334,440,7,7,'#cc805e');
  rect(345,438,7,8,'#d59869');
  text('POMAR',343,482,'#62774e',9);
  for(let i=0; i<17; i++)drawFlower(361+(i*31)%296,550+(i*17)%35,['#f0da99','#e7bca8','#eee6bd'][i%3]);
  for(const item of PICKUPS) {
    if(state.pickups.includes(item.id))continue;
    const bob=Math.sin(animationTime*2+item.x)*2;
    if(item.type==='coin') {
      rect(item.x-4,item.y-10+bob,9,12,'#be9f54');
      rect(item.x-3,item.y-11+bob,7,10,'#eed287');
      rect(item.x,item.y-9+bob,2,6,'#fff1ac')
    }
    else {
      rect(item.x-5,item.y-8,11,10,'#d88d66');
      rect(item.x,item.y-12,3,4,'#6b8d55')
    }
  }
  const sprites=TREES.map(t=>( {
    y:t.y,draw:()=>drawTree(t.x,t.y,t.y>400&&t.x<350)
  }));
  for(const o of OBJECTS) {
    if(o.kind==='npc')sprites.push( {
      y:o.y,draw:()=> {
        drawPerson(o.x,o.y, {
          mila:'#c58d7f',tomas:'#88a0a0',luna:'#a49dba'
        }
        [o.id]);
        text('···',o.x,o.y-47,'#f8f4d4',15)
      }
    });
    if(o.kind==='chest')sprites.push( {
      y:o.y,draw:()=>drawChest(o.x,o.y,state.chests.includes(o.id))
    })
  }
  if(!state.mounted)sprites.push( {
    y:188,draw:()=>drawHorse(432,188)
  });
  sprites.push( {
    y:175,draw:()=>drawCow(564,175)
  }, {
    y:235,draw:()=> {
      drawHen(604,235);
      drawHen(625,220);
      drawHen(583,225)
    }
  });
  sprites.push( {
    y:state.player.y,draw:()=> {
      if(state.mounted) {
        drawHorse(state.player.x,state.player.y,walk>0);
        drawPerson(state.player.x-2,state.player.y-21,'#638d8a',true,walk>0)
      }
      else drawPerson(state.player.x,state.player.y,'#638d8a',true,walk>0);
      rect(state.player.x-2,state.player.y-(state.mounted?78:58),5,4,'#fff0b7')
    }
  });
  sprites.sort((a,b)=>a.y-b.y).forEach(s=>s.draw());
  // Iluminação por período; preserva a visibilidade à noite.
  if(state.time>=60&&state.time<120)rect(0,0,WIDTH,HEIGHT,'#edb97b0d');
  if(state.time>=120) {
    rect(0,0,WIDTH,HEIGHT,'#233b663a');
    for(const [x,y]of [[113,126],[818,121],[379,108]])rect(x,y,17,15,'#f5dc8790');
    for(let i=0; i<14; i++)rect(40+(i*113)%895,390+(i*37)%215,2,2,'#f6e7a5')
  }

}
// Loop com delta limitado: movimento independente da taxa de quadros.
function update(dt) {
  if(document.hidden)return;
  animationTime+=dt;
  if(mini) {
    mini.t+=dt;
    mini.pos=(1-Math.cos(mini.t*3.2))*50;
    $('.marker').style.left=`calc(${mini.pos}% - ${mini.pos/100*5}px)`
  }
  if(activeModal||paused)return;
  let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);
  if(dx||dy) {
    const length=Math.hypot(dx,dy),speed=115*(state.mounted?1.75:1)*(state.boost>0?1.25:1)*(state.boots?1.25:1);
    dx=dx/length*speed*dt;
    dy=dy/length*speed*dt;
    if(!blocked(state.player.x+dx,state.player.y))state.player.x+=dx;
    if(!blocked(state.player.x,state.player.y+dy))state.player.y+=dy;
    walk+=dt*12
  }
  else walk=0;
  state.time+=dt;
  state.boost=Math.max(0,state.boost-dt);
  grow(dt);
  if(state.time>=DAY_SECONDS) {
    state.time=DAY_SECONDS;
    nextDay();
    commit()
  }
  for(const item of worldPickups()) {
    if(!state.pickups.includes(item.id)&&Math.hypot(item.x-state.player.x,item.y-state.player.y)<19) {
      state.pickups.push(item.id);
      if(item.type==='coin')state.coins+=5;
      else state.inventory[item.type]++;
      toast(item.type==='coin'?'+5 moedas no caminho!':`+1 ${ITEMS[item.type].name.toLowerCase()} na mochila!`);
      commit()
    }
  }
  saveClock+=dt;
  if(saveClock>5) {
    saveClock=0;
    save()
  }
}
function frame(now) {
  const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;
  lastTime=now;
  update(dt);
  drawWorld();
  uiClock+=dt;
  if(uiClock>.15) {
    uiClock=0;
    renderUI()
  }
  requestAnimationFrame(frame)
}
initializeRegions();
renderUI();
save();
requestAnimationFrame(frame);
