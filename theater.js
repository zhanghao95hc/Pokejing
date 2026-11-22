"use strict";

const MistTheater=(()=>{
  const folder="assets/cinema/",catalog=MistCatalog;
  const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
  const selfMoves=new Set(["shelter","focus","veil"]);
  const fieldMoves=new Set(["rain","sun"]);
  const contact=new Set(["bump","dash","strain","brine"]);
  const heavy=new Set(["flare","ridge","gale","surge","swell"]);
  const rising=new Set(["ridge","foam","lull","dust"]);
  const imageCache=new Map();
  function load(url){
    if(!imageCache.has(url)){
      const img=new Image();img.src=url;
      imageCache.set(url,img.decode().catch(error=>{imageCache.delete(url);throw error;}));
    }
    return imageCache.get(url);
  }
  function node(tag,cls,parent){
    const element=document.createElement(tag);element.className=cls;parent.append(element);return element;
  }
  async function loadForTurn(url,signal){
    if(signal.aborted)return;
    let stop;
    const cancelled=new Promise(resolve=>{stop=resolve;});
    signal.addEventListener("abort",stop,{once:true});
    try{await Promise.race([load(url),cancelled]);}
    finally{signal.removeEventListener("abort",stop);}
  }
  function timeline(ms,signal,draw){
    return new Promise(resolve=>{
      let frame=0;
      function end(){cancelAnimationFrame(frame);signal.removeEventListener("abort",end);resolve();}
      if(signal.aborted){end();return;}
      signal.addEventListener("abort",end,{once:true});
      const start=performance.now();
      function tick(now){
        const t=Math.min(1,(now-start)/ms);
        draw(t);
        if(t===1)end();else frame=requestAnimationFrame(tick);
      }
      tick(start);
    });
  }
  function slots(arena){
    const result={};
    if(arena.classList.contains("duo-arena")){
      for(const side of arena.querySelectorAll(".pair-side")){
        const team=side.classList.contains("rival-side")?"foe":"ally";
        side.querySelectorAll(".pair-fighter").forEach((el,i)=>{
          result[team+i]={img:el.querySelector("img"),meter:el.querySelector(".duo-meter")};
        });
      }
    }else{
      result.ally0={img:arena.querySelector(".ally"),meter:arena.querySelector(".own")};
      result.foe0={img:arena.querySelector(".foe"),meter:arena.querySelector(".enemy")};
    }
    return result;
  }
  function showUnit(seats,unit){
    const {img,meter}=seats[unit.key],name=catalog.species[unit.kind].name,ally=unit.key.startsWith("ally");
    const src="assets/color/"+unit.kind+(ally?"-back":"")+".webp";
    if(img.getAttribute("src")!==src){
      img.src=src;img.alt=name;
      const tag=meter.querySelector(".meter-tags");
      if(tag)tag.textContent=catalog.affinity(unit.kind).map(k=>catalog.types[k][0]).join(" / ")+" · "+FieldRules.abilities[FieldRules.ability(unit)][0];
    }
    meter.querySelector("strong,b").textContent=name;
    meter.querySelector("small").textContent=(meter.classList.contains("duo-meter")?(ally?" 我方 · ":" 对手 · "):"")+"Lv."+unit.level;
    const bar=meter.querySelector(".hp"),value=Math.round(100*unit.hp/unit.max);
    bar.setAttribute("aria-valuenow",unit.hp);bar.setAttribute("aria-valuemax",unit.max);
    bar.firstElementChild.style.width=value+"%";bar.firstElementChild.className=value<=22?"low":value<=45?"warn":"";
    meter.querySelector(".hp-txt").textContent="HP "+unit.hp+" / "+unit.max+(unit.status?"　"+FieldRules.statusNames[unit.status]:"");
    img.closest(".pair-fighter")?.classList.toggle("fainted",unit.hp===0);
  }
  function center(img,arena){
    const r=img.getBoundingClientRect(),a=arena.getBoundingClientRect();
    const scale=Math.min(r.width/(img.naturalWidth||r.width),r.height/(img.naturalHeight||r.height));
    const h=Math.min(r.height,(img.naturalHeight||r.height)*scale);
    const bottom=getComputedStyle(img).objectPosition.endsWith("100%");
    return {x:r.left-a.left+r.width/2,y:r.top-a.top+(bottom?r.height-h/2:r.height/2),h};
  }
  const clamp=n=>Math.min(1,Math.max(0,n));
  function cel(el,frame){el.style.backgroundPositionX=(frame*100/3)+"%";}
  function sprite(parent,url){
    const el=node("i","painted-fx",parent);el.style.backgroundImage='url("'+url+'")';return el;
  }
  async function playMove(arena,seats,event,caption,signal){
    const move=event.move,url=folder+move+".webp",still=reduced();
    const self=selfMoves.has(move),field=fieldMoves.has(move),melee=contact.has(move);
    const actor=seats[event.source.key].img;
    showUnit(seats,event.source);event.hits.forEach(hit=>showUnit(seats,hit.before));
    caption.textContent=catalog.species[event.source.kind].name+" · "+catalog.moves[move][0];
    await loadForTurn(url,signal);
    if(signal.aborted)return;
    const layer=node("div","fx-layer",arena);
    layer.dataset.move=move;layer.dataset.actor=event.source.key;
    const hits=event.hits.map(hit=>({hit,el:sprite(layer,url),img:seats[hit.before.key].img}));
    const reaction=[],start=center(actor,arena);
    const aim=center(hits[0].img,arena),dir=aim.x>=start.x?1:-1;
    let landed=false;
    try{
      if(!still)reaction.push(actor.animate([
        {translate:"0 0"},{translate:(-dir*4)+"px 2px",offset:.22},
        {translate:(dir*(melee?22:6))+"px -4px",offset:.5},{translate:"0 0"}
      ],{duration:510,easing:"ease-in-out"}));
      await timeline(still?240:heavy.has(move)?900:740,signal,t=>{
        if(!landed&&t>=(still?.25:.57)){
          landed=true;showUnit(seats,event.after);
          event.hits.forEach(hit=>{
            showUnit(seats,hit.after);
            if(!still&&hit.outcome==="hit"){
              reaction.push(seats[hit.before.key].img.animate([{translate:"0 0"},{translate:(dir*7)+"px -2px"},{translate:"0 0"}],{duration:180}));
            }
          });
          const cues={miss:"落空",blocked:"被护幕挡下",absorb:"电能被吸收",failed:"护幕未能展开"};
          const note=event.hits.map(h=>cues[h.outcome]).filter(Boolean).join("、");
          if(note)caption.textContent+=" · "+note;
          if(field){
            arena.classList.remove("w-clear","w-rain","w-sun");arena.classList.add("w-"+move);
            const weather=arena.querySelector(".weather-tag");
            if(weather){weather.className="weather-tag "+move;weather.textContent=FieldRules.weatherNames[move]+" · 5 回合";}
          }
        }
        for(const {hit,el,img} of hits){
          const target=self?start:center(img,arena);
          const width=arena.clientWidth,height=arena.clientHeight;
          const power=heavy.has(move)?1.45:1.12;
          const size=field?Math.min(width*.6,height*.85):Math.max(54,Math.min(width*.34,Math.max(start.h,target.h)*power));
          const travel=still?1:clamp((t-.13)/.46);
          let x=start.x+(target.x-start.x)*travel,y=start.y+(target.y-start.y)*travel;
          if(!self&&!field&&!still)y-=Math.sin(travel*Math.PI)*Math.min(25,height*.085);
          if(melee&&t>.32){x=target.x;y=target.y;}
          if(rising.has(move)){x=target.x;y=target.y+size*(.35-.35*travel);}
          if(field){x=width*.51;y=height*.35;}
          if(hit.outcome==="miss"){x+=dir*size*.52*travel;y-=size*.42*travel;}
          if(hit.outcome==="blocked"){x-=dir*size*.34*travel;}
          if(move==="sap"&&t>.70){const back=clamp((t-.70)/.30);x+=(start.x-x)*back;y+=(start.y-y)*back;}
          el.style.left=x+"px";el.style.top=y+"px";el.style.width=size+"px";
          const angle=!melee&&!self&&!field&&!rising.has(move)?Math.max(-20,Math.min(20,Math.atan2(target.y-start.y,Math.abs(target.x-start.x))*180/Math.PI))*dir:0;
          el.style.transform="translate(-50%,-50%) rotate("+angle+"deg) scaleX("+(dir<0&&!self&&!field?-1:1)+")";
          el.style.opacity=still?1:Math.min(clamp(t/.08),clamp((1-t)/.14));
          cel(el,still?2:t<.23?0:t<.54?1:t<.81?2:3);
        }
      });
    }finally{layer.remove();reaction.forEach(a=>a.cancel());}
  }
  async function playBell(arena,seats,event,caption,signal,ring){
    const ally=seats.ally0.img,foe=seats[event.target.key].img;
    const bellArt="assets/color/item-bells.webp",ribbonArt=folder+"bond-ribbons.webp";
    const name=catalog.species[event.target.kind].name,still=reduced();
    caption.textContent="Levi 投出了结缘铃";
    await Promise.all([bellArt,ribbonArt,ally.src,foe.src].map(url=>loadForTurn(url,signal)));
    if(signal.aborted)return;

    const layer=node("div","fx-layer bond-layer",arena);
    layer.setAttribute("aria-hidden","true");
    const spirit=node("img","bond-spirit",layer),bell=node("img","bond-bell",layer);
    const silk=node("i","bond-ribbon",layer);
    spirit.src=foe.src;spirit.alt="";bell.src=bellArt;bell.alt="";
    silk.style.backgroundImage='url("'+ribbonArt+'")';
    let origin,target,mouth,floor,bellSize,silkSize;
    function measure(){
      const a=center(ally,arena),w=arena.clientWidth,h=arena.clientHeight;
      target=center(foe,arena);
      bellSize=Math.max(33,Math.min(w*.15,h*.2,target.h*.48));
      silkSize=Math.max(bellSize*1.65,Math.min(w*.4,target.h*1.12));
      origin={x:a.x*.72,y:Math.min(h-bellSize*.53,a.y+a.h*.36)};
      mouth={x:target.x,y:Math.max(bellSize*.65,target.y-target.h*.22)};
      floor={x:target.x,y:Math.min(h-bellSize*.65,target.y+target.h*.40)};
      spirit.style.height=target.h+"px";bell.style.width=bellSize+"px";silk.style.width=silkSize+"px";
    }
    function pose(el,x,y,scale=1,angle=0,opacity=1){
      el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) rotate(${angle}deg) scale(${scale})`;
      el.style.opacity=opacity;
    }
    function ribbon(row,t,x,y,scale=1,opacity=1){
      const frame=Math.min(3,Math.floor(t*4));
      silk.style.backgroundPosition=(frame*100/3)+"% "+(row*50)+"%";
      pose(silk,x,y,scale,0,opacity);
    }
    async function phase(id,label,ms,draw){
      if(signal.aborted)return;
      layer.dataset.phase=id;caption.textContent=label;
      await timeline(ms,signal,draw);
    }
    const mix=(a,b,t)=>a+(b-a)*t;
    const resize=new ResizeObserver(measure);
    try{
      measure();resize.observe(arena);foe.classList.add("bond-hidden");
      await phase("throw","Levi 投出了结缘铃",still?160:460,t=>{
        const p=still?1:t;
        pose(spirit,target.x,target.y);
        pose(bell,mix(origin.x,mouth.x,p),mix(origin.y,mouth.y,p)-Math.sin(p*Math.PI)*arena.clientHeight*.23,1,still?0:mix(-65,8,p));
        silk.style.opacity=0;
      });
      await phase("bind","结缘丝绕住了"+name,still?180:540,t=>{
        const draw=clamp((t-.12)/.65),drop=clamp((t-.68)/.32);
        pose(spirit,target.x,mix(target.y,mouth.y,draw),still?1:1-draw*.9,0,1-draw);
        pose(bell,mouth.x,still?floor.y:mix(mouth.y,floor.y,drop*drop),1,still?0:8*(1-t));
        ribbon(0,still?.7:t,target.x,mix(target.y,mouth.y,draw),1,Math.min(1,(1-t)*5));
      });
      for(let i=0;i<event.shakes&&!signal.aborted;i++){
        ring?.([523,659,784][i]);
        await phase("ring","结缘铃 · 第"+["一","二","三"][i]+"声",still?125:350,t=>{
          silk.style.opacity=0;
          const sway=still?0:Math.sin(t*Math.PI*2)*(1-t);
          pose(bell,floor.x+sway*bellSize*.08,floor.y,1,sway*32);
        });
      }
      if(signal.aborted)return;
      if(event.shakes===3){
        ring?.(988,true);
        await phase("bonded","结缘成功 · "+name,still?550:1050,t=>{
          const back=still?0:clamp((t-.70)/.30);
          const x=mix(floor.x,origin.x,back),y=mix(floor.y,origin.y,back)-Math.sin(back*Math.PI)*arena.clientHeight*.12;
          pose(bell,x,y,1-back*.38,back*-20,1-back);
          ribbon(1,still?1:clamp(t/.66),x,y-bellSize*.62,.83,1-back);
        });
      }else{
        ring?.(292);
        await phase("escaped",name+"挣脱了结缘丝",still?500:790,t=>{
          const spring=still?1:1-(1-clamp(t/.58))**3;
          const bounce=still?0:Math.sin(Math.PI*spring);
          pose(spirit,target.x,mix(floor.y,target.y,spring)-bounce*target.h*.20,.16+.84*spring+bounce*.18,0,spring);
          pose(bell,floor.x+(still?0:t*bellSize*.95),floor.y+(still?0:(t*t-.35*t)*bellSize),1-.18*t,still?0:65*t,1-clamp(t/.72));
          ribbon(2,still?.6:t,target.x,target.y,.84+.16*spring,Math.min(1,(1-t)*4));
        });
      }
    }finally{resize.disconnect();foe.classList.remove("bond-hidden");layer.remove();}
  }
  async function turn(arena,events,ring){
    if(!arena||!events.length)return;
    const controller=new AbortController(),seats=slots(arena);
    const title=arena.closest(".battle").querySelector(".page-title"),caption=title.querySelector("p");
    caption.setAttribute("aria-live","polite");
    const skip=node("button","btn fx-skip",title);
    skip.type="button";skip.textContent=events[0].type==="bell"?"略过演出":"略过招式";
    const stop=()=>controller.abort();
    const hide=()=>{if(document.hidden)stop();};
    skip.addEventListener("click",stop);
    document.addEventListener("visibilitychange",hide);
    title.classList.add("showing-move");
    const desk=arena.parentElement.querySelector(".battle-desk");desk.inert=true;
    try{
      for(const event of events){
        if(controller.signal.aborted)break;
        if(event.type==="bell")await playBell(arena,seats,event,caption,controller.signal,ring);
        else await playMove(arena,seats,event,caption,controller.signal);
      }
    }finally{stop();document.removeEventListener("visibilitychange",hide);desk.inert=false;title.classList.remove("showing-move");skip.remove();}
  }
  const growthCaptions={
      moss:["竹角抽枝","青鳞渐生","松冠舒展"],ember:["尾焰渐盛","双尾分岔","三尾舒展"],tide:["荷鳍舒张","鲤须渐长","螭爪初成"],twig:["雏羽换色","翼纹舒展","铜尾分岔"],fry:["鳍缘抽长","金翼展开","长须迎潮"],
      grove:["松冠抽梢","金芽初结","长鬃聚岚"],
      pyre:["尾焰分束","霞尾成扇","九焰齐明"],
      sail:["荷瓣展翼","金须垂浪","龙翼舒张"],
      wind:["芦羽初生","颈羽抽长","笙冠成形"],
      reedcrane:["翼尖染金","云翎垂落","长翮舒展"],
      stone:["砚纹叠起","松苔生根","墨池加深"],
      inkback:["石脊拔高","碑纹浮出","青碑立定"],
      spark:["铜纹成对","颈毛分束","双铎垂落"],
      bellbadger:["肩鬃蓬起","雷纹相接","铜铎成列"],
      crab:["瓦缘挑起","檐角弯成","双螯展宽"],
      eavecrab:["重瓦相扣","飞檐叠起","阁顶结金"],
      moth:["桂纹生脉","月弧初弯","桂花抱翅"],
      cassiamoth:["月斑盈满","银翅拖长","双翼映月"],
      snail:["壳脊加厚","青铜分层","三音初和"],
      chimingconch:["钟脊高升","潮珠聚光","洪钟定音"],
      raven:["铜翎舒张","玄羽覆肩","衔枝负石"],
      glider:["金鳍舒展","鳞光点星","双翼迎潮"],
      ape:["耳缘染翠","肩臂伸长","白耳听泉"],
      echoape:["石纹覆臂","松鬃披肩","双掌托山"],
      tuft:["尾绒聚香","耳畔含苞","桃瓣初绽"],
      plumcat:["桃花舒瓣","春鬃围颈","长尾成帚"],
      kui:["铜纹成环","腹鼓初张","双环共振"],
      rainkui:["长鬃化云","雷纹贯腹","苍鼓应霆"],
      otter:["前爪捧珠","赤胸显纹","珠光照水"],
      pearlward:["玉纹沿肩","波尾舒卷","长身分潮"]
  };
  async function evolution(from){
    const to=catalog.evolutions[from],scene=document.createElement("dialog");
    scene.className="evolution-scene";scene.setAttribute("aria-label","灵兽进化");document.body.append(scene);
    scene.innerHTML='<div class="evo-paint"><div class="evo-portraits"></div></div><div class="evo-caption"><div><small>灵兽进化</small><h2 aria-live="polite"></h2></div><button class="btn" type="button">跳过演出</button></div>';
    const paint=scene.querySelector(".evo-portraits"),title=scene.querySelector("h2"),button=scene.querySelector("button"),label=scene.querySelector("small");

    const names=k=>catalog.species[k].name,young="assets/color/"+from+".webp",adult="assets/color/"+to+".webp",strip=folder+"evo-"+from+".webp";
    const layers=[young,strip,strip,strip,adult].map((url,i)=>{
      const layer=node("div","evo-form",paint);
      layer.style.backgroundImage='url("'+url+'")';
      if(i>0&&i<4){layer.classList.add("inbetween");layer.style.backgroundPositionX=((i-1)*50)+"%";}
      return layer;
    });
    title.textContent=names(from);layers[0].style.opacity=1;
    const controller=new AbortController();
    let finished=false,resolveContinue;
    const confirmed=new Promise(resolve=>{resolveContinue=resolve;});
    const click=()=>{if(finished)resolveContinue();else controller.abort();};
    button.onclick=click;
    scene.oncancel=e=>{e.preventDefault();click();};
    try{
      scene.showModal();
      await Promise.all([load(young),load(adult),load(strip),load(folder+"sanctum.webp")]);
      if(!reduced())await timeline(3650,controller.signal,t=>{
        const progress=clamp((t-.07)/.86)*4,phase=Math.floor(progress),mix=clamp((progress-phase-.55)/.45);
        layers.forEach((el,i)=>{
          el.style.opacity=i===phase?1-mix:i===phase+1?mix:0;
          el.style.transform="translateY("+(-Math.sin(t*Math.PI)*3)+"%) scale("+(.84+t*.16)+")";
        });
        if(paint.dataset.phase!==String(phase)){
          paint.dataset.phase=phase;label.textContent=phase>0&&phase<4?growthCaptions[from][phase-1]:"灵兽进化";
        }
        if(phase===4)title.textContent=names(to);
      });
      finished=true;scene.dataset.complete="true";paint.dataset.phase=4;
      layers.forEach((el,i)=>{el.style.opacity=i===4?1:0;el.style.transform="none";});
      label.textContent=catalog.familyOf[from][2]===to?"终阶 · 进化完成":"中阶 · 进化完成";title.textContent=names(from)+"进化为"+names(to);button.textContent="继续";
      await confirmed;
    }finally{controller.abort();scene.close();scene.remove();}
  }
  return {turn,evolution};
})();
