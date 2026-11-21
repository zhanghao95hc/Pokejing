"use strict";

const MistTrail = (() => {
  // Positions use the original save grid. Outline vertices use percentages of each painting.
  const W=60,H=40;
  const sites={
    lab:{name:"雾岬研究站",short:"研究站",icon:"home",at:[16.5,67],action:"休整补给",desc:"恢复全队体力和招式次数，补足结缘铃与药膏。"},
    grass:{name:"风铃草甸",short:"草甸",icon:"leaf",at:[37,63],action:"调查草丛",desc:"草叶正在轻轻摇晃，压低野生伙伴的体力后更容易结缘。"},
    camp:{name:"林间练习场",short:"练习场",icon:"flag",at:[53,26],action:"切磋对战",desc:"巡林员青禾在这里等候新搭档。战胜她即可挑战灯台。"},
    beacon:{name:"望潮灯台",short:"灯台",icon:"sun",at:[82,33],action:"挑战守灯人",desc:"守灯人岑川带着两位搭档，守护着雾岬的第一枚徽章。"}
  };
  const toGrid=([x,y])=>({x:Math.round(x*W/100),y:Math.round(y*H/100)});
  const coveSites={
    dock:{name:"盐镜渡口",short:"渡口",icon:"compass",at:[16,78],action:"返回雾岬",desc:"沿航线返回研究站，队伍和调查记录会一起带回。"},
    pool:{name:"潮声浅滩",short:"浅滩",icon:"drop",at:[55,78],action:"调查潮草",desc:"瓦当蟹和桂月蛾出没于潮草间。有钓竿时，也可以调查水下的伙伴。"},
    hut:{name:"潮汐小屋",short:"渔舍",icon:"home",at:[47,36],action:"拜访渔舍",desc:"守潮人提供休整与钓具，屋内的补给所接受潮币。"},
    dome:{name:"盐镜观测台",short:"观测台",icon:"star",at:[82,36],action:"挑战潮汐领航员",desc:"记录任意一只盐镜湾的本地伙伴后，在此挑战领航员汐弦。"}
  };
  const siteList=region=>region==="cove"?coveSites:sites;
  const toPct=p=>[p.x*100/W,p.y*100/H];
  const spawn=toGrid(sites.lab.at);
  const terrainShapes={
    coast:{
      land:[[2,29],[9,27],[11,19],[22,18],[28,15],[33,13],[41,13],[46,16],[52,14],[57,16],[62,14],[69,14],[75,16],[81,16],[88,17],[92,20],[95,23],[93,30],[90,34],[89,38],[92,41],[90,46],[89,51],[89,56],[87,61],[85,66],[83,71],[79,77],[75,81],[71,87],[66,90],[62,97],[52,99],[47,95],[42,94],[36,96],[32,95],[29,97],[27,94],[24,92],[21,90],[22,86],[19,84],[15,85],[14,81],[13,78],[8,75],[7,71],[3,70],[3,66],[7,64],[6,60],[3,59],[4,54],[9,51],[10,47],[7,44],[9,41],[11,38],[10,35],[5,32]],
      obstacles:[
        [[8,61],[11,59],[12,55],[20,53],[22,57],[21,60],[24,61],[22,66],[19,66],[18,65],[9,66]],
        [[78,25],[80,22],[86,21],[89,25],[89,30],[86,32],[84,31],[81,31],[78,30]],
        [[46,19],[50,18],[50,22],[46,22]],
        [[54,19],[57,19],[57,22],[54,22]]
      ],
      grass:[
        [[21,36],[27,34],[34,36],[35,40],[31,42],[31,45],[22,45],[20,42]],
        [[27,55],[34,52],[39,52],[44,55],[44,59],[41,63.8],[34,64],[32,62],[26,62],[25,58]],
        [[61,17],[67,16],[74,18],[75,21],[72,24],[64,24],[61,22]],
        [[64,42],[71,40],[77,42],[81,46],[80,50],[75,51],[73,55],[65,54],[62,49]],
        [[50,72],[57,70],[63,71],[69,75],[68,79],[63,82],[54,83],[49,80]]
      ]
    },
    cove:{
      land:[[1,26],[8,20],[19,21],[25,16],[33,13],[43,12],[50,12],[58,10],[68,9],[76,10],[83,14],[89,14],[95,20],[96,27],[98,32],[95,37],[92,41],[94,43],[90,48],[91,52],[95,58],[90,62],[90,66],[86,69],[80,72],[76,77],[65,79],[55,83],[49,87],[37,85],[28,82],[20,80],[19,79],[20,84],[16,84],[14,80],[12,76],[9,76],[5,78],[4,74],[6,72],[3,69],[1,65]],
      obstacles:[
        [[35,31],[39,25],[46,23],[51,27],[50,33],[47,34],[41,35],[36,33]],
        [[75,28],[78,22],[86,20],[92,26],[92,33],[87,35],[85,33],[80,33],[77,34],[74,32]],
        [[10,67],[14,65],[18,67],[20,72],[17,73],[12,74],[9,72]]
      ],
      grass:[
        [[8,31],[17,29],[24,32],[24,38],[20,40],[19,43],[9,42],[6,38]],
        [[31,57],[39,56],[46,60],[45,66],[40,70],[33,69],[30,65]],
        [[61,42],[70,42],[73,45],[80,45],[82,50],[76,55],[65,54],[61,51]],
        [[48,72],[55,70],[64,71],[66,75],[61,79],[54,81],[48,79]]
      ]
    }
  };
  function contains(vertices,x,y){
    let inside=false;
    for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
      const [ax,ay]=vertices[j],[bx,by]=vertices[i];
      if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax) inside=!inside;
    }
    return inside;
  }
  const cellId=p=>p.y*(W+1)+p.x;
  const inBounds=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<=W&&p.y<=H;
  const regions={};
  for(const [region,shape] of Object.entries(terrainShapes)){
    const cells=new Uint8Array((W+1)*(H+1)), grassCells=[];
    for(let y=0;y<=H;y++)for(let x=0;x<=W;x++){
      const pos={x,y},[px,py]=toPct(pos);
      if(!contains(shape.land,px,py)||shape.obstacles.some(p=>contains(p,px,py)))continue;
      const grass=shape.grass.some(p=>contains(p,px,py));
      cells[cellId(pos)]=grass?2:1;
      if(grass)grassCells.push(pos);
    }
    regions[region]={cells,grassCells};
  }
  function tile(pos,region="coast"){return inBounds(pos)?regions[region]?.cells[cellId(pos)]||0:0;}
  const walkable=(pos,region)=>tile(pos,region)>0;
  const tallGrass=(pos,region)=>tile(pos,region)===2;
  const grassCells=region=>regions[region].grassCells;
  const directions=[[1,0],[-1,0],[0,1],[0,-1]];
  function nearestGround(pos,region,limit=Infinity,from=pos){
    if(!inBounds(pos)||!regions[region])return null;
    if(walkable(pos,region))return pos;
    let nearest=null,best=Infinity,tie=Infinity;
    for(let y=Math.max(0,pos.y-limit);y<=Math.min(H,pos.y+limit);y++){
      for(let x=Math.max(0,pos.x-limit);x<=Math.min(W,pos.x+limit);x++){
        const d=(x-pos.x)**2+(y-pos.y)**2,approach=(x-from.x)**2+(y-from.y)**2;
        if(d>limit**2||d>best||(d===best&&approach>=tie)||!walkable({x,y},region))continue;
        nearest={x,y};best=d;tie=approach;
      }
    }
    return nearest;
  }
  function findRoute(start,dest,region,allowGrass){
    const queue=[start],prev=new Map([[cellId(start),null]]);
    for(let i=0;i<queue.length;i++){
      const p=queue[i];
      if(p.x===dest.x&&p.y===dest.y){
        const path=[];
        for(let n=p;prev.get(cellId(n));n=prev.get(cellId(n)))path.push(n);
        return path.reverse();
      }
      for(const [dx,dy] of directions){
        const n={x:p.x+dx,y:p.y+dy},kind=tile(n,region);
        if(kind===0||(!allowGrass&&kind===2)||prev.has(cellId(n)))continue;
        prev.set(cellId(n),p);queue.push(n);
      }
    }
    return null;
  }
  function route(start,dest,region="coast"){
    if(!walkable(start,region)||!walkable(dest,region))return null;
    if(!tallGrass(start,region)&&!tallGrass(dest,region)){
      const safe=findRoute(start,dest,region,false);
      if(safe)return safe;
    }
    return findRoute(start,dest,region,true);
  }
  function near(pos,region="coast"){
    const [x,y]=toPct(pos),available=siteList(region);
    return Object.keys(available).find(k=>Math.hypot(x-available[k].at[0],(y-available[k].at[1])*2/3)<4.1);
  }
  return {W,H,sites,coveSites,siteList,spawn,toGrid,toPct,walkable,tallGrass,grassCells,nearestGround,route,near};
})();
if(typeof module!=="undefined")module.exports=MistTrail;
