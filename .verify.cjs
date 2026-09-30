const fs=require('fs');
const assert=require('assert/strict');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const pages=await(await fetch('http://localhost:9222/json/list')).json();
  const ws=new WebSocket(pages.find(p=>p.url.includes('index.html')).webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;const pending=new Map(),errors=[];
  ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result);}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const run=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  async function screenshot(name){await delay(120);fs.writeFileSync(`assets/${name}.png`,Buffer.from((await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64'));}
  await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Page.reload',{ignoreCache:true});await delay(600);
  if(errors.length)throw Error(errors.join('\n'));
  await run('state=initialState();paused=false;closeDialog();commit()');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await screenshot('preview');
  assert.equal(await run('Object.keys(REGIONS).length'),10,'Dez cidades');
  const worlds=await run('Object.keys(REGIONS)');
  for(const world of worlds){
    await run(`travelTo('${world}');drawWorld()`);
    assert.equal(await run('state.world'),world);
    assert.equal(await run('blocked(state.player.x,state.player.y)'),false,`Spawn livre: ${world}`);
    const unreachable=await run(`(()=>{const sx=Math.round(state.player.x/8)*8,sy=Math.round(state.player.y/8)*8,queue=[{x:sx,y:sy}],seen=new Set([sx+','+sy]);for(let i=0;i<queue.length;i++){for(const [dx,dy]of [[8,0],[-8,0],[0,8],[0,-8]]){const x=queue[i].x+dx,y=queue[i].y+dy,key=x+','+y;if(!seen.has(key)&&!blocked(x,y)){seen.add(key);queue.push({x,y});}}}return [...worldObjects(),...worldPlots()].filter(o=>!queue.some(p=>Math.hypot(o.x-p.x,o.y-p.y)<38)).map(o=>o.id);})()`);
    assert.deepEqual(unreachable,[],`Atividades alcançáveis: ${world}`);
    if(['coast','mountain','lantern','frost','dunes'].includes(world))await screenshot(`preview-${world}`);
  }
  assert.equal(await run('state.visited.length'),10);assert.equal(await run("state.claimed.includes('travel')"),true);
  // Testa entrada real por teclado e pausa, depois regras já existentes.
  await run("travelTo('farm');state.player={x:300,y:315}");
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'d',code:'KeyD'});await delay(230);await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'d',code:'KeyD'});
  assert.ok(await run('state.player.x>310'),'Andar com teclado');
  await run("state.player={x:432,y:188};interact()");assert.equal(await run('state.mounted'),true);
  await run("travelTo('coast')");assert.equal(await run('state.mounted'),true,'Cavalo viaja junto');
  await run("dismount();state.inventory.shell=3;openDelivery();document.querySelector('#dialog-actions button').click()");assert.equal(await run('state.inventory.shell'),0,'Encomenda');assert.equal(await run('state.daily.delivery'),1);
  await run("travelTo('mountain');openMine()");
  for(let i=0;i<9;i++)await run("document.querySelector('.mine-grid button:not(:disabled)')?.click()");
  assert.equal(await run('state.mined.length'),9);assert.equal(await run('state.inventory.ore'),12);
  await run("closeDialog();openForge();document.querySelector('#dialog-actions button').click()");assert.equal(await run('state.inventory.ingot'),1);
  await run("closeDialog();travelTo('lantern');openBakery();document.querySelector('#dialog-actions button').click()");assert.equal(await run('state.inventory.bread'),2);
  // Memória: sequência conhecida para testar reprodução, entrada e prêmio.
  await run("closeDialog();window.originalRandom=Math.random;Math.random=()=>0;openBells();Math.random=window.originalRandom;document.querySelector('#dialog-actions button').click()");await delay(2950);
  for(let i=0;i<4;i++)await run("document.querySelector('.bells-board button').click()");
  assert.equal(await run('state.daily.bells'),1);
  await run("closeDialog();travelTo('grove');openForage();document.querySelectorAll('.forage-grid button[aria-label=\"Cogumelo marrom com 3 pintas\"]').forEach(b=>b.click())");assert.equal(await run('state.inventory.mushroom'),3);
  await run("closeDialog();travelTo('coral');openDive();document.querySelectorAll('#dialog-actions button')[1].click();document.querySelectorAll('#dialog-actions button')[1].click();document.querySelectorAll('#dialog-actions button')[2].click()");assert.equal(await run('state.inventory.pearl'),6);
  await run("closeDialog();travelTo('dunes');openMosaic()");
  for(let i=0;i<6;i++)await run(`(()=>{const buttons=[...document.querySelectorAll('.mosaic-grid button')];if(buttons[${i}].querySelector('b').textContent!=='0${i+1}'){const target=buttons.find(b=>b.querySelector('b').textContent==='0${i+1}');buttons[${i}].click();[...document.querySelectorAll('.mosaic-grid button')].find(b=>b.querySelector('b').textContent==='0${i+1}').click();}})()`);
  assert.equal(await run('state.inventory.relic'),1);
  await run("closeDialog();travelTo('garden');openFlorist();document.querySelectorAll('.flower-tray button').forEach((b,i)=>{for(let n=0;n<[2,2,1][i];n++)b.click()});document.querySelector('#dialog-actions button').click()");assert.equal(await run('state.inventory.bouquet'),1);
  await run("closeDialog();travelTo('frost');openIce()");
  const icePath=await run(`(()=>{const queue=[{x:0,y:5,path:[]}],seen=new Set();for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===1&&p.y===1)return p.path;[[0,-1],[-1,0],[0,1],[1,0]].forEach(([dx,dy],dir)=>{let{x,y}=p;while(x+dx>=0&&x+dx<6&&y+dy>=0&&y+dy<6&&!ICE_ROCKS.some(([rx,ry])=>rx===x+dx&&ry===y+dy)){x+=dx;y+=dy;}const key=x+','+y;if(!seen.has(key)){seen.add(key);queue.push({x,y,path:[...p.path,dir]});}})}return null;})()`);
  assert.ok(icePath,'Puzzle de gelo solucionável');for(const dir of icePath)await run(`document.querySelectorAll('.ice-controls button')[${dir}].click()`);
  assert.equal(await run('state.inventory.snowflake'),1);
  await run("closeDialog();travelTo('wind');openKite();document.querySelectorAll('#dialog-actions button')[1].click();window.kitePilot=setInterval(()=>{const kite=document.querySelector('.flying-kite'),band=document.querySelector('.wind-band'),button=document.querySelector('#dialog-actions button');if(!kite||button.disabled)return;const up=parseFloat(kite.style.bottom||50)<parseFloat(band.style.bottom||35)+15;button.dispatchEvent(new KeyboardEvent(up?'keydown':'keyup',{code:'Space',bubbles:true}));},30)");
  await delay(10000);await run('clearInterval(window.kitePilot)');assert.equal(await run('state.inventory.ribbon'),1,'Pipa vence por controle contínuo');
  // Persistência, migração e recursos diários.
  await run("closeDialog();state.coins=432;save()");await cdp('Page.reload',{ignoreCache:true});await delay(500);
  assert.equal(await run('state.coins'),432);assert.equal(await run('state.world'),'wind');assert.equal(await run('state.visited.length'),10);
  await run('nextDay();commit()');assert.equal(await run('state.mined.length'),0);
  await run("travelTo('farm');state=initialState();commit();state.player={x:99,y:270};interact();document.querySelector('#dialog-actions button').click();grow(60);interact();document.querySelector('#dialog-actions button').click()");assert.equal(await run('state.inventory.carrot'),1,'Fazenda continua funcionando');
  await run('state=initialState();closeDialog();commit()');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(200);
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,'Celular sem overflow');await screenshot('preview-mobile');
  await run('openAtlas()');assert.equal(await run("document.querySelectorAll('.destination').length"),10);await screenshot('preview-atlas-mobile');await run('closeDialog()');
  assert.deepEqual(errors,[],'Sem erros de execução');
  console.log('PASS: 10 cidades, caminhos, cavalo, 10 atividades, recompensas, migração, salvamento, renovação diária, teclado e celular.');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
