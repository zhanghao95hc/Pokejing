"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const T=require("../trail"),G=require("../game"),C=require("../catalog");
const neighbors=({x,y})=>[{x:x-1,y},{x:x+1,y},{x,y:y-1},{x,y:y+1}];
function started(region){
  const s=G.fresh();G.start(s,"moss");s.region=region;
  s.pos=T.toGrid(Object.values(T.siteList(region))[0].at,region);return s;
}
for(const region of Object.keys(T.areas)){
  test(region+" · 同行旅人、灵兽和原有地图人物均有占格，可绕行并靠近交谈",()=>{
    const s=started(region),people=T.people(region);
    assert.ok(people.some(p=>p.pet));
    for(const person of people){
      assert.ok(fs.existsSync(path.join(__dirname,"../assets/color/npc-"+person.actor+".webp")));
      if(person.pet){assert.ok(C.species[person.pet]);assert.ok(person.line);}
      const route=T.approach(s.pos,person.id,region);
      assert.ok(route);assert.ok(route.every(p=>T.walkable(p,region)&&!T.tallGrass(p,region)));
      const end=route.at(-1)||s.pos;assert.equal(T.neighbor(end,region)?.id,person.id);
      assert.deepEqual(T.approach(end,person.id,region),[]);
      if(person.site)assert.equal(T.near(end,region),person.site);
      for(const foot of [person.pos,person.petPos].filter(Boolean)){
        assert.equal(T.walkable(foot,region),false);assert.equal(T.route(end,foot,region),null);
        const sides=neighbors(foot).filter(p=>T.walkable(p,region));assert.ok(sides.length);
        for(const stand of sides){
          s.pos=stand;const steps=s.steps;
          assert.equal(G.step(s,foot,()=>assert.fail("碰撞不应触发遇敌")),false);
          assert.deepEqual(s.pos,stand);assert.equal(s.steps,steps);
          if(!person.site)assert.equal(T.neighbor(stand,region)?.id,person.id);
        }
      }
    }
    for(const complete of [false,true]){
      for(const animal of T.sightings(region,complete))assert.equal(T.walkable(animal.pos,region),false);
    }
  });
}
test("新人物脚下的旧存档会移到附近空地，保留队伍、剧情和战斗",()=>{
  const s=started("coast");assert.ok(G.encounter(s,"wild",()=>.42));s.pos=T.people("coast")[0].pos;
  const moved=G.loadSave(structuredClone(s));assert.ok(moved);
  assert.deepEqual(moved,{...s,pos:T.nearestGround(s.pos,s.region)});
  assert.ok(T.walkable(moved.pos,moved.region));assert.deepEqual(moved,G.loadSave(structuredClone(moved)));
});
