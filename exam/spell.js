// 背单词（错题本里错题的单词）：和「小学英语乐园」的拼单词一样
// 听单词、点字母拼出来 → 拼错一次就给答案 → 照着拼对一遍 → 遮住答案默写对 → 再选出中文意思，选对才到下一个
let SP=null;
function spShuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
let actx=null;
function beep(ok){
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const notes=ok?[660,880]:[300,220];
    notes.forEach((f,k)=>{const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;o.connect(g);g.connect(actx.destination);const t=actx.currentTime+k*.12;g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.start(t);o.stop(t+.2);});
  }catch(e){}
}
function startSpell(ws,all,back){
  SP={qs:spShuffle(ws),k:0,score:0,missed:false,all,back,ws};
  spRender();
}
function spRender(){
  const g=SP;if(g.k>=g.qs.length)return spDone();
  const q=g.qs[g.k];g.ans='';g.phase='';g.missed=false;g.locked=false;
  $('#app').innerHTML=`<div class="qtop"><button class="btn ghost" data-go="${g.back}">✕</button><div class="prog"><i style="width:${g.k/g.qs.length*100}%"></i></div><b>${g.k+1}/${g.qs.length}</b></div>
  <div class="qbox"><div class="em">${q.em}</div><div class="q">${esc(q.cn)}</div><div class="hint"></div><div id="reveal"></div><button class="btn" data-sphear style="margin-top:10px">🔊 再听一次</button></div>
  <div class="slots">${q.en.split('').map(()=>`<span class="slot"></span>`).join('')}</div>
  <div class="letters" id="letters"></div>
  <div class="bar" id="spbar" style="justify-content:center;margin-top:14px"><button class="btn ghost" data-spundo>⌫ 退一格</button><button class="btn ghost" data-spans id="spans">💡 不会，看答案</button></div>`;
  spReset();setTimeout(()=>speak(q.en),250);
}
function spReset(){
  const g=SP,q=g.qs[g.k];
  g.ans='';g.letters=spShuffle(q.en.toLowerCase().split(''));
  document.querySelectorAll('.slot').forEach(s=>{s.textContent='';s.classList.remove('f');});
  const box=document.querySelector('.slots');if(box)box.style.color='';
  $('#letters').innerHTML=g.letters.map((l,k)=>`<button class="letter" data-spl="${k}">${l}</button>`).join('');
  g.locked=false;
}
function spHint(html){document.querySelector('.qbox .hint').innerHTML=html||'';}
function spCopy(msg){
  const g=SP,q=g.qs[g.k];
  g.missed=true;g.phase='copy';
  const b=$('#spans');if(b)b.style.display='none';
  spHint(`<span style="color:var(--bad)">${msg}</span>`);
  $('#reveal').innerHTML=`<div style="margin-top:6px">正确拼法是 <b style="color:var(--ok);font-size:26px;letter-spacing:2px">${esc(q.en)}</b></div>`;
  spReset();speak(q.en);
}
function spMeaning(){
  const g=SP,q=g.qs[g.k];g.phase='mean';
  const opts=spShuffle([q].concat(spShuffle(g.all.filter(w=>w.en!==q.en&&w.cn!==q.cn)).filter((w,k,a)=>a.findIndex(x=>x.cn===w.cn)===k).slice(0,3)));
  g.mopts=opts;
  document.querySelector('.qbox').innerHTML=`<div class="hint" style="font-size:18px;color:var(--hd);font-weight:700">拼对啦！它是什么意思？</div><div class="q" style="font-size:44px;letter-spacing:2px;margin:6px 0">${esc(q.en)}</div><button class="btn" data-sphear>🔊 再听一次</button>`;
  document.querySelector('.slots').remove();$('#letters').remove();$('#spbar').remove();
  document.querySelector('.qbox').insertAdjacentHTML('afterend',`<div class="opts">${opts.map((o,k)=>`<button class="opt" data-spm="${k}">${esc(o.cn)}</button>`).join('')}</div>`);
  g.locked=false;
}
function spDone(){
  const g=SP,n=g.score,tot=g.qs.length;
  $('#app').innerHTML=`<div class="done"><div class="big">${n===tot?'🏆':'🎉'}</div><h2>背完啦！</h2><p>一共 ${tot} 个单词，一次就全对的有 ${n} 个。</p>
  <div class="bar" style="justify-content:center"><button class="btn" data-spagain>🔁 再背一遍</button><button class="btn ghost" data-go="${g.back}">返回错题本</button></div></div>`;
  if(n===tot){confetti();speak('Excellent!');}
}
document.addEventListener('click',e=>{
  if(!SP||!location.hash.endsWith('/spell'))return;
  const t=e.target.closest('button');if(!t)return;const d=t.dataset,g=SP;
  if(d.sphear!==undefined){speak(g.qs[g.k].en);return;}
  if(d.spagain!==undefined){startSpell(g.ws,g.all,g.back);return;}
  if(d.spm!==undefined){
    if(g.locked)return;const q=g.qs[g.k];
    if(g.mopts[+d.spm]!==q){g.missed=true;beep(false);t.classList.add('wrong');t.disabled=true;toast('不对哦，再想想！');speak(q.en);return;}
    g.locked=true;t.classList.add('right');beep(true);if(!g.missed)g.score++;
    setTimeout(()=>speak(q.en),200);setTimeout(()=>{g.k++;spRender();},1100);return;
  }
  if(d.spl!==undefined){
    if(g.locked)return;
    g.ans+=g.letters[+d.spl];t.classList.add('used');
    const slots=document.querySelectorAll('.slot');slots[g.ans.length-1].textContent=g.letters[+d.spl];slots[g.ans.length-1].classList.add('f');
    const q=g.qs[g.k],target=q.en.toLowerCase();
    if(g.ans.length<target.length)return;
    const ok=g.ans===target;
    document.querySelector('.slots').style.color=ok?'var(--ok)':'var(--bad)';
    g.locked=true;
    if(ok&&g.phase==='copy'){
      g.phase='dict';beep(true);
      setTimeout(()=>{$('#reveal').innerHTML='';spHint(`<b style="color:var(--hd)">✍️ 默写「${esc(q.cn)}」：答案遮住了，自己拼出来，拼对才过关</b>`);spReset();speak(q.en);},900);
    }else if(ok){
      beep(true);setTimeout(()=>speak(q.en),200);setTimeout(spMeaning,1000);
    }else{
      g.missed=true;beep(false);toast('不对哦！');
      setTimeout(()=>spCopy('拼错了，先照着下面的答案拼一遍'),900);
    }
    return;
  }
  if(d.spans!==undefined){if(g.locked||g.phase)return;spCopy('先照着下面的答案拼一遍，然后再默写');return;}
  if(d.spundo!==undefined){
    if(g.locked||!g.ans)return;
    const last=g.ans.slice(-1);g.ans=g.ans.slice(0,-1);
    const btn=[...document.querySelectorAll('.letter.used')].reverse().find(x=>x.textContent===last);if(btn)btn.classList.remove('used');
    const slots=document.querySelectorAll('.slot');slots[g.ans.length].textContent='';slots[g.ans.length].classList.remove('f');
  }
});
