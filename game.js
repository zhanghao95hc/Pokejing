"use strict";

const MistGame = (() => {
  const C=typeof MistCatalog!=="undefined"?MistCatalog:require("./catalog.js");
  const T=typeof MistTrail!=="undefined"?MistTrail:require("./trail.js");
  const F=typeof FieldRules!=="undefined"?FieldRules:require("./field-rules.js");
  const chapters=typeof MistChapters!=="undefined"?MistChapters:require("./chapters.js");
  const {species,moves,matchup}=C;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const name=m=>species[m.kind].name;
  const threshold=level=>18+level*4;
  const stat=F.stat;
  function makeMon(kind,level,rng=Math.random) {
    const mon={kind,level,iv:Array.from({length:6},()=>Math.floor(rng()*32)),nature:Math.floor(rng()*25),xp:0,hp:0,status:"",skills:[]};
    F.ensureMon(mon);
    mon.skills=species[kind].moves.slice(0,level>=7?4:3).map(id=>({id,pp:moves[id][4]}));
    mon.hp=stat(mon,0);
    return mon;
  }
  function fresh() {
    return {version:2,starter:null,party:[],box:[],seen:[],caught:[],supply:{bells:6,salves:3,...F.restock()},coins:70,region:"coast",chapters:chapters.fresh(),rod:false,secondBadge:false,pos:{...T.spawn},camp:false,badge:false,steps:0,battle:null,notice:"",sound:false,grace:4};
  }
  function record(list,kind) {if(!list.includes(kind)) list.push(kind);}
  function start(s,kind,rng=Math.random) {
    if(s.starter || !C.starters.includes(kind)) return false;
    s.starter=kind;s.party.push(makeMon(kind,5,rng));s.seen.push(kind);s.caught.push(kind);
    s.notice="青禾在北边的练习场等你。顺路去风铃草甸，试着结识一位野生伙伴。";
    return true;
  }
  function restore(s) {
    for(const mon of s.party) {mon.hp=stat(mon,0);mon.status="";for(const sk of mon.skills) sk.pp=moves[sk.id][4];}
    s.supply.bells=Math.max(s.supply.bells,6);s.supply.salves=Math.max(s.supply.salves,3);
  }
  function evolveReady(mon,lines,transitions){
    while(C.evolutions[mon.kind]&&mon.level>=C.evolutionLevels[mon.kind]){
      const from=mon.kind,oldMax=stat(mon,0);
      mon.kind=C.evolutions[from];
      if(mon.hp>0)mon.hp+=stat(mon,0)-oldMax;
      transitions.push(from);
      lines.push(species[from].name+"进化为"+name(mon)+"！");
    }
  }
  function gain(mon,amount,lines){
    const transitions=[];
    evolveReady(mon,lines,transitions);
    if(mon.level>=50)return transitions;
    mon.xp+=amount;
    lines.push(name(mon)+"获得 "+amount+" 点经验。");
    while(mon.xp>=threshold(mon.level)&&mon.level<50){
      const oldMax=stat(mon,0);
      mon.xp-=threshold(mon.level);mon.level++;
      if(mon.hp>0)mon.hp+=stat(mon,0)-oldMax;
      lines.push(name(mon)+"升至 Lv."+mon.level+"！");
      evolveReady(mon,lines,transitions);
      if(mon.level===7){
        const id=species[mon.kind].moves[3];
        if(!mon.skills.some(k=>k.id===id)&&mon.skills.length<4){mon.skills.push({id,pp:moves[id][4]});lines.push("领悟了「"+moves[id][0]+"」。");}
        else lines.push("可在整备招式中选择「"+moves[id][0]+"」。");
      }
    }
    if(mon.level===50)mon.xp=0;
    return transitions;
  }
  function recordGrowth(s,mon,transitions){
    for(const kind of [...transitions,mon.kind]){
      record(s.caught,kind);record(s.seen,kind);
    }
    if(transitions.length)(s.pendingEvolutions??=[]).push(...transitions);
  }
  function awardExperience(s,index,amount){
    const mon=s.party[index];
    const transitions=gain(mon,amount,s.battle.lines);
    recordGrowth(s,mon,transitions);
  }
  function evolvePartner(s,index){
    const mon=s.party[index];
    if(s.battle||!mon)return false;
    const transitions=[],lines=[];
    evolveReady(mon,lines,transitions);
    if(!transitions.length)return false;
    recordGrowth(s,mon,transitions);
    s.notice=lines.join(" ");return true;
  }
  const stages=()=>({attack:0,guard:0,speed:0,special:0});
  const localKinds=["crab","moth","snail","fry","kui","otter"];
  function sail(s){
    if(!s.badge||s.battle)return false;
    const site=T.near(s.pos,s.region);
    if(s.region==="cove"&&site==="dock"){s.region="coast";s.pos={...T.spawn};}
    else if(s.region==="coast"&&["lab","beacon"].includes(site)){s.region="cove";s.pos=T.toGrid(T.coveSites.dock.at);}
    else return false;
    s.grace=5;s.notice=s.region==="cove"?"盐镜湾到了。先去渔舍借一根钓竿，或到浅滩寻找本地伙伴。":"渡船回到了雾岬研究站。";return true;
  }
  function canBeacon(s){return s.badge||(s.camp&&s.chapters.ridge===2);}
  function hasLocal(s){return s.caught.some(k=>localKinds.includes(C.familyOf[k]?.[0]));}
  function canDuel(s){return s.badge&&s.region==="cove"&&(s.secondBadge||s.chapters.marsh===2&&hasLocal(s));}
  function wildHabitat(s,fish,track){
    if(track==="nest")return ["twig","tuft","tuft"];
    if(track==="inlet")return ["fry","otter","otter"];
    if(s.region==="ridge")return s.pos.x>=34?["ape","ape","twig","tuft"]:["twig","twig","ape","tuft"];
    if(s.region==="marsh")return s.pos.x>=37?["kui","kui","fry","otter"]:["fry","fry","otter","kui"];
    if(s.region==="cove")return fish?["snail","snail","tide","crab"]:["crab","moth","moth","wind"];
    const coast=["wind","stone","spark"];return s.badge?[...coast,...C.starters]:coast;
  }
  function encounter(s,mode,rng=Math.random) {
    const track=mode==="nest"||mode==="inlet"?mode:null;
    if(track){if(T.near(s.pos,s.region)!==track)return false;mode="wild";}
    if(!s.starter||s.battle||!["wild","fish","camp","beacon","dome"].includes(mode)||mode==="beacon"&&!canBeacon(s)||
      mode==="fish"&&(!s.rod||s.region!=="cove")||mode==="dome"&&!canDuel(s)) return false;
    const fish=mode==="fish";if(fish)mode="wild";
    const pool=wildHabitat(s,fish,track);
    const base={coast:3,ridge:5,cove:7,marsh:8}[s.region];
    const rivals=mode==="wild"?[makeMon(pool[Math.floor(rng()*pool.length)],base+Math.floor(rng()*(s.badge?5:3)),rng)]:
      mode==="camp"?[makeMon("spark",5,rng)]:mode==="dome"?[makeMon("crab",10,rng),makeMon("snail",12,rng),makeMon("glider",14,rng)]:[makeMon("twig",6,rng),makeMon("stone",7,rng)];
    if(mode==="dome")rivals[2].held="berry";
    const lead=s.party.findIndex(m=>m.hp>0);
    if(lead<0) return false;
    const intro=mode==="wild"?(fish?"浮标沉了下去，钓起了":track?"沿着踪迹，你遇见了":"草叶一动，出现了")+name(rivals[0])+"！":(mode==="camp"?"巡林员青禾":mode==="dome"?"领航员汐弦":"守灯人岑川")+"派出了"+name(rivals[0])+"。";
    s.battle={mode,rivals,foe:0,lead,round:1,playerStage:stages(),foeStage:stages(),participants:[lead],lines:[intro],history:[intro],result:null,...F.initialWeather(s)};
    record(s.seen,rivals[0].kind);return true;
  }
  const factor=n=>n>=0?(2+n)/2:2/(2-n);
  function speed(m,mods,b){
    const ability=F.ability(m);
    const bonus=ability==="swift"&&b.weather==="rain"?2:ability==="breeze"&&b.weather!=="rain"?1.25:1;
    return stat(m,5)*factor(mods.speed)*(m.status==="para"?.25:1)*bonus;
  }
  function chooseAI(m,rng,target,b,mods) {
    const options=m.skills.filter(sk=>sk.pp>0);
    if(!options.length) return "strain";
    if(target&&b.mode!=="wild"){
      const rate=sk=>{
        const [,type,power,accuracy,,,effect]=moves[sk.id];
        if(!power){
          if(effect==="sleep")return !target.status?45:0;
          if(effect==="rain"||effect==="sun")return b.weather!==effect?37:0;
          if(effect==="guard"&&(mods.guard||0)<2)return 18;
          return 8;
        }
        if(type==="volt"&&F.ability(target)==="coil")return 0;
        return power*accuracy/100*C.effectiveness(type,target.kind)*(C.affinity(m.kind).includes(type)?1.5:1)*F.weatherPower(b,type);
      };
      const ranked=options.map(sk=>({id:sk.id,score:rate(sk)*(.8+.4*rng())})).sort((a,c)=>c.score-a.score);
      return ranked[0].id;
    }
    const attacks=options.filter(sk=>moves[sk.id][1]!=="plain"&&moves[sk.id][2]>0);
    const pool=attacks.length&&rng()<.64?attacks:options;
    return pool[Math.floor(rng()*pool.length)].id;
  }
  const priority=id=>moves[id][6]==="protect"?3:moves[id][6]==="quick"?1:0;
  function beforeMove(a,id,am,lines,rng) {
    if(id!=="veil")am.protectChain=0;
    if(a.status==="sleep"){
      if(a.sleep>0){a.sleep--;lines.push(name(a)+"正在熟睡。");return false;}
      a.status="";lines.push(name(a)+"醒来了。");
    }
    if(a.status==="para"&&rng()<.25) {lines.push(name(a)+"被麻痹打断了动作。");return false;}
    const sk=a.skills.find(k=>k.id===id);
    if(sk) sk.pp--;
    return true;
  }
  function resolveHit(a,t,id,am,tm,b,rng,spread=1) {
    const lines=b.lines;
    const [title,type,power,accuracy,,,effect]=moves[id];
    const prefix=name(a)+"使出「"+title+"」";
    if(tm.shield&&(power||effect==="sleep"||effect==="weaken")){lines.push(name(t)+"的护幕挡住了「"+title+"」。");return "blocked";}
    if(rng()*100>=accuracy) {lines.push(prefix+"，被躲开了。");return "miss";}
    if(!power) {
      if(effect==="protect"){
        const chain=am.protectChain||0;am.shield=chain===0||rng()<.5**chain;am.protectChain=am.shield?chain+1:0;
        lines.push(prefix+(am.shield?"，本回合获得保护。":"，连续展开护幕失败。"));
      }else if(effect==="rain"||effect==="sun"){b.weather=effect;b.weatherTurns=5;lines.push(prefix+"，场地转为"+F.weatherNames[effect]+"。");}
      else if(effect==="sleep"){if(t.status)lines.push(prefix+"，对手已有异常状态。");else{t.status="sleep";t.sleep=1+Math.floor(rng()*3);lines.push(prefix+"，"+name(t)+"睡着了。");F.triggerHeld(t,lines);}}
      else if(effect==="focus"){am.special=clamp((am.special||0)+1,-6,6);lines.push(prefix+"，特攻提高了。");}
      else if(effect==="guard") {
        const old=am.guard;am.guard=clamp(old+1,-6,6);
        lines.push(prefix+(old===am.guard?"，防御已经到顶。":"，防御提高了。"));
      } else {
        const old=tm.attack;tm.attack=clamp(old-1,-6,6);
        lines.push(prefix+(old===tm.attack?"，对手的攻击已到下限。":"，对手的攻击下降了。"));
      }
      return effect==="protect"&&!am.shield?"failed":"status";
    }
    if(F.ability(t)==="coil"&&type==="volt"){
      t.hp=Math.min(stat(t,0),t.hp+Math.max(1,Math.floor(stat(t,0)/4)));
      lines.push(prefix+"，"+name(t)+"以蓄流吸收了电能。");return "absorb";
    }
    const phys=["plain","rock","air"].includes(type),mult=C.effectiveness(type,t.kind);
    const crit=rng()<1/16&&F.ability(t)!=="shell";
    const atkStage=phys?am.attack:am.special||0,defStage=phys?tm.guard:0;
    const offense=stat(a,phys?1:3)*factor(crit?Math.max(0,atkStage):atkStage)*(phys&&a.status==="burn"?.5:1);
    const defense=stat(t,phys?2:4)*factor(crit?Math.min(0,defStage):defStage);
    const own=C.affinity(a.kind).includes(type),low=a.hp<=stat(a,0)/3;
    const surge=low&&({roots:"leaf",ember:"fire",tide:"water"}[F.ability(a)]===type);
    const damage=Math.max(1,Math.floor(((2+a.level*.4)*power*offense/(50*defense)+2)*
      (own?1.5:1)*(own&&a.held==="lens"?1.1:1)*(surge?1.5:1)*F.weatherPower(b,type)*mult*spread*(crit?2:1)*(.85+.15*rng())));
    const lost=Math.min(t.hp,damage); t.hp-=lost;
    lines.push(prefix+"，造成 "+lost+" 点伤害。"+(mult>1?"属性克制！":mult<1?"效果较弱。":"")+(crit?"命中要害！":""));
    if(effect==="drain"){a.hp=Math.min(stat(a,0),a.hp+Math.max(1,Math.floor(lost/2)));lines.push(name(a)+"汲取露水恢复了体力。");}
    if(effect==="recoil") a.hp=Math.max(0,a.hp-Math.max(1,Math.floor(stat(a,0)/6)));
    if(t.hp<=0) return "hit";
    if(effect==="slow"&&rng()<.4) {tm.speed=clamp(tm.speed-1,-6,6);lines.push(name(t)+"的速度下降了。");}
    if(!t.status && effect==="burn" && species[t.kind].type!=="fire" && rng()<.18){t.status="burn";lines.push(name(t)+"陷入灼伤。");}
    if(!t.status && effect==="para" && species[t.kind].type!=="volt" && rng()<.22){t.status="para";lines.push(name(t)+"陷入麻痹。");}
    if(!t.status&&effect==="poison"&&rng()<.35){t.status="poison";lines.push(name(t)+"中毒了。");}
    F.triggerHeld(t,lines);F.triggerHeld(a,lines);
    return "hit";
  }
  const seat=(key,mon,mods)=>({key,mon,mods});
  function snapshot({key,mon}){
    return {key,kind:mon.kind,hp:mon.hp,max:stat(mon,0),level:mon.level,status:mon.status};
  }
  function attack(source,targets,id,b,rng,events){
    if(!beforeMove(source.mon,id,source.mods,b.lines,rng))return;
    const event=events&&{move:id,source:snapshot(source),hits:[]};
    for(const target of targets){
      const before=event&&snapshot(target);
      const outcome=resolveHit(source.mon,target.mon,id,source.mods,target.mods,b,rng,targets.length>1?.75:1);
      if(event)event.hits.push({before,after:snapshot(target),outcome});
    }
    if(event){event.after=snapshot(source);events.push(event);}
  }
  function exchange(s,index) {
    const b=s.battle;
    b.lead=index;b.playerStage=stages();record(b.participants,index);
    b.lines.push("Levi 派出了"+name(s.party[index])+"。");
  }
  function finishRound(s) {
    const b=s.battle,enemy=b.rivals[b.foe];
    if(enemy.hp<=0) {
      b.lines.push(name(enemy)+"失去了战斗能力。");
      const living=b.participants.filter(i=>s.party[i].hp>0);
      for(const i of living) {
        F.growth(s.party[i],enemy);
        awardExperience(s,i,Math.ceil((enemy.level*(b.mode==="wild"?7:11)+6)/living.length));
      }
    }
    if(!s.party.some(m=>m.hp>0)) {
      b.result="loss";b.lines.push("伙伴们需要休息。研究站会为全队恢复体力。");return;
    }
    if(enemy.hp<=0) {
      if(b.foe+1<b.rivals.length) {
        b.foe++;b.foeStage=stages();b.participants=[b.lead];record(s.seen,b.rivals[b.foe].kind);
        b.lines.push((b.mode==="dome"?"领航员":"守灯人")+"派出了"+name(b.rivals[b.foe])+"！");
      } else {
        b.result="win";
        const reward={wild:6,camp:24,beacon:40,dome:75}[b.mode];s.coins+=reward;b.lines.push("获得 "+reward+" 枚潮币。");
        if(b.mode==="camp"&&!s.camp) {s.camp=true;s.supply.salves+=2;b.lines.push("青禾交给你两份药膏，解开练习场的栈门：「海上少了一点灯火。上栖风岭听听风，我在岸边接船。」");}
        if(b.mode==="beacon"&&!s.badge) {s.badge=true;b.lines.push("获得潮光徽章！灯台与研究站开通了前往盐镜湾的航线。");}
        if(b.mode==="dome"&&!s.secondBadge){s.secondBadge=true;b.lines.push("汐弦将镜潮徽章压在那张拓片上：「让船找到归路的人，也该在这张海图上留个名字。」");}
        return;
      }
    }
    if(!s.party[b.lead].hp) b.lines.push("请选择下一位出战伙伴。");
    b.round++;
  }
  function act(s,action,arg,rng=Math.random,events) {
    const b=s.battle;if(!b||b.result||b.mode==="pair") return false;
    let ally=s.party[b.lead];const foe=b.rivals[b.foe],forced=ally.hp<=0;
    if(forced && action!=="switch") return false;
    if(action==="switch"&&(!s.party[arg]?.hp||b.lead===arg)) return false;
    if(action==="move" && !(arg==="strain"?!ally.skills.some(sk=>sk.pp>0):ally.skills.some(sk=>sk.id===arg&&sk.pp>0))) return false;
    if(action==="salve" && (!s.supply.salves||ally.hp===stat(ally,0))) return false;
    if(action==="tonic"&&(!s.supply.tonic||!ally.status))return false;
    if(action==="bell" && (b.mode!=="wild"||!s.supply.bells)) return false;
    if(action==="run" && b.mode!=="wild") return false;
    if(!["move","switch","salve","tonic","bell","run"].includes(action)) return false;
    b.lines=[];
    b.playerStage.shield=false;b.foeStage.shield=false;
    if(action!=="move")b.playerStage.protectChain=0;
    if(action==="switch") {exchange(s,arg);ally=s.party[arg];}
    if(action==="salve") {s.supply.salves--;const old=ally.hp;ally.hp=Math.min(stat(ally,0),old+22);b.lines.push("使用药膏，"+name(ally)+"恢复 "+(ally.hp-old)+" 点体力。");}
    if(action==="tonic"){F.use(s,"tonic",b.lead);b.lines.push("清醒露解除了"+name(ally)+"的异常状态。");}
    if(action==="run"){
      b.attempts=(b.attempts||0)+1;
      const ours=speed(ally,b.playerStage,b),theirs=speed(foe,b.foeStage,b);
      if(ours>=theirs||ally.level>foe.level||rng()<ours/(2*theirs)+b.attempts*.16){b.result="run";b.lines.push("Levi 带着伙伴离开了草丛。");}
      else b.lines.push("野生伙伴拦住了去路，下次撤退会更容易。");
    }
    if(action==="bell") {
      s.supply.bells--;const statusBonus=foe.status ? .12 : 0;
      const chance=clamp(.25+.69*(1-foe.hp/stat(foe,0))+statusBonus,.2,.97);
      let shakes=0;while(shakes<3&&rng()<Math.cbrt(chance))shakes++;
      events?.push({type:"bell",target:snapshot(seat("foe0",foe,b.foeStage)),shakes});
      b.lines.push(["结缘铃晃了晃。","一声铃响。","两声铃响……","三声铃响！"][shakes]);
      if(shakes===3) {
        const full=s.party.length>=6;(full?s.box:s.party).push(foe);record(s.caught,foe.kind);
        b.result="caught";b.lines.push("结缘铃响了！"+name(foe)+(full?"已在研究站寄养。":"加入了队伍。"));
      } else b.lines.push("铃声消散了。削弱对手后再试一次。");
    }
    if(!b.result&&!forced) {
      const playerSeat=seat("ally0",ally,b.playerStage),foeSeat=seat("foe0",foe,b.foeStage);
      const ai=chooseAI(foe,rng,ally,b,b.foeStage),opponent=()=>attack(foeSeat,[playerSeat],ai,b,rng,events);
      if(action==="move") {
        const orderPriority=priority(arg)-priority(ai);
        const diff=speed(ally,b.playerStage,b)-speed(foe,b.foeStage,b);
        const first=orderPriority?orderPriority>0:(diff?diff>0:rng()<.5);
        const player=()=>attack(playerSeat,[foeSeat],arg,b,rng,events);
        const order=first?[player,opponent]:[opponent,player];
        for(const fn of order) if(ally.hp>0&&foe.hp>0) fn();
      } else opponent();
      for(const m of [ally,foe])F.residual(m,b.lines);
      F.endWeather(b);
      finishRound(s);
    }
    b.history=b.history.concat(b.lines).slice(-80);return true;
  }
  function startPair(s,rng=Math.random) {
    if(!s.badge||s.battle) return false;
    const allies=s.party.map((m,i)=>m.hp>0?i:-1).filter(i=>i>=0).slice(0,2);
    if(allies.length<2) return false;
    const rivals=[makeMon("spark",7,rng),makeMon("tide",8,rng)];
    const intro="青禾与岑川并肩迎战。为两位出战伙伴分别选择招式与目标。";
    s.battle={mode:"pair",allies,rivals,round:1,modA:s.party.map(stages),modF:rivals.map(stages),
      participants:[...allies],lines:[intro],history:[intro],result:null,...F.initialWeather(s)};
    for(const m of rivals) record(s.seen,m.kind);
    return true;
  }
  function availableMoves(m) {
    const list=m.skills.filter(sk=>sk.pp>0).map(sk=>sk.id);
    return list.length?list:["strain"];
  }
  function pairRound(s,orders,rng=Math.random,events) {
    const b=s.battle;if(!b||b.mode!=="pair"||b.result||!Array.isArray(orders)) return false;
    if(orders.length!==b.allies.length)return false;
    const incoming=new Set(),cost={salves:0,tonic:0};
    for(const [j,o] of orders.entries()){
      if(!o)return false;
      const mon=s.party[b.allies[j]];
      if(o.action==="switch"){
        if(!Number.isInteger(o.to)||!s.party[o.to]?.hp||incoming.has(o.to)||b.allies.includes(o.to))return false;
        incoming.add(o.to);
      }else if(o.action==="salves"||o.action==="tonic"){
        if(++cost[o.action]>s.supply[o.action]||(o.action==="salves"?mon.hp===stat(mon,0):!mon.status))return false;
      }else if(o.action||!availableMoves(mon).includes(o.move)||!b.rivals[o.target]?.hp)return false;
    }
    b.lines=[];
    const turns=[],replacements=new Map();
    function schedule(isAlly,index,move,target) {
      const actor=isAlly?s.party[index]:b.rivals[index],mods=isAlly?b.modA[index]:b.modF[index];
      turns.push({isAlly,index,move,target,actor,mods,quick:priority(move),speed:speed(actor,mods,b),tie:rng()});
    }
    for(const mods of [...b.modA,...b.modF])mods.shield=false;
    orders.forEach((o,j)=>{if(!o.action)schedule(true,b.allies[j],o.move,o.target);else b.modA[b.allies[j]].protectChain=0;});
    b.rivals.forEach((m,i)=>{
      if(!m.hp)return;
      const target=b.allies[Math.floor(rng()*b.allies.length)];
      schedule(false,i,chooseAI(m,rng,s.party[target],b,b.modF[i]),target);
    });
    orders.forEach((o,j)=>{
      const old=b.allies[j];
      if(o.action==="switch"){
        b.allies[j]=o.to;b.modA[old]=stages();b.modA[o.to]=stages();record(b.participants,o.to);replacements.set(old,o.to);
        b.lines.push(name(s.party[o.to])+"替换"+name(s.party[old])+"出战。");
      }else if(o.action){
        F.use(s,o.action,old);b.lines.push("为"+name(s.party[old])+"使用了"+F.stock[o.action].name+"。");
      }
    });
    turns.sort((a,c)=>c.quick-a.quick||c.speed-a.speed||c.tie-a.tie);
    for(const turn of turns) {
      if(!turn.actor.hp) continue;
      const targets=turn.isAlly?b.rivals:s.party;
      const eligible=turn.isAlly?b.rivals.map((_,i)=>i):b.allies;
      const intended=turn.isAlly?turn.target:(replacements.get(turn.target)??turn.target);
      const target=targets[intended].hp>0?intended:eligible.find(i=>targets[i].hp>0);
      if(target===undefined) continue;
      const hits=moves[turn.move][6]==="spread"?eligible.filter(i=>targets[i].hp>0):[target];
      const source=seat(turn.isAlly?"ally"+b.allies.indexOf(turn.index):"foe"+turn.index,turn.actor,turn.mods);
      const seats=hits.map(i=>turn.isAlly?seat("foe"+i,targets[i],b.modF[i]):seat("ally"+b.allies.indexOf(i),targets[i],b.modA[i]));
      attack(source,seats,turn.move,b,rng,events);
    }
    for(const mon of [...b.allies.map(i=>s.party[i]),...b.rivals]){
      F.residual(mon,b.lines);
    }
    F.endWeather(b);
    b.allies=b.allies.filter(i=>s.party[i].hp>0);
    for(let i=0;i<s.party.length&&b.allies.length<2;i++){
      if(s.party[i].hp>0&&!b.allies.includes(i)){
        b.allies.push(i);record(b.participants,i);b.lines.push(name(s.party[i])+"接替出战。");
      }
    }
    if(!b.allies.length){b.result="loss";b.lines.push("队伍已尽力，回研究站休整吧。");}
    else if(!b.rivals.some(m=>m.hp>0)){
      b.result="win";s.pairWon=true;s.coins+=50;b.lines.push("Levi 赢下了灯台双打交流赛，获得 50 枚潮币！");
      const living=b.participants.filter(i=>s.party[i].hp>0);
      for(const i of living){for(const foe of b.rivals)F.growth(s.party[i],foe);awardExperience(s,i,Math.ceil(160/living.length));}
    } else b.round++;
    b.history=b.history.concat(b.lines).slice(-80);return true;
  }
  function leaveBattle(s) {
    const b=s.battle;if(!b?.result) return false;
    s.notice=b.lines.join(" ");
    if(b.result==="loss"){restore(s);if(s.region==="ridge")s.region="coast";if(s.region==="marsh")s.region="cove";s.pos=s.region==="cove"?T.toGrid(T.coveSites.hut.at):{...T.spawn};s.notice="全队已在补给点恢复。你可以调整首发，准备好后再去挑战。";}
    s.grace=5;s.battle=null;return true;
  }
  function step(s,pos,rng=Math.random) {
    if(!s.starter||s.battle||!T.walkable(pos,s.region)||Math.abs(s.pos.x-pos.x)+Math.abs(s.pos.y-pos.y)!==1) return false;
    s.pos=pos;s.steps++;if(s.grace>0) s.grace--;
    else if(T.tallGrass(pos,s.region)&&rng()<.105) encounter(s,"wild",rng);
    return true;
  }
  function valid(s) {
    const mon=m=>m&&Object.hasOwn(species,m.kind)&&Number.isInteger(m.level)&&m.level>=1&&m.level<=50&&
      Array.isArray(m.iv)&&m.iv.length===6&&m.iv.every(Number.isFinite)&&Number.isFinite(m.hp)&&m.hp>=0&&m.hp<=stat(m,0)&&
      Number.isFinite(m.xp)&&Number.isInteger(m.nature)&&m.nature>=0&&m.nature<25&&Array.isArray(m.ev)&&m.ev.length===6&&
      m.ev.every(v=>Number.isInteger(v)&&v>=0&&v<=255)&&m.ev.reduce((a,b)=>a+b,0)<=510&&(!m.held||F.stock[m.held]?.hold)&&
      Array.isArray(m.skills)&&m.skills.length>0&&m.skills.length<=4&&m.skills.every(k=>!!moves[k.id]&&Number.isInteger(k.pp)&&k.pp>=0);
    if(!s||s.version!==2||!Object.hasOwn(T.areas,s.region)||!Number.isInteger(s.coins)||s.coins<0||!Array.isArray(s.party)||!s.party.every(mon)||s.party.length>6||!Array.isArray(s.box)||!s.box.every(mon)) return false;
    if((s.starter===null?s.party.length!==0:!C.starters.includes(s.starter)||!s.party.length)||!s.pos||!Number.isInteger(s.pos.x)||!Number.isInteger(s.pos.y)||!T.walkable(s.pos,s.region)||
      !Array.isArray(s.seen)||!Array.isArray(s.caught)||!s.supply||!Object.keys(F.stock).every(id=>Number.isInteger(s.supply[id])&&s.supply[id]>=0)) return false;
    if(!chapters.valid(s.chapters))return false;
    if(!s.battle) return true;
    const b=s.battle;
    if(b.mode==="pair") return Array.isArray(b.rivals)&&b.rivals.length===2&&b.rivals.every(mon)&&Array.isArray(b.allies)&&
      b.allies.every(i=>!!s.party[i])&&Array.isArray(b.modA)&&b.modA.length===s.party.length&&Array.isArray(b.modF)&&b.modF.length===2&&
      Array.isArray(b.lines)&&Array.isArray(b.history)&&Array.isArray(b.participants);
    return ["camp","beacon","wild","dome"].includes(b.mode)&&Array.isArray(b.rivals)&&b.rivals.every(mon)&&!!b.rivals[b.foe]&&!!s.party[b.lead]&&
      Array.isArray(b.lines)&&Array.isArray(b.history)&&Array.isArray(b.participants)&&b.participants.every(i=>!!s.party[i])&&!!b.playerStage&&!!b.foeStage;
  }
  function loadSave(previous){
    const s=F.upgrade(previous);
    if(!s||!Object.hasOwn(T.areas,s.region))return null;
    s.chapters??=chapters.fresh();
    if(!T.walkable(s.pos,s.region)){
      const ground=T.nearestGround(s.pos,s.region);
      if(!ground)return null;
      s.pos=ground;
    }
    return valid(s)?s:null;
  }
  return {stat,threshold,makeMon,fresh,start,restore,gain,evolvePartner,encounter,act,leaveBattle,step,valid,loadSave,startPair,pairRound,availableMoves,sail,chapters,canBeacon,hasLocal,canDuel};
})();
if(typeof module!=="undefined") module.exports=MistGame;
