"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const G=require("../game.js"),C=require("../catalog.js");
const fixed=()=>.5;
function single(){
  const s=G.fresh();G.start(s,"ember",fixed);G.encounter(s,"wild",fixed);
  return s;
}
function teach(mon,move){mon.skills=[{id:move,pp:C.moves[move][4]}];}
for(const shakes of [0,1,2,3]){
  test(`结缘铃记录实际的 ${shakes} 声铃响，挣脱先于对手行动`,()=>{
    const s=single(),foe=s.battle.rivals[0],events=[];
    teach(foe,"bump");
    const plain=structuredClone(s);
    function rolls(){
      const draws=Array(shakes).fill(.1).concat(.99);
      return ()=>draws.shift()??.45;
    }
    assert.ok(G.act(s,"bell",undefined,rolls(),events));
    assert.ok(G.act(plain,"bell",undefined,rolls()));
    assert.deepEqual(s,plain);
    assert.equal(events[0].type,"bell");assert.equal(events[0].shakes,shakes);
    assert.equal(events[0].target.kind,foe.kind);assert.equal(events[0].target.key,"foe0");
    assert.equal(s.supply.bells,5);
    if(shakes===3){
      assert.equal(s.battle.result,"caught");assert.equal(events.length,1);assert.equal(s.party.length,2);
    }else{
      assert.equal(s.battle.result,null);assert.equal(events[1].source.key,"foe0");assert.equal(s.party.length,1);
    }
  });
}
test("满队结缘进入寄养，无法投铃时不产生演出",()=>{
  const s=single(),events=[];
  while(s.party.length<6)s.party.push(G.makeMon("moss",5,fixed));
  s.battle.mode="camp";
  assert.equal(G.act(s,"bell",undefined,fixed,events),false);assert.equal(events.length,0);
  s.battle.mode="wild";assert.ok(G.act(s,"bell",undefined,()=>0,events));
  assert.equal(s.supply.bells,5);assert.equal(s.party.length,6);assert.equal(s.box.length,1);
  assert.equal(events[0].shakes,3);assert.equal(s.battle.result,"caught");
  assert.equal(G.act(s,"bell",undefined,fixed,events),false);assert.equal(events.length,1);
});
test("画面事件按实际出手顺序记录，麻痹或睡眠未出招不播放",()=>{
  const s=single(),ally=s.party[0],foe=s.battle.rivals[0];
  teach(ally,"dash");teach(foe,"bump");foe.status="sleep";foe.sleep=1;
  const plain=structuredClone(s),events=[];
  assert.ok(G.act(s,"move","dash",fixed,events));assert.ok(G.act(plain,"move","dash",fixed));
  assert.deepEqual(plain,s);assert.deepEqual(events.map(e=>e.move),["dash"]);
  const [strike]=events;assert.equal(strike.source.key,"ally0");assert.equal(strike.hits[0].before.key,"foe0");
  assert.ok(strike.hits[0].before.hp>strike.hits[0].after.hp);
});
test("落空、护幕和吸收均有各自的演出结果",()=>{
  for(const [move,defense,outcome] of [["flare","bump","miss"],["cinder","veil","blocked"],["jolt","bump","absorb"]]){
    const s=single(),events=[];
    s.battle.rivals[0]=G.makeMon("spark",8,fixed);teach(s.party[0],move);
    teach(s.battle.rivals[0],defense);
    assert.ok(G.act(s,"move",move,outcome==="miss"?()=>.99:fixed,events));
    const e=events.find(v=>v.source.key==="ally0");assert.equal(e.hits[0].outcome,outcome);
    if(outcome==="blocked")assert.equal(events[0].move,"veil");
  }
});
test("一次叠浪同时指向两个实际对手，换上场的伙伴使用正确的画面位置",()=>{
  const s=single();s.battle=null;s.badge=true;s.party.push(G.makeMon("tide",8,fixed),G.makeMon("moss",8,fixed));
  teach(s.party[1],"swell");G.startPair(s,fixed);const events=[];
  for(const m of s.battle.rivals)teach(m,"bump");
  assert.ok(G.pairRound(s,[{action:"switch",to:2},{move:"swell",target:0}],()=>.1,events));
  const wave=events.find(e=>e.move==="swell");assert.equal(wave.source.key,"ally1");
  assert.deepEqual(wave.hits.map(h=>h.before.key),["foe0","foe1"]);
  assert.ok(events.filter(e=>e.source.key.startsWith("foe")).every(e=>e.hits[0].before.kind==="moss"&&e.hits[0].before.key==="ally0"));
});
for(const from of C.starters){
  test(from+" 晋级后只排入一次进化，保存与读档保留待播形态",()=>{
    const s=single();s.party[0]=G.makeMon(from,8,fixed);s.party[0].xp=G.threshold(8)-1;
    s.battle.rivals[0].hp=1;teach(s.party[0],"dash");const events=[];
    G.act(s,"move","dash",fixed,events);assert.equal(s.party[0].kind,C.evolutions[from]);
    assert.deepEqual(G.loadSave(structuredClone(s)).pendingEvolutions,[from]);
    assert.equal(events[0].source.kind,from);
    assert.equal(G.act(s,"move","dash",fixed,events),false);assert.deepEqual(s.pendingEvolutions,[from]);
  });
}
test("双打同回合进化的两个伙伴分别入队，群攻画面仍是出招时的旧形态",()=>{
  const s=G.fresh();G.start(s,"moss",fixed);s.badge=true;
  s.party=["moss","tide"].map(k=>G.makeMon(k,8,fixed));G.startPair(s,fixed);
  for(const m of s.party)m.xp=G.threshold(8)-1;
  teach(s.party[0],"shelter");teach(s.party[1],"swell");
  for(const m of s.battle.rivals){m.hp=1;m.status="sleep";m.sleep=2;}
  const events=[];
  G.pairRound(s,[{move:"shelter",target:0},{move:"swell",target:1}],fixed,events);
  assert.equal(s.battle.result,"win");assert.deepEqual(s.pendingEvolutions,["moss","tide"]);
  assert.equal(events.find(e=>e.move==="swell").source.kind,"tide");
});
