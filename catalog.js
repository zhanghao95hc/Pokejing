"use strict";

const MistCatalog = (() => {
  const types = {
    leaf: ["草木", "leaf"], fire: ["火焰", "flame"], water: ["水栖", "drop"],
    rock: ["岩石", "rock"], air: ["风羽", "feather"], volt: ["雷电", "bolt"], plain: ["普通", "star"]
  };
  const species = {
    moss: { no:"001", name:"筠角鹿", type:"leaf", trait:"温和可靠", role:"耐久型", desc:"竹笋般的小角逢雨便抽叶。它在林间低头时，麻雀常把它错认作一丛新竹。", stats:[62,46,61,52,54,36], moves:["bump","sprout","shelter","sap"] },
    ember:{ no:"002", name:"朱砂狐", type:"fire", trait:"机敏大胆", role:"速攻型", desc:"尾尖的火卷成一笔朱砂。夜里它卧在石阶旁，替晚归的行人照亮最后一级。", stats:[45,57,39,62,43,68], moves:["dash","cinder","call","flare"] },
    tide: { no:"003", name:"荷灯鲤", type:"water", trait:"好奇亲人", role:"均衡型", desc:"背鳍托着一盏将开的荷花。每逢涨潮，它就拨动粉白的鳍瓣，游进渡口的灯影。", stats:[54,42,50,62,58,48], moves:["bump","ripple","shelter","foam"] },
    wind: { no:"004", name:"听风鹤", type:"air", trait:"轻捷敏锐", role:"速攻型", desc:"它常在浅滩单足而立。吹过芦管的第一声风响，就足以让它舒开墨色长翮。", stats:[43,49,39,51,45,68], moves:["dash","gust","call","gale"] },
    stone:{ no:"005", name:"负砚龟", type:"rock", trait:"沉静坚定", role:"防御型", desc:"龟背的石纹围成一方天然砚池。大雨过后，池中总比山径多留一夜清水。", stats:[51,57,69,35,47,31], moves:["bump","chip","shelter","ridge"] },
    spark:{ no:"006", name:"雷纹貉", type:"volt", trait:"活泼灵巧", role:"干扰型", desc:"雷声将近时，毛间的回纹先亮起来。颈下铜铃只轻轻一响，它已经钻进檐下。", stats:[44,46,42,57,45,63], moves:["dash","jolt","call","arc"] }
  };
  const evolutions={moss:"grove",ember:"pyre",tide:"sail"};
  const adults=[
    ["moss","007","松烟麟","旧角长成苍松，鳞间透出石绿。它踏过湿苔时，身后的雾会卷成一缕松烟。",[85,65,86,73,76,47]],
    ["ember","008","丹霞三尾","三缕尾焰各有深浅。它跃过溪面的一瞬，水上像展开了一匹朱红的霞绡。",[65,80,53,87,61,95]],
    ["tide","009","踏浪螭","越过春汛后，旧鲤鳞间生出细爪。它盘起身子，把汹涌的浪头引向无人的沙洲。",[76,58,71,86,82,65]]
  ];
  for(const [base,no,name,desc,stats] of adults)
    species[evolutions[base]]={...species[base],no,name,desc,stats};
  Object.assign(species,{
    crab:{no:"010",name:"瓦当蟹",type:"rock",second:"water",trait:"稳重",role:"防御型",desc:"背上顶着一片云纹旧瓦。退潮后，它会把螯藏进瓦檐，远看像半间搁浅的小屋。",stats:[58,67,79,39,52,31],moves:["bump","chip","shelter","brine"]},
    moth:{no:"011",name:"桂月蛾",type:"air",second:"leaf",trait:"轻盈",role:"干扰型",desc:"双翅各藏一轮浅月。它爱停在桂枝背阴处，振翅时抖落一层带甜香的细粉。",stats:[54,42,46,72,62,65],moves:["gust","lull","sprout","dust"]},
    snail:{no:"012",name:"潮钟螺",type:"water",second:"volt",trait:"沉静",role:"特攻型",desc:"螺壳泛着古铜青色。每当雨点敲响壳上的云纹，浅水里便荡开细细的电光。",stats:[63,39,60,76,64,34],moves:["ripple","jolt","rain","surge"]}
  });
  // Type, power, accuracy, PP, damage category, optional effect.
  const moves = {
    bump:["肩撞","plain",44,100,30,"physical"], dash:["抢步","plain",36,100,24,"physical","quick"],
    sprout:["飞芽","leaf",45,100,20,"special"], cinder:["炭火","fire",45,100,20,"special","burn"],
    ripple:["潮珠","water",45,100,20,"special"], shelter:["抱守","plain",0,100,12,"status","guard"],
    call:["威吓声","plain",0,100,12,"status","weaken"], sap:["汲露","leaf",58,100,10,"special","drain"],
    flare:["烬光","fire",66,95,12,"special","burn"], foam:["泡沫涡","water",64,95,12,"special","slow"],
    gust:["风切","air",44,100,20,"physical"], gale:["掠风","air",64,95,12,"physical","quick"],
    chip:["掷砾","rock",47,100,20,"physical"], ridge:["叠岩","rock",68,92,12,"physical"],
    jolt:["绒电","volt",44,100,20,"special","para"], arc:["跃弧","volt",62,96,12,"special","para"],
    strain:["奋力撞击","plain",45,100,1,"physical","recoil"]
  };
  Object.assign(moves,{
    rain:["引潮歌","water",0,100,5,"status","rain"],sun:["拨云调","fire",0,100,5,"status","sun"],
    lull:["眠粉","leaf",0,75,10,"status","sleep"],dust:["桂魄粉","air",50,95,15,"physical","poison"],
    brine:["碎浪钳","water",64,100,12,"special"],surge:["潮电鸣","volt",74,90,10,"special","para"],
    focus:["凝神","plain",0,100,12,"status","focus"],needle:["盐晶刺","rock",56,100,15,"physical","poison"],
    veil:["回岬护幕","plain",0,100,8,"status","protect"],swell:["叠浪","water",60,100,10,"special","spread"]
  });
  // Earlier saves store journal entries as sentences, while the party uses stable species keys.
  const oldTerms={
    "苔角羊":species.moss.name,
    "烬尾貂":species.ember.name,
    "泡帆乌":species.tide.name,
    "丝冠鸻":species.wind.name,
    "晶背鲮":species.stone.name,
    "蒲灯鼠":species.spark.name,
    "森冠盘羊":species.grove.name,
    "流焰长貂":species.pyre.name,
    "星帆墨客":species.sail.name,
    "岬灯蟹":species.crab.name,
    "夜纱蛾":species.moth.name,
    "潮鸣螺":species.snail.name,
    "紫翅粉":moves.dust[0]
  };
  const oldTermPattern=new RegExp(Object.keys(oldTerms).join("|"),"g");
  const journalText=text=>String(text).replace(oldTermPattern,term=>oldTerms[term]);
  const affinity=kind=>[species[kind].type,species[kind].second].filter(Boolean);
  const effectiveness=(attack,kind)=>affinity(kind).reduce((v,t)=>v*matchup(attack,t),1);
  const strong = {leaf:["water","rock"],fire:["leaf"],water:["fire","rock"],air:["leaf"],rock:["fire","air"],volt:["water","air"]};
  const weak = {leaf:["leaf","fire","air"],fire:["fire","water","rock"],water:["leaf","water"],rock:["rock"],volt:["leaf","volt","rock"],air:["rock","volt"]};
  function matchup(attack,defend) {
    if(strong[attack]?.includes(defend)) return 2;
    if(weak[attack]?.includes(defend)) return .5;
    return 1;
  }
  return {types,species,moves,journalText,matchup,affinity,effectiveness,evolutions,starters:["moss","ember","tide"]};
})();
if(typeof module !== "undefined") module.exports = MistCatalog;
