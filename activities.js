'use strict';

// As atividades têm regras próprias e compartilham apenas o diálogo e o prêmio.
// activityToken muda ao fechar/trocar o diálogo, cancelando animações antigas.
function cityPrize(id,item,amount,coins) {
  if(state.daily[id]===state.day)return false;
  state.daily[id]=state.day;
  state.inventory[item]+=amount;
  state.coins+=coins;
  commit();
  return true;
}
function openTownActivity() {
  const actions={grove:openForage,coral:openDive,dunes:openMosaic,garden:openFlorist,frost:openIce,wind:openKite};
  actions[state.world]?.();
}
function activityStatus(message) {
  const p=document.createElement('p');p.className='game-caption';p.setAttribute('aria-live','polite');p.textContent=message;
  $('#dialog-body').append(p);return p;
}

// BOSQUE: distinguir características visuais, em vez de clicar aleatoriamente.
function openForage() {
  openDialog('O que entra na cesta?', 'Flora quer três cogumelos MARRONS com TRÊS pintas claras. Deixe os vermelhos e os de uma pinta no bosque. Três escolhas erradas encerram a coleta.', [], 'BOSQUE DOS COGUMELOS · IDENTIFICAÇÃO');
  const grid=document.createElement('div');grid.className='forage-grid';$('#dialog-body').append(grid);
  const status=activityStatus('Cesta: 0/3 · Erros: 0/3');
  let found=0,errors=0,finished=false;
  const types=[0,1,2,2,0,1,1,2,0];
  for(let i=0;i<9;i++){
    const type=types[(i+state.day)%9],brown=type!==1,spots=type===2?1:3;
    const button=document.createElement('button');button.setAttribute('aria-label',`Cogumelo ${brown?'marrom':'vermelho'} com ${spots} pinta${spots===1?'':'s'}`);
    button.innerHTML=`<span class="mushroom ${brown?'brown':'red'}"><i>${Array.from({length:spots},()=>'<b></b>').join('')}</i></span>`;
    button.addEventListener('click',()=>{
      if(finished||button.disabled)return;
      button.disabled=true;
      if(type===0){found++;button.classList.add('correct');}else{errors++;button.classList.add('wrong');}
      status.textContent=`Cesta: ${found}/3 · Erros: ${errors}/3`;
      if(found===3||errors===3){
        finished=true;grid.querySelectorAll('button').forEach(b=>b.disabled=true);
        if(found===3){const paid=cityPrize('forage','mushroom',3,15);status.textContent=paid?'Flora aprovou: +3 cogumelos e 15 moedas.':'Espécies certas! O próximo prêmio fica para amanhã.';}
        else status.textContent='A cesta ficou misturada. Deixe os cogumelos aqui e tente novamente.';
        addAction('Tentar outra cesta',openForage,true);
      }
    });
    grid.append(button);
  }
  addAction('Voltar ao bosque',closeDialog,true);
}

// CORAL: escolha entre caminhos que gastam diferentes quantidades de oxigênio.
function openDive() {
  openDialog('Abaixo da linha d’água', 'Você tem 5 cargas de ar. O recife gasta 1 e rende 1 pérola; a gruta gasta 2 e rende 3. Volte à superfície antes de o ar chegar a zero. Uma expedição premiada por dia.', [], 'COSTA CORAL · MERGULHO');
  let air=5,pearls=0,ended=false;
  $('#dialog-body').innerHTML='<div class="dive-scene"><span class="diver">♧</span><span class="dive-bubbles">°<br>·<br>○</span><span class="coral-silhouette">♆　♆　♆</span></div><div class="oxygen"><span></span></div>';
  const status=activityStatus('Ar: 5/5 · Pérolas na sacola: 0');
  const actions=[];
  function dive(cost,loot){
    if(ended)return;
    air=Math.max(0,air-cost);pearls+=loot;
    $('.oxygen span').style.width=`${air/5*100}%`;
    status.textContent=`Ar: ${air}/5 · Pérolas na sacola: ${pearls}`;
    $('.diver').style.top=`${22+(5-air)*9}%`;
    if(air===0){ended=true;actions.forEach(b=>b.disabled=true);status.textContent='O ar acabou! Marina ajudou você a voltar, mas a sacola ficou no fundo.';addAction('Tentar de novo',openDive);}
  }
  actions.push(addAction('Explorar recife · −1 ar',()=>dive(1,1)));
  actions.push(addAction('Entrar na gruta · −2 ar',()=>dive(2,3)));
  actions.push(addAction('Voltar à superfície',()=>{
    if(ended)return;
    if(pearls===0){closeDialog();return;}
    ended=true;actions.forEach(b=>b.disabled=true);
    const paid=cityPrize('dive','pearl',pearls,0);
    status.textContent=paid?`Mergulho concluído! ${pearls} pérolas guardadas. Venda cada uma por 30 moedas.`:'Você voltou em segurança. Já recebeu o prêmio de hoje; amanhã há mais.';
    addAction('Pisar em terra firme',closeDialog);
  },true));
}

