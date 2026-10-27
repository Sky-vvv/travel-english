// ---------- 单元测试卷：按单元的单词、句子和短文自动出题，可在手机上答，也可打印 ----------
// 题型参照常见的单元测试卷：听音选图、听音选词、听音选句、补全单词、选出不同类、单项选择、情景交际、阅读判断。

// 单词分类，用于“选出不同类的一项”和出干扰项
const CATS={
  '动物':'cat dog duck pig bird rabbit monkey panda tiger elephant bear cow horse sheep goat hen fish',
  '颜色':'red yellow blue green purple pink white black brown orange',
  '数字':'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty',
  '家人':'father mother dad mum brother sister grandpa grandma baby uncle aunt cousin',
  '身体':'head face eye ear nose mouth hand arm leg foot',
  '水果':'apple banana pear grape orange',
  '食物':'bread egg milk juice meat rice noodles candy tomato potato carrot corn',
  '文具':'ruler pencil eraser book bag crayon',
  '玩具':'ball doll kite robot boat plane car',
  '心情':'happy sad angry afraid worried',
  '天气':'sunny rainy windy cloudy snowy',
  '冷热':'hot cold warm cool',
  '季节':'spring summer autumn winter',
  '衣服':'coat sweater T-shirt shorts jacket scarf gloves hat shoes shirt skirt dress cap',
  '地点':'park school hospital supermarket library zoo farm cinema bookstore city village street classroom kitchen bedroom',
  '职业':'teacher student doctor nurse farmer pilot coach scientist postman fisherman businessman driver writer cleaner',
  '学科':'Chinese maths music art PE English',
  '植物':'tree flower grass leaf seed',
  '比较级':'taller shorter older younger longer bigger smaller heavier thinner stronger',
  '过去式':'cleaned washed stayed watched slept did went played visited ate hurt rode bought took saw'
};
const NOSWAP=['过去式','比较级'];
const CAT={};const CATW={};
for(const [c,ws] of Object.entries(CATS)){CATW[c]=ws.split(' ');for(const w of CATW[c])(CAT[w.toLowerCase()]=CAT[w.toLowerCase()]||[]).push(c);}
const catsOf=w=>CAT[String(w).toLowerCase()]||[];
const sameCat=(a,b)=>catsOf(a).some(c=>catsOf(b).includes(c));

// 固定种子的随机数：同一单元同一套题每次打开都一样
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296;};}
function rshuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const L='ABCD';
const CN_NUM='一二三四五六七八九十';
const hasWord=(sent,w)=>new RegExp('(^|[^A-Za-z\'’-])'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^A-Za-z\'’-])','i').test(sent);
const isWord=w=>/^[A-Za-z][A-Za-z-]*$/.test(w);

// 反义词，用来出“不相符”的句子
const ANT={};const ANTCN={bad:'不好',lighter:'更轻的',weaker:'更弱的',short:'矮',long:'长',slow:'慢',noisy:'吵闹',young:'年轻',fat:'胖',late:'晚',early:'早',down:'下',small:'小',big:'大',left:'左',right:'右'};
'tall-short big-small long-short old-young new-old happy-sad hot-cold warm-cool fast-slow cheap-expensive quiet-noisy thin-fat early-late before-after black-white good-bad taller-shorter older-younger bigger-smaller heavier-lighter stronger-weaker'
  .split(' ').forEach(p=>{const[a,b]=p.split('-');if(!ANT[a])ANT[a]=b;if(!ANT[b])ANT[b]=a;});
