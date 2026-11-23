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
  const walkMs=136,runMs=68,cycleTiles=4;
  let running=false;
  const lessMotion=matchMedia("(prefers-reduced-motion: reduce)");
  let selected=s.starter||"moss",toastTimer=null,audio=null,boxIndex=null;
  const heldDirections=new Map();
  const menu=$("#gameMenu");
  let menuPage="home";
  const J=G.chapters;
  const regionName=()=>T.areas[s.region].name;
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
  function soundGong(longStroke){
    if(!s.sound)return;
    try{
      audio||=new(window.AudioContext||window.webkitAudioContext)();
      audio.resume().catch(()=>{});
      const start=audio.currentTime,duration=longStroke?1.35:.34;
      for(const [hz,gain] of [[232,.09],[563,.035],[917,.018]]){
        const tone=audio.createOscillator(),amp=audio.createGain();
        tone.frequency.value=hz;amp.gain.setValueAtTime(.001,start);
        amp.gain.exponentialRampToValueAtTime(gain,start+.012);
        amp.gain.exponentialRampToValueAtTime(.001,start+duration);
        tone.connect(amp);amp.connect(audio.destination);tone.start(start);tone.stop(start+duration);
      }
    }catch{}
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
      ["dex","leaf","灵兽谱","沿岸 "+s.caught.filter(k=>species[k]&&!species[k].reserve).length+" / "+Object.values(species).filter(d=>!d.reserve).length+" 已结缘"],
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
      const places=T.siteList(s.region),near=T.near(s.pos,s.region),[x,y]=T.toPct(s.pos,s.region);
      body=`<div class="travel-atlas ${s.region}"><div class="atlas-position" aria-label="Levi 的位置" style="left:${x}%;top:${y}%"></div>${Object.entries(places).map(([k,d])=>`<button class="atlas-pin" style="left:${d.at[0]}%;top:${d.at[1]}%" data-do="travel" data-arg="${k}" aria-label="前往${d.name}" ${s.battle?"disabled":""}>${icon(d.icon)}</button>`).join("")}</div>
      <div class="atlas-caption"><span>${icon("compass")}${regionName()}</span><span><i></i>Levi 的位置</span></div>
      ${chapterMap()}${s.battle?"":sitePanel()}<div class="jump-list">${Object.entries(places).map(([k,d])=>`<button class="jump" data-do="travel" data-arg="${k}" ${s.battle?"disabled":""}><span class="jump-label">${icon(d.icon)}${d.name}</span>${k===near?"<small>所在地</small>":""}${icon("chevron")}</button>`).join("")}</div>`;
    }else if(page==="journal"){
      const grass=T.tallGrass(s.pos,s.region);
      body=`<section class="journal-block"><h3>当前目标</h3><p>${nextGoal()}</p></section>${chapterJournal()}<section class="journal-block"><h3>最近记录</h3><p>${journalHTML(s.notice)}</p></section><div class="journal-location"><b>${regionName()}</b>${weatherBadge(s.battle)}<span class="ground-name">${grass?"草丛 · 可能遇敌":"平地 · 安全"}</span></div>`;
    }else if(page==="settings"){
      body=`<div class="setting-list"><button data-do="sound" aria-pressed="${s.sound}">${icon(s.sound?"sound":"mute")}<b>音乐与音效</b><span>${s.sound?"已开启":"已关闭"}</span></button>
      <button data-do="camera" aria-pressed="${follow()}">${icon("compass")}<b>探索视角</b><span>${follow()?"跟随 Levi":"广角"}</span></button>
      ${document.fullscreenEnabled?`<button data-do="fullscreen" aria-pressed="${!!document.fullscreenElement}">${icon("expand")}<b>全屏显示</b><span>${document.fullscreenElement?"退出全屏":"进入全屏"}</span></button>`:""}</div>
      <dl class="control-list"><div><dt>打开或关闭菜单</dt><dd>M</dd></div><div><dt>返回上一级</dt><dd>Esc</dd></div><div><dt>移动</dt><dd>WASD / 方向键</dd></div><div><dt>按住快跑</dt><dd>Shift</dd></div><div><dt>调查或交谈</dt><dd>E</dd></div><div><dt>自动寻路</dt><dd>点选地面或地点</dd></div></dl>`;
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
  const itineraries={1:["coast","lanternTown","bambooRoad","kiln","ridge"],2:["cove","saltport","saltRoad","echoCave","marsh"]};
  function chapterMap(){
    const chapter=T.areas[s.region].chapter;
    return `<details class="chapter-map"><summary>${chapter===1?"第一章 · 潮光":"第二章 · 镜潮"}行旅图</summary><ol>${itineraries[chapter].map(id=>{
      const area=T.areas[id];
      return `<li ${id===s.region?'aria-current="location"':""}><img src="assets/color/${id}.webp" alt=""><span><b>${area.name}</b><small>${area.type}${id===s.region?" · 当前位置":""}</small></span></li>`;
    }).join("")}</ol><p>${chapter===1?"研究站通灯匠镇。竹影驿道分两岔，一路到古窑，一路上栖风岭。岭上松关栈门通回练习场。":"盐镜渡口通盐栈港。潮田长堤分两岔，一路进石窟，一路到鸣沙泽。芦汀旧埠通回潮汐小屋。"}</p></details>`;
  }
  function chapterJournal(){
    return Object.entries(J.chapters).filter(([id])=>id==="ridge"||J.open(s,id)).map(([id,c])=>{
      const stage=s.chapters[id];
      return `<article class="chapter-note ${id}"><div class="chapter-print" aria-hidden="true"></div><div><small>${c.badge} · ${c.region}</small><h3>${c.title}</h3><p>${[c.opening,c.clue,c.ending][stage]}</p><p>${s.expedition[id]===3?"已寻回"+J.errands[id].item:J.errands[id].goals[s.expedition[id]]}</p></div></article>`;
    }).join("");
  }
  function nextGoal(){
    if(!s.badge){
      if(!s.camp&&!J.hasTool(s,"ridge"))return J.goal(s,"ridge")+" 林间练习场的青禾也在等你。";
      if(!s.camp)return "回雾岬海岸的林间练习场与青禾切磋，她会打开栖风岭的栈门。";
      return J.goal(s,"ridge");
    }
    if(s.secondBadge)return "两枚徽章已集齐。可以重走两条驿路，寻找野生伙伴、行旅补给和沿途的训练师。";
    if(T.areas[s.region].chapter===1)return "回雾岬研究站或望潮灯台，从建筑菜单搭船前往盐镜湾。";
    if(s.chapters.marsh<2)return J.goal(s,"marsh");
    return G.hasLocal(s)?"返回盐镜观测台，挑战领航员汐弦。":"结缘盐镜湾或鸣沙泽的一种本地灵兽，再回盐镜观测台。";
  }
  function sitePanel(standalone=false){
  const site=activeSite(),reeds=["cove","marsh","saltRoad"].includes(s.region);
  const d=site==="cover"?{name:reeds?"湾畔芦荡":"原野高草",icon:"leaf",action:reeds?"调查潮草":"调查草丛",desc:"草叶间有灵兽活动的痕迹。穿行或调查这里，都有机会相遇。"}:T.siteList(s.region)[site],options=[];
  const chapter=J.chapters[s.region];
  const choices=J.options(s,site);
  const gate=T.passage(s.region,site),errand=J.errands[d?.job];
  const crossingButton=()=>btn("步行前往"+T.areas[gate.region].name,"walkPassage","","primary");
  if(d?.exit&&gate)options.push(crossingButton());
  else if(errand&&s.expedition[d.job]===2&&site===errand.sites[2])errand.choices.forEach(([key,label])=>options.push(btn(label,"errand",key)));
  else if(errand)options.push(btn(d.action,"errand","inspect","primary"));
  else if(d?.service==="shop")options.push(btn(d.action,"shop","","primary"));
  else if(chapter&&site===chapter.entrance)options.push(btn(d.action,"cross",s.region,"primary"));
  else if(choices.length)choices.forEach(([key,label])=>options.push(btn(label,"chapterAction",key)));
  else if(chapter&&[chapter.clueSite,chapter.finishSite].includes(site))options.push(btn(d.action,"chapterAction","inspect","primary"));
  else if(d){
    const label=s.expedition.trained.includes(site)?"与"+G.trainers[site].name+"叙旧":s.expedition.claimed.includes(site)?"查看补给处":d.action;
    options.push(btn(label,site==="dock"?"sail":"interact",site,"primary"));
  }
  for(const [id,c] of Object.entries(J.chapters)){
    if(site===c.gate&&s.region===c.origin)options.push(btn(c.passage,"cross",id,"",!J.open(s,id)));
  }
  if(["lab","hut"].includes(site))options.push(btn("补给商店","shop"));
  if(gate&&!d.exit)options.push(crossingButton());
  const outbound=site==="lab"||site==="beacon";
  if(outbound)options.push(btn("搭船去盐镜湾","sail","","",!s.badge));
  if(site==="beacon"&&s.badge)options.push(btn("双打交流赛","pairStart"));
  if(atFishingBank()&&s.rod)options.push(btn("抛竿垂钓","fish"));
  const title=d?.name||(reeds?"滨海滩地":"海岬原野");
  const assignment=Object.values(J.chapters).find(c=>s.region===c.origin&&site===c.gate);
  const assigned=site==="camp"?"ridge":"marsh";
  const brief=errand?(s.expedition[d.job]===3?"已寻回"+errand.item:errand.goals[s.expedition[d.job]]):assignment?[assignment.opening,assignment.clue,assignment.ending][s.chapters[assigned]]:choices.length?chapter.clue:"";
  const rhythm=site==="gong"&&s.chapters.beats>0?"已敲："+Array(s.chapters.beats).fill("短").join("、")+"。":"";
  const description=d?.desc||(atFishingBank()&&s.rod?"这里靠近水边，可以在岸上抛竿。":"脚下是平地，可以自由行走。成片的高草里栖息着野生灵兽。");
  const heading=standalone?"":`<div class="where">${icon(d?.icon||"compass")}<h2>${title}</h2></div>`;
  return `<section class="panel spot-panel">${heading}<p>${description}</p>${brief?`<p class="chapter-brief">${brief} ${rhythm}</p>`:""}<div class="tools">${options.join("")||btn("查看行囊","bag")}</div>${outbound&&!s.badge?"<p class='note'>获得望潮灯台的潮光徽章后可搭船。</p>":""}${standalone?"<p class='site-feedback' role='status'></p>":""}</section>`;
}
  function weatherBadge(b){
  const w=b?.weather||F.ambient(s);
  return `<span class="weather-tag ${w}">${icon(w==="rain"?"drop":"sun")}${F.weatherNames[w]}${b?.weatherTurns?" · "+b.weatherTurns+" 回合":""}</span>`;
}
  function figure(person,pos,kind,pet=false){
    const [x,y]=T.toPct(pos,s.region),label=pet?species[kind].name+"和"+person.name:person.name;
    return `<button type="button" class="field-figure ${pet?"companion":"villager"}" data-do="visit" data-arg="${person.id}" style="left:${x}%;top:${y}%;z-index:${10+pos.y*2}" aria-label="拜访${label}"><img draggable="false" src="assets/color/${pet?"":"npc-"}${kind}.webp" alt=""></button>`;
  }
  function fieldLandmarks(){
    const figures=T.people(s.region).map(p=>figure(p,p.pos,p.actor)+(p.pet?figure(p,p.petPos,p.pet,true):"")).join("");
    const signs=Object.entries(T.siteList(s.region)).map(([key,d])=>{
      const gate=T.passage(s.region,key);
      if(!gate)return "";
      return `<button class="field-sign" style="left:${d.at[0]}%;top:${d.at[1]}%" data-do="travel" data-arg="${key}" aria-label="走到${d.name}">${icon("compass")}${T.areas[gate.region].name}</button>`;
    }).join("");
    return figures+signs;
  }
  function fieldSightings(){
    return T.sightings(s.region,s.chapters[s.region]===2).map(({kind,pos})=>{
      const [x,y]=T.toPct(pos,s.region);
      return `<img class="field-animal" src="assets/color/${kind}.webp" alt="${species[kind].name}" style="left:${x}%;top:${y}%;z-index:${10+pos.y*2}">`;
    }).join("");
  }
  function world(){
    return `<section class="field-page" aria-label="${regionName()}"><div class="map-viewport"><div class="map ${s.region}" id="map" role="group" aria-label="${regionName()}可探索地图" tabindex="0"><canvas class="field-cover" width="${T.grid(s.region)[0]*20}" height="${T.grid(s.region)[1]*20}" aria-hidden="true"></canvas><div class="field-sightings">${fieldSightings()}</div><div class="field-landmarks">${fieldLandmarks()}</div><div class="walker-track"><div class="walker" role="img" aria-label="Levi"></div><i class="foot-grass" hidden aria-hidden="true"></i></div></div></div>
    <div class="field-hud"><div class="touch-pad" aria-label="移动方向">${[["up","↑"],["left","←"],["down","↓"],["right","→"]].map(([k,n])=>`<button data-do="step" data-arg="${k}" aria-label="移动 ${n}">${n}</button>`).join("")}</div><button class="world-action" data-do="inspect" hidden>${icon("compass")} <span class="inspect-label">调查</span> <kbd>E</kbd></button></div></section>`;
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
    const [w,h]=T.grid(s.region),z=follow()?1.5*w/T.W:1;
    const offset=(p,world,view)=>Math.max(0,Math.min(world*z-view,p*world*z-view/2));
    const px=offset(pos.x/w,field.width,field.vw),py=offset(pos.y/h,field.height,field.vh);
    field.map.style.transform="translate3d("+(-px)+"px,"+(-py)+"px,0) scale("+z+")";
  }
  function drawGrass(canvas,region){
    const cells=T.grassCells(region);if(!cells.length)return;
    const grass=new Image();
    grass.onload=()=>{
      if(!canvas.isConnected)return;
      const ctx=canvas.getContext("2d");
      const unit=canvas.width/T.grid(region)[0];
      ctx.save();
      ctx.filter="blur(2px)";
      ctx.fillStyle={ridge:"#69603752",marsh:"#5a635352",cove:"#37745270",coast:"#28654180",bambooRoad:"#3c703f70",saltRoad:"#696a3d68"}[region];
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
    grass.src="assets/color/"+(T.areas[region].grassArt||{coast:"grass",cove:"reeds",ridge:"ridge-grass",marsh:"marsh-reeds"}[region])+".webp";
  }
  function paintPosition(pos,cel){
    const {track,walker,fringe}=field,[x,y]=T.toPct(pos,s.region);
    track.style.transform="translate3d("+x+"%,"+y+"%,0)";
    track.style.zIndex=10+Math.round(pos.y*2)+1;
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
    const site=activeSite(),d=T.siteList(s.region)[site];
    const person=T.neighbor(s.pos,s.region);
    field.interact.hidden=!site&&!person&&!(s.rod&&atFishingBank());
    field.interact.querySelector(".inspect-label").textContent=person?.line?"交谈 · "+person.name:d?"调查 · "+d.name:"调查";
  }
  function meter(m,cls){
  const data=F.abilities[F.ability(m)];
  return `<div class="meter ${cls}"><div class="meter-head"><strong>${species[m.kind].name}</strong><small>Lv.${m.level}</small></div>${hp(m)}<div class="meter-tags">${elType(m.kind)}<span>${data[0]}</span></div>${cls==="own"?`<div class="xp-mini" aria-label="经验 ${m.xp}"><i style="width:${Math.min(100,m.xp/G.threshold(m.level)*100)}%"></i></div>`:""}</div>`;
}
  const battleName=mode=>G.trainers[mode]?.name||({wild:regionName()+" · 野生相遇",camp:"巡林员的切磋",beacon:"守灯人的试炼",dome:"领航员的试炼"}[mode]);
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
      const score=(id,target)=>moves[id][2]*(moves[id][6]==="twice"?2:1)*C.effectiveness(moves[id][1],target.kind)*moves[id][3]/100;
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
    const resultNote=caught?journalHTML(b.lines.at(-1)||species[f.kind].name+"已结缘。"):result==="win"&&b.mode==="beacon"?"山口与海岸的两点灯火亮起。研究站与灯台的渡船可以出海了。":result==="win"&&b.mode==="dome"?"盐船已循钟声归港。汐弦把镜潮徽章和那张潮尺拓片一并还给了你。":"本场对战已经结束。";
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
  let dexBook="field",farArea=0;
  function dex(){
    const known=k=>C.starters.includes(k)||s.seen.includes(k)||s.caught.includes(k);
    const card=(line,i)=>{
      const k=line[i],d=species[k],stage=line.length===1?"独立种":i===line.length-1?"终阶":i?"中阶":"初阶";
      const condition=i?"Lv."+C.evolutionLevels[line[i-1]]:"";
      const hint=i?"由"+species[line[i-1]].name+"培养获得。":d.habitat||(k==="snail"?"在潮声浅滩垂钓时寻找。":["crab","moth"].includes(k)?"在盐镜湾的芦荡中寻找。":"在雾岬海岸的高草中寻找。");
      const portrait=known(k)?plate(k):`<div class="plate"><div class="plate-head"><span class="num">谱 ${d.no}</span></div>${icon("compass")}</div>`;
      return `<article class="dex-entry ${k} ${d.type}">${portrait}<div class="member-info"><small>${stage} ${condition}</small><h2>${known(k)?d.name:"尚待发现"}</h2><p>${known(k)?d.desc:hint}</p>${known(k)&&i===0&&!C.starters.includes(k)?`<p class="note">${hint}</p>`:""}<span class="chip">${s.caught.includes(k)?"已结缘":s.seen.includes(k)?"已目击":known(k)?"研究站记录":"未目击"}</span></div></article>`;
    };
    const tabs='<div class="folio-tabs">'+btn("沿岸卷","dexBook","field",dexBook==="field"?"primary":"")+btn("远域卷","dexBook","far",dexBook==="far"?"primary":"")+'</div>';
    if(dexBook==="far"){
      const area=C.reserve[farArea];
      return `${tabs}<label class="folio-select">拟定栖地 <select id="far-area">${C.reserve.map((a,i)=>`<option value="${i}" ${i===farArea?"selected":""}>${a.habitat}</option>`).join("")}</select></label>
      <p class="note">远域卷收录后续地图的考察画稿。当前两章可在沿岸卷查看当地灵兽。</p>${area.families.map(f=>{
        const line=C.familyOf[f.id];return `<section class="dex-family"><h3>${C.lineage(f.id)}</h3><p class="note">${species[f.id].source} · ${f.motif}</p><div class="dex-grid">${line.map(k=>`<article class="dex-entry ${species[k].type}">${plate(k)}<div class="member-info"><h2>${species[k].name}</h2><small>${species[k].role} · ${line.length===1?"不进化":(line.indexOf(k)+1)+" / "+line.length+" 阶"}</small><p>${species[k].desc}</p>${btn("查看档案与招式","specPath",k)}</div></article>`).join("")}</div></section>`;
      }).join("")}`;
    }
    const local=C.lineages.filter(line=>!species[line[0]].reserve),count=local.flat().length;
    return `<section class="wrap page">${tabs}<div class="page-title"><p>沿岸已结缘 ${s.caught.filter(k=>species[k]&&!species[k].reserve).length} / ${count} 种形态　·　${local.length} 支谱系</p></div>${local.map(line=>{
      const base=species[line[0]],title=known(line[0])?base.name+"谱系":"灵兽谱 "+base.no;
      return `<section class="dex-family"><h3>${title}</h3><div class="dex-grid">${line.map((_,i)=>card(line,i)).join("")}</div></section>`;
    }).join("")}</section>`;
  }
  let enteringBattle=false;
  function render(){
    if(enteringBattle)return;
    if(!s.battle||document.body.dataset.scene!=="field"){paintScene();return;}
    enteringBattle=true;presenting=true;clearWalk();save();
    $("#screen").inert=true;$("#top").inert=true;
    let painted=false;
    const reveal=()=>{if(!painted){painted=true;paintScene();}};
    MistTheater.encounter(s.battle,reveal).catch(()=>toast("已进入战斗。")).finally(()=>{
      reveal();enteringBattle=false;presenting=false;$("#screen").inert=false;$("#top").inert=false;
    });
  }
  function paintScene(){
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
  function setRunning(held){
    if(running===held)return;
    running=held;
    if(!segment)return;
    const now=performance.now(),progress=Math.min(1,Math.max(0,(now-segment.start)/segment.duration));
    segment.duration=held?runMs:walkMs;
    segment.start=now-progress*segment.duration;
  }
  function takeStep(dest,start){
    const from=s.pos;
    if(!G.step(s,dest))return false;
    facing=dest.x>from.x?"right":dest.x<from.x?"left":dest.y>from.y?"down":"up";
    segment={from,to:dest,start,duration:running?runMs:walkMs};
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
      const {site,visitor}=journey;
      journey=null;
      if(visitor){meet(visitor);return false;}
      if(site&&T.near(s.pos,s.region)===site){
        toast("已抵达"+T.siteList(s.region)[site].name);field.map.focus({preventScroll:true});
      }
    }
    return false;
  }
  function walkFrame(now){
    frameRequest=0;
    if(!segment||!field)return;
    if(now>=segment.start+segment.duration){
      const boundary=segment.start+segment.duration;
      segment=null;gait=(gait+1)%cycleTiles;
      if(s.battle){render();beep(580,true);return;}
      const site=T.near(s.pos,s.region),d=T.siteList(s.region)[site];
      if(d?.exit&&(!journey||journey.index===journey.path.length)){
        const endpoint=T.toGrid(d.at,s.region);
        if(endpoint.x===s.pos.x&&endpoint.y===s.pos.y){
          if(crossLand())return;
          clearWalk();paintPosition(s.pos,0);syncMap();return;
        }
      }
      syncMap();
      // Carry the sub-frame remainder across tiles, without replaying long background stalls.
      if(!nextStep(Math.max(boundary,now-32))){
        paintPosition(s.pos,0);return;
      }
    }
    const {from,to,start}=segment,t=Math.max(0,Math.min(1,(now-start)/segment.duration));
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
    if(!path.length&&site&&T.siteList(s.region)[site].exit){crossLand();return;}
    journey={path,index:0,site};
    startWalking();
  }
  function crossLand(){
    if(!J.walkPassage(s)){if(s.notice)toast(s.notice);return false;}
    closeMenu();save();render();beep(480,true);toast(s.notice);return true;
  }
  function meet(id){
    const person=T.neighbor(s.pos,s.region);
    if(!person||person.id!==id||!fieldOpen())return;
    const foot=[person.pos,person.petPos].find(p=>p&&Math.abs(p.x-s.pos.x)+Math.abs(p.y-s.pos.y)===1);
    if(foot)facing=foot.x>s.pos.x?"right":foot.x<s.pos.x?"left":foot.y>s.pos.y?"down":"up";
    if(person.site){openMenu("site");return;}
    modal(person.name,`<section class="road-chat"><div class="chat-pair"><img src="assets/color/npc-${person.actor}.webp" alt=""><img src="assets/color/${person.pet}.webp" alt="${species[person.pet].name}"></div><div><small>随行 · ${species[person.pet].name}</small><p>「${person.line}」</p></div></section>`);
    $("#dialog [data-do=close]").focus({preventScroll:true});
  }
  function visit(id){
    if(!fieldOpen())return;
    const path=T.approach(s.pos,id,s.region);
    if(!path){toast("从另一边靠近这里试试。");return;}
    heldDirections.clear();queuedDirection=null;
    journey={path,index:0,visitor:id};
    startWalking();
  }
  function inspect(){
    if(!fieldOpen())return;
    const person=T.neighbor(s.pos,s.region);
    if(person){meet(person.id);return;}
    const site=activeSite();
    if((site&&Object.hasOwn(T.siteList(s.region),site)&&!["grass","pool"].includes(site))||(s.rod&&atFishingBank())){
      openMenu("site");return;
    }
    interact(site);
  }
  function service(kind){return ["lab","hut"].includes(activeSite())||T.siteList(s.region)[activeSite()]?.service===kind;}
  function interact(k){
  stopWalk();if(!k||k!==activeSite()){toast("请先靠近可调查的地点。");return;}
  const d=T.siteList(s.region)[k];
  if(service("inn")){
    G.restore(s);s.notice="伙伴体力和招式次数已恢复，基础补给已备齐。";
    if(k==="hut"&&!s.rod){s.rod=true;s.notice="守潮人把潮线竿交给了 Levi。前往潮声浅滩，抛竿等待浮标下沉。";}
    beep(500,true);
  }else if(k==="beacon"&&!G.canBeacon(s)){s.notice=nextGoal();}
  else if(k==="dome"&&!G.canDuel(s)){s.notice=nextGoal();}
  else if(d?.gift)J.collect(s);
  else if(G.trainers[k]&&s.expedition.trained.includes(k))s.notice=G.trainers[k].name+"认出了你，笑着让开路：「下回靠岸，来讲讲旅途的事吧。」";
  else if(d&&!["camp","beacon","dome","inlet","nest","grass","pool"].includes(k)&&!G.trainers[k])s.notice=d.desc;
  else {G.encounter(s,["grass","pool","cover"].includes(k)?"wild":k);beep(570,true);}
  save();
  if(!s.battle&&menu.open&&menuPage==="site"){
    drawMenu("site");menu.querySelector(".site-feedback").textContent=s.notice;return;
  }
  closeMenu();render();if(!s.battle)toast(s.notice);
}
  const itemIcon=id=>`<img class="item-art" src="assets/color/item-${id}.webp" alt="">`;
  function bagContents(){
  const list=Object.entries(F.stock).map(([id,it])=>`<div class="dialog-row stocked">${itemIcon(id)}<div><b>${it.name} ×${s.supply[id]}</b><p class="note">${it.desc}</p></div>${["salves","tonic"].includes(id)&&!s.battle?btn("使用","useSelect",id,"",!s.supply[id]):""}</div>`).join("");
  const questItems=Object.entries(J.errands).filter(([id])=>s.expedition[id]===3).map(([,entry])=>entry.item);
  return `<div class="bag-ledger"><b>潮币 ${s.coins}</b><span>${s.badge?"潮光徽章":"徽章 0 / 2"}${s.secondBadge?" · 镜潮徽章":""}${s.rod?" · 潮线竿":""}${s.badge?" · 潮光招式卷":""}${s.secondBadge?" · 镜潮招式卷":""}</span></div>${questItems.length?`<p class="note">调查物品 · ${questItems.join("、")}</p>`:""}${list}<div class="dialog-foot tools">${btn("重新开始冒险","resetPrompt")}</div>`;
}
  function shop(){
  if(s.battle||!service("shop"))return;
  modal("沿岸补给所",`<div class="bag-ledger"><span>余额</span><b>${s.coins} 潮币</b></div>${Object.entries(F.stock).map(([id,it])=>`<div class="dialog-row stocked">${itemIcon(id)}<div><b>${it.name}</b><p class="note">${it.desc}</p><small>行囊 ×${s.supply[id]}</small></div>${btn(it.price+" 潮币","buy",id,"",s.coins<it.price)}</div>`).join("")}`);
}
  function inventoryTarget(id){
  modal("使用"+F.stock[id].name,s.party.map((m,i)=>`<div class="dialog-row"><div class="inline">${art(m.kind)}<div><b>${species[m.kind].name}</b><p class="note">HP ${m.hp}/${G.stat(m,0)}　${F.statusNames[m.status]||""}</p></div></div>${btn("使用","fieldUse",id+","+i,"",!m.hp||(id==="salves"?m.hp===G.stat(m,0):!m.status))}</div>`).join(""));
}
  function equipment(i){
  const m=s.party[i];modal("更换携带物",`<p class="note">${species[m.kind].name}当前携带${F.stock[m.held]?.name||"空"}。</p>${Object.entries(F.stock).filter(([,it])=>it.hold).map(([id,it])=>`<div class="dialog-row stocked">${itemIcon(id)}<div><b>${it.name} ×${s.supply[id]}</b><p class="note">${it.desc}</p></div>${btn("携带","equip",i+","+id,"",m.held===id||!s.supply[id])}</div>`).join("")}<div class="dialog-foot">${btn("卸下携带物","equip",i+",","",!m.held)}</div>`);
}
  function movePage(m,index){
    const desk=index!==null&&!s.battle&&service("inn"), plan=F.studyPlan(m,index===null?null:s);
    const groups=["升级","进化","师授","秘卷","同伴","回忆"];
    return groups.map(group=>{
      const entries=plan.filter(e=>e.source===group);if(!entries.length)return "";
      return `<section class="study-group"><h3>${group}</h3>${entries.map(e=>{
        const equipped=m.skills.some(sk=>sk.id===e.id);
        return `<div class="dialog-row"><div><small>${e.hint}</small><b>${moves[e.id][0]}</b><p class="note">${moveInfo(e.id)}</p></div>${desk?btn(equipped?"已装备":e.ready?"学习":"未解锁","chooseSlot",index+","+e.id,"",equipped||!e.ready):""}</div>`;
      }).join("")}</section>`;
    }).join("");
  }
  function farDossier(kind){
    const d=species[kind],m={kind,level:1,skills:[]},[ability,trait]=F.abilities[F.ability(m)];
    const views=[[art(kind,"",d.name+"正面"),"正面"],[art(kind,"rear-art",d.name+"背面"),"背面"]];
    modal(d.name+" · 灵兽档案",`<div class="folio-views">${views.map(([img,n])=>`<figure>${img}<figcaption>${n}</figcaption></figure>`).join("")}</div>
      <p>${d.desc}</p><p class="note">${d.source} · ${d.motif}　${d.habitat}</p>
      <p><b>${d.role}</b>　${elType(kind)}</p><p class="note">${C.lineage(kind)}</p>
      <dl class="folio-stats">${F.labels.map((n,i)=>`<div><dt>${n}</dt><dd>${d.stats[i]}</dd></div>`).join("")}</dl>
      <p><b>${ability}</b> · ${trait}</p>${movePage(m,null)}`);
  }
  function dojo(i){
    const m=s.party[i];modal(species[m.kind].name+" · 招式谱",movePage(m,i));
  }
  function offerNext(index){
    if(s.battle||presenting)return;
    const i=Number.isInteger(index)&&s.party[index]?.offers?.length?index:s.party.findIndex(m=>m.offers?.length);if(i<0)return;
    const m=s.party[i],id=m.offers[0];
    modal("领悟新招",`<p><b>${species[m.kind].name}</b> 可以学习「${moves[id][0]}」。</p><p class="note">${moveInfo(id)}</p>${m.skills.map((sk,slot)=>`<div class="dialog-row"><b>${moves[sk.id][0]}</b>${btn("替换","offer",[i,slot].join(","))}</div>`).join("")}<div class="dialog-foot">${btn("保留原招 · 稍后回忆","offer",i+",-1")}</div>`);
  }
  function moveInfo(id){
  const [n,t,p,acc,pp,category,effect]=moves[id];
  const effects={heal:"恢复最大体力的一半",cleanse:"解除自身异常",haste:"提高一级速度",ward:"提高一级特防",keen:"要害概率提高至 25%",punish:"对异常目标威力提高一半",comeback:"半血以下威力提高一半",rainbound:"降雨时威力提高一半",sunbound:"烈日时威力提高一半",twice:"连续攻击两次，各自判定命中",breach:"忽略目标防守能力等级",recoil:"承受最大体力六分之一的反冲",protect:"先制防护，连续使用成功率递减",spread:"双打命中两位对手，双目标时每位承受 75% 伤害",rain:"五回合降雨，增强水、削弱火",sun:"五回合烈日，增强火、削弱水",sleep:"使目标睡眠 1～3 次行动",focus:"提高一级特攻",guard:"提高一级防御",weaken:"降低目标一级攻击",poison:"有机会使对手中毒",burn:"有机会灼伤",para:"有机会麻痹",quick:"先制出手",drain:"回复造成伤害的一半",slow:"有机会降低速度"};
  return [types[t][0],p?(category==="physical"?"物理":"特殊")+" "+p:"变化","命中 "+acc+"%","PP "+pp,effects[effect]].filter(Boolean).join(" · ");
}
  function detail(i){
  const m=s.party[i],d=species[m.kind],[ability,explain]=F.abilities[F.ability(m)];
  const line=C.familyOf[m.kind],stage=line.indexOf(m.kind);
  const replayButtons=line.slice(0,stage).map((from,step)=>btn(stage===1?"重看进化":"重看第"+(step===0?"一":"二")+"次进化","replayEvolution",i+","+from)).join("");
  const canEvolve=C.evolutions[m.kind]&&m.level>=C.evolutionLevels[m.kind]&&!s.battle;
  const manage=!s.battle,atDesk=service("inn");
  modal(d.name,`<div class="dossier"><div class="portrait">${art(m.kind)}</div><div>${elType(m.kind)}<h3>Lv.${m.level}　${d.role}</h3>${hp(m)}<small>EXP ${m.xp} / ${G.threshold(m.level)}</small></div></div>
  <div class="skill-notes"><p><b>性格</b> ${F.disposition(m)}</p><p><b>特性</b> ${ability} · ${explain}</p><p><b>携带</b> ${F.stock[m.held]?.name||"空"}</p></div>
  <table class="stat-table"><thead><tr><th>能力</th><th>数值</th><th>个体值</th><th>努力值</th></tr></thead><tbody>${F.labels.map((n,j)=>`<tr><th>${n}</th><td>${G.stat(m,j)}</td><td>${m.iv[j]}</td><td>${m.ev[j]}</td></tr>`).join("")}</tbody></table>
  <p class="note">累计努力值 ${m.ev.reduce((a,b)=>a+b,0)} / 510</p><p class="note">第 ${stage+1} / ${line.length} 阶段　·　${C.lineage(m.kind)}</p>
  ${m.skills.map(sk=>`<div class="dialog-row"><div><b>${moves[sk.id][0]}</b><p class="note">${moveInfo(sk.id)}</p></div><small>PP ${sk.pp}</small></div>`).join("")}
  <div class="dialog-foot tools">${btn("更换携带物","equipment",i,"",!manage)}${btn("查看招式谱","dojo",i)}${m.offers?.length&&manage?btn("领悟新招","pendingSkills",i):""}${canEvolve?btn("现在进化","evolvePartner",i,"primary"):""}${replayButtons}${btn("返回","close")}</div>${!atDesk?"<p class='note dialog-foot'>在研究站、潮汐小屋或城镇客栈可以整备招式。</p>":""}`);
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
      case "visit":visit(arg);break;
      case "travel":if(s.battle)break;closeMenu();go(T.toGrid(T.siteList(s.region)[arg].at,s.region),arg);break;
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
      case "buy":if(service("shop")&&F.buy(s,arg)){save();render();shop();beep(545);toast("已购入"+F.stock[arg].name);}break;
      case "equipment":if(!s.battle)equipment(Number(arg));break;
      case "equip":{const [i,id]=arg.split(",");if(F.equip(s,Number(i),id)){save();render();detail(Number(i));}break;}
      case "useSelect":if(!s.battle)inventoryTarget(arg);break;
      case "fieldUse":{const [id,i]=arg.split(",");if(!s.battle&&F.use(s,id,Number(i))){save();closeDialog();render();openMenu("bag");toast("已使用"+F.stock[id].name);}break;}
      case "dojo":dojo(Number(arg));break;
      case "pendingSkills":offerNext(Number(arg));break;
      case "offer":{const [i,slot]=arg.split(",").map(Number);if(G.resolveOffer(s,i,slot)){save();closeDialog();offerNext();}break;}
      case "specPath":if(species[arg]?.reserve)farDossier(arg);break;
      case "dexBook":dexBook=arg==="far"?"far":"field";drawMenu("dex");break;
      case "chooseSlot":{
        const [i,id]=arg.split(","),m=s.party[i];
        if(!s.battle&&service("inn")){
          if(m.skills.length<4){if(F.teach(s,Number(i),id,m.skills.length)){save();render();detail(Number(i));}}
          else modal("选择替换的招式","<p class='note'>新招式「"+moves[id][0]+"」将占用一个招式栏位。</p>"+m.skills.map((sk,j)=>'<div class="dialog-row"><b>'+moves[sk.id][0]+'</b>'+btn("替换","learn",[i,id,j].join(","))+'</div>').join(""));
        }break;
      }
      case "learn":{const [i,id,j]=arg.split(",");if(service("inn")&&F.teach(s,Number(i),id,Number(j))){save();render();detail(Number(i));}break;}
      case "walkPassage":crossLand();break;
      case "errand":
        if(J.doErrand(s,arg)){
          save();openMenu("site");menu.querySelector(".site-feedback").textContent=s.notice;beep(520);
        }break;
      case "cross":if(J.crossing(s,arg)){closeMenu();save();render();beep(480,true);toast(s.notice);}break;
      case "chapterAction":
        if(J.investigate(s,arg)){
          save();$(".field-sightings").innerHTML=fieldSightings();openMenu("site");menu.querySelector(".site-feedback").textContent=s.notice;
          if(arg==="long"||arg==="short")soundGong(arg==="long");else beep(540);
        }break;
      case "sail":if(G.sail(s)){closeMenu();save();render();beep(480,true);toast(s.notice);}break;
      case "fish":cast();break;
      case "hook":if(fishReady&&atFishingBank()&&G.encounter(s,"fish")){fishReady=false;closeDialog();closeMenu();save();render();}break;
      case "close":closeDialog();break;
      case "detail":detail(Number(arg));break;
      case "evolvePartner":{
        const i=Number(arg);
        if(G.evolvePartner(s,i)){save();closeDialog();render();showEvolutions().then(()=>s.party[i].offers?.length?offerNext():detail(i));}
        break;
      }
      case "replayEvolution":{
        const [index,from]=arg.split(","),i=Number(index),kind=s.party[i]?.kind,line=C.familyOf[kind];
        if(line?.slice(0,line.indexOf(kind)).includes(from)){closeDialog();showEvolutions(from).then(()=>detail(i));}
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
      case "leave":if(G.leaveBattle(s)){save();render();offerNext();}break;
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
    const map=e.target.closest("#map");if(map){const r=map.getBoundingClientRect();go(T.toGrid([(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100],s.region));}
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
    if(e.target.id==="far-area"){farArea=Number(e.target.value);drawMenu("dex");return;}
    if(!e.target.id?.startsWith("duo-move-"))return;
    const j=e.target.id.slice(9),target=$("#duo-target-"+j),value=e.target.value;
    if(!target)return;
    const fixedTarget=value.startsWith("swap-")||["salves","tonic"].includes(value)||["spread","rain","sun","protect","guard","focus","heal","cleanse","haste","ward"].includes(moves[value]?.[6]);
    target.disabled=fixedTarget;
    target.setAttribute("title",fixedTarget?"此指令自动确定作用对象":"选择对手");
  });
  document.addEventListener("keydown",e=>{
    setRunning(e.shiftKey);
    if($("#dialog").open&&$("#dialog .road-chat")&&["e","E","Enter"," "].includes(e.key)){
      e.preventDefault();if(!e.repeat)closeDialog();return;
    }
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
  document.addEventListener("keyup",e=>{setRunning(e.shiftKey);releaseDirection(e.key.toLowerCase());});
  function releaseControls(){setRunning(false);stopWalk();}
  window.addEventListener("blur",releaseControls);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)releaseControls();syncMusic();});
  if(loaded)save();render();if(saveError)toast("本地存档暂不可读，当前会话仍可游玩。");
  showEvolutions().then(offerNext);
}
runMistcape();