// DUNAS: puzzle de permutação. Selecione duas peças para trocá-las de lugar.
function openMosaic() {
  openDialog('O sol em seis pedaços', 'Amir numerou os fragmentos no verso. Reorganize-os de 01 a 06, da esquerda para a direita. Toque em duas peças para trocar suas posições.', [], 'DUNAS DE ÂMBAR · ARQUEOLOGIA');
  let pieces=[4,1,5,2,0,3],selected=-1,moves=0,finished=false;
  const grid=document.createElement('div');grid.className='mosaic-grid';$('#dialog-body').append(grid);
  const status=activityStatus('Ordem original: 01 · 02 · 03 / 04 · 05 · 06');
  function render(){
    grid.replaceChildren();
    pieces.forEach((piece,i)=>{
      const button=document.createElement('button');button.className=selected===i?'selected':'';button.disabled=finished;
      button.setAttribute('aria-label',`Fragmento ${piece+1}, posição ${i+1}`);
      button.innerHTML=`<span class="sun-fragment" style="--px:${piece%3};--py:${Math.floor(piece/3)}"></span><b>0${piece+1}</b>`;
      button.addEventListener('click',()=>{
        if(selected<0)selected=i;
        else if(selected===i)selected=-1;
        else{[pieces[i],pieces[selected]]=[pieces[selected],pieces[i]];selected=-1;moves++;}
        if(pieces.every((p,index)=>p===index)){
          finished=true;const paid=cityPrize('mosaic','relic',1,20);
          status.textContent=paid?`Mosaico restaurado em ${moves} trocas! +1 relíquia e 20 moedas.`:'O sol voltou ao lugar. O prêmio de hoje já foi recebido.';
        }else status.textContent=`${moves} trocas · ${selected<0?'Escolha uma peça.':'Agora escolha com qual peça trocar.'}`;
        render();
      });
      grid.append(button);
    });
  }
  render();addAction('Voltar às dunas',closeDialog,true);
}

// JARDIM: montar uma receita de flores com contagem exata e pedido diário.
function openFlorist() {
  const target=[2,1,1];target[state.day%3]++;
  const names=['rosas','girassóis','margaridas'],symbols=['✿','☀','❋'];
  openDialog('Um pedido para Rosa', `O bilhete diz: ${target[0]} rosas, ${target[1]} girassóis e ${target[2]} margaridas. Monte o buquê com a quantidade exata de cada flor.`, [], 'JARDIM AURORA · FLORICULTURA');
  let counts=[0,0,0],done=false;
  const tray=document.createElement('div');tray.className='flower-tray';$('#dialog-body').append(tray);
  const preview=document.createElement('div');preview.className='bouquet-preview';preview.textContent='Seu buquê começa aqui.';$('#dialog-body').append(preview);
  const status=activityStatus('0 flores selecionadas.');
  names.forEach((name,i)=>{
    const button=document.createElement('button');button.innerHTML=`<span>${symbols[i]}</span><small>+ ${name}</small>`;
    button.addEventListener('click',()=>{
      if(done)return;if(counts.reduce((a,b)=>a+b,0)>=9){status.textContent='O vaso está cheio. Limpe e tente a combinação do pedido.';return;}
      counts[i]++;preview.textContent=counts.map((n,index)=>symbols[index].repeat(n)).join(' ');
      status.textContent=counts.map((n,index)=>`${n} ${names[index]}`).join(' · ');
    });tray.append(button);
  });
  const deliver=addAction('Entregar o buquê',()=>{
    if(done)return;
    if(!counts.every((n,i)=>n===target[i])){status.textContent='Rosa conferiu o bilhete: as quantidades ainda estão diferentes. Limpe e tente novamente.';return;}
    done=true;deliver.disabled=true;tray.querySelectorAll('button').forEach(b=>b.disabled=true);
    const paid=cityPrize('flowers','bouquet',1,25);
    status.textContent=paid?'Pedido certinho! +1 buquê e 25 moedas.':'Lindo buquê! Amanhã Rosa terá outro pedido premiado.';
  });
  addAction('Limpar o vaso',()=>{if(done)return;counts=[0,0,0];preview.textContent='Seu buquê começa aqui.';status.textContent='Vaso limpo.';},true);
}

