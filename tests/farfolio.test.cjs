"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const C=require("../catalog"),G=require("../game"),F=require("../field-rules");
const fixed=()=>.42;
const skill=id=>({id,pp:C.moves[id][4]});
const started=()=>{const s=G.fresh();G.start(s,"moss",fixed);return s;};
const asset=(dir,id)=>fs.statSync(path.join(__dirname,"../assets",dir,id+".webp")).size;

test("远域卷十处栖地独立收录五十支谱系、八十个连续编号及成对立绘",()=>{
  const families=C.reserve.flatMap(a=>a.families),numbers=[];
  assert.equal(C.reserve.length,10);assert.ok(C.reserve.every(a=>a.families.length===5&&a.source));
  assert.equal(new Set(families.map(f=>f.id)).size,50);
  for(const [stages,n] of [[1,30],[2,10],[3,10]])assert.equal(families.filter(f=>f.names.length===stages).length,n);
  for(const f of families){
    const line=C.familyOf[f.id];assert.equal(line.length,f.names.length);
    for(const [i,k] of line.entries()){
      const d=C.species[k];assert.equal(d.name,f.names[i]);assert.ok(d.reserve&&d.desc&&d.habitat&&d.source);
      assert.equal(d.stats.length,6);assert.deepEqual(C.familyOf[k],line);numbers.push(+d.no);
      for(const suffix of ["","-back"])assert.ok(asset("color",k+suffix)>1000,k+suffix);
      assert.equal(C.evolutions[k],line[i+1]);assert.equal(C.evolutionLevels[k],f.levels[i]);
    }
    const m=G.makeMon(f.id,1,fixed);for(const [index,lv] of f.levels.entries()){
      while(m.level<lv-1)G.gain(m,G.threshold(m.level),[]);
      assert.equal(m.kind,line[index]);assert.deepEqual(G.gain(m,G.threshold(m.level),[]),[line[index]]);
    }
    G.gain(m,1e6,[]);assert.equal(m.kind,line.at(-1));assert.equal(m.level,50);
  }
  assert.deepEqual(numbers,Array.from({length:80},(_,i)=>46+i));
  assert.equal(Object.keys(C.species).length,125);
});
test("每支谱系有家传技，全部形态成长表有序，七十五种可习招式及耗尽 PP 的应急招都有演出",()=>{
  const reachable=new Set();
  assert.equal(Object.keys(C.familyArts).length,C.lineages.length);
  for(const line of C.lineages)for(const k of line){
    const path=F.levelPath(k),ids=path.map(p=>p.id);
    assert.equal(new Set(ids).size,ids.length);
    assert.ok(path.every((p,i)=>C.moves[p.id]&&p.level<=50&&p.level>=1&&(!i||p.level>=path[i-1].level)));
    assert.ok(C.familyArts[line[0]].every(id=>ids.includes(id)));
    const mon=G.makeMon(k,50,fixed);
    for(const e of F.studyPlan(mon,{party:[],badge:true,secondBadge:true}))reachable.add(e.id);
  }
  assert.deepEqual(Object.keys(C.moves).filter(k=>!reachable.has(k)),["strain"]);assert.equal(reachable.size,75);
  for(const [id,move] of Object.entries(C.moves))assert.ok(asset("cinema",move[7]||id)>200,id);
});
test("升级补入空栏，满栏时保存替换选择，保留原招后仍可回忆",()=>{
  const s=started(),m=s.party[0];assert.equal(m.skills.length,3);
  while(m.level<7)G.gain(m,G.threshold(m.level),[]);assert.equal(m.skills.length,4);assert.ok(m.skills.some(sk=>sk.id==="sap"));
  while(m.level<14)G.gain(m,G.threshold(m.level),[]);
  const copy=G.loadSave(structuredClone(s)),p=copy.party[0],id=p.offers[0],old=p.skills[1].id;
  assert.deepEqual(p.offers,m.offers);assert.equal(G.resolveOffer(copy,0,7),false);
  assert.ok(G.resolveOffer(copy,0,1));assert.deepEqual(p.skills[1],skill(id));assert.ok(p.remembered.includes(old));
  const skipped=p.offers[0],slots=structuredClone(p.skills);assert.ok(G.resolveOffer(copy,0,-1));
  assert.deepEqual(p.skills,slots);assert.ok(F.teachable(p,copy).includes(skipped));assert.ok(G.valid(copy));
});
test("师授、徽章秘卷、同伴传习与曾习招式回忆使用同一套学习条件",()=>{
  const s=started(),m=s.party[0];
  assert.ok(F.studyPlan(m,s).some(e=>e.source==="师授"&&e.id==="veil"&&e.ready));
  assert.equal(F.teach(s,0,"bellnote",1),false);s.badge=true;assert.ok(F.teach(s,0,"bellnote",1));
  assert.equal(F.teach(s,0,"silkguard",1),false);s.secondBadge=true;assert.ok(F.teach(s,0,"silkguard",1));
  assert.equal(F.teach(s,0,"leafduet",1),false);
  const mentor=G.makeMon("wishgrass",30,fixed);mentor.skills=[skill("leafduet")];s.party.push(mentor);
  assert.ok(F.teach(s,0,"leafduet",1));s.party.pop();assert.ok(F.teach(s,0,"bellnote",1));
  assert.ok(F.studyPlan(m,s).some(e=>e.source==="回忆"&&e.id==="leafduet"&&e.ready));
  assert.ok(G.encounter(s,"wild",fixed));assert.equal(F.teach(s,0,"leafduet",1),false);
});
function strike(id,prepare=()=>{}){
  const s=started(),a=s.party[0]=G.makeMon("tide",20,fixed);
  a.skills=[skill(id)];G.encounter(s,"wild",fixed);
  const b=s.battle,t=b.rivals[0]=G.makeMon("stone",45,fixed);
  t.skills=[skill("shelter")];b.playerStage.speed=6;prepare(a,t,b);
  const events=[];assert.ok(G.act(s,"move",id,fixed,events));
  return {events:events.filter(e=>e.move===id),a,b,t};
}
const lost=({events})=>events.reduce((n,e)=>n+e.hits[0].before.hp-e.hits[0].after.hp,0);
test("同属性物理与特殊攻击独立结算，雨招与体力回复使用实际场上状态",()=>{
  const focus=(a,t,b)=>{b.playerStage.special=4;},boost=(a,t,b)=>{b.playerStage.attack=4;};
  assert.ok(lost(strike("tideclaw",boost))>lost(strike("tideclaw",focus)));
  assert.ok(lost(strike("pearljet",focus))>lost(strike("pearljet",boost)));
  assert.ok(lost(strike("rainwake",(a,t,b)=>{b.weather="rain";}))>lost(strike("rainwake")));
  const {a}=strike("quietpulse",a=>{a.hp=1;});assert.equal(a.hp,1+Math.floor(G.stat(a,0)/2));
});
test("二连击只耗一次 PP，分别生成命中演出，击倒后停止",()=>{
  const r=strike("twinrill");assert.equal(r.events.length,2);assert.equal(r.a.skills[0].pp,C.moves.twinrill[4]-1);
  assert.equal(r.events[0].hits[0].after.hp,r.events[1].hits[0].before.hp);
  assert.equal(strike("twinrill",(a,t)=>{t.hp=1;}).events.length,1);
});
test("草丛、垂钓、训练师和双打均登记匹配的入场，旧战斗可原样续玩",()=>{
  for(const [mode,theme] of [["wild","grass"],["fish","water"],["camp","trainer"],["pair","pair"]]){
    const s=started();
    if(mode==="fish"){s.rod=true;s.region="cove";s.pos=require("../trail").toGrid(require("../trail").coveSites.dock.at,"cove");}
    if(mode==="pair"){s.badge=true;s.party.push(G.makeMon("ember",8,fixed));assert.ok(G.startPair(s,fixed));}
    else assert.ok(G.encounter(s,mode,fixed));
    assert.equal(s.battle.entry,theme);assert.ok(asset("cinema","entry-"+theme)>1000);
    delete s.battle.entry;assert.ok(G.loadSave(s));assert.equal(s.battle.round,1);
  }
});
