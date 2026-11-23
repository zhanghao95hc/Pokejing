"use strict";

const MistTrail = (() => {
  // Positions use the original save grid. Outline vertices use percentages of each painting.
  const W=60,H=40;
  const atlas=typeof MistAtlas!=="undefined"?MistAtlas:require("./atlas.js");
  const grid=region=>atlas.areas[region]?.grid||[W,H];
  const sites={
    lab:{name:"雾岬研究站",short:"研究站",icon:"home",at:[16.5,67],action:"休整补给",desc:"恢复全队体力和招式次数，补足结缘铃与药膏。"},
    grass:{name:"风铃草甸",short:"草甸",icon:"leaf",at:[37,63],action:"调查草丛",desc:"草叶正在轻轻摇晃，压低野生伙伴的体力后更容易结缘。"},
    camp:{name:"林间练习场",short:"练习场",icon:"flag",at:[53,26],action:"切磋对战",desc:"巡林员青禾在这里等候新搭档。战胜她可从营地上栖风岭，为晚归的渡船修好引灯。"},
    beacon:{name:"望潮灯台",short:"灯台",icon:"sun",at:[82,33],action:"挑战守灯人",desc:"守灯人岑川带着两位搭档，守护着雾岬的第一枚徽章。"}
  };
  function toGrid([x,y],region){const [w,h]=grid(region);return {x:Math.round(x*w/100),y:Math.round(y*h/100)};}
  const coveSites={
    dock:{name:"盐镜渡口",short:"渡口",icon:"compass",at:[16,78],action:"返回雾岬",desc:"沿航线返回研究站，队伍和调查记录会一起带回。"},
    pool:{name:"潮声浅滩",short:"浅滩",icon:"drop",at:[55,78],action:"调查潮草",desc:"瓦当蟹和桂月蛾出没于潮草间。有钓竿时，也可以调查水下的伙伴。"},
    hut:{name:"潮汐小屋",short:"渔舍",icon:"home",at:[47,36],action:"拜访渔舍",desc:"守潮人提供休整与钓具，屋内的补给所接受潮币。"},
    dome:{name:"盐镜观测台",short:"观测台",icon:"star",at:[82,36],action:"挑战潮汐领航员",desc:"找回鸣沙泽的引航钟声，带一份本地灵兽的结缘记录来挑战汐弦。"}
  };
  const ridgeSites={
    pass:{name:"松关栈门",short:"栈门",icon:"compass",at:[15,80],action:"返回林间练习场",desc:"越过栈门便是青禾的营地。显眼的朱绳标着返程的路。"},
    rack:{name:"听风竹架",short:"竹架",icon:"feather",at:[43,25],action:"听竹管辨风",desc:"长短竹管依次悬起，架脚的红枝被风吹得偏向一边。"},
    lantern:{name:"石龛引灯",short:"引灯",icon:"sun",at:[79,31],action:"查看灯窗",desc:"石龛有两扇转窗。天黑前，渡工要从海上看见这里和灯台的两点灯火。"},
    nest:{name:"背风松坡",short:"松坡",icon:"leaf",at:[31,52],action:"循着扫痕找灵兽",desc:"松针之间留着细细的扫痕。蹲下顺着它走，有时能看见绒尾狸替衔枝雀清理鸟巢。"}
  };
  const marshSites={
    landing:{name:"芦汀旧埠",short:"旧埠",icon:"compass",at:[16,75],action:"返回潮汐小屋",desc:"踏着芦根间的小径，可以绕回守潮人的渔舍。"},
    gauge:{name:"双柱潮尺",short:"潮尺",icon:"drop",at:[42,26],action:"拓下潮尺刻纹",desc:"两根石柱间有鳞光闪动，石身上的旧潮痕还露在水面上。"},
    gong:{name:"回澜钟架",short:"潮钟",icon:"sun",at:[80,29],action:"查看引航钟",desc:"铜钟的余音绕泽一圈才散。引航人曾用长短不同的钟声为夜船报潮。"},
    inlet:{name:"归鳍汊口",short:"汊口",icon:"drop",at:[63,66],action:"沿鳍影探查",desc:"灯鳍苗聚在两股水流交会处。偶尔有白额潮獭从芦根下探出脑袋。"}
  };
  ridgeSites.eastPass=atlas.exit("竹林岭口",[65,62]);
  marshSites.eastReed=atlas.exit("长堤芦口",[70,67]);
  const areas={
    coast:{name:"雾岬海岸",sites,chapter:1,type:"海岸"},
    cove:{name:"盐镜湾",sites:coveSites,chapter:2,type:"湾岸"},
    ridge:{name:"栖风岭",sites:ridgeSites,chapter:1,type:"山岭"},
    marsh:{name:"鸣沙泽",sites:marshSites,chapter:2,type:"湿地"},...atlas.areas
  };
  const links={};
  for(const [a,gateA,b,gateB] of atlas.links){
    (links[a]??={})[gateA]={region:b,site:gateB};
    (links[b]??={})[gateB]={region:a,site:gateA};
  }
  const passage=(region,site)=>links[region]?.[site];
  const siteList=region=>areas[region].sites;
  function toPct(p,region){const [w,h]=grid(region);return [p.x*100/w,p.y*100/h];}
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
  terrainShapes.ridge={
    land:[[5,56],[12,47],[15,30],[25,23],[32,21],[36,15],[51,14],[59,10],[68,11],[74,22],[79,23],[85,26],[88,32],[95,40],[94,50],[87,54],[82,65],[77,68],[74,78],[61,83],[47,88],[37,92],[22,87],[15,84],[7,86],[6,77],[3,68]],
    obstacles:[[[31,13],[48,10],[49,18],[36,25],[33,21]],[[74,21],[80,19],[83,27],[78,29],[74,27]]],
    grass:[[[18,44],[27,38],[33,43],[31,51],[22,52]],[[47,30],[58,26],[65,31],[62,38],[51,38]],[[44,64],[52,59],[61,63],[59,70],[46,73]],[[72,39],[81,36],[84,44],[79,49],[72,48]]]
  };
  terrainShapes.marsh={
    land:[[4,47],[12,38],[17,27],[27,23],[33,17],[42,19],[49,16],[54,20],[65,15],[71,18],[83,17],[90,22],[93,34],[98,40],[97,55],[91,61],[87,70],[93,77],[81,80],[77,86],[61,85],[55,91],[45,90],[39,85],[25,83],[18,78],[10,83],[4,78],[5,70],[8,64],[4,55]],
    obstacles:[[[39,14],[45,12],[45,20],[40,23]],[[75,14],[87,15],[87,24],[75,25]],[[6,61],[16,58],[18,66],[7,69]]],
    grass:[[[20,36],[31,33],[36,38],[32,44],[23,45]],[[48,48],[56,43],[64,47],[64,54],[53,56]],[[70,33],[80,32],[86,38],[81,44],[73,42]],[[31,64],[39,62],[45,70],[40,76],[30,72]]]
  };
  function contains(vertices,x,y){
    let inside=false;
    for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
      const [ax,ay]=vertices[j],[bx,by]=vertices[i];
      if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax) inside=!inside;
    }
    return inside;
  }
  const cellId=(p,region)=>p.y*(grid(region)[0]+1)+p.x;
  const inBounds=(p,region)=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<=grid(region)[0]&&p.y<=grid(region)[1];
  const regions={};
  for(const [region,shape] of Object.entries({...terrainShapes,...atlas.terrain})){
    const [w,h]=grid(region);
    const residents=Object.entries(siteList(region)).filter(([,site])=>site.actor).map(([id,site])=>{
      const door=toGrid(site.at,region);
      return {id,name:site.name,actor:site.actor,site:id,pos:{x:door.x-1,y:door.y}};
    });
    const people=residents.concat(atlas.visitors[region]||[]);
    const occupied=new Set(people.flatMap(person=>[person.pos,person.petPos].filter(Boolean).map(p=>cellId(p,region))));
    for(const animal of atlas.wildlife[region]||[]){if(!animal.phase)occupied.add(cellId(animal.pos,region));}
    const cells=new Uint8Array((w+1)*(h+1)), grassCells=[];
    for(let y=0;y<=h;y++)for(let x=0;x<=w;x++){
      const pos={x,y},[px,py]=toPct(pos,region);
      if(occupied.has(cellId(pos,region))||!contains(shape.land,px,py)||shape.obstacles.some(p=>contains(p,px,py)))continue;
      const grass=shape.grass.some(p=>contains(p,px,py));
      cells[cellId(pos,region)]=grass?2:1;
      if(grass)grassCells.push(pos);
    }
    regions[region]={cells,grassCells,people};
  }
  function tile(pos,region="coast"){return inBounds(pos,region)?regions[region]?.cells[cellId(pos,region)]||0:0;}
  const walkable=(pos,region)=>tile(pos,region)>0;
  const tallGrass=(pos,region)=>tile(pos,region)===2;
  const grassCells=region=>regions[region].grassCells;
  const directions=[[1,0],[-1,0],[0,1],[0,-1]];
  function nearestGround(pos,region,limit=Infinity,from=pos){
    if(!inBounds(pos,region)||!regions[region])return null;
    if(walkable(pos,region))return pos;
    let nearest=null,best=Infinity,tie=Infinity;
    for(let y=Math.max(0,pos.y-limit);y<=Math.min(grid(region)[1],pos.y+limit);y++){
      for(let x=Math.max(0,pos.x-limit);x<=Math.min(grid(region)[0],pos.x+limit);x++){
        const d=(x-pos.x)**2+(y-pos.y)**2,approach=(x-from.x)**2+(y-from.y)**2;
        if(d>limit**2||d>best||(d===best&&approach>=tie)||!walkable({x,y},region))continue;
        nearest={x,y};best=d;tie=approach;
      }
    }
    return nearest;
  }
  function findRoute(start,arrived,region,allowGrass){
    const queue=[start],prev=new Map([[cellId(start,region),null]]);
    for(let i=0;i<queue.length;i++){
      const p=queue[i];
      if(arrived(p)){
        const path=[];
        for(let n=p;prev.get(cellId(n,region));n=prev.get(cellId(n,region)))path.push(n);
        return path.reverse();
      }
      for(const [dx,dy] of directions){
        const n={x:p.x+dx,y:p.y+dy},kind=tile(n,region);
        if(kind===0||(!allowGrass&&kind===2)||prev.has(cellId(n,region)))continue;
        prev.set(cellId(n,region),p);queue.push(n);
      }
    }
    return null;
  }
  function route(start,dest,region="coast"){
    if(!walkable(start,region)||!walkable(dest,region))return null;
    const arrived=p=>p.x===dest.x&&p.y===dest.y;
    if(!tallGrass(start,region)&&!tallGrass(dest,region)){
      const safe=findRoute(start,arrived,region,false);
      if(safe)return safe;
    }
    return findRoute(start,arrived,region,true);
  }
  const people=region=>regions[region].people;
  function sightings(region,complete){return (atlas.wildlife[region]||[]).filter(a=>!a.phase||a.phase===(complete?"after":"before"));}
  const beside=(pos,tile)=>tile&&Math.abs(pos.x-tile.x)+Math.abs(pos.y-tile.y)===1;
  function canSpeak(pos,person,region){
    return (beside(pos,person.pos)||beside(pos,person.petPos))&&(!person.site||near(pos,region)===person.site);
  }
  function neighbor(pos,region){return people(region).find(person=>canSpeak(pos,person,region));}
  function approach(start,id,region){
    const person=people(region).find(p=>p.id===id);
    if(!person||!walkable(start,region))return null;
    const arrived=p=>canSpeak(p,person,region);
    return findRoute(start,arrived,region,false)??findRoute(start,arrived,region,true);
  }
  function near(pos,region="coast"){
    const [x,y]=toPct(pos,region),available=siteList(region);
    return Object.keys(available).find(k=>Math.hypot(x-available[k].at[0],(y-available[k].at[1])*2/3)<4.1);
  }
  return {W,H,sites,coveSites,areas,grid,passage,siteList,spawn,toGrid,toPct,walkable,tallGrass,grassCells,nearestGround,route,near,people,neighbor,approach,sightings};
})();
if(typeof module!=="undefined")module.exports=MistTrail;
