"use strict";
function runMistcape() {
  "use strict";
  const C=MistCatalog,G=MistGame,T=MistTrail,F=FieldRules;
  const {species,moves,types}=C;
  const $=sel=>document.querySelector(sel);
  const KEY="mistcape.adventure.1";
  const music=new Audio();music.loop=true;music.volume=.3;
  let s=G.fresh(),saved=false,saveError=false,loaded=false;
  try {
    const raw=localStorage.getItem(KEY);
    if(raw){const previous=JSON.parse(raw);if(previous?.version===1&&!localStorage.getItem(KEY+".v1"))localStorage.setItem(KEY+".v1",raw);const candidate=G.loadSave(previous);if(candidate){s=candidate;loaded=true;}else saveError=true;}
  } catch {saveError=true;}
  let facing="down",field=null,segment=null,journey=null,queuedDirection=null;
  let frameRequest=0,gait=0,fishTimer=null,fishReady=false;
  const tileMs=136,cycleTiles=4;
  const lessMotion=matchMedia("(prefers-reduced-motion: reduce)");
  let selected=s.starter||"moss",toastTimer=null,audio=null,boxIndex=null;
  const heldDirections=new Map();
  const menu=$("#gameMenu");
  let menuPage="home";
  const regionName=()=>s.region==="cove"?"盐镜湾":"雾岬海岸";
  const follow=()=>s.follow!==false;
  const resizeField=new ResizeObserver(sizeField);
  const paths={
    expand:'<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
    back:'<path d="m14 5-7 7 7 7"/>',
    settings:'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    team:'<path d="M2 20c.2-4 2.6-6 6-6s5.8 2 6 6M15 14c3.9-.3 6 1.7 6.5 5"/><circle cx="8" cy="8" r="3.3"/><path d="M15 5c4.5-.4 5 6 .7 6.5"/>',
    book:'<path d="M3 4.5c3-1 6-1 9 1.2 3-2.2 6-2.2 9-1.2v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v13"/>',
    sound:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8c2.7 2.2 2.7 5.8 0 8m3-11c4 4 4 10 0 14"/>',
    mute:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9l5 6m0-6-5 6"/>',
    leaf:'<path d="M20.5 3.5C8 3 2.5 9.5 5.5 16.5c7 4 14.1-.7 15-13zM3 21 15.5 9"/>',
    flame:'<path d="M13 2c1.2 6-4 6.6-2 11 2-1 3.5-3.1 4-5 4.6 4.6 5.7 8 2.7 11.5-2.5 3-8.5 3-11.1-.5-3.6-5.2 1.3-9.9 3.6-12.2-.1 2 .3 2.5.8 3C12.5 7 13.4 5 13 2z"/>',
    drop:'<path d="M12 2c-2 3.3-7.1 8.8-7.1 12.4a7.1 7.1 0 0 0 14.2 0C19.1 10.8 14 5.3 12 2zM8 15c.3 2 1.7 3 3 3.4"/>',
    rock:'<path d="m2 16 5-9 6-4 5 4 4 10-8 4-9-1zM7 7l5 5 6-5m-6 5 2 9"/>',
    feather:'<path d="M3 21 16 8m-9 9c-1.5-7 3.6-14 10-14 4 0 4.4 3 3.4 6-1.8 5.2-6.3 9-13.4 8z"/>',
    bolt:'<path d="m14 2-11 12h8l-1 8 11-13h-8z"/>',star:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
    pin:'<path d="M12 22s7-7.6 7-13A7 7 0 0 0 5 9c0 5.4 7 13 7 13z"/><circle cx="12" cy="9" r="2.3"/>',
    check:'<path d="m4 12 5 5L20 6"/>',right:'<path d="M3 12h17m-7-6 7 6-7 6"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',close:'<path d="m5 5 14 14m0-14L5 19"/>',
    home:'<path d="M2 11 12 3l10 8M5 10v11h14V10M10 21v-6h4v6"/>',
    flag:'<path d="M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    award:'<path d="m12 2 7 3v8l-7 6-7-6V5zm-5 15-2 5 5-2m7-3 2 5-5-2"/><path d="m12 6 1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z"/>',
    bag:'<path d="M5 8h14l1 13H4zM9 8V6a3 3 0 0 1 6 0v2m-8 6h10"/>',
    save:'<path d="m3 3 15 0 3 3v15H3zM7 3v6h9V3M7 21v-7h10v7"/>',
    key:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h1m3 0h1m3 0h1m3 0h1M6 14h2m2 1h6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.3"/>'
  };
  const icon=(key)=>`<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key]||paths.star}</svg>`;
  const brandMark='<span class="brand-seal" aria-hidden="true">山海</span>';
  const elType=k=>C.affinity(k).map(t=>{const [n,i]=types[t];return `<span class="type">${icon(i)}${n}</span>`;}).join("");
  const journalHTML=v=>C.journalText(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function art(k,cls="",alt=species[k]?.name||"") {
    const back=cls.includes("ally")||cls.includes("rear-art");
    return `<img class="${cls}" src="assets/color/${k}${back?"-back":""}.webp" alt="${alt}" draggable="false">`;
  }
  const btn=(label,action,arg="",cls="",disabled=false)=>`<button class="btn ${cls}" data-do="${action}" data-arg="${arg}"${disabled?" disabled":""}>${label}</button>`;
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(s));saved=true;saveError=false;}catch{saveError=true;}
  }
  function syncMusic(){
  const next=s.battle?"duel":"trail";
  if(!s.sound||document.hidden){music.pause();return;}
  if(music.dataset.song!==next){music.src=`assets/field/${next}.wav`;music.dataset.song=next;}
  if(music.paused)music.play().catch(()=>{});
}
  function beep(freq=450,extra=false){
    if(!s.sound) return;
    try {
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      audio.resume().catch(()=>{});
      const play=(f,start)=>{const osc=audio.createOscillator(),v=audio.createGain();osc.type="sine";osc.frequency.value=f;
        osc.connect(v);v.connect(audio.destination);v.gain.setValueAtTime(.0001,start);v.gain.exponentialRampToValueAtTime(.075,start+.008);
        v.gain.exponentialRampToValueAtTime(.0001,start+.22);osc.start(start);osc.stop(start+.24);};
      play(freq,audio.currentTime);if(extra)play(freq*1.5,audio.currentTime+.12);
    } catch {}
  }
  function toast(msg){$("#toast").textContent=msg;$("#toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("show"),2100);}
  function clearWalk(){
    cancelAnimationFrame(frameRequest);frameRequest=0;
    segment=null;journey=null;queuedDirection=null;heldDirections.clear();
  }
  function stopWalk(){
    const enteringBattle=segment&&s.battle;
    clearWalk();
    if(enteringBattle){render();beep(580,true);}
    else if(field){paintPosition(s.pos,0);syncMap();}
  }
  function drawMenu(page=menuPage){
    menuPage=page;
    const entries=[
      ["team","team","同行队伍",s.party.length+" / 6 位伙伴"],
      ["places","pin","沿途地点",regionName()],
      ["bag","bag","行囊",s.coins+" 潮币"],
      ["dex","leaf","灵兽谱",s.caught.length+" / "+Object.keys(species).length+" 已结缘"],
      ["journal","book","冒险手记","目标与近况"],
      ["settings","settings","设置","视角与声音"]
    ];
    const entry=entries.find(([k])=>k===page),home=page==="home";
    let body="";
    if(home){
      body=`<div class="menu-vista"><strong>${s.starter?regionName():"雾岬研究站"}</strong><span>Levi　·　徽章 ${Number(s.badge)+Number(s.secondBadge)} / 2</span></div>
      <nav class="menu-list" aria-label="冒险菜单栏目">${entries.map(([k,i,n,meta])=>`<button data-do="tab" data-arg="${k}" ${(!s.starter&&["places","bag","journal"].includes(k))?"disabled":""}><span class="menu-symbol">${icon(i)}</span><span><b>${n}</b><small>${meta}</small></span>${icon("chevron")}</button>`).join("")}</nav>
      <div class="menu-save">${icon(saveError?"info":"save")}${saveError?"存档不可用":saved?"进度已保存":"本地自动存档"}</div>`;
    }else if(page==="site")body=sitePanel(true);
    else if(page==="team")body=members();
    else if(page==="dex")body=dex();
    else if(page==="bag")body=bagContents();
    else if(page==="places"){
      const places=T.siteList(s.region),near=T.near(s.pos,s.region),[x,y]=T.toPct(s.pos);
      body=`<div class="travel-atlas ${s.region}"><div class="atlas-position" aria-label="Levi 的位置" style="left:${x}%;top:${y}%"></div>${Object.entries(places).map(([k,d])=>`<button class="atlas-pin" style="left:${d.at[0]}%;top:${d.at[1]}%" data-do="travel" data-arg="${k}" aria-label="前往${d.name}" ${s.battle?"disabled":""}>${icon(d.icon)}</button>`).join("")}</div>
      <div class="atlas-caption"><span>${icon("compass")}${regionName()}</span><span><i></i>Levi 的位置</span></div>
      ${s.battle?"":sitePanel()}<div class="jump-list">${Object.entries(places).map(([k,d])=>`<button class="jump" data-do="travel" data-arg="${k}" ${s.battle?"disabled":""}><span class="jump-label">${icon(d.icon)}${d.name}</span>${k===near?"<small>所在地</small>":""}${icon("chevron")}</button>`).join("")}</div>`;
    }else if(page==="journal"){
      const grass=T.tallGrass(s.pos,s.region);
      body=`<section class="journal-block"><h3>当前目标</h3><p>${nextGoal()}</p></section><section class="journal-block"><h3>最近记录</h3><p>${journalHTML(s.notice)}</p></section><div class="journal-location"><b>${regionName()}</b>${weatherBadge(s.battle)}<span class="ground-name">${grass?"草丛 · 可能遇敌":"平地 · 安全"}</span></div>`;
    }else if(page==="settings"){
      body=`<div class="setting-list"><button data-do="sound" aria-pressed="${s.sound}">${icon(s.sound?"sound":"mute")}<b>音乐与音效</b><span>${s.sound?"已开启":"已关闭"}</span></button>
      <button data-do="camera" aria-pressed="${follow()}">${icon("compass")}<b>探索视角</b><span>${follow()?"跟随 Levi":"广角"}</span></button>
      ${document.fullscreenEnabled?`<button data-do="fullscreen" aria-pressed="${!!document.fullscreenElement}">${icon("expand")}<b>全屏显示</b><span>${document.fullscreenElement?"退出全屏":"进入全屏"}</span></button>`:""}</div>
      <dl class="control-list"><div><dt>打开或关闭菜单</dt><dd>M</dd></div><div><dt>返回上一级</dt><dd>Esc</dd></div><div><dt>移动</dt><dd>WASD / 方向键</dd></div><div><dt>调查</dt><dd>E</dd></div><div><dt>自动寻路</dt><dd>点选地面或地点</dd></div></dl>`;
    }
    menu.dataset.page=page;
    const title=page==="site"?T.siteList(s.region)[T.near(s.pos,s.region)].name:entry?.[2]||"冒险菜单";
    menu.innerHTML=`<div class="menu-bar">${home||page==="site"?brandMark:'<button class="icon-btn" data-do="tab" data-arg="home" aria-label="返回主菜单">'+icon("back")+'</button>'}<h2 id="menuTitle">${title}</h2><button class="icon-btn" data-do="menuClose" aria-label="关闭菜单">${icon("close")}</button></div><div class="menu-body">${body}</div>`;
  }
  function openMenu(page="home"){
    if(!menu.open)stopWalk();
    drawMenu(page);
    if(!menu.open)menu.showModal();
    const first=page==="home"?".menu-list button":page==="site"?".spot-panel button:enabled":"[data-arg=home]";
    menu.querySelector(first)?.focus({preventScroll:true});
  }
  function closeMenu(){
    if(menu.open)menu.close();
    menuPage="home";
  }
  function plate(k,mark=false){
    return `<div class="plate"><div class="plate-head"><span class="num"><small>谱</small> ${species[k].no}</span><span class="plate-types">${elType(k)}</span></div>${art(k,"spec-art")}${mark?`<span class="pick-mark">${icon("check")}</span>`:""}</div>`;
  }
  function opening(){
    const d=species[selected];
    return `<section class="opening-scene"><div class="opening-brand">${brandMark}<span>雾岬物语</span></div>
      <div class="opening-title"><div class="loc">${icon("pin")}雾岬研究站</div><h1>择一灵兽，<wbr>同行山海</h1><p>Levi，选一位伙伴，一起出发。</p></div>
      <div class="starter-dock"><div class="starter-grid" role="group" aria-label="选择初始伙伴">${C.starters.map(k=>{
        const m=species[k],chosen=k===selected;
        return `<button class="specimen ${k} ${chosen?"selected":""}" data-do="select" data-arg="${k}" aria-pressed="${chosen}">${art(k,"starter-portrait")}<span class="spec-copy"><span class="starter-type">${icon(types[m.type][1])}${types[m.type][0]}</span><strong>${m.name}</strong><small>${m.trait} · ${m.role}</small></span>${chosen?'<span class="chosen-check">'+icon("check")+'</span>':""}</button>`;
      }).join("")}</div><div class="selection"><p>${d.desc}</p>${btn("带上伙伴出发 "+icon("right"),"depart","","primary depart")}</div></div></section>`;
  }
  function hp(m){const max=G.stat(m,0),value=Math.round(m.hp/max*100);return `<div class="hp" role="meter" aria-label="体力" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${m.hp}"><i class="${value<=22?"low":value<=45?"warn":""}" style="width:${value}%"></i></div><div class="hp-txt">HP ${m.hp} / ${max}${m.status?"　"+F.statusNames[m.status]:""}</div>`;}
  function activeSite(){
    const site=T.near(s.pos,s.region);
    if(site&&site!=="pool"&&site!=="grass")return site;
    if(!T.tallGrass(s.pos,s.region))return "";
    return site||"cover";
  }
  const atFishingBank=()=>s.region==="cove"&&T.near(s.pos,s.region)==="pool";
  function nextGoal(){
  if(!s.camp)return "前往林间练习场，与巡林员青禾切磋。";
  if(!s.badge)return "前往望潮灯台，赢得第一枚徽章。";
  if(s.region==="coast")return s.secondBadge?"两枚徽章已集齐，可继续培养队伍或参加双打。":"从研究站或灯台搭船，前往盐镜湾。";
  if(!s.rod)return "去潮汐小屋借竿，调查沿岸的本地伙伴。";
  return !G.canDuel(s)?"结缘瓦当蟹、桂月蛾或潮钟螺，取得观测台挑战资格。":s.secondBadge?"盐镜湾调查完成，可继续垂钓和收集。":"前往盐镜观测台，挑战领航员汐弦。";
}
  function sitePanel(standalone=false){
  const site=activeSite(),reeds=s.region==="cove";
  const d=site==="cover"?{name:reeds?"湾畔芦荡":"原野高草",icon:"leaf",action:reeds?"调查潮草":"调查草丛",desc:"草叶间有灵兽活动的痕迹。穿行或调查这里，都有机会相遇。"}:T.siteList(s.region)[site],options=[];
  if(d)options.push(btn(d.action,site==="dock"?"sail":"interact",site,"primary"));
  if(["lab","hut"].includes(site))options.push(btn("补给商店","shop"));
  const outbound=site==="lab"||site==="beacon";
  if(outbound)options.push(btn("搭船去盐镜湾","sail","","",!s.badge));
  if(site==="beacon"&&s.badge)options.push(btn("双打交流赛","pairStart"));
  if(atFishingBank()&&s.rod)options.push(btn("抛竿垂钓","fish"));
  const title=d?.name||(reeds?"滨海滩地":"海岬原野");
  const description=d?.desc||(atFishingBank()&&s.rod?"这里靠近水边，可以在岸上抛竿。":"脚下是平地，可以自由行走。成片的高草里栖息着野生灵兽。");
  const heading=standalone?"":`<div class="where">${icon(d?.icon||"compass")}<h2>${title}</h2></div>`;
  return `<section class="panel spot-panel">${heading}<p>${description}</p><div class="tools">${options.join("")||btn("查看行囊","bag")}</div>${outbound&&!s.badge?"<p class='note'>获得望潮灯台的潮光徽章后可搭船。</p>":""}${standalone?"<p class='site-feedback' role='status'></p>":""}</section>`;
}
  function weatherBadge(b){
  const w=b?.weather||F.ambient(s);
  return `<span class="weather-tag ${w}">${icon(w==="rain"?"drop":"sun")}${F.weatherNames[w]}${b?.weatherTurns?" · "+b.weatherTurns+" 回合":""}</span>`;
}
  function world(){
    return `<section class="field-page" aria-label="${regionName()}"><div class="map-viewport"><div class="map ${s.region}" id="map" role="group" aria-label="${regionName()}可探索地图" tabindex="0"><canvas class="field-cover" width="1200" height="800" aria-hidden="true"></canvas><div class="walker-track"><div class="walker" role="img" aria-label="Levi"></div><i class="foot-grass" hidden aria-hidden="true"></i></div></div></div>
    <div class="field-hud"><div class="touch-pad" aria-label="移动方向">${[["up","↑"],["left","←"],["down","↓"],["right","→"]].map(([k,n])=>`<button data-do="step" data-arg="${k}" aria-label="移动 ${n}">${n}</button>`).join("")}</div><button class="world-action" data-do="inspect" hidden>${icon("compass")} 调查 <kbd>E</kbd></button></div></section>`;
  }
  function sizeField(){
    if(!field)return;
    const {viewport,map}=field;
    field.vw=viewport.clientWidth;field.vh=viewport.clientHeight;
    field.width=Math.max(field.vw,field.vh*1.5);field.height=field.width/1.5;
    map.style.width=field.width+"px";map.style.height=field.height+"px";
    paintCamera(field.pos||s.pos);
  }
  function paintCamera(pos){
    const z=follow()?1.5:1;
    const offset=(p,world,view)=>Math.max(0,Math.min(world*z-view,p*world*z-view/2));
    const px=offset(pos.x/T.W,field.width,field.vw),py=offset(pos.y/T.H,field.height,field.vh);
    field.map.style.transform="translate3d("+(-px)+"px,"+(-py)+"px,0) scale("+z+")";
  }
  function drawGrass(canvas,region){
    const grass=new Image();
    grass.onload=()=>{
      if(!canvas.isConnected)return;
      const ctx=canvas.getContext("2d");
      const unit=canvas.width/T.W,cells=T.grassCells(region);
      ctx.save();
      ctx.filter="blur(2px)";
      ctx.fillStyle=region==="cove"?"#37745270":"#28654180";
      ctx.beginPath();
      for(const {x,y} of cells){
        ctx.moveTo((x+.75)*unit,y*unit);
        ctx.ellipse(x*unit,y*unit,.75*unit,.65*unit,0,0,Math.PI*2);
      }
      ctx.fill();ctx.restore();
      for(const pos of cells){
        // Stable variation keeps adjoining blades irregular when the map is reopened.
        const seed=(pos.x*73856093 ^ pos.y*19349663)>>>0;
        const x=(pos.x+((seed%13)-6)/32)*unit;
        const y=(pos.y+.38+((seed%7)-3)/36)*unit;
        const width=(1.35+(seed%19)/55)*unit;
        const height=width*grass.naturalHeight/grass.naturalWidth;
        ctx.save();ctx.translate(x,y);
        if(seed%2)ctx.scale(-1,1);
        ctx.drawImage(grass,-width*.68,-height*1.13,width*.74,height*.8);
        ctx.drawImage(grass,-width/2,-height,width,height);
        ctx.restore();
      }
    };
    grass.src="assets/color/"+(region==="cove"?"reeds":"grass")+".webp";
  }
  function paintPosition(pos,cel){
    const {track,walker,fringe}=field,[x,y]=T.toPct(pos);
    track.style.transform="translate3d("+x+"%,"+y+"%,0)";
    if(walker.dataset.facing!==facing)walker.dataset.facing=facing;
    if(field.cel!==cel){
      walker.style.backgroundPositionX=(cel*12.5)+"%";
      field.cel=cel;
    }
    const grass=T.tallGrass({x:Math.round(pos.x),y:Math.round(pos.y)},s.region);
    if(fringe.hidden===grass)fringe.hidden=!grass;
    field.pos=pos;paintCamera(pos);
  }
  function syncMap(){
    field.interact.hidden=!activeSite()&&!(s.rod&&atFishingBank());
  }
  function meter(m,cls){
  const data=F.abilities[F.ability(m)];
  return `<div class="meter ${cls}"><div class="meter-head"><strong>${species[m.kind].name}</strong><small>Lv.${m.level}</small></div>${hp(m)}<div class="meter-tags">${elType(m.kind)}<span>${data[0]}</span></div>${cls==="own"?`<div class="xp-mini" aria-label="经验 ${m.xp}"><i style="width:${Math.min(100,m.xp/G.threshold(m.level)*100)}%"></i></div>`:""}</div>`;
}
  const battleName=mode=>({wild:"草甸相遇",camp:"巡林员的切磋",beacon:"守灯人的试炼",dome:"领航员的试炼"}[mode]);
  function duoCommands(m,j){
  const opts=s.party.map((p,i)=>!s.battle.allies.includes(i)&&p.hp>0?`<option value="swap-${i}">换上 ${species[p.kind].name} · Lv.${p.level}</option>`:"").join("");
  return opts+(s.supply.salves&&m.hp<G.stat(m,0)?`<option value="salves">使用草本药膏 ×${s.supply.salves}</option>`:"")+
    (s.supply.tonic&&m.status?`<option value="tonic">使用清醒露 ×${s.supply.tonic}</option>`:"");
}
  function pairScene() {
    const b=s.battle;
    const actors=b.allies.map(i=>s.party[i]);
    const side=(mon,label)=>`<div class="pair-fighter ${!mon.hp?"fainted":""}">${art(mon.kind,label==="我方"?"rear-art":"")}<div class="duo-meter"><b>${species[mon.kind].name}</b><small> ${label} · Lv.${mon.level}</small>${hp(mon)}</div></div>`;
    function plan(m,j) {
      const usable=G.availableMoves(m),alive=b.rivals.map((v,i)=>({v,i})).filter(p=>p.v.hp>0);
      const score=(id,target)=>moves[id][2]*C.effectiveness(moves[id][1],target.kind)*moves[id][3]/100;
      const ranked=usable.flatMap(id=>alive.map(({v,i})=>({id,i,value:score(id,v)}))).sort((a,d)=>d.value-a.value);
      const best=ranked[0];
      return `<div class="pair-order"><b>${species[m.kind].name}</b><label>回合指令<select id="duo-move-${j}">${usable.map(id=>`<option value="${id}" ${id===best.id?"selected":""}>${moves[id][0]} · ${id==="strain"?"∞":m.skills.find(k=>k.id===id).pp} PP</option>`).join("")}${duoCommands(m,j)}</select></label><label>目标<select id="duo-target-${j}">${alive.map(({v,i})=>`<option value="${i}" ${i===best.i?"selected":""}>${species[v.kind].name}</option>`).join("")}</select></label></div>`;
    }
    return `<section class="wrap page battle"><div class="page-title"><div><h1>灯台双打交流赛</h1><p>回合 ${String(b.round).padStart(2,"0")}　·　双打</p></div>${btn(icon("book")+" 记录","history")}</div>
    <div class="arena duo-arena w-${b.weather} region-${s.region}">${weatherBadge(b)}<div class="pair-side">${actors.map(m=>side(m,"我方")).join("")}</div><div class="pair-side rival-side">${b.rivals.map(m=>side(m,"对手")).join("")}</div></div>
    <div class="battle-desk"><div class="panel" aria-live="polite"><div class="small-label">战斗记录</div><ul class="battle-log">${b.lines.map(l=>`<li>${journalHTML(l)}</li>`).join("")}</ul></div><div class="panel">${b.result?`<h2>${b.result==="win"?"双打获胜":"挑战结束"}</h2><div class="dialog-foot">${btn(b.result==="win"?"继续探索":"回研究站休整","leave","","primary")}</div>`:`${actors.map(plan).join("")}<div class="dialog-foot">${btn("执行本回合","pairRound","","primary")}</div>`}</div></div></section>`;
  }
  function battles(){
    if(s.battle.mode==="pair") return pairScene();
    const b=s.battle,a=s.party[b.lead],f=b.rivals[b.foe],lost=a.hp<=0,result=b.result;
    const title={win:b.mode==="beacon"?"潮光徽章":b.mode==="dome"?"镜潮徽章":"对战胜利",caught:"成功结缘",loss:"返回研究站",run:"安全离开"}[result];
    const sks=a.skills.some(k=>k.pp>0)?a.skills:[{id:"strain",pp:1}];
    const caught=result==="caught";
    const resultNote=caught?journalHTML(b.lines.at(-1)||species[f.kind].name+"已结缘。"):result==="win"&&b.mode==="beacon"?"第一枚徽章已获得，可搭船前往盐镜湾。":"本场对战已经结束。";
    const commands=result?`<div class="badge-box">${caught?art(f.kind,"bond-portrait"):icon(b.mode==="beacon"&&result==="win"?"award":"flag")}<div><h2 class="result-title">${title}</h2><p class="note">${resultNote}</p></div></div><div class="dialog-foot">${btn(result==="loss"?"回研究站休整":"继续探索","leave","","primary")}</div>`:
      lost?`<h2>更换出战伙伴</h2><p class="note">当前伙伴已失去战斗能力。</p><div class="dialog-foot">${btn("选择队友","switchDialog","","primary")}</div>`:
      `<div class="small-label">选择招式</div><div class="moves">${sks.map(sk=>{const [n,t,p,,max]=moves[sk.id];const eff=C.effectiveness(t,f.kind);return `<button class="move" data-do="move" data-arg="${sk.id}" ${sk.pp?"":"disabled"}><strong>${icon(types[t][1])} ${n}</strong><small>${types[t][0]} · ${p?(t==="volt"&&F.ability(f)==="coil"?"对手吸收":eff>1?"克制 ×"+eff:eff<1?"抵抗 ×"+eff:"威力 "+p):"变化"}　 PP ${sk.pp}/${max}</small></button>`;}).join("")}</div>
       <div class="tools battle-actions">${btn("换伙伴","switchDialog","","",s.party.filter(m=>m.hp>0).length<2)}${btn("药膏 ×"+s.supply.salves,"salve","","",!s.supply.salves||a.hp===G.stat(a,0))}${a.status?btn("清醒露 ×"+s.supply.tonic,"tonic","","",!s.supply.tonic):""}${b.mode==="wild"?btn("结缘铃 ×"+s.supply.bells,"bell","","",!s.supply.bells)+btn("离开","run"):""}</div>`;
    return `<section class="wrap page battle"><div class="page-title"><div><h1>${battleName(b.mode)}</h1><p>回合 ${String(b.round).padStart(2,"0")}　·　${b.mode==="wild"?"野生相遇":"训练师对战　"+(b.foe+1)+" / "+b.rivals.length}</p></div>${btn(icon("book")+" 记录","history")}</div>
    <div class="arena w-${b.weather} region-${s.region}">${weatherBadge(b)}${art(a.kind,"fighter ally")}${caught?"":art(f.kind,"fighter foe")+meter(f,"enemy")}${meter(a,"own")}</div><div class="battle-desk"><div class="panel" aria-live="polite"><div class="small-label">战斗记录</div><ul class="battle-log">${b.lines.map(l=>`<li>${journalHTML(l)}</li>`).join("")}</ul></div><div class="panel">${commands}</div></div></section>`;
  }
  function members(){
    if(!s.starter) return `<section class="wrap page"><div class="panel empty"><h2>等待第一位伙伴</h2><p>研究站的三位伙伴正等着 Levi。</p>${btn("前往选择","tab","adventure","primary")}</div></section>`;
    return `<section class="wrap page"><div class="page-title"><div><p>携带 ${s.party.length} / 6 位伙伴　·　徽章 ${Number(s.badge)+Number(s.secondBadge)} / 2</p></div>${btn(icon("bag")+" 行囊","bag")}</div><div class="party-list">${s.party.map((m,i)=>`<article class="member ${m.kind} ${species[m.kind].type}">${plate(m.kind)}<div class="member-info"><h2>${species[m.kind].name}</h2><p>Lv.${m.level}　${species[m.kind].role}　${i===0?"首发":""}</p>${hp(m)}<div class="hp-txt">EXP ${m.xp} / ${G.threshold(m.level)}</div><div class="tools">${btn("详情","detail",i)}${i>0?btn("设为首发","lead",i,"",!!s.battle||!m.hp):""}</div></div></article>`).join("")}</div>${s.box.length?`<div class="subhead"><h2>研究站寄养</h2></div><div class="panel"><p class="note">在研究站可将寄养伙伴与队员交换。</p>${s.box.map((m,i)=>`<div class="dialog-row"><span>${species[m.kind].name}　Lv.${m.level}</span>${btn("交换队员","boxSelect",i,"",!!s.battle||activeSite()!=="lab")}</div>`).join("")}</div>`:""}</section>`;
  }
  function dex(){
    return `<section class="wrap page"><div class="page-title"><div><p>已结缘 ${s.caught.length} / ${Object.keys(species).length} 种　·　野外与对战目击 ${s.seen.length} 种</p></div></div><div class="dex-grid">${Object.entries(species).map(([k,d])=>{
      const known=C.starters.includes(k)||s.seen.includes(k);
      return `<article class="dex-entry ${k} ${d.type}">${known?plate(k):`<div class="plate"><div class="plate-head"><span class="num">谱 ${d.no}</span></div>${icon("compass")}</div>`}<div class="member-info"><h2>${known?d.name:"尚待发现"}</h2><p>${known?d.desc:Number(d.no)>9?"搭船前往盐镜湾，观察当地生态。":Number(d.no)>6?"培养初始伙伴至 Lv.9，观察它的进化。":"调查风铃草甸，补齐这份观察记录。"}</p><span class="chip">${s.caught.includes(k)?"已结缘":s.seen.includes(k)?"已目击":known?"研究站记录":"未目击"}</span></div></article>`;}).join("")}</div></section>`;
  }
  function render(){
    clearWalk();resizeField.disconnect();field=null;
    const scene=!s.starter?"opening":s.battle?"battle":"field";
    document.body.dataset.scene=scene;
    syncMusic();$("#screen").innerHTML=scene==="opening"?opening():scene==="battle"?battles():world();
    if(scene==="field"){
      field={map:$("#map"),viewport:$(".map-viewport"),track:$(".walker-track"),walker:$(".walker"),fringe:$(".foot-grass"),interact:$(".world-action")};
      sizeField();resizeField.observe(field.viewport);
      drawGrass($(".field-cover"),s.region);paintPosition(s.pos,0);syncMap();
    }
    if(menu.open)drawMenu();
  }
  function closeDialog(){clearTimeout(fishTimer);fishReady=false;if($("#dialog").open) $("#dialog").close();}
  function modal(title,contents){
    stopWalk();$("#dialogBody").innerHTML=`<div class="dialog-head"><h2>${title}</h2><button class="icon-btn" data-do="close" aria-label="关闭">${icon("close")}</button></div>${contents}`;
    if(!$("#dialog").open)$("#dialog").showModal();
  }
  function choose(k){selected=k;render();$(".specimen.selected")?.focus({preventScroll:true});beep(380+C.starters.indexOf(k)*70);}
  function takeStep(dest,start){
    const from=s.pos;
    if(!G.step(s,dest))return false;
    facing=dest.x>from.x?"right":dest.x<from.x?"left":dest.y>from.y?"down":"up";
    segment={from,to:dest,start};
    save();
    return true;
  }
  function nextStep(start){
    if(!fieldOpen())return false;
    const directions=new Set([queuedDirection,...[...heldDirections.values()].reverse()]);
    queuedDirection=null;
    directions.delete(null);
    for(const k of directions){
      const [dx,dy]=dir[k];
      if(takeStep({x:s.pos.x+dx,y:s.pos.y+dy},start))return true;
    }
    if(directions.size)facing=directions.values().next().value;
    if(journey){
      if(journey.index<journey.path.length&&takeStep(journey.path[journey.index++],start))return true;
      const site=journey.site;
      if(site&&journey.index===journey.path.length&&T.near(s.pos,s.region)===site){
        toast("已抵达"+T.siteList(s.region)[site].name);field.map.focus({preventScroll:true});
      }
      journey=null;
    }
    return false;
  }
  function walkFrame(now){
    frameRequest=0;
    if(!segment||!field)return;
    if(now>=segment.start+tileMs){
      const boundary=segment.start+tileMs;
      segment=null;gait=(gait+1)%cycleTiles;
      if(s.battle){render();beep(580,true);return;}
      syncMap();
      // Carry the sub-frame remainder across tiles, without replaying long background stalls.
      if(!nextStep(Math.max(boundary,now-32))){
        paintPosition(s.pos,0);return;
      }
    }
    const {from,to,start}=segment,t=Math.max(0,Math.min(1,(now-start)/tileMs));
    let cel=1+Math.floor((gait+t)*8/cycleTiles)%8;
    const stopping=!heldDirections.size&&!queuedDirection&&(!journey||journey.index===journey.path.length);
    if(stopping&&t>.78)cel=cel<=4?1:5;
    paintPosition({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t},lessMotion.matches?0:cel);
    frameRequest=requestAnimationFrame(walkFrame);
  }
  function startWalking(){
    if(segment)return;
    const now=performance.now();
    if(nextStep(now))walkFrame(now);
    else if(field)paintPosition(s.pos,0);
  }
  function go(dest,site){
    if(!fieldOpen())return;
    heldDirections.clear();queuedDirection=null;journey=null;
    const target=site?dest:T.nearestGround(dest,s.region,1,s.pos);
    const path=T.route(s.pos,target,s.region);
    if(!path){toast("这里无法落脚，请选择附近的陆地。");return;}
    journey={path,index:0,site};
    startWalking();
  }
  function inspect(){
    if(!fieldOpen())return;
    const site=activeSite();
    if(["lab","beacon","camp","dock","hut","dome"].includes(site)||(s.rod&&atFishingBank())){
      openMenu("site");return;
    }
    interact(site);
  }
  function interact(k){
  stopWalk();if(!k||k!==activeSite()){toast("请先靠近可调查的地点。");return;}
  if(k==="lab"||k==="hut"){
    G.restore(s);s.notice="伙伴体力和招式次数已恢复，基础补给已备齐。";
    if(k==="hut"&&!s.rod){s.rod=true;s.notice="守潮人把潮线竿交给了 Levi。前往潮声浅滩，抛竿等待浮标下沉。";}
    beep(500,true);
  }else if(k==="beacon"&&!s.camp){s.notice="岑川指向北边的练习场：「先让青禾看看你们的默契吧。」";}
  else if(k==="dome"&&!G.canDuel(s)){s.notice="汐弦需要一份本地观察记录。去浅滩结缘瓦当蟹、桂月蛾或潮钟螺。";}
  else {G.encounter(s,["grass","pool","cover"].includes(k)?"wild":k);beep(570,true);}
  save();
  if(!s.battle&&menu.open&&menuPage==="site"){
    menu.querySelector(".site-feedback").textContent=s.notice;return;
  }
  closeMenu();render();if(!s.battle)toast(s.notice);
}
  const itemIcon=id=>`<img class="item-art" src="assets/color/item-${id}.webp" alt="">`;
  function bagContents(){
  const list=Object.entries(F.stock).map(([id,it])=>`<div class="dialog-row stocked">${itemIcon(id)}<div><b>${it.name} ×${s.supply[id]}</b><p class="note">${it.desc}</p></div>${["salves","tonic"].includes(id)&&!s.battle?btn("使用","useSelect",id,"",!s.supply[id]):""}</div>`).join("");
  return `<div class="bag-ledger"><b>潮币 ${s.coins}</b><span>${s.badge?"潮光徽章":"徽章 0 / 2"}${s.secondBadge?" · 镜潮徽章":""}${s.rod?" · 潮线竿":""}</span></div>${list}<div class="dialog-foot tools">${btn("重新开始冒险","resetPrompt")}</div>`;
}
  function shop(){
  if(s.battle||!["lab","hut"].includes(activeSite()))return;
  modal("沿岸补给所",`<div class="bag-ledger"><span>余额</span><b>${s.coins} 潮币</b></div>${Object.entries(F.stock).map(([id,it])=>`<div class="dialog-row stocked">${itemIcon(id)}<div><b>${it.name}</b><p class="note">${it.desc}</p><small>行囊 ×${s.supply[id]}</small></div>${btn(it.price+" 潮币","buy",id,"",s.coins<it.price)}</div>`).join("")}`);
}
  function inventoryTarget(id){
  modal("使用"+F.stock[id].name,s.party.map((m,i)=>`<div class="dialog-row"><div class="inline">${art(m.kind)}<div><b>${species[m.kind].name}</b><p class="note">HP ${m.hp}/${G.stat(m,0)}　${F.statusNames[m.status]||""}</p></div></div>${btn("使用","fieldUse",id+","+i,"",!m.hp||(id==="salves"?m.hp===G.stat(m,0):!m.status))}</div>`).join(""));
}
  function equipment(i){
  const m=s.party[i];modal("更换携带物",`<p class="note">${species[m.kind].name}当前携带${F.stock[m.held]?.name||"空"}。</p>${Object.entries(F.stock).filter(([,it])=>it.hold).map(([id,it])=>`<div class="dialog-row stocked">${itemIcon(id)}<div><b>${it.name} ×${s.supply[id]}</b><p class="note">${it.desc}</p></div>${btn("携带","equip",i+","+id,"",m.held===id||!s.supply[id])}</div>`).join("")}<div class="dialog-foot">${btn("卸下携带物","equip",i+",","",!m.held)}</div>`);
}
  function dojo(i){
  const m=s.party[i];modal("整备招式",`<p class="note">${species[m.kind].name}最多携带四招。已学招式可在补给点免费回忆。</p>${F.teachable(m).map(id=>{const a=moves[id],known=m.skills.some(k=>k.id===id);return `<div class="dialog-row"><div><b>${a[0]}</b><p class="note">${moveInfo(id)}</p></div>${btn(known?"已装备":"学习","chooseSlot",i+","+id,"",known)}</div>`;}).join("")}`);
}
  function moveInfo(id){
  const [n,t,p,acc,pp,,effect]=moves[id];
  const effects={protect:"先制防护，连续使用成功率递减",spread:"双打命中两位对手，双目标时每位承受 75% 伤害",rain:"五回合降雨，增强水、削弱火",sun:"五回合烈日，增强火、削弱水",sleep:"使目标睡眠 1～3 次行动",focus:"提高一级特攻",guard:"提高一级防御",weaken:"降低目标一级攻击",poison:"有机会使对手中毒",burn:"有机会灼伤",para:"有机会麻痹",quick:"先制出手",drain:"回复造成伤害的一半",slow:"有机会降低速度"};
  return [types[t][0],p?(["plain","rock","air"].includes(t)?"物理":"特殊")+" "+p:"变化","命中 "+acc+"%","PP "+pp,effects[effect]].filter(Boolean).join(" · ");
}
  function detail(i){
  const m=s.party[i],d=species[m.kind],[ability,explain]=F.abilities[F.ability(m)];
  const manage=!s.battle,atDesk=["lab","hut"].includes(activeSite());
  modal(d.name,`<div class="dossier"><div class="portrait">${art(m.kind)}</div><div>${elType(m.kind)}<h3>Lv.${m.level}　${d.role}</h3>${hp(m)}<small>EXP ${m.xp} / ${G.threshold(m.level)}</small></div></div>
  <div class="skill-notes"><p><b>性格</b> ${F.disposition(m)}</p><p><b>特性</b> ${ability} · ${explain}</p><p><b>携带</b> ${F.stock[m.held]?.name||"空"}</p></div>
  <table class="stat-table"><thead><tr><th>能力</th><th>数值</th><th>个体值</th><th>努力值</th></tr></thead><tbody>${F.labels.map((n,j)=>`<tr><th>${n}</th><td>${G.stat(m,j)}</td><td>${m.iv[j]}</td><td>${m.ev[j]}</td></tr>`).join("")}</tbody></table>
  <p class="note">累计努力值 ${m.ev.reduce((a,b)=>a+b,0)} / 510${C.evolutions[m.kind]?"　·　Lv.9 进化":""}</p>
  ${m.skills.map(sk=>`<div class="dialog-row"><div><b>${moves[sk.id][0]}</b><p class="note">${moveInfo(sk.id)}</p></div><small>PP ${sk.pp}</small></div>`).join("")}
  <div class="dialog-foot tools">${btn("更换携带物","equipment",i,"",!manage)}${btn("整备招式","dojo",i,"",!manage||!atDesk)}${Object.values(C.evolutions).includes(m.kind)?btn("重看进化","replayEvolution",i):""}${btn("返回","close")}</div>${!atDesk?"<p class='note dialog-foot'>在雾岬研究站或潮汐小屋可以整备招式。</p>":""}`);
}
  function cast(){
  if(s.battle||!s.rod||!atFishingBank())return;
  clearTimeout(fishTimer);fishReady=false;
  modal("潮声浅滩 · 垂钓",`<div class="float-scene"><i></i></div><p id="bite" role="status">浮标随波摇晃，稍等片刻……</p><div class="dialog-foot">${btn("提竿","hook","","primary",true)}</div>`);
  fishTimer=setTimeout(()=>{
    if(!$("#dialog").open||!$("#bite"))return;
    fishReady=true;$("#bite").textContent="浮标沉下去了！现在可以提竿。";$(".float-scene").classList.add("bite");$("[data-do=hook]").disabled=false;beep(744,true);
  },850+Math.random()*750);
}
  function teamDialog(mode){
    modal(mode==="switch"?"选择出战伙伴":"选择交换队员",s.party.map((m,i)=>`<div class="dialog-row"><div class="inline">${art(m.kind)}<div><b>${species[m.kind].name}</b><p class="note">Lv.${m.level} · HP ${m.hp}/${G.stat(m,0)}</p></div></div>${btn(mode==="switch"?"出战":"交换",mode,i,"",mode==="switch"&&(!m.hp||s.battle.lead===i))}</div>`).join(""));
  }
  let presenting=false;
  async function showEvolutions(replay){
    if(presenting||(!replay&&!s.pendingEvolutions?.length))return;
    presenting=true;
    try{
      if(replay){await MistTheater.evolution(replay);return;}
      while(s.pendingEvolutions?.length){
        const from=s.pendingEvolutions[0];
        if(Object.hasOwn(C.evolutions,from))await MistTheater.evolution(from);
        s.pendingEvolutions.shift();
        if(!s.pendingEvolutions.length)delete s.pendingEvolutions;
        save();
      }
    }catch{toast("进化画面未能加载，伙伴进度已保留。");}
    finally{presenting=false;}
  }
  async function presentRound(events){
    presenting=true;closeDialog();save();
    if(events[0]?.type==="bell"){
      $(".battle-actions [data-do=bell]").textContent="结缘铃 ×"+s.supply.bells;
    }else beep(s.battle.result?632:330,!!s.battle.result);
    $("#top").inert=true;
    try{await MistTheater.turn($(".arena"),events,beep);}
    catch{toast("战斗演出未能加载，本回合已结算。");}
    finally{$("#top").inert=false;presenting=false;render();}
    await showEvolutions();
  }
  function battleAct(action,arg){
    const events=[];
    if(G.act(s,action,arg,Math.random,events))presentRound(events);
  }
  const dir={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  function fieldOpen(){return s.starter&&!s.battle&&!menu.open&&!$("#dialog").open;}
  function pressDirection(source,k){
    if(!fieldOpen()||heldDirections.has(source))return;
    journey=null;queuedDirection=k;heldDirections.set(source,k);startWalking();
  }
  function releaseDirection(source){
    if(heldDirections.delete(source)&&!segment&&heldDirections.size)startWalking();
  }
  function action(op,arg){
    if(presenting||(segment&&s.battle))return;
    switch(op){
      case "select":choose(arg);break;
      case "depart":if(G.start(s,selected)){beep(523,true);save();render();window.scrollTo(0,0);}break;
      case "menu":openMenu();break;
      case "menuClose":closeMenu();break;
      case "tab":if(arg==="adventure")closeMenu();else openMenu(arg);break;
      case "sound":s.sound=!s.sound;save();syncMusic();beep(660);drawMenu();menu.querySelector("[data-do=sound]")?.focus();break;
      case "travel":if(s.battle)break;closeMenu();go(T.toGrid(T.siteList(s.region)[arg].at),arg);break;
      case "step":pressDirection("tap",arg);releaseDirection("tap");break;
      case "inspect":inspect();break;
      case "interact":interact(arg);break;
      case "fullscreen":{
        const switchScreen=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
        switchScreen.catch(()=>toast("当前窗口无法切换全屏。"));
        break;
      }
      case "camera":s.follow=!follow();save();if(field)paintCamera(s.pos);drawMenu();menu.querySelector("[data-do=camera]")?.focus();break;
      case "bag":openMenu("bag");break;
      case "shop":shop();break;
      case "buy":if(["lab","hut"].includes(activeSite())&&F.buy(s,arg)){save();render();shop();beep(545);toast("已购入"+F.stock[arg].name);}break;
      case "equipment":if(!s.battle)equipment(Number(arg));break;
      case "equip":{const [i,id]=arg.split(",");if(F.equip(s,Number(i),id)){save();render();detail(Number(i));}break;}
      case "useSelect":if(!s.battle)inventoryTarget(arg);break;
      case "fieldUse":{const [id,i]=arg.split(",");if(!s.battle&&F.use(s,id,Number(i))){save();closeDialog();render();openMenu("bag");toast("已使用"+F.stock[id].name);}break;}
      case "dojo":if(!s.battle&&["lab","hut"].includes(activeSite()))dojo(Number(arg));break;
      case "chooseSlot":{
        const [i,id]=arg.split(","),m=s.party[i];
        if(!s.battle&&["lab","hut"].includes(activeSite())){
          if(m.skills.length<4){if(F.teach(s,Number(i),id,m.skills.length)){save();render();detail(Number(i));}}
          else modal("选择替换的招式","<p class='note'>新招式「"+moves[id][0]+"」将占用一个招式栏位。</p>"+m.skills.map((sk,j)=>'<div class="dialog-row"><b>'+moves[sk.id][0]+'</b>'+btn("替换","learn",[i,id,j].join(","))+'</div>').join(""));
        }break;
      }
      case "learn":{const [i,id,j]=arg.split(",");if(["lab","hut"].includes(activeSite())&&F.teach(s,Number(i),id,Number(j))){save();render();detail(Number(i));}break;}
      case "sail":if(G.sail(s)){closeMenu();save();render();beep(480,true);toast(s.notice);}break;
      case "fish":cast();break;
      case "hook":if(fishReady&&atFishingBank()&&G.encounter(s,"fish")){fishReady=false;closeDialog();closeMenu();save();render();}break;
      case "close":closeDialog();break;
      case "detail":detail(Number(arg));break;
      case "replayEvolution":{
        const from=C.starters.find(k=>C.evolutions[k]===s.party[Number(arg)]?.kind);
        if(from){closeDialog();showEvolutions(from).then(()=>detail(Number(arg)));}
        break;
      }
      case "lead":if(!s.battle&&s.party[arg]?.hp){[s.party[0],s.party[arg]]=[s.party[arg],s.party[0]];save();render();}break;
      case "move":case "tonic":case "bell":case "salve":case "run":battleAct(op,arg);break;
      case "switch":battleAct(op,Number(arg));break;
      case "switchDialog":teamDialog("switch");break;
      case "pairStart":
        if(G.startPair(s)){closeMenu();save();beep(570,true);render();}
        else if(menu.open&&menuPage==="site")menu.querySelector(".site-feedback").textContent="双打需要至少两位有体力的伙伴。";
        else toast("双打需要至少两位有体力的伙伴。");
        break;
      case "pairRound":{
        const orders=s.battle.allies.map((_,j)=>{
          const move=$("#duo-move-"+j).value;
          if(move.startsWith("swap-"))return {action:"switch",to:Number(move.slice(4))};
          if(move==="salves"||move==="tonic")return {action:move};
          return {move,target:Number($("#duo-target-"+j).value)};
        });
        const events=[];
        if(G.pairRound(s,orders,Math.random,events))presentRound(events);else toast("请选不同的替补，并确认道具数量足够。");
        break;
      }
      case "history":modal("战斗记录",`<ul class="battle-log">${s.battle.history.map(l=>`<li>${journalHTML(l)}</li>`).join("")}</ul>`);break;
      case "leave":if(G.leaveBattle(s)){save();render();}break;
      case "boxSelect":boxIndex=Number(arg);teamDialog("swap");break;
      case "swap":if(activeSite()==="lab"&&!s.battle&&s.box[boxIndex]&&s.party[arg]){[s.box[boxIndex],s.party[arg]]=[s.party[arg],s.box[boxIndex]];G.restore(s);save();closeDialog();render();}break;
      case "resetPrompt":modal("重新开始冒险？",`<p>将清除当前队伍、图鉴和徽章，回到研究站重新选择初始伙伴。</p><div class="tools dialog-foot">${btn("保留进度","close","","primary")}${btn("清除并重开","reset")}</div>`);break;
      case "reset":{const sound=s.sound;s=G.fresh();s.sound=sound;selected="moss";closeDialog();closeMenu();save();render();break;}
    }
  }
  document.addEventListener("pointerdown",syncMusic);
  document.addEventListener("pointerdown",e=>{
    const button=e.target.closest('[data-do="step"]');
    if(!button||e.button!==0||!fieldOpen())return;
    e.preventDefault();button.setPointerCapture(e.pointerId);
    pressDirection("pointer"+e.pointerId,button.dataset.arg);
  });
  for(const type of ["pointerup","pointercancel","lostpointercapture"]){
    document.addEventListener(type,e=>releaseDirection("pointer"+e.pointerId));
  }
  document.addEventListener("keydown",syncMusic);
  document.addEventListener("click",e=>{
    const button=e.target.closest("[data-do]");
    if(button&&!button.disabled){
      if(button.dataset.do!=="step"||e.detail===0)action(button.dataset.do,button.dataset.arg);
      return;
    }
    const map=e.target.closest("#map");if(map){const r=map.getBoundingClientRect();go(T.toGrid([(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100]));}
    if(e.target===$("#dialog")){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}
  });
  document.addEventListener("fullscreenchange",()=>{
    if(menu.open&&menuPage==="settings"){
      drawMenu();menu.querySelector("[data-do=fullscreen]")?.focus();
    }
  });
  menu.addEventListener("cancel",e=>{
    e.preventDefault();
    if(menuPage==="home"||menuPage==="site")closeMenu();else openMenu("home");
  });
  menu.addEventListener("click",e=>{
    if(e.target!==menu)return;
    const r=menu.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeMenu();
  });
  document.addEventListener("change",e=>{
    if(!e.target.id?.startsWith("duo-move-"))return;
    const j=e.target.id.slice(9),target=$("#duo-target-"+j),value=e.target.value;
    if(!target)return;
    const fixedTarget=value.startsWith("swap-")||["salves","tonic"].includes(value)||["spread","rain","sun","protect","guard","focus"].includes(moves[value]?.[6]);
    target.disabled=fixedTarget;
    target.setAttribute("title",fixedTarget?"此指令自动确定作用对象":"选择对手");
  });
  document.addEventListener("keydown",e=>{
    if(presenting||e.altKey||e.ctrlKey||e.metaKey||$("#dialog").open)return;
    const k=e.key.toLowerCase();
    if(k==="m"||(!menu.open&&k==="escape")){
      e.preventDefault();
      if(!e.repeat&&!(segment&&s.battle)){if(menu.open)closeMenu();else openMenu();}
      return;
    }
    if(menu.open)return;
    if(!s.starter){
      const d=["a","arrowleft"].includes(k)?-1:["d","arrowright"].includes(k)?1:0;
      if(d){e.preventDefault();choose(C.starters[(C.starters.indexOf(selected)+d+3)%3]);}
      else if(k==="enter"&&(!document.activeElement?.closest("button")||document.activeElement?.matches(".specimen"))){e.preventDefault();action("depart");}
    } else if(s.battle){
      if(!e.repeat&&/^[1-4]$/.test(k)) document.querySelectorAll(".move")[Number(k)-1]?.click();
    } else {
      const keys={w:"up",s:"down",a:"left",d:"right",arrowup:"up",arrowdown:"down",arrowleft:"left",arrowright:"right"};
      if(keys[k]){e.preventDefault();if(!e.repeat)pressDirection(k,keys[k]);}
      else if(k==="e"&&!e.repeat){e.preventDefault();inspect();}
    }
  });
  document.addEventListener("keyup",e=>releaseDirection(e.key.toLowerCase()));
  window.addEventListener("blur",stopWalk);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stopWalk();syncMusic();});
  if(loaded)save();render();if(saveError)toast("本地存档暂不可读，当前会话仍可游玩。");
  showEvolutions();
}
runMistcape();