const VOC={};
for(const b of BOOKS)for(const u of b.units)for(const x of u.w){const w=W(x);const k=w.en.toLowerCase();if(!VOC[k])VOC[k]=w.cn.split('；')[0];}
const reWord=w=>new RegExp('(^|[^A-Za-z\'’-])('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?=$|[^A-Za-z\'’-])','i');
const wordS=(en,cn)=>({en,cn:cn||'',map:cn?en+'='+cn:''});

function makeTest(b,i,set){
  const r=rng(b.id+'-'+i+'-'+set);
  const u=b.units[i];
  const uw=u.w.map(W);
  const bookW=b.units.flatMap(x=>x.w.map(W));
  const others=bookW.filter(w=>!uw.some(x=>x.en===w.en));
  const pick=(arr,n)=>rshuffle(arr,r).slice(0,n);
  const sents=[...u.s.map(P),...u.p.s.map(P)];
  // 只用这一册和之前学过的单词，避免出现没学过的词
  const known=new Set(BOOKS.slice(0,BOOKS.indexOf(b)+1).flatMap(x=>x.units.flatMap(y=>y.w.map(z=>W(z).en.toLowerCase()))));
  const catW=c=>CATW[c].filter(w=>known.has(w.toLowerCase()));
  function distract(ans,n,pool){
    const cand=rshuffle(pool.filter(w=>w.en!==ans.en&&w.cn!==ans.cn&&w.em!==ans.em),r);
    const seen=new Set();const out=[];
    for(const w of cand){if(seen.has(w.en))continue;seen.add(w.en);out.push(w);if(out.length>=n)break;}
    return out;
  }
  function choice(ans,dis){const opts=rshuffle([ans,...dis],r);return{opts,ans:opts.indexOf(ans)};}
  // 把句子里的一个本单元单词换成同类的别的词，得到一句“不一样”的句子（中文翻译也跟着换）
  function swapSentence(s,ant){
    // 默认换成同类的词；ant 时换成反义词（tall→short）
    const words=s.en.match(/[A-Za-z']+/g)||[];
    const inSent=ant?rshuffle(words.filter(w=>ANT[w.toLowerCase()]&&!hasWord(s.en,ANT[w.toLowerCase()])&&!new RegExp('metres? '+w,'i').test(s.en)),r).map(w=>({en:w}))
      :rshuffle(uw.filter(w=>hasWord(s.en,w.en)&&catsOf(w.en).some(c=>!NOSWAP.includes(c))),r);
    for(const w of inSent){
      const pl=x=>/s$/i.test(x);
      const rep=ant?ANT[w.en.toLowerCase()]:rshuffle(catW(catsOf(w.en).find(c=>!NOSWAP.includes(c))).filter(x=>x.toLowerCase()!==w.en.toLowerCase()&&!hasWord(s.en,x)&&pl(x)===pl(w.en)),r)[0];
      if(!rep)continue;
      let actual='';
      const en=s.en.replace(reWord(w.en),(m,p1,p2)=>{actual=p2;return p1+(p2[0]===p2[0].toUpperCase()?rep[0].toUpperCase()+rep.slice(1):rep);});
      let cn='',map='';
      const ents=(s.map||'').split(';');const k=ents.findIndex(x=>x.split('=')[0].toLowerCase()===actual.toLowerCase());
      const piece=k>=0?ents[k].split('=')[1]:'';let ncn=VOC[rep.toLowerCase()]||ANTCN[rep.toLowerCase()];
      if(ncn&&piece&&!piece.endsWith('的'))ncn=ncn.replace(/的$/,'');
      if(piece&&!piece.includes('+')&&ncn&&s.cn.includes(piece)){
        cn=s.cn.replace(piece,ncn);ents[k]=rep+'='+ncn;map=ents.join(';');
      }
      if(!cn)continue;
      return{en,cn,map};
    }
    return null;
  }
  const SEC=[];
  // 一、听音选图
  {let pp=uw.filter(w=>catsOf(w.en).length);if(pp.length<5)pp=pp.concat(rshuffle(uw.filter(w=>!pp.includes(w)),r));
   const items=pick(pp,5).map(w=>{const c=choice(w,distract(w,2,pp));return{type:'choice',listen:w.en,pic:1,opts:c.opts.map(o=>({kind:'pic',em:o.em,en:o.en})),ans:c.ans};});
   SEC.push({title:'听录音，选出与你所听内容相符的图片。',pts:2,listen:1,items});}
  // 二、听音选词
  {const items=pick(uw,5).map(w=>{const c=choice(w,distract(w,2,uw));return{type:'choice',listen:w.en,opts:c.opts.map(o=>({kind:'s',s:wordS(o.en),ns:1})),ans:c.ans};});
   SEC.push({title:'听录音，选出你所听到的单词。',pts:2,listen:1,items});}
  // 三、听音选句
  {const pool=rshuffle(sents.filter(s=>s.en.split(' ').length<=9),r);const items=[];
   for(const s of pool){if(items.length>=5)break;
     if(items.some(it=>it.listen===s.en))continue;
     let other=swapSentence(s);
     if(!other){const o=pool.find(x=>x.en!==s.en&&!items.some(it=>it.listen===x.en));if(!o)continue;other=o;}
     const opts=rshuffle([s,other],r);items.push({type:'choice',listen:s.en,col:1,opts:opts.map(o=>({kind:'s',s:o,ns:1})),ans:opts.indexOf(s)});}
   SEC.push({title:'听录音，选出你所听到的句子。',pts:2,listen:1,items});}
  // 四、看图补全单词
  {let pool=uw.filter(w=>isWord(w.en)&&w.en.length>=3);if(pool.length<5)pool=pool.concat(others.filter(w=>isWord(w.en)&&w.en.length>=3));
   const items=pick(pool,5).map(w=>{
     const n=w.en.length>=6?2:1;const idx=rshuffle([...Array(w.en.length).keys()].filter(k=>w.en[k]!=='-'),r).slice(0,n);
     const pat=w.en.split('').map((c,k)=>idx.includes(k)?'_':c).join(' ');
     return{type:'fill',q:`<span class="tem">${w.em}</span> ${esc(w.cn)}　<span class="pat">${esc(pat)}</span>`,ans:w.en};});
   SEC.push({title:'看图和中文，补全单词（在横线上写出完整的单词）。',pts:2,items});}
  // 五、选出不同类的一项
  {const cats=rshuffle(Object.keys(CATS).filter(c=>catW(c).length>=3),r);
   const unitCats=rshuffle([...new Set(uw.flatMap(w=>catsOf(w.en)))],r);
   const order=[...unitCats,...cats.filter(c=>!unitCats.includes(c))];const items=[];
   for(const c of order){if(items.length>=5)break;
     const inUnit=uw.map(w=>w.en).filter(w=>catsOf(w).includes(c));
     const two=[...new Set([...rshuffle(inUnit,r),...rshuffle(catW(c),r)])].filter(w=>catsOf(w).length===1).slice(0,2);
     if(two.length<2)continue;
     const otherCat=rshuffle(Object.keys(CATS).filter(x=>x!==c&&catW(x).length),r)[0];
     const odd=rshuffle(catW(otherCat).filter(w=>!catsOf(w).includes(c)&&catsOf(w).length===1),r)[0];if(!odd)continue;
     const opts=rshuffle([...two,odd],r);
     items.push({type:'choice',opts:opts.map(o=>({kind:'s',s:wordS(o,VOC[o.toLowerCase()])})),ans:opts.indexOf(odd),why:`${odd} 和另外两个不是一类（${two.join('、')} 都是${c}）`});}
   SEC.push({title:'从下列每组单词中选出不同类的一项。',pts:2,items});}
  // 六、单项选择（根据中文提示选词填空）
  {const items=[];
   const tryPool=[uw,bookW];
   for(const pool of tryPool)for(const s of rshuffle(sents,r)){if(items.length>=10)break;
     if(items.some(it=>it.src===s.en))continue;
     const cand=rshuffle(uw.filter(w=>hasWord(s.en,w.en)),r)[0];if(!cand)continue;
     const re=reWord(cand.en);const actual=s.en.match(re)[2];
     const dis=distract(cand,2,pool.filter(w=>!hasWord(s.en,w.en)&&!sameCat(w.en,cand.en)));
     if(dis.length<2)continue;
     const fix=w=>actual[0]===actual[0].toUpperCase()&&w.en[0]!==w.en[0].toUpperCase()?w.en[0].toUpperCase()+w.en.slice(1):w.en;
     const c=choice(cand,dis);
     const ents=(s.map||'').split(';').filter(x=>x.split('=')[0].toLowerCase()!==actual.toLowerCase());
     items.push({type:'choice',src:s.en,q:{s:{en:s.en.replace(re,'$1______'),cn:s.cn,map:ents.join(';')},cnAlways:1},opts:c.opts.map(o=>({kind:'s',s:wordS(fix(o))})),ans:c.ans});}
   // 句子不够 10 道时，用“看中文选单词”补足
   for(const w of rshuffle(uw,r)){if(items.length>=10)break;
     if(items.some(it=>it.word===w.en))continue;
     const c=choice(w,distract(w,2,uw.length>4?uw:bookW));
     items.push({type:'choice',word:w.en,q:{h:`「${esc(w.cn)}」的英文是：`},opts:c.opts.map(o=>({kind:'s',s:wordS(o.en)})),ans:c.ans});}
   SEC.push({title:'单项选择（根据中文意思选出正确的词）。',pts:2,items});}
  // 七、情景交际
  {const pool=rshuffle(u.s.map(P),r);const items=[];
   for(const s of pool){if(items.length>=5)break;
     const dis=rshuffle(sents.filter(x=>x.en!==s.en&&x.cn!==s.cn),r).slice(0,2);
     const opts=rshuffle([s,...dis],r);
     items.push({type:'choice',q:{h:`想用英语说「${esc(s.cn)}」，你可以说：`},col:1,opts:opts.map(o=>({kind:'s',s:o,nocn:1})),ans:opts.indexOf(s)});}
   SEC.push({title:'情景交际。',pts:2,items});}
  // 八、阅读理解：判断正误
  {const ps=u.p.s.map(P);const items=[];
   const order=rshuffle(ps.slice(1),r);let nFalse=0;
   for(const s of order){if(items.length>=5)break;
     const sw=(nFalse<2||r()<0.4)?(swapSentence(s)||swapSentence(s,1)):null;
     if(sw){nFalse++;items.push({type:'tf',q:{s:sw},ans:false,why:`短文里是：${s.en}`});}
     else items.push({type:'tf',q:{s},ans:true});}
   SEC.push({title:'阅读短文，判断下列句子与短文内容是(T)否(F)相符。',pts:4,passage:u.p,items});}
  return SEC.filter(x=>x.items.length);
}

// ---------- 渲染 ----------
// 一句英文：点 🔊 读整句，点单词读单词，下面对应的中文变色
// 句子不给整句中文：点哪个词，就只显示那个词的中文
const FW={i:'我',you:'你',he:'他',she:'她',it:'它',we:'我们',they:'他们',me:'我',him:'他',us:'我们',them:'他们',my:'我的',your:'你的',his:'他的',her:'她的',its:'它的',our:'我们的',their:'他们的',
a:'一（个）',an:'一（个）',the:'这／那',is:'是',am:'是',are:'是',was:'是（过去）',were:'是（过去）',be:'是',to:'到；去',too:'也',and:'和',or:'或者',but:'但是',at:'在',in:'在……里',on:'在……上',under:'在……下面',of:'……的',from:'来自',
this:'这个',that:'那个',these:'这些',those:'那些',what:'什么',where:'哪里',when:'什么时候',how:'怎样',who:'谁',why:'为什么',which:'哪个',yes:'是的',no:'不',not:'不',with:'和……一起',for:'为了；给',can:'能',do:'做',does:'做',did:'做（过去）',
"don't":'不',"doesn't":'不',"can't":'不能',"it's":'它是',"i'm":'我（是）',"what's":'……是什么',"let's":'让我们',"that's":'那是',"he's":'他是',"she's":'她是',"you're":'你是',"they're":'他们是',"we're":'我们是',"isn't":'不是',"aren't":'不是',"i'd":'我想',"i'll":'我将',"we'll":'我们将',"name's":'名字是',
very:'非常',so:'如此；所以',now:'现在',then:'然后',ask:'问',says:'说',say:'说',see:'看见',like:'喜欢',have:'有',has:'有',go:'去',come:'来',let:'让',please:'请',here:'这里',there:'那里',some:'一些',all:'所有',about:'关于',up:'向上',
sarah:'萨拉（人名）',mike:'迈克（人名）',john:'约翰（人名）',amy:'埃米（人名）',chen:'陈',jie:'洁',wu:'吴',binbin:'斌斌',zhang:'张',peng:'鹏',oliver:'奥利弗（人名）',zhou:'周',yang:'杨',ming:'明',mr:'先生',by:'乘坐；通过',many:'许多',going:'去',take:'拿；带；乘坐',next:'下一个；旁边',had:'有；吃（过去）',rode:'骑（过去）',saw:'看见（过去）',took:'拿；带（过去）',fell:'摔倒（过去）',bought:'买（过去）',watched:'看（过去）',make:'做',look:'看',get:'得到',put:'放',give:'给',play:'玩；踢',playing:'玩',day:'天',each:'每个',other:'其他的',over:'在……上方；结束',off:'离开',down:'向下',away:'离开',years:'年',words:'单词',word:'单词',turn:'转弯',try:'试',set:'摆放',people:'人们',week:'星期',evening:'晚上',long:'长的',slow:'慢的',right:'右边；对的',left:'左边',deep:'深的',line:'线；排队',room:'房间',bed:'床',mrs:'太太',miss:'小姐',ms:'女士'};
function wordCn(t,parts,g,sen){
  if(g>=0){const c=parts.filter(p=>p.g===g).map(p=>p.t).join('…').replace(/^[，。！？、“”：；\s]+|[，。！？、“”：；\s]+$/g,'');if(c)return c;}
  const k=t.toLowerCase().replace(/’/g,"'");
  const v=VOC[k]||FW[k]||(k.endsWith("'s")&&(VOC[k.slice(0,-2)]||FW[k.slice(0,-2)]))||(k.endsWith('es')&&VOC[k.slice(0,-2)])||(k.endsWith('s')&&VOC[k.slice(0,-1)]);
  if(v)return v;
  const ing=k.endsWith('ing')&&(VOC[k.slice(0,-3)]||VOC[k.slice(0,-3)+'e']||VOC[k.slice(0,-4)]);if(ing)return ing;
  // 词组里的词（police officer、watch TV）：用整个词组的中文
  const ph=Object.keys(VOC).find(x=>x.includes(' ')&&hasWord(x,k)&&hasWord(sen||'',x));
  return ph?VOC[ph]:'';
}
// 按整句意思给每个词的中文：先找这句话（或它出自的原句）的逐词意思
const TOK=/[A-Za-z0-9]+(?:['’.\-][A-Za-z0-9]+)*/g;
const GL=new Map((typeof GLOSS!=='undefined'?GLOSS:[]).map(l=>{const[en,g]=l.split('|');const w=en.match(TOK)||[],m=g.trim().split(/\s+/);return[en,w.map((x,i)=>[x.toLowerCase(),m[i]])];}));
const GLC=new Map();
function glossFor(en){
  if(GL.has(en))return GL.get(en);if(GLC.has(en))return GLC.get(en);
  const w=(en.match(TOK)||[]).map(x=>x.toLowerCase());let best=null,bs=0;
  if(w.length>1)for(const g of GL.values()){const bw=g.map(x=>x[0]);let c=0;for(const x of w)if(bw.includes(x))c++;const sc=c/Math.max(w.length,bw.length);if(sc>bs){bs=sc;best=g;}}
  const r=bs>=0.6?best:null;GLC.set(en,r);return r;
}
function tS(s,o={}){
  const r=alignSentence(s.en,s.cn||'',s.map||'');
  const gl=glossFor(s.en);let gp=0;
  const cnOf=p=>{if(gl){const k=p.t.toLowerCase();for(let j=gp;j<gl.length;j++)if(gl[j][0]===k){gp=j+1;return gl[j][1]==='-'?'-':gl[j][1];}}return wordCn(p.t,r.cnParts,p.g,s.en);};
  const en=r.enParts.map(p=>{if(!p.w)return esc(p.t);const c=cnOf(p);return `<span class="wd${c==='-'?' wx':''}" data-g="${p.g}" data-cn="${c==='-'?'（不用翻）':esc(c)}">${esc(p.t)}</span>`;}).join('');
  return `<span class="tsx" ${o.ns?'data-ns="1"':''}>${o.ns||o.nosp?'':`<button class="tsp no-print" data-tsay="${esc(s.en)}" aria-label="读整句">🔊</button>`}<span class="ten">${en}</span>${o.cnAlways&&s.cn?`<span class="tcn">${esc(s.cn)}</span>`:''}</span>`;
}
function optHTML(o){
  if(o.kind==='pic')return `<span class="tem">${o.em}</span>`;
  return tS(o.s,{ns:o.ns,nocn:o.nocn,nosp:!o.s.cn&&!o.ns&&o.s.en.split(' ').length===1&&false});
}
function qHTML(q){if(!q)return'';if(q.h)return q.h;return tS(q.s,{cnAlways:q.cnAlways});}
let TEST=null;
function testSet(b,i){return (S.testSet&&S.testSet[b.id+'-'+i])||1;}
function secHTML(k,s){
    let h=`<div class="tsec">${s.from?`<div class="tfrom">${esc(s.from)}</div>`:''}<h4>${s.from?'':CN_NUM[k]+'、'}${s.title}${s.from?'':`<small>（共 ${s.items.length} 小题，每小题 ${s.pts} 分，共 ${s.items.length*s.pts} 分）</small>`}</h4>`;
    if(s.listen&&!s.from)h+=`<div class="tlh no-print">点 🔊 听录音。打印的试卷请家长照着最后一页的“听力原文”读给孩子听。</div>`;
    if(s.passage)h+=`<div class="tpass"><div class="tpt">${esc(s.passage.t)}</div>${s.passage.s.map(x=>`<div class="tpl">${tS(P(x))}</div>`).join('')}</div>`;
    s.items.forEach((it,j)=>{
      const id=k+'-'+j;
      h+=`<div class="ti" data-ti="${id}">`;
      if(it.type==='fill'){
        h+=`<div class="tq"><span class="tn">${j+1}.</span> ${it.q}　<input class="tin" data-tin="${id}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>`;
      }else if(it.type==='tf'){
        h+=`<div class="tq"><span class="br">( <b class="bf" id="bf-${id}"></b> )</span><span class="tn">${j+1}.</span><span class="tqt">${qHTML(it.q)}</span></div>
        <div class="topts no-print"><div class="topt" data-topt="${id}" data-v="T"><b>T</b> 对</div><div class="topt" data-topt="${id}" data-v="F"><b>F</b> 错</div></div>`;
      }else{
        h+=`<div class="tq"><span class="br">( <b class="bf" id="bf-${id}"></b> )</span><span class="tn">${j+1}.</span>${it.listen?`<button class="tsp big no-print" data-tsay="${esc(it.listen)}">🔊</button>`:''}<span class="tqt">${qHTML(it.q)}</span></div>
        <div class="topts ${it.pic?'pic':''} ${it.col?'col':''}">${it.opts.map((o,q)=>`<div class="topt" data-topt="${id}" data-v="${q}"><b class="tl">${L[q]}.</b> ${optHTML(o)}</div>`).join('')}</div>`;
      }
      h+=`<div class="tfb" id="fb-${id}"></div></div>`;
    });
    return h+'</div>';
}
function renderTest(b,i){
  const set=testSet(b,i);
  const secs=makeTest(b,i,set);
  TEST={b,i,set,secs,done:false,ans:{}};
  const u=b.units[i];
  const best=S.tests&&S.tests[b.id+'-'+i];
  const total=secs.reduce((s,x)=>s+x.pts*x.items.length,0);
  const showcn=S.testShowCn;
  let html=`<div class="bar no-print"><button class="btn" data-tprint>🖨️ 打印试卷</button><button class="btn ghost" data-tnew>🔄 换一套</button></div>
  <label class="no-print tkeyopt"><input type="checkbox" id="tkey" ${S.printKey!==false?'checked':''}> 打印时附上听力原文和答案（最后一页）</label>
  <div class="note no-print">👆 点 🔊 读整句，点英文单词读单词，下面对应的中文会变黄色。${best!=null?`<br>这个单元的最好成绩：<b>${best} 分</b>`:''}</div>
  <div class="paper ${showcn?'tshowcn':''}">
  <div class="phead"><div class="pt">${b.grade}${b.term} · 第${CN_NUM[i]}单元测试卷（第 ${set} 套）</div>
  <div class="ps">Unit ${i+1} ${esc(u.t)} · ${u.c} · 满分 ${total} 分</div>
  <div class="pinfo">姓名 ________　　班级 ________　　得分 ________</div></div>`;
  html+=`<div class="tpart">第一部分　听力（共 ${secs.slice(0,3).reduce((s,x)=>s+x.pts*x.items.length,0)} 分）</div>`;
  secs.forEach((s,k)=>{if(k===3)html+=`<div class="tpart">第二部分　笔试（共 ${secs.slice(3).reduce((s,x)=>s+x.pts*x.items.length,0)} 分）</div>`;html+=secHTML(k,s);});
  html+=`</div>
  <div class="bar no-print" style="justify-content:center;margin-top:16px"><button class="btn" data-tsubmit>✅ 交卷</button></div>
  <div id="tresult" class="no-print"></div>
  <div class="pkey">${keyHTML(secs,b,i,set)}</div>`;
  return html;
}
function letterOf(it){return it.type==='tf'?(it.ans?'T':'F'):it.type==='fill'?it.ans:L[it.ans];}
function optText(o){return o.kind==='pic'?o.en:o.s.en;}
function keyHTML(secs,b,i,set){
  let h=`<div class="pt">${b.grade}${b.term} · 第${CN_NUM[i]}单元测试卷（第 ${set} 套）· 听力原文和答案</div><h4>听力原文（请家长读两遍）</h4>`;
  secs.slice(0,3).forEach((s,k)=>{h+=`<p><b>${CN_NUM[k]}、</b>${s.items.map((it,j)=>`${j+1}. ${esc(it.listen)}`).join('　')}</p>`;});
  h+='<h4>参考答案</h4>';
  secs.forEach((s,k)=>{h+=`<p><b>${CN_NUM[k]}、</b>${s.items.map((it,j)=>`${j+1}. ${esc(letterOf(it))}`).join('　')}</p>`;});
  return h;
}
// ---------- 错题本：交卷后做错（或没做）的题收进来，可以单独再做；再做对了就移出 ----------
function noteWrong(T,s,k,j,it,ok){
  S.wrongQ=S.wrongQ||{};
  const key=T.review?s.keys[j]:`${T.b.id}-${T.i}-${T.set}-${k}-${j}`;
  if(ok){delete S.wrongQ[key];return;}
  const o=S.wrongQ[key]||{b:T.b.id,i:T.i,title:s.title,listen:!!s.listen,tf:!!s.passage,item:it,n:0};
  o.n++;o.t=Date.now();S.wrongQ[key]=o;
}
function wrongCount(){return Object.keys(S.wrongQ||{}).length;}
function renderReview(){
  const W=Object.entries(S.wrongQ||{}).sort((a,b)=>a[1].b.localeCompare(b[1].b)||a[1].i-b[1].i||a[1].t-b[1].t);
  if(!W.length){TEST=null;return `<div class="done"><div class="big">🎉</div><h2>错题本是空的！</h2><p>做测试卷交卷后，做错的题会自动收到这里。</p><div class="bar" style="justify-content:center"><button class="btn" data-go="/">返回首页</button></div></div>`;}
  // 同一单元、同一大题的错题放在一起（阅读判断只放一次短文）
  const secs=[];
  for(const [key,o] of W){const g=o.b+'-'+o.i+'-'+o.title;let s=secs.find(x=>x.g===g);
    if(!s){const b=BOOKS.find(x=>x.id===o.b);const u=b.units[o.i];s={g,keys:[],title:o.title,pts:2,listen:o.listen,passage:o.tf?u.p:null,items:[],from:`${b.grade}${b.term} · 第${CN_NUM[o.i]}单元`};secs.push(s);}
    s.keys.push(key);s.items.push(o.item);}
  TEST={review:true,secs,done:false,ans:{}};
  return `<div class="note no-print">一共 <b>${W.length}</b> 道错题。做完点「交卷」，做对的题会移出错题本，做错的继续留着。</div>
  <div class="paper">${secs.map((s,k)=>secHTML(k,s)).join('')}</div>
  <div class="bar no-print" style="justify-content:center;margin-top:16px"><button class="btn" data-tsubmit>✅ 交卷</button></div>
  <div id="tresult" class="no-print"></div>`;
}
function reviewDone(right,wrong){
  const left=wrongCount();
  $('#tresult').innerHTML=`<div class="done"><div class="big">${left?'💪':'🏆'}</div><h2>做对 ${right} 题</h2><p>${right?'做对的题已经移出错题本。':''}${left?`还剩 ${left} 道错题，下面写着正确答案，看懂了再练一次。`:'错题全部消灭了！'}</p>
  <div class="bar" style="justify-content:center">${left?'<button class="btn" data-tredo>🔁 再练一次</button>':''}<button class="btn ghost" data-go="/">返回首页</button></div></div>`;
  document.querySelector('[data-tsubmit]').style.display='none';
  $('#tresult').scrollIntoView({behavior:'smooth',block:'center'});
  if(!left){confetti();speak('Great job!');}
}
function submitTest(){
  const T=TEST;if(!T||T.done)return;
  let score=0,wrong=0,blank=0;
  T.secs.forEach((s,k)=>s.items.forEach((it,j)=>{
    const id=k+'-'+j;const el=document.querySelector(`[data-ti="${id}"]`);const fb=$('#fb-'+id);
    let got=T.ans[id],ok;
    if(it.type==='fill'){got=(document.querySelector(`[data-tin="${id}"]`).value||'').trim();ok=got.toLowerCase()===it.ans.toLowerCase();}
    else if(it.type==='tf')ok=got===(it.ans?'T':'F');
    else ok=got!==undefined&&+got===it.ans;
    if(got===undefined||got==='')blank++;
    if(ok)score+=s.pts;else wrong++;
    el.classList.add(ok?'tok':'tbad');
    noteWrong(T,s,k,j,it,ok);
    if(!ok){
      fb.innerHTML=`正确答案：<b>${esc(letterOf(it))}</b>${it.type==='choice'?`（${esc(optText(it.opts[it.ans]))}）`:''}${it.why?`<br>${esc(it.why)}`:''}`;
      const c=el.querySelector(`[data-v="${it.type==='tf'?(it.ans?'T':'F'):it.ans}"]`);if(c)c.classList.add('tright');
    }
  }));
  T.done=true;save();
  if(T.review)return reviewDone(score/2,wrong);
  const total=T.secs.reduce((s,x)=>s+x.pts*x.items.length,0);
  const key=T.b.id+'-'+T.i;S.tests=S.tests||{};const better=S.tests[key]==null||score>S.tests[key];if(better){S.tests[key]=score;save();}
  const pct=score/total*100;
  const msg=pct>=95?'太棒了！':pct>=85?'真厉害！':pct>=60?'不错，继续加油！':'别灰心，看看错题再来一次！';
  $('#tresult').innerHTML=`<div class="done"><div class="big">${pct>=85?'🏆':'📝'}</div><h2>${score} 分</h2><p>${msg}</p><p>错了 ${wrong} 题${blank?`（其中 ${blank} 题没答）`:''}。错题下面写着正确答案。</p>
  <div class="bar" style="justify-content:center"><button class="btn" data-tredo>🔁 同一套再做一遍</button><button class="btn ghost" data-tnew>🔄 换一套</button></div></div>`;
  document.querySelector('[data-tsubmit]').style.display='none';
  $('#tresult').scrollIntoView({behavior:'smooth',block:'center'});
  if(pct>=85){confetti();speak('Great job!');}
}
document.addEventListener('click',e=>{
  if(!TEST)return;
  const sp=e.target.closest('[data-tsay]');if(sp){speak(sp.dataset.tsay);return;}
  const op=e.target.closest('[data-topt]');
  if(op){
    if(TEST.done)return;const d=op.dataset;
    TEST.ans[d.topt]=d.v;
    op.parentNode.querySelectorAll('.topt').forEach(x=>x.classList.toggle('on',x===op));
    const bf=$('#bf-'+d.topt);if(bf)bf.textContent=d.v==='T'||d.v==='F'?d.v:L[+d.v];
    return;
  }
  const t=e.target.closest('button');if(!t)return;const d=t.dataset;
  if(d.tsubmit!==undefined){
    const n=TEST.secs.reduce((s,x)=>s+x.items.length,0);
    const filled=Object.keys(TEST.ans).length+[...document.querySelectorAll('.tin')].filter(x=>x.value.trim()).length;
    if(filled<n&&!confirm(`还有 ${n-filled} 题没有做，确定要交卷吗？`))return;
    submitTest();return;
  }
  if(d.tcn!==undefined){S.testShowCn=!S.testShowCn;save();document.querySelector('.paper').classList.toggle('tshowcn',S.testShowCn);if(!S.testShowCn)document.querySelectorAll('.tsx.open').forEach(x=>x.classList.remove('open'));t.textContent=S.testShowCn?'🙈 收起中文':'👀 显示全部中文';return;}
  if(d.tredo!==undefined){render();return;}
  if(d.tnew!==undefined){S.testSet=S.testSet||{};const k=TEST.b.id+'-'+TEST.i;S.testSet[k]=(S.testSet[k]||1)+1;save();render();return;}
  if(d.tprint!==undefined){
    const key=$('#tkey');S.printKey=key?key.checked:true;save();
    document.body.classList.toggle('print-key',S.printKey);
    window.print();return;
  }
});
