"use strict";

const MistChapters=(()=>{
  const T=typeof MistTrail!=="undefined"?MistTrail:require("./trail.js");
  const chapters={
    ridge:{
      title:"风从哪边来",badge:"潮光徽章",region:"栖风岭",gate:"camp",origin:"coast",entrance:"pass",
      passage:"上山去栖风岭",clueSite:"rack",finishSite:"lantern",
      opening:"夜渡船只认得一盏灯。青禾守在岸上等信，请 Levi 上栖风岭看看另一盏为何照不出山口。",
      clue:"竹管由高到低响过一排。衔枝雀叼起红枝，顺风穿过东南豁口；往西北飞的枯叶全贴在石壁上。",
      ending:"东南灯窗一开，风抽走龛里的烟。渡工在雾里看见了双灯，把等在礁外的小船领回海岸。",
      goals:["从林间练习场进入栖风岭，到听风竹架辨认风向。","前往石龛引灯，依竹管与红枝的指向调整灯窗。","回望潮灯台，告诉岑川夜船已到岸，挑战潮光徽章。"],
      reward:"青禾留下两枚结缘铃，托你沿路照看衔枝雀。"
    },
    marsh:{
      title:"潮退三声",badge:"镜潮徽章",region:"鸣沙泽",gate:"hut",origin:"cove",entrance:"landing",
      passage:"沿芦堤去鸣沙泽",clueSite:"gauge",finishSite:"gong",
      opening:"昨夜两条船在旧盐沟搁浅。守潮人摊开半张旧谱，请 Levi 去鸣沙泽对照潮尺，找回报退潮的钟声。",
      clue:"灯鳍苗从石柱下游过，照出两道短凿痕和一道长凿痕。旧谱在同一处写着「两促一延，退水归槽」。",
      ending:"钟声两短一长，磬腹夔在泽心踏出回音。船夫循声避开浅脊，最后一条盐船也过了湾口。",
      goals:["从潮汐小屋进入鸣沙泽，到双柱潮尺拓下刻纹。","到回澜钟架，按拓片上的长短顺序敲钟。","带一份本地灵兽的结缘记录回盐镜观测台，挑战镜潮徽章。"],
      reward:"守潮人为你包好两颗露心果，留作下一程的口粮。"
    }
  };
  const errands={
    ridge:{
      sites:["lampMaker","postShelter","glassTable"],item:"透雾灯片",
      goals:["从雾岬研究站进灯匠镇，找灯纸作坊的桑婆。","从镇北竹门巷走上竹影驿道，读送灯驿亭的色签。","从驿道的古窑山门进丹砂古窑，在退火拣片台挑选灯片。"],
      lines:["桑婆递给你一个空灯匣：「从前每次送灯，都要在驿亭记下料色。你去看看，那一页还在不在。」","旧签上写着：浓雾里，烟紫片的光散在脚边，蜜黄片能照到第三根船桩。你把签上的色样拓了下来。","蜜黄色的灯片滑进灯匣，严丝合缝。带它去栖风岭的石龛引灯。"],
      choices:[["amber","装入蜜黄灯片"],["purple","装入烟紫灯片"]],answer:"amber",miss:"烟紫的光只落到脚边。比一比旧签上的船桩记号，再挑一片。"
    },
    marsh:{
      sites:["shipGuild","tidePost","bellNiche"],item:"青铜钟舌",
      goals:["从盐镜渡口进盐栈港，找盐运船行的船老大。","从港东盐车道口上潮田长堤，到验潮工棚翻看巡堤簿。","从长堤的潮洞石门进洄声石窟，在沉舟石龛打捞钟舌。"],
      lines:["船老大把打捞索交给你：「钟舌滚进了潮洞。巡堤人听见过它，工棚里留着当天的记录。」","巡堤簿写着：空石腔回声尖，压着铜器的石腔回声低。你在绳头系了个方便套住铜环的结。","绳索一紧，沉在石龛里的青铜钟舌露出水面。带它去鸣沙泽的回澜钟架。"],
      choices:[["high","放索到高鸣处"],["low","放索到低鸣处"]],answer:"low",miss:"绳头碰到光滑的空石壁。收回绳索，听一听另一处的回声。"
    }
  };
  function expedition(){return {ridge:0,marsh:0,claimed:[],trained:[],legacy:[]};}
  function validExpedition(e){
    return e&&Object.keys(errands).every(id=>Number.isInteger(e[id])&&e[id]>=0&&e[id]<=3)
      &&[["claimed",["herbSlope","kilnCache","saltBasket","caveCache"]],["trained",["courier","warden"]],["legacy",Object.keys(errands)]].every(([key,allowed])=>Array.isArray(e[key])&&e[key].every(id=>allowed.includes(id)));
  }
  function hasTool(s,id){return s.expedition[id]===3||s.expedition.legacy.includes(id);}
  function goal(s,id){return hasTool(s,id)?chapters[id].goals[s.chapters[id]]:errands[id].goals[s.expedition[id]];}
  function doErrand(s,action){
    if(!s.starter||s.battle)return false;
    const site=T.near(s.pos,s.region),id=T.siteList(s.region)[site]?.job;
    if(!id)return false;
    const e=errands[id],stage=s.expedition[id],station=e.sites.indexOf(site);
    if(station!==stage){s.notice=station<stage?e.lines[station]:e.goals[stage];return action==="inspect";}
    if(stage===2){
      if(!e.choices.some(([key])=>key===action))return false;
      if(action!==e.answer){s.notice=e.miss;return true;}
    }else if(action!=="inspect")return false;
    s.notice=e.lines[stage];s.expedition[id]++;return true;
  }
  function collect(s){
    const site=T.near(s.pos,s.region),item=T.siteList(s.region)[site]?.gift;
    if(!s.starter||s.battle||!item)return false;
    if(s.expedition.claimed.includes(site)){s.notice="这一份行旅补给已经收进了行囊。";return true;}
    const count=item==="tonic"?1:2;
    s.expedition.claimed.push(site);s.supply[item]+=count;
    s.notice="收进行囊："+({salves:"药膏",bells:"结缘铃",tonic:"清醒露",berry:"露心果"}[item])+" ×"+count+"。";return true;
  }
  function walkPassage(s){
    if(!s.starter||s.battle)return false;
    const gate=T.passage(s.region,T.near(s.pos,s.region));if(!gate)return false;
    if(gate.region==="ridge"&&!open(s,"ridge")){s.notice="青禾还守着岭口。先回雾岬海岸的林间练习场，与她切磋。";return false;}
    if(T.areas[gate.region].chapter===2&&!s.badge)return false;
    s.region=gate.region;s.pos=T.toGrid(T.siteList(s.region)[gate.site].at,s.region);
    s.grace=5;s.notice="抵达"+T.areas[s.region].name+" · "+T.siteList(s.region)[gate.site].name;return true;
  }
  function fresh(){return {ridge:0,marsh:0,beats:0};}
  function valid(p){
    return !!p&&["ridge","marsh","beats"].every(k=>Number.isInteger(p[k])&&p[k]>=0&&p[k]<=2)
      &&(!p.beats||p.marsh===1);
  }
  function open(s,id){return id==="ridge"?(s.camp||s.badge):s.badge;}
  function crossing(s,id){
    const c=chapters[id];if(!c||!s.starter||s.battle||!open(s,id))return false;
    const at=T.near(s.pos,s.region);
    if(s.region===c.origin&&at===c.gate){
      s.region=id;s.pos=T.toGrid(T.siteList(id)[c.entrance].at);
      s.notice=s.chapters[id]===0?c.opening:"回到"+c.region+"。";
    }else if(s.region===id&&at===c.entrance){
      s.region=c.origin;s.pos=T.toGrid(T.siteList(c.origin)[c.gate].at);
      s.notice="回到"+T.siteList(c.origin)[c.gate].name+"。";
    }else return false;
    s.grace=5;return true;
  }
  function options(s,site){
    const c=chapters[s.region];
    if(!c||site!==c.finishSite||(s.chapters[s.region]!==1||!hasTool(s,s.region)))return [];
    return s.region==="ridge"?[["north","推开西北窗"],["south","推开东南窗"]]:[["short","敲一声短钟"],["long","敲一声长钟"]];
  }
  function investigate(s,action){
    const id=s.region,c=chapters[id];
    if(!s.starter||s.battle||!c)return false;
    const site=T.near(s.pos,id),p=s.chapters;
    if(site!==c.finishSite&&site!==c.clueSite)return false;
    if(action==="inspect"){
      if(site===c.clueSite){p[id]=Math.max(p[id],1);s.notice=c.clue;}
      else s.notice=p[id]===2?c.ending:!hasTool(s,id)?"此处缺少"+errands[id].item+"。"+goal(s,id):p[id]===0?c.goals[0]:c.clue;
      return true;
    }
    if(!options(s,site).some(([key])=>key===action))return false;
    if(id==="ridge"&&action==="north"){s.notice="一股烟迎面扑来，衔枝雀绕回了东南侧。可以重新调窗。";return true;}
    if(id==="marsh"){
      if(action!==(p.beats===2?"long":"short")){
        p.beats=0;s.notice="回音杂在一起，船仍系在岸边。等回声散去，再从第一声敲起。";return true;
      }
      if(action==="short"){
        p.beats++;s.notice=p.beats===1?"第一声短钟落在近滩。":"第二声短钟传过石柱，远处的船夫举起了篙。";return true;
      }
      p.beats=0;
    }
    p[id]=2;s.supply[id==="ridge"?"bells":"berry"]+=2;s.notice=c.ending+c.reward;
    return true;
  }
  return {chapters,errands,expedition,validExpedition,hasTool,goal,doErrand,collect,walkPassage,fresh,valid,open,crossing,options,investigate};
})();
if(typeof module!=="undefined")module.exports=MistChapters;
