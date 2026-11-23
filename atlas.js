"use strict";

const MistAtlas=(()=>{
  const site=(name,at,icon,action,desc,extra={})=>({name,at,icon,action,desc,...extra});
  const exit=(name,at)=>site(name,at,"compass","穿过路口","沿路标可步行前往相邻区域。",{exit:true});
  const inn=(name,at)=>site(name,at,"home","休整补给","客房可免费恢复全队体力与招式次数。也可在这里整备招式。",{service:"inn"});
  const market=(name,at)=>site(name,at,"bag","逛补给铺","货架上摆着结缘铃、药膏与携带物，使用潮币购买。",{service:"shop"});
  const areas={
    lanternTown:{name:"灯匠镇",chapter:1,type:"城镇",sites:{
      townWest:exit("海岸街口",[8,52]),townNorth:exit("竹门巷",[49,28]),
      lampInn:inn("杏黄客栈",[29,32]),lampShop:market("南街集市",[70,72]),
      lampMaker:site("灯纸作坊",[72,33],"sun","拜访灯匠桑婆","桑婆捻着半截烧黑的灯芯。旧引灯的琉璃裂了，夜船只看得见一半航标。",{actor:"lampMaker",job:"ridge"}),
      wellBench:site("花树下的石凳",[12,44],"feather","听街坊说船","卖花人记得，旧时出海的人会把引灯描在信封上，好教回乡的孩子认得它。")
    }},
    bambooRoad:{name:"竹影驿道",chapter:1,type:"野外道路",grid:[90,60],grassArt:"grass",wild:["twig","wind","ape","tuft"],level:5,sites:{
      bambooWest:exit("竹西驿口",[8,32]),bambooKiln:exit("古窑山门",[60,13]),bambooEast:exit("岭上岔口",[92,36]),
      postShelter:site("送灯驿亭",[32,41],"book","读送灯人的旧签","亭柱上还留着几块试色灯片。老驿卒把雾天透光最远的那片记在签尾。",{job:"ridge"}),
      courier:site("石标旁的驿骑",[55,52],"flag","与驿骑阿栩切磋","阿栩和听风鹤轮班送信。经过里程碑，可以请他示范如何用先手招式。",{actor:"courier"}),
      herbSlope:site("竹根药圃",[65,66],"leaf","采集竹根草","向阳坡上的草药正好成熟，采药人留了一份给赶路的伙伴。",{gift:"salves"})
    }},
    kiln:{name:"丹砂古窑",chapter:1,type:"窑址",sites:{
      kilnMouth:exit("运陶坡口",[10,80]),
      fireBed:site("龙窑火眼",[30,36],"flame","查看窑火","窑壁保留着三层不同的火色。制灯的料要送到右侧退火台，等它冷透才能装匣。"),
      glassTable:site("退火拣片台",[75,34],"sun","对照色签挑灯片","台上留着蜜黄色与烟紫色两种琉璃。挑对的灯片才能在海雾里给船掌舵。",{job:"ridge"}),
      kilnCache:site("陶罐旧库",[74,69],"bag","打开留客罐","旧库有一罐用布封着的结缘铃，罐沿刻着「留给同行人」。",{gift:"bells"})
    }},
    saltport:{name:"盐栈港",chapter:2,type:"港镇",sites:{
      quayWest:exit("湾口街门",[8,52]),quayEast:exit("盐车道口",[91,51]),
      quayInn:inn("潮生客舍",[18,34]),quayShop:market("鱼行货摊",[80,71]),
      shipGuild:site("盐运船行",[79,34],"compass","问船老大借索","船老大将一圈沉甸甸的旧索放在柜上。引航钟少了钟舌，空敲只能招来回声。",{actor:"shipGuild",job:"marsh"}),
      ropeBench:site("晾网埠头",[50,81],"drop","打听汛期","晒网的船工把三种结绳摆在船舷上，记的是顺流、逆流和泊船的水位。")
    }},
    saltRoad:{name:"潮田长堤",chapter:2,type:"野外道路",grid:[90,60],grassArt:"reeds",wild:["crab","fry","otter","kui"],level:8,sites:{
      dikeWest:exit("盐车西堤",[7,50]),dikeCave:exit("潮洞石门",[52,18]),dikeEast:exit("泽畔东堤",[91,25]),
      tidePost:site("验潮工棚",[64,31],"book","读领航员的巡堤簿","领航员记下了钟舌沉没的位置。潮声涌进石室，会从藏物的石壁传出低沉回音。",{job:"marsh"}),
      warden:site("分水标旁的巡堤人",[53,54],"flag","与巡堤人阿苇切磋","阿苇的伙伴常在雨里巡堤。想学雨天怎么应战，就到分水标下找阿苇切磋。",{actor:"warden"}),
      saltBasket:site("堤边盐篓",[24,64],"bag","拾取封好的行囊","盐篓下压着一包给夜班守堤人解乏的清醒露。",{gift:"tonic"})
    }},
    echoCave:{name:"洄声石窟",chapter:2,type:"潮洞",sites:{
      caveMouth:{...exit("石窟潮口",[12,79]),desc:"潮水刚退，青石滩上只余一层薄水。沿浅滩走到北壁，能听见石龛里的回声。"},
      chimes:site("滴声石柱",[19,28],"drop","听三柱回响","靠水的石柱回音高而空，贴近岸壁的石柱却压着低低的余响。铜器在下面。"),
      bellNiche:site("沉舟石龛",[78,24],"star","探查钟舌回声","石壁分出高鸣与低鸣两处空腔，旧绳索只够放进一处。",{job:"marsh"}),
      caveCache:site("贝纹石窝",[82,63],"bag","翻看贝纹石窝","石窝里裹着干芦叶和两颗露心果，正好够分给疲惫的伙伴。",{gift:"berry"})
    }}
  };
  // Coordinates are foot tiles. The companion stands two tiles to the indicated side.
  function traveler(id,name,x,y,pet,side,line){
    return {id,name,actor:id,pos:{x,y},pet,petPos:{x:x+side*2,y},line};
  }
  const visitors={
    coast:[
      traveler("postGirl","投书人阿缃",15,27,"twig",1,"它一路衔着这封信都没松嘴。偏偏到了研究站门口，要我拿一根好看的树枝跟它换。"),
      traveler("kiteMaker","纸鸢翁",34,16,"wind",-1,"风筝线松下来，我就看听风鹤的翅尖。它往哪边歪，哪边就要起风。")
    ],
    lanternTown:[
      traveler("cakeSeller","桂糕娘子",21,21,"moth",-1,"桂花糕刚揭笼，桂月蛾就来了。你闻见的这阵香，也有它翅膀的一份。"),
      traveler("teaSeller","茶摊老陶",40,24,"ember",1,"朱砂狐只肯替我温第二壶。头一壶太烫，它蹲得比客人还远。")
    ],
    bambooRoad:[
      traveler("flutist","制笛人小篁",39,28,"ape",1,"我吹一句，白耳狌就在竹节上敲两下。刚才那段重音，是它自己添的。"),
      traveler("herbalist","采药的菘婆",40,43,"moss",-1,"认药得等晨露散。筠角鹿已经把那株嫩芽闻了三遍，就等我点头呢。")
    ],
    kiln:[traveler("potter","陶师阿砚",31,22,"stone",1,"这只杯底的花纹是负砚龟踩的。买杯的人问我要印章，我只好把它请出来。")],
    ridge:[traveler("painter","写生客云笺",34,18,"tuft",1,"绒尾狸总想替我拂掉纸上的墨点。那是远山上的鸟呀，可别让它擦没了。")],
    cove:[
      traveler("sailor","系缆人桂姨",15,29,"otter",1,"我教潮獭打活结，它一学会，就把我的鞋带和船缆系在了一起。"),
      traveler("shellSeeker","拾贝人小螺",42,24,"snail",-1,"我把贝壳贴在耳边，它就在旁边轻轻响。你说我听到的到底是不是海？")
    ],
    saltport:[
      traveler("merchant","盐商闻叔",30,20,"crab",1,"瓦当蟹替我压着账簿。今早少算的一袋盐，还是它拿钳子点出来的。"),
      traveler("tailor","染坊小靛",13,20,"cassiamoth",1,"抱桂绡蛾停在哪块布上，我就把哪块晾到窗边。它挑中的颜色总是最先卖完。")
    ],
    saltRoad:[
      traveler("farmer","田埂老许",29,32,"spark",-1,"雷纹貉一听打雷就往我蓑衣里钻。你可别笑，它平常巡田威风得很。"),
      traveler("weaver","编苇人阿箬",71,35,"reedcrane",1,"苇席的边要编紧些。笙羽鹤昨夜在我那张旧席上睡了一宿，醒来脚趾全漏在外头。")
    ],
    echoCave:[traveler("surveyor","探洞人石青",27,22,"chimingconch",1,"听，编钟螺只响了一下。石壁把后面两声还给了它，这一笔我得记下来。")],
    marsh:[traveler("naturalist","观泽人阿浦",31,14,"kui",1,"我原想量水有多深。磬腹夔才踏了一脚，尺上的泥点倒比我还高。")]
  };
  // Story sightings change on the rock shelves. The other animals stay on the trail.
  const wildlife={
    ridge:[
      {kind:"twig",pos:{x:26,y:8},phase:"before"},{kind:"raven",pos:{x:47,y:9},phase:"after"},
      {kind:"tuft",pos:{x:17,y:20}}
    ],
    marsh:[
      {kind:"fry",pos:{x:24,y:9},phase:"before"},{kind:"kui",pos:{x:49,y:9},phase:"after"},
      {kind:"otter",pos:{x:37,y:26}}
    ]
  };
  const links=[
    ["coast","lab","lanternTown","townWest"],["lanternTown","townNorth","bambooRoad","bambooWest"],
    ["bambooRoad","bambooKiln","kiln","kilnMouth"],["bambooRoad","bambooEast","ridge","eastPass"],
    ["cove","dock","saltport","quayWest"],["saltport","quayEast","saltRoad","dikeWest"],
    ["saltRoad","dikeCave","echoCave","caveMouth"],["saltRoad","dikeEast","marsh","eastReed"]
  ];
  const terrain={
    lanternTown:{land:[[4,52],[10,45],[11,34],[22,32],[28,27],[39,29],[44,25],[49,22],[54,28],[64,32],[72,28],[79,34],[82,41],[97,44],[97,58],[81,61],[76,70],[72,77],[68,85],[70,96],[51,98],[47,83],[40,77],[27,73],[16,69],[6,65]],obstacles:[],grass:[]},
    bambooRoad:{land:[[4,26],[12,24],[24,34],[34,34],[43,24],[40,18],[50,14],[56,12],[60,9],[65,13],[72,17],[82,22],[90,31],[98,32],[94,41],[90,46],[83,55],[75,59],[69,70],[58,74],[51,89],[49,96],[42,96],[44,78],[27,75],[17,69],[14,59],[17,50],[10,44],[4,39]],obstacles:[[[20,24],[40,23],[40,35],[30,39],[22,36]]],grass:[[[17,46],[26,45],[32,48],[29,55],[19,54]],[[46,21],[53,20],[54,25],[52,30],[43,32]],[[67,30],[77,27],[85,31],[79,38],[69,39]],[[54,56],[64,55],[69,60],[63,65],[54,63]],[[26,62],[35,60],[39,65],[36,72],[29,70]]]},
    kiln:{land:[[4,80],[12,68],[12,43],[21,41],[27,35],[37,32],[47,28],[55,24],[64,25],[72,30],[80,30],[87,33],[94,37],[93,48],[88,54],[83,65],[76,72],[68,79],[55,81],[42,79],[26,79],[15,83],[5,91]],obstacles:[],grass:[]},
    saltport:{land:[[2,49],[14,46],[16,33],[20,32],[21,45],[44,46],[47,21],[60,5],[64,5],[54,27],[54,46],[73,46],[74,35],[83,32],[88,37],[83,44],[96,47],[99,48],[99,55],[82,56],[78,60],[82,65],[89,68],[93,74],[81,76],[79,83],[91,84],[90,87],[11,87],[10,84],[21,83],[22,60],[25,60],[25,82],[43,81],[47,58],[36,55],[17,55],[2,56]],obstacles:[],grass:[]},
    saltRoad:{land:[[2,42],[20,39],[33,32],[43,28],[49,23],[51,15],[55,14],[56,25],[60,31],[69,29],[77,30],[86,24],[95,13],[98,15],[92,33],[85,43],[97,44],[98,57],[95,68],[81,70],[71,74],[57,76],[43,78],[32,74],[23,74],[15,71],[5,71],[2,62]],obstacles:[],grass:[[[9,58],[17,54],[25,55],[28,60],[21,64],[12,64]],[[33,43],[40,38],[46,41],[45,47],[36,48]],[[60,57],[67,54],[73,57],[74,65],[63,67]],[[76,40],[83,36],[86,40],[83,46],[77,48]]]},
    echoCave:{land:[[2,94],[6,82],[14,75],[10,62],[7,53],[12,43],[17,39],[11,33],[16,26],[28,23],[44,20],[50,16],[62,13],[69,16],[76,23],[83,21],[88,26],[93,34],[91,45],[88,52],[93,60],[91,69],[81,78],[74,80],[67,87],[56,92],[44,85],[34,78],[24,81],[15,80],[9,87],[5,98]],obstacles:[],grass:[]}
  };
  return {areas,terrain,links,exit,visitors,wildlife};
})();
if(typeof module!=="undefined")module.exports=MistAtlas;
