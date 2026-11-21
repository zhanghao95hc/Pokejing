"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const T=require("../trail.js"),G=require("../game.js");
const neighbors=p=>[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy}));
const id=p=>p.x+","+p.y;

function connected(start,allowed){
  const queue=[start],seen=new Set([id(start)]);
  for(let i=0;i<queue.length;i++){
    for(const n of neighbors(queue[i])){
      if(!allowed(n)||seen.has(id(n)))continue;
      seen.add(id(n));queue.push(n);
    }
  }
  return seen;
}
for(const region of ["coast","cove"]){
  const coast=region==="coast",sites=T.siteList(region);
  const start=T.toGrid(sites[coast?"lab":"dock"].at);
  test(region+" 的开阔地全域连通、草丛可绕行，房屋和水面不可通行",()=>{
    const reachable=connected(start,p=>T.walkable(p,region));
    assert.ok(reachable.size>(T.W+1)*(T.H+1)/2);
    for(let y=0;y<=T.H;y++)for(let x=0;x<=T.W;x++){
      assert.equal(reachable.has(id({x,y})),T.walkable({x,y},region));
    }
    const blocked=coast?[[16,60],[84,27],[95,90]]:[[44,29],[84,27],[52,95]];
    for(const at of blocked)assert.equal(T.route(start,T.toGrid(at),region),null);
    for(const site of Object.values(sites)){
      const target=T.toGrid(site.at),path=T.route(start,target,region);
      assert.ok(path);assert.deepEqual(path.at(-1)||start,target);
      if(!T.tallGrass(target,region))assert.ok(path.every(p=>!T.tallGrass(p,region)));
    }
  });
  test(region+" 每片可见草丛可步行遇敌，安全地面及撞墙不触发",()=>{
    const cells=T.grassCells(region),unseen=new Set(cells.map(id));
    let patches=0;
    for(const p of cells){
      if(!unseen.has(id(p)))continue;
      const patch=connected(p,n=>T.tallGrass(n,region));
      assert.ok(patch.size>=15);
      for(const key of patch)unseen.delete(key);
      const entry=cells.find(n=>patch.has(id(n))&&neighbors(n).some(v=>T.walkable(v,region)&&!T.tallGrass(v,region)));
      const s=G.fresh();G.start(s,"moss",()=>.5);s.region=region;s.grace=0;
      s.pos=neighbors(entry).find(v=>T.walkable(v,region)&&!T.tallGrass(v,region));
      assert.ok(G.step(s,entry,()=>0));assert.equal(s.battle.mode,"wild");patches++;
    }
    assert.equal(patches,coast?5:4);
    const s=G.fresh();G.start(s,"tide",()=>.5);s.region=region;s.pos=start;s.grace=0;
    const safe=T.route(start,T.toGrid(sites[coast?"camp":"hut"].at),region);
    for(const pos of safe){assert.ok(G.step(s,pos,()=>0));assert.equal(s.battle,null);}
    const wall=coast?{x:10,y:26}:{x:27,y:13};
    s.pos=neighbors(wall).find(p=>T.walkable(p,region));const steps=s.steps;
    assert.ok(s.pos);assert.equal(G.step(s,wall,()=>0),false);assert.equal(s.steps,steps);
  });
  test(region+" 旧档站在新障碍上可接续战斗，落脚点修复可重复读取",()=>{
    const s=G.fresh();G.start(s,"moss",()=>.5);s.region=region;s.pos={x:49,y:12};
    G.encounter(s,"wild",()=>.5);
    const before=structuredClone(s),restored=G.loadSave(structuredClone(s));
    assert.ok(restored);assert.ok(T.walkable(restored.pos,region));
    assert.deepEqual(restored,{...before,pos:T.nearestGround(before.pos,region)});
    assert.deepEqual(G.loadSave(structuredClone(restored)),restored);
    assert.equal(G.loadSave({...s,pos:{x:-1,y:5}}),null);
  });
}
test("点击紧邻障碍时可选本侧落脚点，深水仍然拒绝",()=>{
  assert.deepEqual(T.nearestGround({x:10,y:26},"coast",1,T.spawn),T.spawn);
  assert.equal(T.nearestGround(T.toGrid([98,95]),"coast",1,T.spawn),null);
});
