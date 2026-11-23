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
  const adults=[
    ["moss","grove","007","松烟麟","旧角长成苍松，鳞间透出石绿。它踏过湿苔时，身后的雾会卷成一缕松烟。",[85,65,86,73,76,47]],
    ["ember","pyre","008","丹霞三尾","三缕尾焰各有深浅。它跃过溪面的一瞬，水上像展开了一匹朱红的霞绡。",[65,80,53,87,61,95]],
    ["tide","sail","009","踏浪螭","越过春汛后，旧鲤鳞间生出细爪。它盘起身子，把汹涌的浪头引向无人的沙洲。",[76,58,71,86,82,65]]
  ];
  for(const [base,kind,no,name,desc,stats] of adults)
    species[kind]={...species[base],no,name,desc,stats};
  Object.assign(species,{
    crab:{no:"010",name:"瓦当蟹",type:"rock",second:"water",trait:"稳重",role:"防御型",desc:"背上顶着一片云纹旧瓦。退潮后，它会把螯藏进瓦檐，远看像半间搁浅的小屋。",stats:[58,67,79,39,52,31],moves:["bump","chip","shelter","brine"]},
    moth:{no:"011",name:"桂月蛾",type:"air",second:"leaf",trait:"轻盈",role:"干扰型",desc:"双翅各藏一轮浅月。它爱停在桂枝背阴处，振翅时抖落一层带甜香的细粉。",stats:[54,42,46,72,62,65],moves:["gust","lull","sprout","dust"]},
    snail:{no:"012",name:"潮钟螺",type:"water",second:"volt",trait:"沉静",role:"特攻型",desc:"螺壳泛着古铜青色。每当雨点敲响壳上的云纹，浅水里便荡开细细的电光。",stats:[63,39,60,76,64,34],moves:["ripple","jolt","rain","surge"]}
  });
  Object.assign(species,{
    twig:{no:"013",name:"衔枝雀",type:"air",trait:"执着",role:"先手型",desc:"落下的细枝若被风吹走，它会沿山沟再捡回来。岭上的小雀总朝同一个缺口起飞。",stats:[46,51,39,40,47,66],moves:["dash","gust","sprout","gale"],habitat:"栖风岭的草窝与背风松坡。"},
    raven:{no:"014",name:"填岫鸦",type:"air",second:"rock",trait:"坚忍",role:"强攻型",desc:"它挑有棱的石子压住巢脚，再把红枝嵌进石缝。年复一年，一段裂开的崖岸被垫成了缓坡。",stats:[68,81,63,50,65,86],moves:["dash","gust","chip","gale"],habitat:"衔枝雀升至 Lv.10 时进化。"},
    ape:{no:"015",name:"白耳狌",type:"rock",trait:"善听",role:"强攻型",desc:"白耳能分辨滚石与脚步。它常抢先绕到行人面前，用一串短啸提醒哪块浮石踩不得。",stats:[60,74,62,36,47,62],moves:["dash","chip","focus","ridge"],habitat:"栖风岭山脚和风架旁的高草。"},
    tuft:{no:"016",name:"绒尾狸",type:"leaf",trait:"恋巢",role:"干扰型",desc:"尾尖沾着桃色树脂，它用这把软刷替幼鸟扫走巢底的松针。循松坡上的扫痕便能找到它。",stats:[62,43,51,66,67,52],moves:["sprout","lull","shelter","sap"],habitat:"栖风岭高草，也能在背风松坡循迹寻找。"},
    fry:{no:"017",name:"灯鳍苗",type:"water",trait:"趋光",role:"灵巧型",desc:"薄鳍在浅水中像两片橘皮。退潮时成群贴着潮尺打转，露出水面的刻线会被它们逐一照亮。",stats:[47,40,44,62,51,61],moves:["ripple","dash","rain","foam"],habitat:"鸣沙泽芦苇间，也会在归鳍汊口聚集。"},
    glider:{no:"018",name:"巡潮文鳐",type:"water",second:"air",trait:"识潮",role:"游击型",desc:"风从海上转向时，它舒开金纹长鳍，贴着潮头滑翔。船夫按鱼群落水的位置辨认深槽。",stats:[68,65,56,83,66,81],moves:["ripple","gust","rain","swell"],habitat:"灯鳍苗升至 Lv.14 时进化。"},
    kui:{no:"019",name:"磬腹夔",type:"volt",second:"rock",trait:"沉稳",role:"耐久型",desc:"它用独足踏住松软河床。雷雨欲来，肚腹的金色涡纹会嗡嗡作响，与旧渡钟遥遥相和。",stats:[76,55,71,70,52,33],moves:["jolt","chip","shelter","surge"],habitat:"鸣沙泽钟架附近的芦荡。"},
    otter:{no:"020",name:"白额潮獭",type:"water",trait:"好客",role:"支援型",desc:"天亮前把石子在肚皮上排成一行，留下最大的一颗压住渔网。村里人说这是它付的借网钱。",stats:[56,58,49,62,59,71],moves:["ripple","dash","veil","swell"],habitat:"鸣沙泽低滩与归鳍汊口。"}
  });
  // Stable species IDs and catalogue numbers also identify partners in older saves.
  const families=[
    ["moss","grove","canglin",9,21],
    ["ember","pyre","dawnfox",9,21],
    ["tide","sail","riverlong",9,21],
    ["wind","reedcrane","cloudcrane",10,21],
    ["stone","inkback","steletortoise",10,22],
    ["spark","bellbadger","stormbadger",10,21],
    ["crab","eavecrab","palacecrab",13,24],
    ["moth","cassiamoth","moonmoth",12,24],
    ["snail","chimingconch","bronzeconch",13,24],
    ["twig","raven","islandraven",10,22],
    ["ape","echoape","cragape",11,22],
    ["tuft","plumcat","springcat",11,22],
    ["fry","glider","starwing",14,25],
    ["kui","rainkui","thunderkui",14,25],
    ["otter","pearlward","tideward",12,23]
  ];
  const evolutions={},evolutionLevels={},familyOf={},lineages=[];
  for(const [base,middle,final,firstLevel,lastLevel] of families){
    const line=[base,middle,final];
    lineages.push(line);
    for(const kind of line)familyOf[kind]=line;
    evolutions[base]=middle;evolutions[middle]=final;
    evolutionLevels[base]=firstLevel;evolutionLevels[middle]=lastLevel;
  }
  const newForms=[
    ["canglin","021","苍岚瑞麟","角上老松每年只结一粒金实。山雨欲来时，它走到最高的石梁，把迷路的鹿群领出云底。",[104,81,102,91,95,63],"rock","ridge"],
    ["dawnfox","022","赤霄九尾","九条尾巴能各自控火。寒夜过桥，它收起八团尾焰，只留一团恰好照到行人的脚尖。",[80,93,69,105,78,111],null,"sun"],
    ["riverlong","023","镇涛应龙","肩头荷鳍长成双翼。春汛漫过堤脚时，它沿河心逆飞，浪头便一道道伏在它身后。",[94,77,88,107,100,83],"air","swell"],
    ["reedcrane","024","笙羽鹤","颈侧的长羽像一排笙管。它迎风侧头，浅滩上便有了分辨风向的高低两音。",[57,65,50,62,58,81],null,"focus"],
    ["cloudcrane","025","云阙仙鹤","展开长翮时，金色翼尖先触到日光。它沿着上升的风盘旋，把鹤群带过最高的山隘。",[74,87,68,80,78,102],null,"gale"],
    ["inkback","026","松墨砚龟","壳上的砚池多出一重墨纹。苔松在池沿生根，连最急的一阵山雨也溅不散池里的倒影。",[66,70,86,46,61,37],null,"needle"],
    ["steletortoise","027","驮碑玄龟","层层砚纹隆成一方青碑。水低时，它伏在河心的乱石上，让小兽顺着碑脊过河。",[87,89,109,61,83,43],"water","brine"],
    ["bellbadger","028","鸣铎貉","颈毛间长出成对的铜铎。它能把左铎摇响、右铎按住，悄声拨开挂满露珠的草叶。",[58,57,54,74,59,79],null,"focus"],
    ["stormbadger","029","镇雷铜貉","鬃间铜铎在雷雨前齐鸣。它伏低身子，让闪电沿背纹落地，护住竹棚里发抖的幼崽。",[76,73,72,94,74,98],null,"surge"],
    ["eavecrab","030","飞檐蟹","背瓦两角微微上翘。它斜行钻过浅水时，几尾小鱼便躲在檐影下，跟它一同赶潮。",[70,79,93,47,64,39],null,"needle"],
    ["palacecrab","031","海楼将军蟹","重檐从背甲上逐层拱起。退潮时，它合拢两只巨螯，把整座小楼稳稳泊在礁缝里。",[88,98,111,59,80,46],null,"ridge"],
    ["cassiamoth","032","抱桂绡蛾","桂枝状翼脉间藏着淡黄的小花。它收翅休息时，翼上的两弯细月正好贴成一朵花苞。",[65,53,57,84,74,77],null,"sap"],
    ["moonmoth","033","望舒天蛾","两轮月斑在夜里泛出银辉。无月时节，林间的幼蛾循着它的长翅尾，越过漆黑山口。",[82,72,74,102,92,94],null,"gale"],
    ["chimingconch","034","编钟螺","螺壳上长出高低错落的钟脊。浪从不同方向拍来，壳中便依次传出三种清音。",[75,50,74,88,76,40],null,"swell"],
    ["bronzeconch","035","镇海洪钟螺","壳顶的潮珠会随水位明灭。大雾锁湾时，它让低沉的钟鸣穿过水面，替渔船指出礁群。",[94,62,92,108,96,48],null,"surge"],
    ["islandraven","036","衔岳玄鸦","它能叼起一整枝山榆，双爪却只攥一颗小石。石子正好嵌住崖缝，下一枝便有了落脚处。",[87,102,83,66,83,101],null,"ridge"],
    ["echoape","037","听泉狌","白耳外缘染上一抹石绿。它单手贴住崖壁，就能从指尖的震动听出泉水藏在哪道石缝。",[73,86,75,45,61,74],null,"shelter"],
    ["cragape","038","撼岳山狌","一双石臂比老松还粗。雨夜山洪冲断栈道，它会攀在两岸之间，让最后一位行人踩过肩头。",[94,108,96,58,77,87],null,"ridge"],
    ["plumcat","039","眠花狸","耳后长出细小花苞。它用带花香的尾巴绕住雀巢，山风再凉，雏鸟也能安稳入眠。",[74,54,63,78,79,63],null,"focus"],
    ["springcat","040","护春灵狸","尾尖掠过冻土，绒毛裹住了刚破土的芽。花季过后，它的颈鬃里还藏着最后几枚春瓣。",[92,70,79,100,97,79],null,"sap"],
    ["starwing","041","星津天鳐","金鳍上亮着一列细碎星点。它夜里掠过暗潮，鳍尖落下的最后一点光，总在船头正前方。",[87,82,73,104,86,103],null,"gale"],
    ["rainkui","042","震鼓夔","独足一落，腹上的两道铜圈就齐声震响。泽里的鱼群听见这声低鼓，便向深水处散去。",[88,67,84,84,63,39],null,"rain"],
    ["thunderkui","043","唤霆苍夔","云白长鬃贴着苍青的背脊。它在暴雨里立定独足，腹鼓与雷声一答一和，响彻芦汀。",[109,84,103,104,80,46],null,"surge"],
    ["pearlward","044","抱珠獭","它把圆润的河珠抱在胸前，潜水时借珠光辨认深浅。上岸前总会挑一颗最小的留给幼獭。",[69,70,60,74,72,82],null,"foam"],
    ["tideward","045","司潮玉獭","玉色水纹从肩头一直延伸到尾梢。它用长尾拍出一条缓流，把落水的小兽托回滩头。",[86,86,79,92,90,99],null,"swell"]
  ];
  for(const [kind,no,name,desc,stats,second,move] of newForms){
    const line=familyOf[kind],parent=line[line.indexOf(kind)-1],previous=species[parent];
    species[kind]={...previous,no,name,desc,stats,second:second||previous.second,
      moves:[...previous.moves.slice(0,3),move],
      habitat:previous.name+"升至 Lv."+evolutionLevels[parent]+" 时进化。"};
  }
  function lineage(kind){
    const line=familyOf[kind];
    return line.map((stage,i)=>(i?"Lv."+evolutionLevels[line[i-1]]+" ":"")+species[stage].name).join(" → ");
  }
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
  const school=typeof MistSchool!=="undefined"?MistSchool:require("./move-school.js");
  const reserve=typeof MistFarForms!=="undefined"?MistFarForms:require("./reserve.js");
  Object.assign(moves,school.moves);
  reserve.register(species,lineages,familyOf,evolutions,evolutionLevels,school.tracks);
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
  return {types,species,moves,tracks:school.tracks,familyArts:school.familyArts,reserve:reserve.areas,journalText,matchup,affinity,effectiveness,evolutions,evolutionLevels,familyOf,lineages,lineage,starters:["moss","ember","tide"]};
})();
if(typeof module !== "undefined") module.exports = MistCatalog;
