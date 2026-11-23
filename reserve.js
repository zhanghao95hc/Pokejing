"use strict";

// Future habitats are independent from the encounter tables of the first two chapters.
const MistReserve=[
  { habitat:"鹿蜀原", source:"《山海经·南山经》", families:[
    {"id":"songfoal","names":["谣斑驹","踏拍骢","赤尾歌骓"],"levels":[12,27],"type":"air","second":"leaf","role":"游击型","stats":[44,64,50,54,52,85],"motif":"鹿蜀","desc":"它用尾尖给自己的蹄声打拍子。失散的马群循着山谷里的三拍短歌归队。"},
    {"id":"reedturtle","names":["啄石龟","断木旋甲"],"levels":[17],"type":"rock","second":"water","role":"守备型","stats":[78,65,77,49,70,36],"motif":"旋龟","desc":"鸟喙叩在壳沿，声音像木板裂开。它靠这声响把钻进背壳的小虫震出来。"},
    {"id":"wishgrass","names":["祝芽团"],"levels":[],"type":"leaf","second":null,"role":"支援型","stats":[78,55,72,77,89,64],"motif":"祝余","desc":"每次滚过荒坡，它背上的嫩芽都会掉下一粒。明年这条路边便多出一行野菜。"},
    {"id":"waylamp","names":["迷榖蛾"],"levels":[],"type":"volt","second":"leaf","role":"术攻型","stats":[64,54,61,99,78,73],"motif":"迷榖","desc":"翅脉里的光只在岔路上亮起来。走对了道，它又安静得像一片树皮。"},
    {"id":"redgill","names":["赤颊鲵"],"levels":[],"type":"water","second":null,"role":"守备型","stats":[88,75,96,59,80,55],"motif":"赤鱬","desc":"两腮涨红时，它就要唱歌了。山泉里回荡的细声常被误认成孩子喊渡。"}
  ]},
  { habitat:"赤砂谷", source:"《山海经·西山经》", families:[
    {"id":"firestilt","names":["丹趾雏","点炬鹭","绯翮毕方"],"levels":[13,28],"type":"fire","second":"air","role":"游击型","stats":[47,67,44,57,55,79],"motif":"毕方","desc":"落脚前先用白喙拨开枯叶；它知道哪片林地受得住自己足底的热。"},
    {"id":"chaosdrum","names":["绒囊","舞云帝囊"],"levels":[18],"type":"air","second":"fire","role":"支援型","stats":[72,40,57,71,74,49],"motif":"帝江","desc":"没有眼睛也认得鼓手。鼓心一震，六只短足便能踩出同一个拍子。"},
    {"id":"redpanther","names":["五炬狰"],"levels":[],"type":"fire","second":"rock","role":"强攻型","stats":[68,97,72,58,68,75],"motif":"狰","desc":"五条尾巴从左到右依次扬起，正好把崖边的碎石扫下去。"},
    {"id":"sentrylynx","names":["守隘驳"],"levels":[],"type":"rock","second":"air","role":"守备型","stats":[86,73,94,57,78,53],"motif":"驳","desc":"它把独角嵌进石缝睡觉。滚石经过，角根的震动就会叫醒整座关口。"},
    {"id":"cliffbee","names":["钦原金蜂"],"levels":[],"type":"volt","second":"air","role":"游击型","stats":[62,82,59,72,70,94],"motif":"钦原","desc":"翅声会随崖壁厚薄变调，蜂群因此总能从石缝背后找到空巢。"}
  ]},
  { habitat:"寒溟屿", source:"《庄子·逍遥游》", families:[
    {"id":"mistfin","names":["沫背鳍","横浦鲲","垂天云鹏"],"levels":[14,29],"type":"water","second":"air","role":"术攻型","stats":[51,41,48,86,65,60],"motif":"鲲化为鹏","desc":"年幼时用鳍丈量潮池，后来终于有了装得下整片潮影的一双翼。"},
    {"id":"whirldove","names":["蓬梢鸠","越榆鹆"],"levels":[19],"type":"air","second":null,"role":"游击型","stats":[46,66,52,56,54,87],"motif":"蜩与学鸠","desc":"它记得每一株榆树的落脚处。哪怕大风封住山口，也能贴着树冠送信。"},
    {"id":"cicadacup","names":["饮露蜩"],"levels":[],"type":"leaf","second":"air","role":"支援型","stats":[84,52,69,83,86,61],"motif":"蜩","desc":"把晨露藏进透明的翼杯。到了正午，翼上只剩一只干燥的虹。"},
    {"id":"gourlfish","names":["浮瓢鲀"],"levels":[],"type":"water","second":"leaf","role":"守备型","stats":[89,76,88,60,81,47],"motif":"大瓠","desc":"涨水时把自己翻成一只圆瓢，替不会游水的小虫渡过菜圃。"},
    {"id":"rootmarten","names":["不材栎貂"],"levels":[],"type":"leaf","second":"rock","role":"守备型","stats":[94,72,93,65,77,52],"motif":"樗树","desc":"它挑最扭曲的树洞安家。直木都搬走后，唯独它的屋顶还是绿的。"}
  ]},
  { habitat:"桂渚花市", source:"《聊斋志异·葛巾》", families:[
    {"id":"peonyveil","names":["葛蕊貂","绛袖花貂","冠霞牡丹客"],"levels":[15,30],"type":"leaf","second":"air","role":"支援型","stats":[64,41,58,63,75,50],"motif":"葛巾的牡丹","desc":"初花藏在鬓边，盛放时才铺满双肩。夜深了，它总把最外一层花瓣留给迷路的蜂。"},
    {"id":"inkbutterfly","names":["墨页蝶","钿花书蝶"],"levels":[20],"type":"air","second":"leaf","role":"术攻型","stats":[50,49,47,85,73,59],"motif":"花圃与书生","desc":"翅上没有字，偏爱在翻开的书页上睡觉。书合上时，会留下淡淡的花粉页签。"},
    {"id":"rainpearl","names":["浥露蚌"],"levels":[],"type":"water","second":"leaf","role":"守备型","stats":[87,74,95,58,79,54],"motif":"花圃晨露","desc":"它把夜里的露水滤成一颗珠，雨歇后才肯重新开壳。"},
    {"id":"petalfinch","names":["绀萼雀"],"levels":[],"type":"air","second":"leaf","role":"游击型","stats":[63,74,60,73,62,95],"motif":"牡丹花萼","desc":"混进花丛时只露出青色花萼似的小脚，直到整株牡丹开始啁啾。"},
    {"id":"rootboar","names":["翻香豚"],"levels":[],"type":"rock","second":"leaf","role":"强攻型","stats":[66,95,79,56,66,82],"motif":"牡丹根圃","desc":"它嗅得出土下的烂根，刨开一小圈便收蹄，从来不伤活根。"}
  ]},
  { habitat:"鸣秋巷", source:"《聊斋志异·促织》", families:[
    {"id":"jadechirp","names":["青豆蛩","金弦促织","鸣庭将军"],"levels":[16,31],"type":"volt","second":"rock","role":"强攻型","stats":[54,83,58,44,54,61],"motif":"小虫入斗","desc":"它以翅为弦、以砖为鼓；越是细小的裂纹，弹出的声音反而越清楚。"},
    {"id":"maptoad","names":["笺角蟾","引径丹蟾"],"levels":[21],"type":"water","second":"rock","role":"守备型","stats":[81,59,80,52,64,39],"motif":"图中的蟆","desc":"掌心的斑点像旧门栓。迷路的人跟着它跳，总会看见一口有人打水的井。"},
    {"id":"cagekatydid","names":["竹笼螽"],"levels":[],"type":"leaf","second":null,"role":"游击型","stats":[61,81,58,71,69,93],"motif":"虫笼","desc":"竹笼的影子落到身上就成了保护色。它常在门敞开时还坐着听风。"},
    {"id":"tilegecko","names":["听甓守宫"],"levels":[],"type":"rock","second":"volt","role":"游击型","stats":[57,77,63,67,65,98],"motif":"庭院斗虫","desc":"伏在砖缝里数足音，一百只虫经过，也分得出哪一只是老邻居。"},
    {"id":"milletmouse","names":["黍仓灰鼷"],"levels":[],"type":"plain","second":"leaf","role":"支援型","stats":[82,59,67,81,93,59],"motif":"饲虫的谷粒","desc":"它会拨出最小的谷粒，推到蟋蟀洞前。粗糠则被它拖回家铺床。"}
  ]},
  { habitat:"石壁画坊", source:"《聊斋志异·画壁》", families:[
    {"id":"ochrefawn","names":["赭点麂","行壁麂","出岫丹青鹿"],"levels":[17,32],"type":"rock","second":"leaf","role":"术攻型","stats":[52,45,54,82,62,56],"motif":"入画的壁面","desc":"它最早只是石壁上的一枚蹄印。下雨时，画中那条路会一直伸到廊外。"},
    {"id":"plasterbat","names":["檐粉蝠","朱栏壁蝠"],"levels":[22],"type":"air","second":"rock","role":"游击型","stats":[42,60,46,68,52,93],"motif":"旧寺彩壁","desc":"它衔着掉落的彩屑绕梁飞，暮色里便像墙上的朱栏忽然长出翅膀。"},
    {"id":"ochresnake","names":["赭线蛇"],"levels":[],"type":"rock","second":"fire","role":"强攻型","stats":[71,91,75,61,62,78],"motif":"壁上勾线","desc":"遇到断裂的墨线就沿着补一笔。画师常在次日发现山石多了一层轮廓。"},
    {"id":"brushrat","names":["洗砚花鼠"],"levels":[],"type":"water","second":"rock","role":"支援型","stats":[80,57,65,79,91,57],"motif":"画壁颜料","desc":"蘸水洗脸时把两颊染得一蓝一绿。它把这两种颜色看作自己的名字。"},
    {"id":"tileowl","names":["藻井鸮"],"levels":[],"type":"air","second":"rock","role":"守备型","stats":[82,61,86,81,96,47],"motif":"彩绘屋顶","desc":"眠在天花正中，翅一拢就是一枚端正的八瓣花。"}
  ]},
  { habitat:"炎帘关", source:"《西游记》", families:[
    {"id":"fanpup","names":["蕉耳獾","摇风獾","息焰蕉君"],"levels":[12,33],"type":"leaf","second":"air","role":"支援型","stats":[59,44,53,76,64,63],"motif":"芭蕉扇","desc":"两扇长耳能把烫人的风分到身旁。行人走在它身后，衣角都不会焦。"},
    {"id":"coalram","names":["炭角羔","赤壑炉羊"],"levels":[23],"type":"fire","second":"rock","role":"守备型","stats":[76,69,80,44,68,39],"motif":"火焰山","desc":"它把余火封在空心角里，冬天才敲开一点，烘干山道上的木桥。"},
    {"id":"gourdmole","names":["葫口鼹"],"levels":[],"type":"rock","second":null,"role":"守备型","stats":[94,72,92,57,74,52],"motif":"紫金葫芦","desc":"会往空葫芦里囤粮。对着藤口喊它的名字，只听见一阵忙着藏食的窸窣声。"},
    {"id":"ashkite","names":["流火鸢"],"levels":[],"type":"fire","second":"air","role":"游击型","stats":[62,85,52,77,68,92],"motif":"火焰山热风","desc":"一整天都不用扇翅，顺着热气便能把影子送上最远的山梁。"},
    {"id":"fordterrapin","names":["渡经老鼋"],"levels":[],"type":"water","second":"rock","role":"支援型","stats":[79,56,73,78,90,65],"motif":"通天河老鼋","desc":"它在背上留出一块干燥的壳面，送过河去的书从未湿过一个角。"}
  ]},
  { habitat:"五彩石原", source:"《淮南子·览冥训》", families:[
    {"id":"glazecko","names":["釉尾蜥","五斑岩蜥","缀穹璃龙"],"levels":[13,27],"type":"rock","second":"fire","role":"守备型","stats":[76,63,75,47,68,34],"motif":"五色石","desc":"蜕下的釉皮透得过日光。当地人将碎片嵌进屋顶，在屋里也能看见晴天。"},
    {"id":"pillarox","names":["撑石犊","负柱青牛"],"levels":[24],"type":"rock","second":"volt","role":"强攻型","stats":[59,79,63,49,50,66],"motif":"支撑天地","desc":"爱用额头抵住歪斜的石柱。它走过以后，原先叮当乱响的风铃便安静了。"},
    {"id":"skythread","names":["补隙蚕"],"levels":[],"type":"leaf","second":"air","role":"支援型","stats":[81,58,66,80,92,58],"motif":"补天意象","desc":"在窗纸的小洞上结网，清早的光穿过时，就像刚补好的天空。"},
    {"id":"emberwren","names":["衔炭鹪"],"levels":[],"type":"fire","second":"air","role":"游击型","stats":[56,64,54,83,70,94],"motif":"炼石余火","desc":"它只衔已经熄灭的木炭，在崖洞口画一圈黑线，提醒同伴风从哪里来。"},
    {"id":"cloudclam","names":["虹釉贝"],"levels":[],"type":"water","second":"rock","role":"术攻型","stats":[63,62,60,98,86,72],"motif":"五色石","desc":"壳里没有珍珠，只有一弯不散的虹。被浪翻过来时，沙滩便亮一下。"}
  ]},
  { habitat:"月杵台", source:"月宫传说与李白《古朗月行》", families:[
    {"id":"pestlekit","names":["桂杵兔","碾露玉兔","听月药君"],"levels":[14,28],"type":"leaf","second":"rock","role":"支援型","stats":[70,38,55,69,72,47],"motif":"月兔捣药","desc":"它听石臼里的声音辨认药材。磨到最后一下，连桂树上的露珠都不会惊落。"},
    {"id":"moonfrog","names":["缺月蟾","抱轮金蟾"],"levels":[25],"type":"water","second":"rock","role":"守备型","stats":[75,62,83,46,67,42],"motif":"月中有蟾","desc":"背上的金轮每夜宽窄不同。渔人据此猜月相，偶尔也会被它鼓起肚皮骗过。"},
    {"id":"laurelstag","names":["伐桂天牛"],"levels":[],"type":"leaf","second":"rock","role":"强攻型","stats":[77,104,81,48,66,67],"motif":"月桂","desc":"角齿只啃枯枝。它走过的树干上，年轮露出细细的一圈白边。"},
    {"id":"silvercarp","names":["沉月鳊"],"levels":[],"type":"water","second":null,"role":"术攻型","stats":[61,60,58,96,84,70],"motif":"水中月影","desc":"它游到水底时把水面的月影一同带走。没有月色的地方常是鱼群最多的地方。"},
    {"id":"mistmantis","names":["剪影螳"],"levels":[],"type":"air","second":"leaf","role":"游击型","stats":[65,76,62,75,64,97],"motif":"桂树影","desc":"螳臂合拢恰好像一道桂叶影。它剪过的枝条，次年往往多开一簇花。"}
  ]},
  { habitat:"笑槐坞", source:"《聊斋志异》", families:[
    {"id":"laughkit","names":["笑靥狸","簪花狸","流芳春使"],"levels":[15,29],"type":"leaf","second":"air","role":"游击型","stats":[49,57,44,66,54,85],"motif":"婴宁爱花与笑","desc":"它一开心，脸颊的小花就会颤。路人以为听见笑声，其实是一树花苞同时打开。"},
    {"id":"wallmouse","names":["穿缝鼠","入壁灰仙"],"levels":[17],"type":"rock","second":"plain","role":"游击型","stats":[49,69,46,59,57,81],"motif":"劳山道士穿墙","desc":"它会挤过比耳朵还窄的砖缝。出了墙先抖抖胡须，免得灰落进邻家的茶。"},
    {"id":"ropesquirrel","names":["攀绳松鼠"],"levels":[],"type":"air","second":"plain","role":"强攻型","stats":[65,94,78,55,65,81],"motif":"偷桃的绳戏","desc":"尾巴卷成绳扣，风再大也能挂在半空剥松仁。"},
    {"id":"marketmirage","names":["蜃楼蜗"],"levels":[],"type":"water","second":"air","role":"术攻型","stats":[70,42,67,95,85,70],"motif":"山市幻景","desc":"壳口吐出的雾里会浮现街市。凑近才发现，楼上晾的全是它爱吃的水草。"},
    {"id":"maskstoat","names":["换面鼬"],"levels":[],"type":"plain","second":"air","role":"术攻型","stats":[60,59,66,95,83,78],"motif":"画皮意象","desc":"收集落叶贴在额头。对伙伴来说，藏不住身份的从来都是它那条白尾尖。"}
  ]}
];
const MistFarForms={
  areas:MistReserve,
  register(species,lineages,familyOf,evolutions,evolutionLevels,tracks){
    const basic={leaf:"sprout",fire:"cinder",water:"ripple",rock:"chip",air:"gust",volt:"jolt",plain:"bump"};
    const habits={"守备型":"shelter","游击型":"dash","支援型":"veil","强攻型":"call","术攻型":"focus"};
    const notes=[
      ["跑过木桥时，四蹄能敲出两种音高。","长尾一扬，就能给整支马群定拍。","颈甲能把敲木声送到急流对岸。"],
      ["踝上的小火能烘干一窝湿羽。","它把林火引向裸岩，留下一条鸟兽能穿过的凉径。","四翼轮番拍打，六足一下也不踏乱。"],
      ["胸鳍轻轻一翻就能驮起小船的影子。","鱼尾还留着旧日鳞片，双翼却已能遮住海口的日光。","榆荚般的顶羽倒向哪边，它就从另一边切进风里。"],
      ["绛红花瓣盖住双肩，可护住一只避雨的幼蜂。","正午合起花冠，只在行人经过时送出一缕清香。","烫金般的翼脉在夜里投出细细的书页影。"],
      ["金翅贴住砖面，能听出脚底有没有空洞。","后腿的铜棘稳稳扣住擂台，连暴雨也冲不动。","背纹像打开的路图，铜红的趾尖会指向干燥的落脚处。"],
      ["石青色的肩斑随抬蹄连成一列远峰。","双角顶着一幅层峦，经过空廊时会落下彩色山影。","翼面红栏层层相叠，倒悬梁上犹如一截小廊。"],
      ["扇耳已经展平，一摇就能吹凉整壶茶。","叶脉分出两股风，把热灰压回山缝深处。","炉角盘成一圈，角心只露出一点温火。"],
      ["背上五块釉斑各自映出不同颜色的天空。","琉璃背脊弯成拱桥，雨光一过便能照亮沟底。","方角抵紧石壁，在崖脚撑出最后一道安全空隙。"],
      ["碾过桂露的前爪常年带着淡绿药香。","月盘缺一角的夜里，它把最后一杵药分给远行人。","腹上金轮映进水潭，连最小的蝌蚪都能借光游路。"],
      ["耳后簪着的花会在它忍笑时轻轻抖动。","长尾开出一串春花，回身时便给山路系上一条花带。","身子化入砖影，唯独尾尖始终拖着一小点灰。"]
    ];
    let nextNo=46;
    MistReserve.forEach((area,a)=>{
      for(const f of area.families){
        const line=f.names.map((_,i)=>i?f.id+(i+1):f.id);
        lineages.push(line);
        line.forEach((kind,i)=>{
          familyOf[kind]=line;
          if(i<f.levels.length){evolutions[kind]=line[i+1];evolutionLevels[kind]=f.levels[i];}
          const moves=[...new Set([basic[f.type],habits[f.role],basic[f.second]||"dash","shelter","bump"])].slice(0,3);
          moves.push(tracks[f.type][i]);
          const growth=f.levels.length===1?22:15;
          species[kind]={no:String(nextNo++).padStart(3,"0"),name:f.names[i],type:f.type,second:i===f.levels.length?f.second:null,role:f.role,trait:f.motif,
            stats:f.stats.map((n,j)=>n+i*(growth+(j===5?0:2))),moves,reserve:true,desc:i?notes[a][f.levels.length===1?2:i-1]:f.desc,
            habitat:area.habitat,source:area.source,motif:f.motif};
        });
      }
    });
  }
};
if(typeof module!=="undefined")module.exports=MistFarForms;
