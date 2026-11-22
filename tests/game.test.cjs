"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const C=require("../catalog.js"),T=require("../trail.js"),G=require("../game.js");
const fixed=()=>.52;
function ready(kind="moss"){const state=G.fresh();G.start(state,kind,fixed);return state;}
function wild(){const state=ready();G.encounter(state,"wild",fixed);return state;}

for(const kind of C.starters){
  test(kind+" 初选、升级、学招和进化",()=>{
    const s=ready(kind),m=s.party[0];
    assert.equal(m.level,5);assert.equal(m.hp,G.stat(m,0));assert.equal(m.skills.length,3);
    assert.equal(G.start(s,"ember"),false);
    const log=[];G.gain(m,200,log);
    assert.equal(m.kind,C.evolutions[kind]);assert.equal(m.skills.length,4);assert.ok(log.some(x=>x.includes("进化")));
    assert.equal(m.hp,G.stat(m,0));
    assert.equal(G.valid(JSON.parse(JSON.stringify(s))),true);
  });
}
test("陆路连接四个地点且每步合法，不能走进海里",()=>{
  for(const a of Object.values(T.sites)) for(const b of Object.values(T.sites)){
    let p=T.toGrid(a.at);const route=T.route(p,T.toGrid(b.at));assert.ok(route);
    for(const n of route){assert.ok(T.walkable(n));assert.equal(Math.abs(n.x-p.x)+Math.abs(n.y-p.y),1);p=n;}
    assert.deepEqual(p,T.toGrid(b.at));
  }
  assert.equal(T.route(T.spawn,T.toGrid([90,90])),null);
  assert.equal(G.step(ready(),T.toGrid([53,26])),false);
});
test("草甸有步行遇敌和战后保护步数",()=>{
  const s=ready();s.pos=T.toGrid([37,63]);s.grace=1;
  const n={x:s.pos.x+1,y:s.pos.y},old=s.pos;
  assert.ok(G.step(s,n,()=>0));assert.equal(s.battle,null);
  assert.ok(G.step(s,old,()=>0));assert.equal(s.battle.mode,"wild");
  G.act(s,"run");G.leaveBattle(s);assert.equal(s.grace,5);
});
test("属性、招式次数、无次数后的挣扎招式",()=>{
  assert.equal(C.matchup("water","fire"),2);assert.equal(C.matchup("fire","water"),.5);
  const s=wild(),m=s.party[0];s.battle.rivals[0]=G.makeMon("moss",6,fixed);const first=m.skills[1].pp;
  assert.ok(G.act(s,"move","sprout",fixed));assert.equal(m.skills[1].pp,first-1);
  assert.equal(G.act(s,"move","strain",fixed),false);
  m.skills.forEach(sk=>sk.pp=0);assert.equal(G.act(s,"move","sprout",fixed),false);
  assert.ok(G.act(s,"move","strain",fixed));
});
test("草甸捕捉消耗道具，满队入寄养",()=>{
  for(const full of [false,true]){
    const s=wild();if(full)while(s.party.length<6)s.party.push(G.makeMon("wind",4,fixed));
    assert.ok(G.act(s,"bell",null,()=>0));assert.equal(s.battle.result,"caught");
    assert.equal(s.supply.bells,5);assert.equal(s.box.length,full?1:0);assert.equal(s.party.length,full?6:2);
    const before=s.supply.bells;assert.equal(G.act(s,"bell",null,()=>0),false);assert.equal(s.supply.bells,before);
    G.leaveBattle(s);assert.equal(s.battle,null);assert.ok(G.valid(s));
  }
});
test("训练师禁止逃跑和捕捉，灯台要求练习场与引灯调查",()=>{
  const s=ready();assert.equal(G.encounter(s,"beacon",fixed),false);G.encounter(s,"camp",fixed);
  assert.equal(G.act(s,"run"),false);assert.equal(G.act(s,"bell"),false);assert.equal(s.supply.bells,6);
  s.battle.rivals[0].hp=1;G.act(s,"move","sprout",fixed);assert.ok(s.camp);G.leaveBattle(s);
  assert.equal(G.encounter(s,"beacon",fixed),false);s.chapters.ridge=2;
  assert.ok(G.encounter(s,"beacon",fixed));assert.equal(s.battle.rivals.length,2);
});
test("替补、倒下后免费换人、药膏、研究站与战败恢复",()=>{
  const s=wild();s.party.push(G.makeMon("ember",5,fixed));s.party[0].hp=0;
  assert.equal(G.act(s,"move","sprout",fixed),false);assert.ok(G.act(s,"switch",1,fixed));
  assert.equal(s.battle.round,1);assert.equal(s.party[1].hp,G.stat(s.party[1],0));
  assert.equal(G.act(s,"salve",null,fixed),false);
  s.party[1].hp=2;assert.ok(G.act(s,"salve",null,fixed));assert.equal(s.supply.salves,2);
  s.party[1].hp=1;G.act(s,"move","call",fixed);assert.equal(s.battle.result,"loss");
  G.leaveBattle(s);assert.deepEqual(s.pos,T.spawn);assert.equal(s.supply.salves,3);
  for(const m of s.party){assert.equal(m.hp,G.stat(m,0));assert.equal(m.status,"");}
});
test("灼伤持续扣血，变化招式修改能力，休整清除状态",()=>{
  const s=ready("ember");G.encounter(s,"camp",fixed);
  const foe=G.makeMon("wind",12,fixed);s.battle.rivals[0]=foe;s.party[0].level=8;s.party[0].hp=G.stat(s.party[0],0);
  G.act(s,"move","cinder",()=>.1);assert.equal(foe.status,"burn");assert.ok(s.battle.lines.some(x=>x.includes("灼伤伤害")));
  s.party[0].status="burn";G.restore(s);assert.equal(s.party[0].status,"");
  G.act(s,"move","call",fixed);assert.equal(s.battle.foeStage.attack,-1);
});
test("回合中途重新载入保留双方体力、PP 和回合",()=>{
  const s=wild();G.act(s,"move","shelter",fixed);const copy=JSON.parse(JSON.stringify(s));
  assert.ok(G.valid(copy));assert.deepEqual(copy.battle,s.battle);
  G.act(copy,"move","sprout",fixed);G.act(s,"move","sprout",fixed);assert.deepEqual(s,copy);
  copy.party[0].skills[0].id="missing";assert.equal(G.valid(copy),false);
});
test("双打门槛、分开选目标、回合存档与胜利结算",()=>{
  const s=ready();assert.equal(G.startPair(s,fixed),false);s.badge=true;assert.equal(G.startPair(s,fixed),false);
  s.party=[G.makeMon("grove",14,fixed),G.makeMon("pyre",14,fixed)];
  assert.ok(G.startPair(s,fixed));assert.equal(G.act(s,"run"),false);
  assert.equal(G.pairRound(s,[],fixed),false);
  const hp=s.battle.rivals.map(m=>m.hp);
  G.pairRound(s,[{move:"bump",target:0},{move:"dash",target:1}],fixed);
  s.battle.rivals.forEach((m,i)=>assert.ok(m.hp<hp[i]));assert.ok(G.valid(JSON.parse(JSON.stringify(s))));
  for(let i=0;i<20&&!s.battle.result;i++){
    const target=s.battle.rivals.findIndex(m=>m.hp>0);
    G.pairRound(s,s.battle.allies.map(j=>({move:G.availableMoves(s.party[j])[0],target})),fixed);
  }
  assert.equal(s.battle.result,"win");assert.equal(s.pairWon,true);G.leaveBattle(s);assert.equal(s.battle,null);
});
test("同一回合目标倒下后转向另一对手，倒下的伙伴被替补接替",()=>{
  const s=ready();s.badge=true;s.party=[G.makeMon("ember",4,fixed),G.makeMon("wind",13,fixed),G.makeMon("stone",6,fixed)];
  G.startPair(s,fixed);s.battle.rivals[0].hp=1;s.party[0].hp=1;
  G.pairRound(s,[{move:"call",target:0},{move:"dash",target:0}],()=>.04);
  assert.equal(s.battle.rivals[0].hp,0);assert.ok(s.battle.allies.includes(2));
});
