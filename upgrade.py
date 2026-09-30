from pathlib import Path
p=Path('script.js')
s=p.read_text(encoding='utf-8')
s=s.replace("const ITEMS = {", """const ITEMS = {
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
  ribbon: {name:'Fita do céu',icon:'⚑',price:30},""")
s=s.replace('const QUESTS = [', """const QUESTS = [
{id:'travel',title:'Dez carimbos no mapa',goal:10,reward:150,icon:'⌁',detail:'Visite as 10 cidades'},
{id:'forge',title:'Aprendiz de Ivo',goal:2,reward:45,icon:'◆',detail:'Forje 2 barras de cobre'},
{id:'bake',title:'A receita da Nina',goal:2,reward:40,icon:'▱',detail:'Asse 2 receitas de pão'},""")
s=s.replace('version:1,coins:80,day:1,time:0,player:', "version:1,world:'farm',visited:['farm'],mined:[],daily:{},coins:80,day:1,time:0,player:")
s=s.replace('carrotSeed:5,cornSeed:3,apple:2,feed:4,carrot:0,corn:0,fish:0,egg:0,milk:0,crystal:0', 'carrotSeed:5,cornSeed:3,apple:2,feed:4,carrot:0,corn:0,fish:0,egg:0,milk:0,crystal:0,shell:0,ore:0,ingot:0,flour:2,bread:0,herb:0,pearl:0,mushroom:0,relic:0,bouquet:0,snowflake:0,ribbon:0')
s=s.replace('harvest:0,fish:0,feed:0,chest:0', 'harvest:0,fish:0,feed:0,chest:0,travel:1,forge:0,bake:0')
s=s.replace("if(!raw || raw.version!==1)return base;", """if(!raw || raw.version!==1)return base;
    base.world = Object.hasOwn(REGIONS, raw.world) ? raw.world : 'farm';
    base.visited = [...new Set(['farm', ...(Array.isArray(raw.visited) ? raw.visited.filter(id => Object.hasOwn(REGIONS,id)) : []), base.world])];
    base.mined = Array.isArray(raw.mined) ? raw.mined.filter(i => Number.isInteger(i) && i >= 0 && i < 9) : [];
    if(raw.daily && typeof raw.daily === 'object') for(const [key,value] of Object.entries(raw.daily)) if(Number.isFinite(value)) base.daily[key] = value;""")
s=s.replace('  return base;\n}', '  base.stats.travel = base.visited.length;\n  return base;\n}',1)
s=s.replace('SOLIDS.some(', 'worldSolids().some(').replace('||TREES.some(', '||worldTrees().some(')
s=s.replace('for(const o of [...OBJECTS,...PLOTS])', 'for(const o of [...worldObjects(),...worldPlots()])')
s=s.replace('function locationName() {', "function locationName() {\n  if(state.world !== 'farm')return currentRegion().name;")
s=s.replace('function renderUI() {','function renderUI() {\n  renderRegionUI();')
s=s.replace("name:'S. cenoura', icon:'🌱'", "name:'S. cenoura', icon:'♧'").replace("name:'S. milho',icon:'🌾'", "name:'S. milho',icon:'♧'")
s=s.replace("name:'Cenoura',icon:'🥕'", "name:'Cenoura',icon:'◢'").replace("name:'Milho',icon:'🌽'", "name:'Milho',icon:'▥'")
s=s.replace("name:'Maçã',icon:'🍎'", "name:'Maçã',icon:'●'").replace("name:'Ração',icon:'🌾'", "name:'Ração',icon:'▧'")
s=s.replace("name:'Peixe',icon:'🐟'", "name:'Peixe',icon:'⋊'").replace("name:'Ovo',icon:'🥚'", "name:'Ovo',icon:'◯'")
s=s.replace("name:'Leite',icon:'🥛'", "name:'Leite',icon:'▤'").replace("name:'Cristal',icon:'💎'", "name:'Cristal',icon:'◇'")
s=s.replace('  if(!activeModal)previousFocus=document.activeElement;', '  activityToken++;\n  if(!activeModal)previousFocus=document.activeElement;')
s=s.replace('function closeDialog() {\n  if(modalLocked)return;', 'function closeDialog() {\n  if(modalLocked)return;\n  activityToken++;')
s=s.replace('  switch(o.kind) {','  if(interactRegion(o))return;\n  switch(o.kind) {',1)
s=s.replace('const SHOP=[', "const SHOP=[{id:'flour',name:'Farinha da Nina',detail:'3 porções · ingrediente da padaria',price:9,amount:3},")
s=s.replace('  state.day++;', '  state.day++;\n  state.mined=[];')
s=s.replace('function drawWorld() {', 'function drawFarmWorld() {')
# The new renderer handles pause once, after rendering every type of city.
start=s.index('  if(paused) {',s.index('function drawFarmWorld()'))
end=s.index('\n}\n// Loop',start)
s=s[:start]+s[end:]
# Only replace pickup traversal in update; the farm renderer remains farm-specific.
start=s.index('function update(dt)')
tail=s[start:].replace('for(const item of PICKUPS)', 'for(const item of worldPickups())')
tail=tail.replace('else state.inventory.apple++;', 'else state.inventory[item.type]++;')
tail=tail.replace("toast(item.type==='coin'?'+5 moedas encontradas no caminho!':'+1 maçã fresquinha!');", "toast(item.type==='coin'?'+5 moedas no caminho!':`+1 ${ITEMS[item.type].name.toLowerCase()} na mochila!`);")
s=s[:start]+tail
s=s.replace("rect(0,0,WIDTH,HEIGHT,'#a7c887')", "rect(0,0,WIDTH,HEIGHT,'#91ad70')")
s=s.replace("rect(0,406,337,234,'#97b97b')", "rect(0,406,337,234,'#7f9d63')")
s=s.replace("'#93b879':'#b9d59a'", "'#819f62':'#adc582'")
s=s.replace("// Deterministic texture: no random shimmer between frames.", "// Textura estável: evita cintilação entre quadros.")
s=s.replace("// Store awning and flower pots.", "// Toldos e vasos da loja.")
s=s.replace("  $('#dialog-body').innerHTML='<ul class=\"instructions\">", "  $('#dialog-body').innerHTML='<ul class=\"instructions\"><li><b>Mapa / placas VIAJAR:</b> viaje grátis entre dez cidades, cada uma com uma atividade própria.</li>")
s=s.replace('renderUI();\nsave();\nrequestAnimationFrame(frame);', 'initializeRegions();\nrenderUI();\nsave();\nrequestAnimationFrame(frame);')
p.write_text(s,encoding='utf-8')
