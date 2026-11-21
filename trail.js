"use strict";

const MistTrail = (() => {
  // Navigation grid corresponds to the painted footpaths on the 3:2 coast map.
  const W=60,H=40;
  const main=[[17,71],[17,76],[21,78],[29,72],[39,71],[45,65],[44,60],[50,53],[49,46],[51,40],[55,35],[61,34],[67,29],[72,28],[78,32],[82,33]];
  const spur=[[55,35],[53,31],[52,27],[53,25]];
  const sites={
    lab:{name:"雾岬研究站",short:"研究站",icon:"home",at:[17,72],action:"休整补给",desc:"恢复全队体力和招式次数，补足结缘铃与药膏。"},
    grass:{name:"风铃草甸",short:"草甸",icon:"leaf",at:[37,63],action:"调查草丛",desc:"草叶正在轻轻摇晃，压低野生伙伴的体力后更容易结缘。"},
    camp:{name:"林间练习场",short:"练习场",icon:"flag",at:[53,26],action:"切磋对战",desc:"巡林员青禾在这里等候新搭档。战胜她即可挑战灯台。"},
    beacon:{name:"望潮灯台",short:"灯台",icon:"sun",at:[82,33],action:"挑战守灯人",desc:"守灯人岑川带着两位搭档，守护着雾岬的第一枚徽章。"}
  };
  const toGrid=([x,y])=>({x:Math.round(x*W/100),y:Math.round(y*H/100)});
  const coveSites={
    dock:{name:"盐镜渡口",short:"渡口",icon:"compass",at:[16,78],action:"返回雾岬",desc:"沿航线返回研究站，队伍和调查记录会一起带回。"},
    pool:{name:"潮声浅滩",short:"浅滩",icon:"drop",at:[40,66],action:"调查潮草",desc:"瓦当蟹和桂月蛾出没于潮草间。有钓竿时，也可以调查水下的伙伴。"},
    hut:{name:"潮汐小屋",short:"渔舍",icon:"home",at:[46.5,40],action:"拜访渔舍",desc:"守潮人提供休整与钓具，屋内的补给所接受潮币。"},
    dome:{name:"盐镜观测台",short:"观测台",icon:"star",at:[81.5,39],action:"挑战潮汐领航员",desc:"记录任意一只盐镜湾的本地伙伴后，在此挑战领航员汐弦。"}
  };
  const siteList=region=>region==="cove"?coveSites:sites;
  const coveRoad=[[16,90],[15,80],[18,76],[28,71],[34,70],[40,66],[44,62],[44,55],[47,51],[54,47],[59,44],[64,45],[70,48],[74,47],[79,41],[82,38],[83,31]];
  const coveSpur=[[45,55],[46,49],[48,44],[46,39]];
  const toPct=p=>[p.x*100/W,p.y*100/H];
  const spawn=toGrid(sites.lab.at);
  function segmentDistance(x,y,a,b) {
    const dx=b[0]-a[0],dy=(b[1]-a[1])*2/3, ax=x-a[0],ay=(y-a[1])*2/3;
    const t=Math.max(0,Math.min(1,(ax*dx+ay*dy)/(dx*dx+dy*dy)));
    return Math.hypot(ax-t*dx,ay-t*dy);
  }
  function inMeadow(x,y,region="coast") {
    if(region==="cove")return ((x-40)/4.5)**2+((y-67)/4)**2<=1;
    return ((x-38)/8)**2+((y-61)/8)**2<=1 || ((x-52)/7)**2+((y-62)/7)**2<=1;
  }
  function walkable(pos,region="coast") {
    const [x,y]=toPct(pos);
    if(inMeadow(x,y,region)) return true;
    if(region==="cove")return [coveRoad,coveSpur].some(line=>line.slice(1).some((b,i)=>segmentDistance(x,y,line[i],b)<=2.1));
    if(((x-53)/6)**2+((y-26)/4.5)**2<=1) return true;
    return [main,spur].some(line=>line.slice(1).some((b,i)=>segmentDistance(x,y,line[i],b)<=2.1));
  }
  const key=p=>p.x+","+p.y;
  function route(start,dest,region="coast") {
    if(!walkable(dest,region)) return null;
    const queue=[start], prev=new Map([[key(start),null]]);
    for(let i=0;i<queue.length;i++) {
      const p=queue[i];
      if(p.x===dest.x && p.y===dest.y) {
        const path=[]; let step=p;
        while(prev.get(key(step))) {path.push(step);step=prev.get(key(step));}
        return path.reverse();
      }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const n={x:p.x+dx,y:p.y+dy};
        if(walkable(n,region)&&!prev.has(key(n))) {prev.set(key(n),p);queue.push(n);}
      }
    }
    return null;
  }
  function near(pos,region="coast") {
    const [x,y]=toPct(pos);
    const available=siteList(region);
    return Object.keys(available).find(k=>Math.hypot(x-available[k].at[0],(y-available[k].at[1])*2/3)<4.1);
  }
  return {sites,coveSites,siteList,spawn,toGrid,toPct,walkable,inMeadow,route,near};
})();
if(typeof module !== "undefined") module.exports=MistTrail;