// GEADA: desliza até um limite. O percurso até (1,1) é sempre solucionável.
const ICE_ROCKS=[[2,0],[1,2],[3,2],[5,3],[2,4],[4,4]];
function openIce() {
  openDialog('Olga conhece um atalho.', 'No gelo você só para na borda ou em uma pedra. Use os quatro botões para deslizar até a bandeira. O cristal espera na chegada.', [], 'ESTAÇÃO GEADA · PUZZLE DE DESLIZAMENTO');
  let player={x:0,y:5},moves=0,done=false;
  const board=document.createElement('div');board.className='ice-board';board.setAttribute('aria-label','Lago de gelo, seis por seis casas');$('#dialog-body').append(board);
  const status=activityStatus('Comece no canto inferior esquerdo. A bandeira está na linha 2, coluna 2.');
  function render(){
    board.innerHTML=Array.from({length:36},(_,i)=>{
      const x=i%6,y=Math.floor(i/6),rock=ICE_ROCKS.some(([rx,ry])=>rx===x&&ry===y);
      return `<span class="ice-cell ${rock?'rock':''} ${player.x===x&&player.y===y?'skater':''}">${rock?'◆':player.x===x&&player.y===y?'●':x===1&&y===1?'⚑':''}</span>`;
    }).join('');
  }
  const controls=document.createElement('div');controls.className='ice-controls';$('#dialog-body').append(controls);
  for(const [label,dx,dy]of [['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]]){
    const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',`Deslizar ${label}`);
    button.addEventListener('click',()=>{
      if(done)return;let x=player.x,y=player.y;
      while(x+dx>=0&&x+dx<6&&y+dy>=0&&y+dy<6&&!ICE_ROCKS.some(([rx,ry])=>rx===x+dx&&ry===y+dy)){x+=dx;y+=dy;}
      if(x!==player.x||y!==player.y)moves++;
      player={x,y};status.textContent=`${moves} movimentos · Linha ${y+1}, coluna ${x+1}.`;
      if(x===1&&y===1){done=true;controls.querySelectorAll('button').forEach(b=>b.disabled=true);const paid=cityPrize('ice','snowflake',1,20);status.textContent=paid?'Chegou! +1 cristal de inverno e 20 moedas.':'Travessia perfeita. O prêmio renova amanhã.';}
      render();
    });controls.append(button);
  }
  render();addAction('Recomeçar o percurso',openIce,true);
}

// VENTANIA: controle contínuo, diferente dos puzzles por clique.
function openKite() {
  openDialog('O vento não fica parado.', 'Mantenha a pipa na faixa clara por 8 segundos acumulados, dentro de 24 segundos. Segure o botão (ou Espaço com ele focado) para subir. Solte para descer.', [], 'ALTO VENTANIA · VOO DE PIPA');
  const token=activityToken;
  $('#dialog-body').innerHTML='<div class="kite-sky"><div class="wind-band"></div><span class="flying-kite">◆<i>〰</i></span><span class="sky-cloud cloud-one">☁</span><span class="sky-cloud cloud-two">☁</span></div><div class="kite-progress"><span></span></div>';
  const status=activityStatus('Aperte Começar para lançar a pipa.');
  let started=false,holding=false,altitude=50,elapsed=0,stable=0,last=0,finished=false;
  const hold=addAction('Segurar a linha ↑',()=>{},false,true);
  hold.style.touchAction='none';
  hold.addEventListener('pointerdown',e=>{if(!started||finished)return;e.preventDefault();hold.setPointerCapture(e.pointerId);holding=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])hold.addEventListener(event,()=>holding=false);
  hold.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();holding=true;}});
  hold.addEventListener('keyup',e=>{if(e.code==='Space'){e.preventDefault();holding=false;}});
  const start=addAction('Começar',()=>{if(started)return;started=true;hold.disabled=false;start.disabled=true;hold.focus();requestAnimationFrame(tick);},true);
  function tick(now){
    if(token!==activityToken||finished)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(document.hidden){holding=false;requestAnimationFrame(tick);return;}
    elapsed+=dt;altitude=Math.max(4,Math.min(96,altitude+(holding?34:-23)*dt));
    const target=50+Math.sin(elapsed*.52)*13;
    if(Math.abs(altitude-target)<15)stable+=dt;
    $('.flying-kite').style.bottom=`${altitude}%`;
    $('.wind-band').style.bottom=`${target-15}%`;
    $('.kite-progress span').style.width=`${Math.min(100,stable/8*100)}%`;
    status.textContent=`Vento certo: ${stable.toFixed(1)} / 8s · Tempo restante: ${Math.max(0,24-elapsed).toFixed(0)}s`;
    if(stable>=8||elapsed>=24){
      finished=true;hold.disabled=true;
      if(stable>=8){const paid=cityPrize('kite','ribbon',1,20);status.textContent=paid?'Caio aplaudiu! +1 fita dos bons ventos e 20 moedas.':'Voo perfeito. Você já ganhou a fita de hoje.';}
      else status.textContent='A pipa pousou. Tente segurar em pequenos intervalos.';
      addAction('Voar outra vez',openKite,true);return;
    }
    requestAnimationFrame(tick);
  }
}

