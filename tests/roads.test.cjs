"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const G=require("../game"),T=require("../trail"),J=G.chapters;
const fixed=()=>0.45;
function start(){const s=G.fresh();G.start(s,"moss",fixed);return s;}
function walk(s,site){
  const dest=T.toGrid(T.siteList(s.region)[site].at,s.region),path=T.route(s.pos,dest,s.region);
  assert.ok(path,site);for(const p of path)assert.ok(G.step(s,p,()=>.99));
  assert.equal(T.near(s.pos,s.region),site);
}
function cross(s,site,next){
  walk(s,site);assert.ok(J.walkPassage(s));assert.equal(s.region,next);assert.ok(G.valid(s));
}
for(const [number,regions] of [[1,["coast","lanternTown","bambooRoad","kiln","ridge"]],[2,["cove","saltport","saltRoad","echoCave","marsh"]]]){
  test("第"+number+"章每个落脚点陆路连通，25 处地点可达，每个出入口都有回程",()=>{
    let land=0,places=0;
    for(const id of regions){
      const area=T.areas[id],sites=Object.entries(area.sites),[w,h]=T.grid(id);
      const start=T.toGrid(sites[0][1].at,id),queue=[start],key=p=>p.x+":"+p.y,seen=new Set([key(start)]);
      for(let i=0;i<queue.length;i++){
        const {x,y}=queue[i];
        for(const p of [{x:x+1,y},{x:x-1,y},{x,y:y+1},{x,y:y-1}]){
          if(!T.walkable(p,id)||seen.has(key(p)))continue;
          seen.add(key(p));queue.push(p);
        }
      }
      for(let y=0;y<=h;y++)for(let x=0;x<=w;x++)assert.equal(T.walkable({x,y},id),seen.has(key({x,y})));
      for(const [k,d] of sites){
        const p=T.toGrid(d.at,id);assert.ok(seen.has(key(p)),id+" "+k);assert.equal(T.near(p,id),k);
        if(!T.tallGrass(p,id))assert.ok(T.route(start,p,id).every(tile=>!T.tallGrass(tile,id)));
        const gate=T.passage(id,k);if(gate)assert.deepEqual(T.passage(gate.region,gate.site),{region:id,site:k});
      }
      land+=seen.size;places+=sites.length;
    }
    assert.ok(land>6400);assert.equal(places,25);
  });
}
test("第一章从海岸步行经镇、驿道、古窑返回山岭；新档修灯须取得灯片",()=>{
  let s=start();assert.equal(G.sail(s),false);cross(s,"lab","lanternTown");assert.equal(G.encounter(s,"wild"),false);
  walk(s,"lampMaker");assert.ok(J.doErrand(s,"inspect"));cross(s,"townNorth","bambooRoad");
  walk(s,"bambooEast");assert.equal(J.walkPassage(s),false);
  cross(s,"bambooKiln","kiln");walk(s,"glassTable");assert.equal(J.doErrand(s,"amber"),false);
  cross(s,"kilnMouth","bambooRoad");walk(s,"postShelter");assert.ok(J.doErrand(s,"inspect"));
  s=G.loadSave(structuredClone(s));cross(s,"bambooKiln","kiln");walk(s,"glassTable");
  assert.ok(J.doErrand(s,"purple"));assert.equal(s.expedition.ridge,2);assert.ok(J.doErrand(s,"amber"));
  assert.equal(s.expedition.ridge,3);cross(s,"kilnMouth","bambooRoad");s.camp=true;
  cross(s,"bambooEast","ridge");walk(s,"rack");assert.ok(J.investigate(s,"inspect"));walk(s,"lantern");
  const missing=structuredClone(s);missing.expedition.ridge=0;assert.equal(J.investigate(missing,"south"),false);
  assert.ok(J.investigate(s,"south"));walk(s,"pass");assert.ok(J.crossing(s,"ridge"));assert.ok(G.canBeacon(s));
});
test("第二章渡口双向通航；从港镇取得绳索，经长堤取钟舌并走回原观测台",()=>{
  const s=start();s.badge=s.camp=true;assert.ok(G.sail(s));cross(s,"dock","saltport");
  walk(s,"shipGuild");assert.ok(J.doErrand(s,"inspect"));cross(s,"quayEast","saltRoad");
  walk(s,"tidePost");assert.ok(J.doErrand(s,"inspect"));cross(s,"dikeCave","echoCave");walk(s,"bellNiche");
  assert.ok(J.doErrand(s,"high"));assert.equal(s.expedition.marsh,2);assert.ok(J.doErrand(s,"low"));
  cross(s,"caveMouth","saltRoad");cross(s,"dikeEast","marsh");walk(s,"gauge");assert.ok(J.investigate(s,"inspect"));
  walk(s,"gong");const missing=structuredClone(s);missing.expedition.marsh=0;assert.equal(J.investigate(missing,"short"),false);
  for(const beat of ["short","short","long"])assert.ok(J.investigate(s,beat));
  walk(s,"inlet");G.encounter(s,"inlet",()=>0);G.act(s,"bell",null,()=>0);G.leaveBattle(s);
  walk(s,"landing");J.crossing(s,"marsh");walk(s,"dome");assert.ok(G.canDuel(s));
  walk(s,"dock");assert.ok(G.sail(s));assert.equal(s.region,"coast");
});
for(const [id,trainer,gift,town] of [["bambooRoad","courier","herbSlope","lanternTown"],["saltRoad","warden","saltBasket","saltport"]]){
  test(id+"草丛遇敌，路外物资领取一次，训练师可读档、落败重试并领奖",()=>{
    let s=start();s.badge=true;s.region=id;s.pos=T.toGrid(T.siteList(id)[gift].at,id);
    const item=T.siteList(id)[gift].gift,initial=s.supply[item];J.collect(s);const after=s.supply[item];assert.ok(after>initial);
    assert.ok(J.collect(s));assert.equal(s.supply[item],after);assert.equal(G.encounter(s,trainer),false);
    const grass=T.grassCells(id)[0];s.pos={x:grass.x,y:grass.y+1};s.grace=0;
    assert.ok(G.step(s,grass,()=>0));assert.equal(s.battle.rivals[0].kind,T.areas[id].wild[0]);assert.equal(s.battle.rivals[0].level,T.areas[id].level);
    s.battle=null;walk(s,trainer);assert.ok(G.encounter(s,trainer));s=G.loadSave(structuredClone(s));
    s.battle.result="loss";G.leaveBattle(s);assert.equal(s.region,town);assert.ok(G.valid(s));assert.equal(s.expedition.trained.length,0);
    cross(s,town==="lanternTown"?"townNorth":"quayEast",id);walk(s,trainer);assert.ok(G.encounter(s,trainer));const coins=s.coins;
    s.party[0]=G.makeMon("moss",45,fixed);s.party[0].skills=[{id:"dash",pp:20}];
    while(!s.battle.result){s.battle.rivals[s.battle.foe].hp=1;assert.ok(G.act(s,"move","dash",fixed));}
    assert.equal(s.battle.result,"win");assert.equal(s.coins,coins+G.trainers[trainer].reward);G.leaveBattle(s);
    assert.equal(G.encounter(s,trainer),false);assert.deepEqual(G.loadSave(structuredClone(s)).expedition.trained,[trainer]);
  });
}
test("旧档中途回程仍可续调查，新任务的半程状态不会被迁移跳过",()=>{
  const old=start();old.camp=true;old.chapters.ridge=1;delete old.expedition;
  const s=G.loadSave(old);assert.deepEqual(s.expedition.legacy,["ridge"]);assert.equal(J.hasTool(s,"ridge"),true);
  const modern=start();modern.chapters.ridge=1;modern.expedition.ridge=1;
  assert.equal(J.hasTool(G.loadSave(modern),"ridge"),false);
});
