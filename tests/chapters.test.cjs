const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const G=require("../game"),C=require("../catalog"),T=require("../trail"),F=require("../field-rules");
const J=G.chapters,fixed=()=>0.45;
function ready(){const s=G.fresh();G.start(s,"ember",fixed);return s;}
function at(s,site){return T.toGrid(T.siteList(s.region)[site].at);}
function walk(s,site){
  const route=T.route(s.pos,at(s,site),s.region);
  assert.ok(route);for(const pos of route)assert.ok(G.step(s,pos,()=>.99));
  assert.equal(T.near(s.pos,s.region),site);
}
test("第一枚徽章须完成山岭调查，错开灯窗可重试，交付只结算一次",()=>{
  const s=ready();s.expedition.ridge=3;walk(s,"camp");assert.equal(J.crossing(s,"ridge"),false);s.camp=true;
  assert.ok(J.crossing(s,"ridge"));assert.equal(s.region,"ridge");
  assert.equal(J.investigate(s,"south"),false);walk(s,"lantern");
  assert.equal(J.investigate(s,"south"),false);walk(s,"rack");assert.ok(J.investigate(s,"inspect"));
  walk(s,"lantern");const before=s.supply.bells;
  assert.ok(J.investigate(s,"north"));assert.equal(s.chapters.ridge,1);assert.equal(G.canBeacon(s),false);
  assert.ok(J.investigate(s,"south"));assert.equal(s.supply.bells,before+2);
  assert.equal(J.investigate(s,"south"),false);assert.ok(G.canBeacon(s));walk(s,"pass");
  assert.ok(J.crossing(s,"ridge"));assert.deepEqual(s.pos,at(s,"camp"));walk(s,"beacon");assert.ok(G.encounter(s,"beacon",fixed));
});
test("第二枚徽章须完成潮尺与钟声，半段钟谱能读档，错误节奏重置，可从鸣沙泽获得本地记录",()=>{
  let s=ready();s.expedition.marsh=3;s.badge=s.camp=true;assert.ok(G.sail(s));walk(s,"hut");assert.ok(J.crossing(s,"marsh"));
  walk(s,"gauge");assert.ok(J.investigate(s,"inspect"));walk(s,"gong");assert.ok(J.investigate(s,"short"));
  s=G.loadSave(structuredClone(s));assert.equal(s.chapters.beats,1);assert.ok(J.investigate(s,"long"));assert.equal(s.chapters.beats,0);
  const berries=s.supply.berry;for(const beat of ["short","short","long"])assert.ok(J.investigate(s,beat));
  assert.equal(s.chapters.marsh,2);assert.equal(s.supply.berry,berries+2);assert.equal(J.investigate(s,"long"),false);
  walk(s,"inlet");assert.ok(G.encounter(s,"inlet",()=>0));assert.equal(s.battle.rivals[0].kind,"fry");
  assert.ok(G.act(s,"bell",null,()=>0));assert.ok(G.leaveBattle(s));assert.ok(G.hasLocal(s));
  walk(s,"landing");assert.ok(J.crossing(s,"marsh"));walk(s,"dome");assert.ok(G.encounter(s,"dome",fixed));assert.equal(s.battle.rivals.at(-1).kind,"glider");
});
for(const [region,gate,track,kinds] of [["ridge","camp","nest",["twig","ape","tuft"]],["marsh","hut","inlet",["fry","kui","otter"]]]){
  test(region+" 的地点可步行，各栖地能遇见三种野生灵兽，战败返回相应补给点",()=>{
    const s=ready();s.camp=s.badge=true;if(region==="marsh")assert.ok(G.sail(s));
    walk(s,gate);assert.ok(J.crossing(s,region));const start={...s.pos};
    for(const [id,site] of Object.entries(T.siteList(region))){
      const pos=T.toGrid(site.at);assert.equal(T.near(pos,region),id);assert.ok(T.route(start,pos,region));
    }
    const seen=new Set();for(const pos of T.grassCells(region)){
      assert.ok(T.walkable(pos,region));s.pos=pos;
      for(const x of [0,.26,.51,.76]){
        G.encounter(s,"wild",()=>x);seen.add(s.battle.rivals[0].kind);s.battle=null;
      }
      if(seen.size===3)break;
    }
    assert.deepEqual([...seen].sort(),kinds.sort());
    s.pos=start;assert.equal(G.encounter(s,track,fixed),false);
    walk(s,track);assert.ok(G.encounter(s,track,fixed));assert.ok(G.valid(s));assert.equal(J.crossing(s,region),false);
    s.battle.result="loss";G.leaveBattle(s);assert.equal(s.region,region==="ridge"?"coast":"cove");assert.ok(G.valid(s));
  });
}
test("两条新进化路线各按等级触发，入谱并保存演出；四种山泽伙伴能进化至终阶",()=>{
  for(const [id,to] of [["twig","raven"],["fry","glider"]]){
    const s=ready(),m=G.makeMon(id,C.evolutionLevels[id]-1,fixed);
    s.party=[m];m.xp=G.threshold(m.level)-1;G.encounter(s,"wild",fixed);
    m.skills=[{id:"dash",pp:10}];s.battle.rivals[0].hp=1;G.act(s,"move","dash",fixed);
    assert.equal(m.kind,to);assert.ok(s.seen.includes(to)&&s.caught.includes(to));
    assert.deepEqual(G.loadSave(structuredClone(s)).pendingEvolutions,[id]);
    assert.ok(C.species[id].moves.every(move=>F.teachable(m).includes(move)));
    assert.ok(fs.existsSync(path.join(__dirname,"../assets/cinema/evo-"+id+".webp")));
  }
  for(const id of ["ape","tuft","kui","otter"]){
    const m=G.makeMon(id,5,fixed);G.gain(m,99999,[]);assert.equal(m.kind,C.familyOf[id][2]);assert.equal(m.level,50);
    F.growth(m,m);assert.ok(m.ev.every(Number.isFinite));assert.ok(F.abilities[F.ability(m)]);
  }
  for(const id of Object.keys(C.species))for(const view of ["","-back"]){
    assert.ok(fs.existsSync(path.join(__dirname,"../assets/color/"+id+view+".webp")));
  }
});
test("旧存档保留徽章、通航和首领战，可以回头补做两章",()=>{
  const s=ready();s.camp=s.badge=s.secondBadge=true;delete s.chapters;
  const loaded=G.loadSave(structuredClone(s));assert.deepEqual(loaded.chapters,J.fresh());
  assert.ok(G.canBeacon(loaded));G.sail(loaded);assert.ok(G.canDuel(loaded));walk(loaded,"hut");assert.ok(J.crossing(loaded,"marsh"));
  assert.ok(G.encounter(loaded,"wild",fixed));const after=G.loadSave(structuredClone(loaded));assert.deepEqual(after.battle,loaded.battle);
});
