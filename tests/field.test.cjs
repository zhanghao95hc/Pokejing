"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const C=require("../catalog"),F=require("../field-rules"),G=require("../game"),T=require("../trail");
const fixed=()=>.55;
test("旧战报按新物种和招式名显示，同一句重复读取仍保持一致",()=>{
  const original="苔角羊使出「飞芽」。夜纱蛾使出「紫翅粉」。苔角羊升至 Lv.6！";
  const current="筠角鹿使出「飞芽」。桂月蛾使出「桂魄粉」。筠角鹿升至 Lv.6！";
  assert.equal(C.journalText(original),current);
  assert.equal(C.journalText(current),current);
  assert.equal(C.journalText("获得 6 枚潮币。"),"获得 6 枚潮币。");
});
function start(k="moss"){const s=G.fresh();G.start(s,k,fixed);return s;}
function duel(a,t){
  const s=start();s.party=[a];G.encounter(s,"wild",fixed);s.battle.rivals=[t];s.battle.weather="clear";return s;
}
function unit(k,level=16){return G.makeMon(k,level,fixed);}
function withMove(m,id){m.skills=[{id,pp:C.moves[id][4]}];return m;}
function hit(s,id){const m=s.battle.rivals[0],hp=m.hp;G.act(s,"move",id,fixed);return hp-m.hp;}
function pair(){
  const s=start();s.party=[unit("moss"),unit("tide"),unit("crab"),unit("ember")];s.badge=true;G.startPair(s,fixed);return s;
}
test("性格与训练分别作用于正确的能力，努力值上限生效",()=>{
  const m=unit("moss",50),base=G.stat(m,1);m.nature=1;
  assert.equal(G.stat(m,1),Math.floor(base*1.1));m.nature=0;m.ev[1]=200;assert.ok(G.stat(m,1)>base);
  m.ev=[0,254,254,0,0,0];F.growth(m,unit("crab"));assert.equal(m.ev[1],255);
  F.growth(m,unit("moth"));F.growth(m,unit("moth"));assert.equal(m.ev.reduce((a,b)=>a+b,0),510);
});
test("同一招在两种天气下的伤害以及双属性叠乘",()=>{
  assert.equal(C.effectiveness("leaf","crab"),4);assert.equal(C.effectiveness("leaf","moth"),.25);
  function damage(weather){const s=duel(withMove(unit("tide"),"ripple"),withMove(unit("wind",24),"call"));s.battle.weather=weather;s.battle.weatherTurns=5;return hit(s,"ripple");}
  assert.ok(damage("rain")>damage("clear"));assert.ok(damage("clear")>damage("sun"));
});
test("天气招式持续五次回合结算，刷新不重置剩余时间",()=>{
  const s=duel(withMove(unit("tide"),"rain"),withMove(unit("stone"),"shelter"));
  assert.ok(G.act(s,"move","rain",fixed));assert.equal(s.battle.weatherTurns,4);
  const restored=JSON.parse(JSON.stringify(s));assert.ok(G.valid(restored));
  withMove(restored.party[0],"shelter");for(let i=0;i<4;i++)G.act(restored,"move","shelter",fixed);
  assert.equal(restored.battle.weather,"clear");assert.equal(restored.battle.weatherTurns,0);
});
test("蓄流吸收雷电并回血，携带镜提高本系伤害",()=>{
  const foe=withMove(unit("spark"),"call");foe.hp-=10;
  const s=duel(withMove(unit("tide"),"jolt"),foe),before=foe.hp;hit(s,"jolt");assert.ok(foe.hp>before);
  function d(held){const a=withMove(unit("ember",24),"cinder");a.held=held;return hit(duel(a,withMove(unit("stone",36),"call")),"cinder");}
  assert.ok(d("lens")>=d(""));assert.equal(F.ability(unit("snail")),"swift");
});
test("商店和装备守恒，药膏不能复活，果实只触发一次",()=>{
  const s=start();assert.ok(F.buy(s,"berry"));assert.equal(s.coins,52);assert.equal(F.buy(s,"lens"),false);
  assert.ok(F.equip(s,0,"berry"));assert.equal(s.supply.berry,2);assert.ok(F.equip(s,0,"balm"));assert.equal(s.supply.berry,3);
  const a=s.party[0];a.status="sleep";a.sleep=2;F.triggerHeld(a,[]);assert.equal(a.status,"");assert.equal(a.held,"");
  F.equip(s,0,"berry");a.hp=3;F.triggerHeld(a,[]);F.triggerHeld(a,[]);assert.equal(a.hp,13);
  a.hp=0;assert.equal(F.use(s,"salves",0),false);assert.equal(s.supply.salves,3);
});
test("睡眠阻断行动、不会扣 PP，醒后可行动；清醒露与毒伤",()=>{
  const s=duel(withMove(unit("moss"),"sprout"),withMove(unit("stone",20),"shelter"));
  const a=s.party[0];a.status="sleep";a.sleep=1;const pp=a.skills[0].pp;
  G.act(s,"move","sprout",fixed);assert.equal(a.skills[0].pp,pp);G.act(s,"move","sprout",fixed);assert.equal(a.status,"");assert.equal(a.skills[0].pp,pp-1);
  a.status="poison";const hp=a.hp;F.residual(a,[]);assert.ok(a.hp<hp);
  assert.ok(G.act(s,"tonic",null,fixed));assert.equal(a.status,"");assert.equal(s.supply.tonic,1);
});
test("四招上限、替换、战外整备，升级不挤掉已选招式",()=>{
  const s=start();assert.ok(F.teach(s,0,"sun",3));assert.equal(s.party[0].skills.length,4);
  G.gain(s.party[0],90,[]);assert.equal(s.party[0].skills.length,4);assert.ok(F.teach(s,0,"sap",2));
  assert.equal(F.teach(s,0,"sap",3),false);G.encounter(s,"wild",fixed);assert.equal(F.teach(s,0,"focus",0),false);
});
test("盐镜湾渡船、区域地图连通性、钓竿门槛与三人首领战",()=>{
  const s=start();assert.equal(G.sail(s),false);s.badge=true;assert.ok(G.sail(s));assert.equal(s.region,"cove");
  for(const site of Object.values(T.coveSites)){assert.ok(T.route(s.pos,T.toGrid(site.at),"cove"));}
  assert.equal(G.encounter(s,"fish",fixed),false);s.rod=true;assert.ok(G.encounter(s,"fish",()=>.8));assert.equal(s.battle.weather,"rain");
  s.battle=null;assert.equal(G.encounter(s,"dome",fixed),false);s.caught.push("snail");assert.ok(G.encounter(s,"dome",fixed));assert.equal(s.battle.rivals.length,3);
  s.battle.foe=2;s.party[0]=unit("grove",40);s.battle.rivals[2].hp=1;G.act(s,"move","sprout",fixed);assert.ok(s.secondBadge);const paid=s.coins;
  assert.equal(G.act(s,"move","sprout"),false);assert.equal(s.coins,paid);G.leaveBattle(s);assert.ok(G.sail(s));assert.equal(s.region,"coast");
});
test("双打换人承伤、同位替补冲突拒绝、道具不重复扣除",()=>{
  const s=pair(),z=s.battle;
  assert.equal(G.pairRound(s,[{action:"switch",to:2},{action:"switch",to:2}],fixed),false);
  const old=s.party[0].hp,entrant=s.party[2].hp;
  G.pairRound(s,[{action:"switch",to:2},{move:"ripple",target:1}],()=>.02);
  assert.equal(s.party[0].hp,old);assert.ok(s.party[2].hp<entrant);assert.equal(z.allies[0],2);
  s.supply.salves=1;s.party[1].hp--;const raw=JSON.stringify(s);
  assert.equal(G.pairRound(s,[{action:"salves"},{action:"salves"}],fixed),false);assert.equal(JSON.stringify(s),raw);
  assert.ok(G.pairRound(s,[{action:"salves"},{move:"ripple",target:1}],fixed));assert.equal(s.supply.salves,0);
});
test("旧档升级保留回合、体力和 PP，重复升级不重复发放物资",()=>{
  const s=start();G.encounter(s,"wild",fixed);G.act(s,"move","shelter",fixed);s.version=1;const {round}=s.battle;
  for(const m of [...s.party,...s.battle.rivals]){delete m.nature;delete m.ev;delete m.held;delete m.sleep;}
  const hp=s.party[0].hp,pp=s.party[0].skills[2].pp;
  const migrated=F.upgrade(s);assert.ok(G.valid(migrated));assert.equal(migrated.battle.round,round);assert.equal(migrated.party[0].hp,hp);assert.equal(migrated.party[0].skills[2].pp,pp);
  migrated.coins=2;F.upgrade(migrated);assert.equal(migrated.coins,2);
});
test("护幕先于攻击行动，连续护幕可能失败，其他招式打断连续计数",()=>{
  const s=duel(withMove(unit("stone"),"veil"),withMove(unit("wind"),"dash")),m=s.party[0],hp=m.hp;
  G.act(s,"move","veil",fixed);assert.equal(m.hp,hp);
  G.act(s,"move","veil",fixed);assert.ok(m.hp<hp);assert.equal(s.battle.playerStage.protectChain,0);
  G.act(s,"move","veil",fixed);assert.ok(s.battle.playerStage.shield);
  withMove(m,"bump");G.act(s,"move","bump",fixed);assert.equal(s.battle.playerStage.shield,false);assert.equal(s.battle.playerStage.protectChain,0);
});
test("双打叠浪同时命中两名对手，扣一次 PP；睡眠时两次命中都取消",()=>{
  const s=pair(),z=s.battle;s.party[0]=withMove(unit("tide",8),"swell");
  s.party[1]=withMove(unit("stone",16),"shelter");
  z.rivals=[withMove(unit("wind",18),"call"),withMove(unit("stone",18),"shelter")];
  const hp=z.rivals.map(m=>m.hp),skill=s.party[0].skills[0],pp=skill.pp;
  const orders=[{move:"swell",target:0},{move:"shelter",target:1}];
  assert.ok(G.pairRound(s,orders,fixed));assert.ok(z.rivals.every((m,i)=>m.hp<hp[i]));assert.equal(skill.pp,pp-1);
  const after=z.rivals.map(m=>m.hp);s.party[0].status="sleep";s.party[0].sleep=1;
  G.pairRound(s,orders,fixed);assert.deepEqual(z.rivals.map(m=>m.hp),after);assert.equal(skill.pp,pp-1);
});