// Cada novo mapa tem chão, horizonte e marco central próprios.
function drawRegionalTree(x,y) {
  if(['coast','coral'].includes(state.world)){drawPalm(x,y);return;}
  if(['mountain','frost'].includes(state.world)){
    drawPine(x,y);if(state.world==='frost'){polygon([[x,y-91],[x-12,y-69],[x+11,y-69]],'#e8eee4');rect(x-19,y-31,39,4,'#dde7dd');}return;
  }
  if(state.world==='dunes'){
    shadow(x,y);rect(x-5,y-52,11,54,'#6b8b69');rect(x-17,y-33,15,8,'#6b8b69');rect(x-19,y-45,7,15,'#6b8b69');rect(x+4,y-24,14,8,'#6b8b69');rect(x+13,y-37,7,19,'#6b8b69');rect(x-2,y-48,2,43,'#99aa72');return;
  }
  drawTree(x,y,state.world==='grove');
  if(state.world==='garden'){for(let i=0;i<6;i++)rect(x-19+(i*11)%40,y-65+(i*13)%40,7,6,i%2?'#d4a0aa':'#ecd0bb');}
}

function drawOtherGround() {
  const type=state.world;
  const colors={grove:['#789276','#93a781'],coral:['#3b91a0','#e7d5a6'],dunes:['#d7b278','#dec291'],garden:['#a9b783','#d8c09c'],frost:['#cadcda','#b6c9c5'],wind:['#aaba81','#c6be92']};
  rect(0,0,960,640,colors[type][0]);
  if(type==='coral'){
    polygon([[49,122],[232,69],[435,122],[682,104],[890,166],[932,466],[813,589],[478,615],[154,568],[28,397]],'#92c3b6');
    polygon([[65,136],[233,85],[435,136],[680,121],[870,181],[913,451],[800,570],[478,596],[161,551],[45,392]],'#e7d5a6');
    for(let i=0;i<26;i++)rect((i*117)%960,(i*37)%640,13,2,'#cbe3cd44');
  }else if(type==='dunes'){
    for(let i=0;i<7;i++)polygon([[i*158-90,124],[i*158+63,14],[i*158+191,126]],i%2?'#c69c64':'#cfa56d');
    for(let i=0;i<20;i++)rect((i*83)%960,410+(i*23)%220,31,2,'#e8c58b');
  }else if(type==='frost'){
    for(let i=0;i<9;i++)polygon([[i*135-90,120],[i*135,13],[i*135+110,120]],i%2?'#afc5c8':'#96b2bd');
    for(let i=0;i<78;i++)rect((i*83+33)%960,130+(i*43)%500,3,3,'#f3f3df');
  }else if(type==='wind'){
    polygon([[0,100],[210,26],[481,81],[790,24],[960,86],[960,0],[0,0]],'#cfdbb3');
    for(let i=0;i<52;i++){const x=(i*71)%960,y=117+(i*83)%520;rect(x,y,2,7,'#799565');rect(x+3,y-3,2,7,'#8da06d');}
  }else if(type==='garden'){
    for(const [x,y]of [[70,407],[272,518],[657,468],[570,166]]){
      rect(x,y,78,44,'#798f5e');for(let i=0;i<9;i++)drawFlower(x+9+(i%3)*25,y+12+Math.floor(i/3)*12,['#d58e98','#f0d48e','#e8e7c2'][i%3]);
    }
  }else{
    for(let i=0;i<44;i++){const x=(i*73+24)%960,y=(i*131)%640;rect(x,y,16,4,'#64806544');}
  }
  pathTiles(165,299,648,45,colors[type][1]);pathTiles(450,302,55,299,colors[type][1]);pathTiles(180,485,593,32,colors[type][1]);
  // Central activity buildings deliberately have different silhouettes.
  if(type==='grove'){
    rect(420,251,115,67,'#a98e62');rect(409,241,138,13,'#756b4e');
    polygon([[402,244],[448,200],[505,200],[552,244]],'#688460');
    for(const x of [435,468,502]){rect(x,283,19,19,'#695d43');rect(x-3,276,25,10,'#ae7c53');rect(x+4,278,4,3,'#e5d5ad');}
    labelSign('BOTÂNICA',478,218);
  }else if(type==='coral'){
    rect(417,229,125,88,'#78bcb7');rect(425,237,109,70,'#398594');
    for(let i=0;i<5;i++){rect(435+i*18,286,5,18,'#dca38d');rect(431+i*18,281,13,7,'#dca38d');}
    rect(412,314,135,8,'#d2b382');rect(444,245,20,9,'#dfa978');rect(479,270,18,7,'#eed193');
    labelSign('MERGULHO',478,221);
  }else if(type==='dunes'){
    polygon([[406,319],[420,243],[478,216],[541,248],[551,319]],'#bd7d55');
    polygon([[478,216],[474,319],[541,319],[532,248]],'#dbb584');
    rect(451,282,43,38,'#775840');rect(422,247,110,5,'#e1c08c');
    labelSign('ESCAVAÇÕES',478,205);
    for(const [x,y]of [[329,401],[584,256]]){rect(x,y-27,22,29,'#c7a476');rect(x-5,y-31,32,5,'#e2c795');}
  }else if(type==='garden'){
    rect(418,241,122,78,'#9bb39c');rect(425,248,108,63,'#c6d3ad');
    for(const x of [449,483,516])rect(x,245,4,71,'#718d79');rect(421,272,116,4,'#718d79');
    polygon([[410,242],[478,206],[549,242]],'#c7d6b9');polygon([[478,209],[478,239],[543,239]],'#92af9a');
    for(let i=0;i<7;i++)drawFlower(428+i*16,305,['#db96a2','#f1d390','#eee7c4'][i%3]);labelSign('FLORICULTURA',478,209);
  }else if(type==='frost'){
    rect(405,215,147,103,'#eff0df');rect(415,225,127,84,'#8bb5c2');
    for(let i=0;i<5;i++)rect(421+i*23,229,18,76,i%2?'#aed1d6':'#a6c7ce');
    rect(473,237,3,24,'#756b60');polygon([[476,237],[494,244],[476,250]],'#b77267');labelSign('LAGO DE GELO',478,204);
  }else{
    rect(416,291,124,29,'#b4956f');for(let i=0;i<7;i++)rect(416+i*18,291,2,29,'#907653');
    rect(474,218,4,76,'#82765b');polygon([[478,220],[516,229],[478,241]],'#dbad61');
    polygon([[531,162],[553,186],[529,208],[510,184]],'#b96f5c');ctx.strokeStyle='#ebe1b1';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(529,208);ctx.quadraticCurveTo(580,254,490,291);ctx.stroke();
    labelSign('MIRANTE DAS PIPAS',478,332);
    for(const [x,y]of [[65,118],[811,93]]){rect(x-5,y-39,11,61,'#dfd1a4');ctx.save();ctx.translate(x,y-36);ctx.rotate(animationTime*.5);for(let i=0;i<4;i++){rect(0,-3,38,7,'#ecdfb2');ctx.rotate(Math.PI/2);}ctx.restore();}
  }
}
