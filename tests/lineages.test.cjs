"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const G=require("../game"),C=require("../catalog"),F=require("../field-rules");
const fixed=()=>.42,lines=C.lineages.filter(line=>!C.species[line[0]].reserve);
const name=k=>C.species[k].name;
function saveWith(m){
  const s=G.fresh();G.start(s,"moss",fixed);s.party=[m];s.seen=[m.kind];s.caught=[m.kind];return s;
}
test("所有图鉴编号唯一，十五条谱系均含两次可达进化及完整素材",()=>{
  assert.equal(lines.length,15);assert.equal(new Set(lines.flat()).size,45);
  const coastal=Object.values(C.species).filter(d=>!d.reserve);
  assert.equal(coastal.length,45);
  assert.deepEqual(coastal.map(s=>+s.no).sort((a,b)=>a-b),Array.from({length:45},(_,i)=>i+1));
  for(const line of lines){
    const [base,middle,final]=line;
    assert.equal(C.evolutions[base],middle);assert.equal(C.evolutions[middle],final);
    assert.equal(C.evolutions[final],undefined);
    assert.ok(C.evolutionLevels[base]<C.evolutionLevels[middle]&&C.evolutionLevels[middle]<=50);
    for(const id of line){
      assert.ok(line.every(k=>C.lineage(id).includes(name(k))));
      const m=G.makeMon(id,28,fixed);
      assert.ok(m.skills.every(({id})=>C.moves[id]));assert.ok(F.abilities[F.ability(m)]);
      F.growth(m,m);assert.equal(m.ev.reduce((sum,x)=>sum+x,0),2);
      for(const suffix of ["","-back"])assert.ok(fs.existsSync(path.join(__dirname,"../assets/color/"+id+suffix+".webp")));
    }
    for(const id of [base,middle])assert.ok(fs.existsSync(path.join(__dirname,"../assets/cinema/evo-"+id+".webp")));
  }
});
for(const [base,middle,final] of lines){
  test(name(base)+"：两次升级均在对应门槛触发，技能、装备、受伤量能继承",()=>{
    const first=C.evolutionLevels[base],last=C.evolutionLevels[middle];
    const m=G.makeMon(base,first-1,fixed);m.held="lens";m.hp-=3;
    const skills=structuredClone(m.skills),iv=[...m.iv],ev=[...m.ev],nature=m.nature;
    assert.deepEqual(G.gain(m,G.threshold(m.level)-1,[]),[]);assert.equal(m.kind,base);
    assert.deepEqual(G.gain(m,1,[]),[base]);assert.equal(m.kind,middle);
    while(m.level<last-1)assert.deepEqual(G.gain(m,G.threshold(m.level),[]),[]);
    assert.deepEqual(G.gain(m,G.threshold(m.level),[]),[middle]);assert.equal(m.kind,final);
    assert.equal(m.hp,G.stat(m,0)-3);assert.equal(m.held,"lens");
    assert.deepEqual(m.skills,skills);assert.deepEqual(m.iv,iv);assert.deepEqual(m.ev,ev);assert.equal(m.nature,nature);
    for(const id of C.familyOf[base])assert.ok(C.species[id].moves.every(move=>F.teachable(m).includes(move)));
    assert.deepEqual(G.gain(m,1e6,[]),[]);assert.equal(m.kind,final);assert.equal(m.level,50);
  });
}
test("旧档满级初阶可在详情补齐两阶，顺序入谱、只结算一次，倒下的伙伴不会因进化复活",()=>{
  const m=G.makeMon("snail",50,fixed),s=G.loadSave(saveWith(m));s.party[0].hp=0;
  assert.equal(G.evolvePartner(s,0),true);assert.equal(s.party[0].kind,"bronzeconch");
  assert.deepEqual(s.pendingEvolutions,["snail","chimingconch"]);
  assert.deepEqual(s.caught,C.familyOf.snail);assert.deepEqual(s.seen,s.caught);assert.equal(s.party[0].hp,0);
  assert.deepEqual(G.loadSave(structuredClone(s)).pendingEvolutions,s.pendingEvolutions);
  assert.equal(G.evolvePartner(s,0),false);assert.equal(F.ability(s.party[0]),"swift");
  assert.equal(G.hasLocal(s),true);
});
test("战斗正常结算补播两段进化，刷新与重复操作保持队列顺序",()=>{
  const m=G.makeMon("wind",50,fixed),s=saveWith(m);
  G.encounter(s,"wild",fixed);assert.equal(G.evolvePartner(s,0),false);
  s.battle.rivals[0].hp=1;assert.ok(G.act(s,"move","dash",fixed));
  assert.equal(m.kind,"cloudcrane");assert.deepEqual(s.pendingEvolutions,["wind","reedcrane"]);
  assert.deepEqual(s.caught,C.familyOf.wind);
  const saved=G.loadSave(structuredClone(s));assert.deepEqual(saved.pendingEvolutions,s.pendingEvolutions);
  assert.equal(G.act(saved,"move","dash",fixed),false);assert.deepEqual(saved.pendingEvolutions,s.pendingEvolutions);
});
test("大笔经验跨两道门槛，未达门槛不能手动进化",()=>{
  const m=G.makeMon("fry",5,fixed),s=saveWith(m);
  assert.equal(G.evolvePartner(s,0),false);assert.equal(s.pendingEvolutions,undefined);
  assert.deepEqual(G.gain(m,99999,[]),["fry","glider"]);assert.equal(m.kind,"starwing");
});
