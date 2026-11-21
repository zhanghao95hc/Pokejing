"use strict";
const FieldRules=(()=>{
  const C=typeof MistCatalog!=="undefined"?MistCatalog:require("./catalog.js");
  const labels=["体力","攻击","防御","特攻","特防","速度"];
  const natures=["平和","昂扬","率真","冒险","凌厉","端谨","淡泊","务实","坚韧","沉着","明朗","好奇","随和","敏悟","灵巧","宽厚","审慎","温柔","安定","耐心","果决","活泼","自在","勇进","从容"];
  const abilityByType={leaf:"roots",fire:"ember",water:"tide",air:"breeze",rock:"shell",volt:"coil"};
  const abilities={
    roots:["根脉","体力不超过三分之一时，草木招式威力提高 50%。"],
    ember:["余烬","体力不超过三分之一时，火焰招式威力提高 50%。"],
    tide:["潮心","体力不超过三分之一时，水栖招式威力提高 50%。"],
    breeze:["迎风","天气为晴朗或烈日时，速度提高 25%。"],
    shell:["层甲","岩甲可以抵挡命中要害。"],
    coil:["蓄流","受到雷电招式时吸收电流，恢复四分之一最大体力。"],
    swift:["雨航","雨天速度翻倍。"]
  };
  const ability=m=>m.kind==="snail"?"swift":abilityByType[C.species[m.kind].type];
  const stock={
    berry:{name:"露心果",price:18,desc:"携带后，体力降至一半时食用，恢复 10 点。",hold:true},
    balm:{name:"净芽果",price:24,desc:"携带后，首次出现异常状态时食用并解除异常。",hold:true},
    lens:{name:"潮纹镜",price:80,desc:"携带期间，本系攻击的伤害额外提高 10%。",hold:true},
    salves:{name:"草本药膏",price:14,desc:"恢复 22 点体力，无法唤醒倒下的伙伴。"},
    bells:{name:"结缘铃",price:12,desc:"用于野生遭遇。降低体力或附加异常能提高结缘机会。"},
    tonic:{name:"清醒露",price:16,desc:"解除一位伙伴的灼伤、麻痹、睡眠或中毒。"}
  };
  const weatherNames={clear:"晴朗",sun:"烈日",rain:"降雨"};
  const statusNames={burn:"灼伤",para:"麻痹",sleep:"睡眠",poison:"中毒"};
  const yields={moss:0,grove:0,ember:5,pyre:5,tide:3,sail:3,wind:5,stone:2,spark:5,crab:1,moth:3,snail:4};
  function natureStats(m){
    const n=m.nature??0;return [Math.floor(n/5)+1,n%5+1];
  }
  function disposition(m){
    const [up,down]=natureStats(m);return natures[m.nature??0]+" · "+(up===down?"能力均衡":labels[up]+"↑ "+labels[down]+"↓");
  }
  function stat(m,i){
    const raw=Math.floor((2*C.species[m.kind].stats[i]+m.iv[i]+Math.floor((m.ev?.[i]||0)/4))*m.level/100);
    if(i===0)return raw+m.level+12;
    const [up,down]=natureStats(m);
    return Math.floor((raw+6)*(up===down?1:up===i?1.1:down===i?.9:1));
  }
  function growth(mon,foe){
    const i=yields[foe.kind],total=mon.ev.reduce((a,b)=>a+b,0);
    const oldHP=stat(mon,0);
    mon.ev[i]+=Math.max(0,Math.min(foe.level>=8?2:1,255-mon.ev[i],510-total));
    if(mon.hp>0)mon.hp+=stat(mon,0)-oldHP;
  }
  function restock(){return {berry:2,balm:1,lens:0,tonic:2};}
  function ambient(s){return s.region==="cove"?"rain":Math.floor(s.steps/64)%3===1?"sun":"clear";}
  function initialWeather(s){const weather=ambient(s);return {weather,weatherTurns:weather==="clear"?0:5};}
  function weatherPower(b,type){
    if(b.weather==="rain")return type==="water"?1.5:type==="fire"?.5:1;
    if(b.weather==="sun")return type==="fire"?1.5:type==="water"?.5:1;
    return 1;
  }
  function endWeather(b){
    if(b.weatherTurns>0&&--b.weatherTurns===0){b.weather="clear";b.lines.push("云层散开，天气恢复晴朗。");}
  }
  function triggerHeld(m,lines){
    if(!m.hp)return;
    if(m.held==="berry"&&m.hp<=stat(m,0)/2){
      const old=m.hp;m.hp=Math.min(stat(m,0),old+10);m.held="";
      lines.push(C.species[m.kind].name+"吃掉露心果，恢复 "+(m.hp-old)+" 点体力。");
    }else if(m.held==="balm"&&m.status){
      m.held="";m.status="";m.sleep=0;lines.push(C.species[m.kind].name+"吃掉净芽果，解除异常。");
    }
  }
  function residual(m,lines){
    if(m.hp>0&&["burn","poison"].includes(m.status)){
      m.hp=Math.max(0,m.hp-Math.max(1,Math.floor(stat(m,0)/8)));lines.push(C.species[m.kind].name+"受到了"+statusNames[m.status]+"伤害。");
    }
    triggerHeld(m,lines);
  }
  function ensureMon(m){m.nature??=0;m.ev??=[0,0,0,0,0,0];m.held??="";m.sleep??=0;}
  function upgrade(s){
    if(!s||s.version!==1||!Array.isArray(s.party)||!Array.isArray(s.box)||!s.supply)return s;
    const roster=[...s.party,...s.box,...(Array.isArray(s.battle?.rivals)?s.battle.rivals:[])];
    for(const m of roster)if(m&&typeof m==="object")ensureMon(m);
    s.version=2;s.region="coast";s.coins=70;s.rod=false;s.secondBadge=false;Object.assign(s.supply,restock());
    if(s.battle){s.battle.weather="clear";s.battle.weatherTurns=0;}
    return s;
  }
  function equip(s,i,item){
    const m=s.party[i];if(s.battle||!m||m.held===item||item&&(!stock[item]?.hold||!(s.supply[item]>0)))return false;
    if(m.held)s.supply[m.held]++;if(item)s.supply[item]--;m.held=item;return true;
  }
  function buy(s,id){
    if(s.battle||!stock[id]||s.coins<stock[id].price)return false;
    s.coins-=stock[id].price;s.supply[id]++;return true;
  }
  function use(s,id,i){
    const m=s.party[i];if(!m?.hp||!(s.supply[id]>0))return false;
    if(id==="salves"&&m.hp<stat(m,0))m.hp=Math.min(stat(m,0),m.hp+22);
    else if(id==="tonic"&&m.status){m.status="";m.sleep=0;}
    else return false;
    s.supply[id]--;return true;
  }
  function teachable(m){
    const base=C.species[m.kind].moves.slice(0,m.level>=7?4:3);
    const extras={leaf:["sun","lull"],fire:["sun","focus"],water:["rain","focus","swell"],air:["lull","focus"],rock:["needle","focus"],volt:["rain","focus"]};
    return [...new Set([...base,...extras[C.species[m.kind].type],"veil"])];
  }
  function teach(s,i,id,slot){
    const m=s.party[i];if(s.battle||!m||!teachable(m).includes(id)||m.skills.some(k=>k.id===id))return false;
    if(!Number.isInteger(slot)||slot<0||slot>Math.min(3,m.skills.length))return false;
    m.skills[slot]={id,pp:C.moves[id][4]};return true;
  }
  return {labels,natures,abilities,ability,stock,weatherNames,statusNames,disposition,stat,growth,restock,ambient,initialWeather,
    weatherPower,endWeather,triggerHeld,residual,ensureMon,upgrade,equip,buy,use,teachable,teach};
})();
if(typeof module!=="undefined")module.exports=FieldRules;
