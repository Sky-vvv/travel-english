// 把英文句子和中文翻译按 "英文=中文;..." 的对应表切成可点击的小块。
// 中文可用 + 连接多个不相邻的片段，如 "a girl=一个+女孩"。
function alignSentence(en, cn, map){
  const re=/[A-Za-z0-9]+(?:['’.\-][A-Za-z0-9]+)*/g;
  const words=[];let m;
  while((m=re.exec(en)))words.push({s:m.index,e:m.index+m[0].length,t:m[0],g:-1});
  const cg=new Array(cn.length).fill(-1);
  const miss=[];
  (map?map.split(';'):[]).forEach((pair,k)=>{
    const [ep,cp]=pair.split('=');if(!ep||!cp){miss.push(pair);return;}
    const pw=ep.match(re)||[];
    let hit=-1;
    for(let i=0;i+pw.length<=words.length&&hit<0;i++){
      if(pw.every((w,j)=>words[i+j].g<0&&words[i+j].t.toLowerCase()===w.toLowerCase()))hit=i;
    }
    if(hit<0){miss.push('EN:'+ep);return;}
    for(let j=0;j<pw.length;j++)words[hit+j].g=k;
    cp.split('+').forEach(piece=>{
      let at=-1,from=0;
      while((at=cn.indexOf(piece,from))>=0){
        let free=true;for(let x=at;x<at+piece.length;x++)if(cg[x]>=0){free=false;break;}
        if(free)break;from=at+1;
      }
      if(at<0){
        // 中文已被别的词占用：并入那个词的组（如 she 和前面的 She 都对应“她”）
        const j=cn.indexOf(piece);
        if(j>=0&&cg[j]>=0){const old=cg[j];for(let q=0;q<pw.length;q++)words[hit+q].g=old;return;}
        miss.push('CN:'+piece);return;
      }
      for(let x=at;x<at+piece.length;x++)cg[x]=k;
    });
  });
  // 英文：文字片段和单词交替
  const enParts=[];let pos=0;
  words.forEach(w=>{if(w.s>pos)enParts.push({t:en.slice(pos,w.s)});enParts.push({t:w.t,g:w.g,w:1});pos=w.e;});
  if(pos<en.length)enParts.push({t:en.slice(pos)});
  // 中文：相同组号的连续字合成一段
  const cnParts=[];
  for(let x=0;x<cn.length;x++){
    const last=cnParts[cnParts.length-1];
    if(last&&last.g===cg[x])last.t+=cn[x];else cnParts.push({t:cn[x],g:cg[x]});
  }
  return {enParts,cnParts,miss};
}
if(typeof module!=='undefined')module.exports=alignSentence;
