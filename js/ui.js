'use strict';
const $=s=>document.querySelector(s);
const UP='assets/ui/slices/';
const icon=(n,c='')=>`<img class="ic ${c}" src="${UP}${n}.png" alt="">`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sprEl(app,sc,frame,attrs){return `<canvas class="spr" data-app="${encodeURIComponent(JSON.stringify(app))}" data-sc="${sc}" data-f="${frame||0}" ${attrs||''}></canvas>`;}
function hydrate(root){root.querySelectorAll('canvas.spr').forEach(c=>{if(c.dataset.done===c.dataset.app+c.dataset.f)return;const app=JSON.parse(decodeURIComponent(c.dataset.app)),sc=+c.dataset.sc,src=charCanvas(app,+c.dataset.f);
  c.width=src.width*sc;c.height=src.height*sc;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,c.width,c.height);c.dataset.done=c.dataset.app+c.dataset.f;});}
const bannedHit=t=>BANNED.some(w=>t.toLowerCase().includes(w));

const UI={tab:'adv',sel:null,mult:1,pdown:false,t5:0,t1:0,lastHtml:'',
  toast(t){const tc=$('#toasts');while(tc.children.length>=3)tc.firstChild.remove();const d=document.createElement('div');d.className='toast';d.textContent=t;$('#toasts').appendChild(d);setTimeout(()=>d.remove(),2400);},
  bubble(t){const b=$('#bubble');b.textContent='💬 '+t;const bw=b.offsetWidth||140;b.style.left=Math.min(Math.max(pCssX(),bw/2+4),cv.clientWidth-bw/2-4)+'px';b.style.top=(pCssY()-52)+'px';b.classList.add('on');clearTimeout(UI._bt);UI._bt=setTimeout(()=>b.classList.remove('on'),2600);},
  pop(t,x,y,cls,col){const fx=$('#fx');if(fx.children.length>28)return;const d=document.createElement('div');d.className='pop '+(cls||'');d.textContent=t;d.style.left=(x+(Math.random()*16-8))+'px';d.style.top=y+'px';if(col)d.style.color=col;fx.appendChild(d);setTimeout(()=>d.remove(),900);},
  modal(html,opt={}){G.modal++;const bg=document.createElement('div');bg.className='mbg'+(opt.full?' full':'');bg.innerHTML=`<div class="mbox ${opt.cls||''}">${html}</div>`;$('#overlay').appendChild(bg);hydrate(bg);
    const close=()=>{if(!bg.parentNode)return;bg.remove();G.modal--;if(opt.onClose)opt.onClose();};bg.close=close;
    bg.addEventListener('click',e=>{const a=e.target.closest('[data-m]');if(a){if(a.dataset.m==='close')close();else if(opt.on)opt.on(a.dataset.m,a,close);}});return bg;},
  /* ---------- HUD / 필드 UI ---------- */
  buildStatic(){
    $('#hud').innerHTML=`<canvas id="av" class="avatar" width="36" height="34"></canvas><div class="pill">${icon('icon_gold')}<span id="hGold">0</span></div><div class="pill">${icon('icon_gem')}<span id="hGem">0</span></div><div class="pill">${icon('icon_stone_enhance')}<span id="hStone">0</span></div>`;
    $('#sideL').innerHTML=`<button data-s="quest">${icon('menu_quest')}</button><button data-s="codex">${icon('menu_book')}</button>`;
    $('#sideR').innerHTML=`<button data-s="gift">${icon('menu_gift')}</button><button data-s="set">${icon('menu_settings')}</button>`;
    $('#nav').innerHTML=[['grow','nav_growth','성장'],['acc','nav_accessory','악세사리'],['adv','nav_adventure','모험'],['pt','nav_partner','파트너'],['shop','nav_shop','상점']].map(x=>`<div data-t="${x[0]}">${icon(x[1])}${x[2]}</div>`).join('');
    const hc=charCanvas(CLASSES[S.cls].app,0),a=$('#av').getContext('2d');a.imageSmoothingEnabled=false;a.clearRect(0,0,36,34);a.drawImage(hc,0,0,18,17,0,0,36,34);
  },
  tick(dt){
    if(!G.started)return;this.t5+=dt;this.t1+=dt;
    if(this.t5>=.25){this.t5=0;this.hud();}
    if(this.t1>=1){this.t1=0;if(!this.pdown&&!G.modal&&!document.activeElement.matches('input,textarea,select')&&['adv','grow','shop'].includes(this.tab))this.renderPanel();}
  },
  hud(){
    $('#hGold').textContent=fmt(S.gold);$('#hGem').textContent=fmt(S.gems);$('#hStone').textContent=fmt(S.stones);
    const A=AREAS[areaOf(S.stage)];$('#banner').innerHTML=`STAGE ${S.stage}<small>${A.n} · ${Math.min(S.kills,10)}/10</small>`;
    $('#buffs').innerHTML=S.buffs.filter(b=>b.src==='enc').map(b=>`<span>${{atk:'⚔️',as:'⚡',crit:'🎯',gold:'🪙'}[b.k]}${Math.ceil(b.t)}s</span>`).join('');
    const can=S.kills>=10&&(G.bossBlocked||!S.bossAuto||G.bossNow)&&!(G.mon&&G.mon.boss);
    $('#bossBtn').innerHTML=can&&!G.bossNow?`<button class="btn" data-s="boss">보스 도전</button>`:(G.mon&&G.mon.boss?`<div class="bt">⏱ ${Math.max(0,Math.ceil(G.bossT))}s</div>`:'');
    document.querySelectorAll('#nav div').forEach(d=>d.classList.toggle('on',d.dataset.t===this.tab));
  },
  /* ---------- 패널 ---------- */
  setTab(t){this.tab=t;this.renderPanel(true);this.hud();},
  renderPanel(force){
    const c=$('#content'),fn={adv:this.pAdv,grow:this.pGrow,acc:this.pAcc,pt:this.pPt,shop:this.pShop}[this.tab];
    const html=fn.call(this);if(!force&&html===this.lastHtml)return;this.lastHtml=html;
    const st=c.scrollTop,ig=c.querySelector('.invgrid'),igs=ig?ig.scrollTop:0;
    c.innerHTML=html;c.scrollTop=st;const ig2=c.querySelector('.invgrid');if(ig2)ig2.scrollTop=igs;hydrate(c);
  },
  pAdv(){const st=stats(),A=AREAS[areaOf(S.stage)],p=S.partner,r=ROLES[p.role];
    return `<div class="card"><b>${A.n}</b> · STAGE ${S.stage}<br><small>처치 ${Math.min(S.kills,10)}/10 · 최고 ${S.best} · 총 처치 ${fmt(S.totalKills)}</small></div>
    <div class="grid2"><div class="card sm">⚔️ 공격력 <b>${fmt(st.atk)}</b></div><div class="card sm">⚡ 공속 <b>${st.as.toFixed(2)}</b></div>
    <div class="card sm">🎯 치명타 <b>${(st.crit*100).toFixed(1)}%</b></div><div class="card sm">💥 치피 <b>${(st.cdmg*100).toFixed(0)}%</b></div>
    <div class="card sm">❤️ 체력 <b>${fmt(st.hp)}</b></div><div class="card sm">🪙 골드+ <b>${(st.gold*100).toFixed(0)}%</b></div></div>
    <div class="card row">${sprEl(p.app,2,0)}<div class="tx"><b>${esc(p.name)}</b> <small>${r.n} · 애정도 Lv.${p.aff}</small><br><small>스킬 [${r.sk}] ${r.d} · ${Math.max(0,Math.ceil(G.skillT))}s</small></div></div>
    <div class="grid2"><button class="btn" data-a="autoboss">자동 보스 ${S.bossAuto?'ON':'OFF'}</button><button class="btn ${S.kills>=10?'':'off'}" data-a="boss">보스 도전</button></div>
    <div class="card sm">DPS ${fmt(st.dps)} · 다음 조우 약 ${Math.max(0,Math.ceil(S.enc.next))}초 · 오늘 ${S.enc.count}/20</div>`;},
  pGrow(){
    const rows=Object.keys(UPDEF).map(k=>{const d=UPDEF[k],l=S.up[k],n=this.mult==='max'?Math.max(1,maxBuy(k)):this.mult;let cost=0,cl=l;for(let i=0;i<n&&cl<d.cap;i++){cost+=upCost(k,cl);cl++;}
      const capped=l>=d.cap,ok=!capped&&S.gold>=cost&&cost>0;
      return `<div class="row2"><span class="ie">${{atk:'⚔️',as:'⚡',crit:'🎯',cdmg:'💥',hp:'❤️'}[k]}</span><div class="tx"><b>${d.n} Lv.${l}</b><br><small>${d.d(l)} → ${d.d(cl)}${k==='atk'&&(Math.floor((cl)/25)>Math.floor(l/25))?' ✨×2':''}</small></div><button class="btn ${ok?'':'off'}" data-a="up" data-k="${k}">${capped?'MAX':fmt(cost)+'<br>강화'}</button></div>`;}).join('');
    const w=S.weapon,wc=wCost(w),wok=w<20&&S.gold>=wc.gold&&S.stones>=wc.stones;
    return `<div class="seg">${[1,10,'max'].map(m=>`<span class="${this.mult===m?'on':''}" data-a="mult" data-m="${m}">${m==='max'?'MAX':'×'+m}</span>`).join('')}</div>${rows}
    <div class="row2"><span class="ie">🗡️</span><div class="tx"><b>무기 +${w}</b><br><small>공격력 ×${(1+.15*w).toFixed(2)} → ×${(1+.15*(w+1)).toFixed(2)}</small></div><button class="btn ${wok?'':'off'}" data-a="weapon">${w>=20?'MAX':fmt(wc.gold)+'+🔩'+wc.stones}</button></div>`;},
  accSlot(a,extra=''){if(!a)return `<div class="slot empty ${extra}"></div>`;const gimg=['slot_g1_common','slot_g2_uncommon','slot_g3_rare','slot_g3_rare','slot_g5_legend','slot_g6_mythic'][a.grade];
    return `<div class="slot g${a.grade} ${extra}" data-a="sel" data-id="${a.id}"><img src="${UP}${gimg}.png"><span>${ACC_EMOJI[a.type]}</span>${a.lv?`<i>+${a.lv}</i>`:''}</div>`;},
  optLine(a,o,i,rr){const v=o.v*(1+.08*a.lv);const pct=(v*100).toFixed(1)+'%';return `<div class="opt">${OPTS[o.k].n} +${pct}${rr?` <button class="mini" data-a="reroll" data-i="${i}">🎲</button>`:''}</div>`;},
  pAcc(){
    const eq=S.eq.map((id,i)=>{const a=S.inv.find(x=>x.id===id);return a?this.accSlot(a,this.sel===a.id?'sel':''):`<div class="slot empty"><span class="ph">${ACC_EMOJI[i]}</span></div>`;}).join('');
    const items=[...S.inv].sort((a,b)=>b.grade-a.grade||b.lv-a.lv).map(a=>this.accSlot(a,(this.sel===a.id?'sel ':'')+(S.eq.includes(a.id)?'on':''))).join('');
    const a=S.inv.find(x=>x.id===this.sel);let det='<div class="card sm">아이템을 눌러 확인하세요. (등급이 높을수록 옵션이 많아요)</div>';
    if(a){const eqd=S.eq.includes(a.id),c=accCost(a),cnt=S.inv.filter(x=>x.grade===a.grade&&!S.eq.includes(x.id)).length;
      det=`<div class="card"><b style="color:${GRADE_COL[a.grade]}">${accName(a)}</b> <small>Lv.${a.lv}/${accMaxLv(a)}</small>${a.opts.map((o,i)=>this.optLine(a,o,i,true)).join('')}
      <div class="grid2" style="margin-top:6px">${eqd?`<button class="btn" data-a="unequip" data-i="${a.type}">해제</button>`:`<button class="btn" data-a="equip">장착</button>`}
      <button class="btn ${a.lv<accMaxLv(a)&&S.gold>=c.gold&&S.stones>=c.stones?'':'off'}" data-a="enh">강화 ${fmt(c.gold)}+🔩${c.stones}</button>
      <button class="btn ${eqd?'off':''}" data-a="dis">분해</button><button class="btn ${cnt>=3&&a.grade<5?'':'off'}" data-a="merge">합성(${cnt}/3)</button></div><small>🎲 재굴림석 ${S.rerolls}개 · 옵션을 다시 굴립니다</small></div>`;}
    return `<div class="slots">${eq}</div>${det}<div class="invgrid">${items||'<small>보유 악세사리 없음</small>'}</div>
    <div class="grid2"><button class="btn ${S.gems>=300?'':'off'}" data-a="sm1">소환 ×1<br>💎300</button><button class="btn ${S.gems>=2700?'':'off'}" data-a="sm10">소환 ×10<br>💎2700</button></div>
    <div class="grid2"><small>천장 ${S.pity}/90 (전설 이상 확정)</small><button class="btn mini2" data-a="disLow">일반 일괄분해</button></div>`;},
  pPt(){const p=S.partner,r=ROLES[p.role],need=expNeed(p.aff);
    return `<div class="card ptcard">${sprEl(p.app,6,0)}<div class="tx"><b>${esc(p.name)}</b><br><small>${esc(p.cat)} · ${esc(p.pers)} · ${r.n}</small><br><small>“${esc(p.intro||'함께 모험을 떠나요!')}”</small></div></div>
    <div class="card sm">💖 애정도 Lv.${p.aff} <div class="pbar"><i style="width:${Math.floor(p.exp/need*100)}%"></i></div><small>${p.exp}/${need} · 공격력 +${p.aff*2}%</small></div>
    <div class="card sm">스킬 [${r.sk}] : ${r.d} (10초마다)<br><small>패시브: ${{dealer:'공격력 +10%',support:'버프 스킬',healer:'체력 +15%',wealth:'골드 +15%'}[p.role]}</small></div>
    <div class="grid2"><button class="btn ${S.bond>=10?'':'off'}" data-a="gift">🎀 선물 (🤝10)</button><button class="btn" data-a="editpt">파트너 편집</button></div><small>🤝 인연 포인트 ${S.bond}</small>`;},
  pShop(){const g=rebirthGain(),free=S.freeDay!==today();
    return `<div class="card row"><span class="ie">🎁</span><div class="tx"><b>일일 무료 선물</b><br><small>매일 💎100</small></div><button class="btn ${free?'':'off'}" data-a="free">${free?'받기':'완료'}</button></div>
    <div class="card"><b>🤝 인연 상점</b> <small>(${S.bond}pt)</small><div class="grid2" style="margin-top:6px"><button class="btn ${S.bond>=15?'':'off'}" data-a="bshop" data-k="reroll">🎲 재굴림석<br>🤝15</button><button class="btn ${S.bond>=10?'':'off'}" data-a="bshop" data-k="stone">🔩 강화석×5<br>🤝10</button></div></div>
    <div class="card"><b>⭐ 환생</b> <small>이세계의 별 ${S.stars}개 (공격력 +${S.stars*10}%, 골드 +${S.stars*5}%)</small><br><small>스테이지 100 이상에서 가능 · 스테이지/골드/강화/무기 초기화 · 악세사리·파트너 유지</small>
    <button class="btn ${g?'':'off'}" style="margin-top:6px;width:100%" data-a="rebirth">${g?`환생하기 (⭐+${g})`:'STAGE 100 필요 (현재 '+S.stage+')'}</button></div>`;},
  /* ---------- 액션 ---------- */
  act(a,el){const d=el.dataset;let changed=true;
    switch(a){
      case'tab':this.setTab(d.t);return;
      case'mult':this.mult=d.m==='max'?'max':+d.m;break;
      case'up':{const n=this.mult==='max'?maxBuy(d.k):this.mult;if(!buyUp(d.k,n))this.toast('골드가 부족해요');break;}
      case'weapon':if(!enhanceWeapon())this.toast('재료가 부족해요');break;
      case'boss':if(!manualBoss())this.toast('몬스터를 10마리 처치하세요');break;
      case'autoboss':S.bossAuto=!S.bossAuto;break;
      case'sel':this.sel=+d.id;break;
      case'equip':equip(this.sel);break;
      case'unequip':unequip(+d.i);break;
      case'enh':if(!enhanceAcc(this.sel))this.toast('재료가 부족하거나 최대 레벨이에요');break;
      case'reroll':if(!rerollOpt(this.sel,+d.i))this.toast('재굴림석이 없어요');break;
      case'dis':{const s=dismantle(this.sel);if(s){this.toast('강화석 +'+s);this.sel=null;}else this.toast('장착 중이에요');break;}
      case'disLow':{const r=dismantleLow();this.toast(r.n?`${r.n}개 분해 · 강화석 +${r.s}`:'분해할 아이템이 없어요');break;}
      case'merge':{const cur=S.inv.find(x=>x.id===this.sel);const r=cur&&mergeAcc(cur.grade);if(r){this.sel=r.n.id;this.toast(r.up?'합성 성공! 등급 UP':'합성 완료 (등급 유지)');}else this.toast('같은 등급 3개가 필요해요');break;}
      case'sm1':case'sm10':{const res=summon(a==='sm1'?1:10);if(!res){this.toast('젬이 부족해요');break;}res.forEach(autoEquip);this.showSummon(res);break;}
      case'gift':if(S.bond>=10){S.bond-=10;addAff(30);this.toast('💖 선물을 받고 기뻐해요!');say('lv');}else this.toast('인연 포인트가 부족해요');break;
      case'editpt':this.creator(S.partner,p=>{Object.assign(S.partner,p);dirty=true;this.toast('파트너를 수정했어요');this.renderPanel(true);},true);return;
      case'free':if(S.freeDay!==today()){S.freeDay=today();S.gems+=100;this.toast('💎 +100');}break;
      case'bshop':{if(d.k==='reroll'&&S.bond>=15){S.bond-=15;S.rerolls++;}else if(d.k==='stone'&&S.bond>=10){S.bond-=10;S.stones+=5;}else this.toast('인연 포인트가 부족해요');break;}
      case'rebirth':if(rebirthGain()&&confirm('환생할까요? 스테이지·골드·강화가 초기화되고 ⭐을 얻습니다.')){const g=rebirth();this.toast('⭐ +'+g);}break;
    }
    if(changed){this.renderPanel(true);this.hud();save();}
  },
  showSummon(res){const m=this.modal(`<h3>소환 결과</h3><div class="slots wrap">${res.map(a=>this.accSlot(a)).join('')}</div><div class="card sm">${res.map(a=>`<div style="color:${GRADE_COL[a.grade]}">${accName(a)} · ${a.opts.map(o=>OPTS[o.k].n).join(', ')}</div>`).join('')}</div><button class="btn" data-m="close">확인</button>`,{cls:'summon'});
    m.querySelectorAll('.slot').forEach(s=>s.removeAttribute('data-a'));},
  /* ---------- 사이드 메뉴 ---------- */
  side(k){
    if(k==='boss'){manualBoss();return;}
    if(k==='gift'){this.setTab('shop');return;}
    if(k==='quest'){const render=()=>QUESTS.map(q=>{const v=Math.min(S.dq[q.k],q.need),done=S.dq.claimed.includes(q.id),ok=v>=q.need&&!done;return `<div class="row2"><div class="tx"><b>${q.n}</b><br><small>${v}/${q.need} · 💎${q.gem}</small></div><button class="btn ${ok?'':'off'}" data-m="${q.id}">${done?'완료':'받기'}</button></div>`;}).join('');
      const m=this.modal(`<h3>일일 퀘스트</h3><div id="ql">${render()}</div><button class="btn" data-m="close">닫기</button>`,{on:(id)=>{if(claimQuest(id)){this.toast('💎 보상 획득!');m.querySelector('#ql').innerHTML=render();save();}}});return;}
    if(k==='codex'){this.modal(`<h3>인연 도감</h3><div class="card sm">지금까지 만난 플레이어 <b>${S.met}</b>명<br><small>(프로토타입: NPC 분신이 대신 찾아옵니다)</small></div><h4>친구 ${S.friends.length}명</h4>${S.friends.map(f=>`<div class="row2">${sprEl(f.app,2,0)}<div class="tx"><b>${esc(f.name)}</b><br><small>파트너 ${esc(f.pName)}</small></div></div>`).join('')||'<small>아직 친구가 없어요. 조우할 때 친구 신청을 해보세요!</small>'}<button class="btn" data-m="close">닫기</button>`);return;}
    if(k==='set'){this.modal(`<h3>설정</h3><div class="grid2"><button class="btn" data-m="enc">조우 테스트</button><button class="btn" data-m="st">스테이지 +10</button><button class="btn" data-m="gold">골드 +100만</button><button class="btn" data-m="gem">젬 +3000</button><button class="btn" data-m="reset">데이터 초기화</button><button class="btn" data-m="close">닫기</button></div><small>⚠ 테스트용 메뉴(개발 중)</small>`,
      {on:(id,el,close)=>{if(id==='enc'){close();setTimeout(()=>this.encounter(),50);}else if(id==='st'){S.stage+=10;S.kills=0;G.mon=null;toast('스테이지 '+S.stage);}else if(id==='gold'){S.gold+=1e6;}else if(id==='gem'){S.gems+=3000;}else if(id==='reset'&&confirm('모든 데이터를 삭제할까요?'))resetSave();}});}
  },
  /* ---------- 조우 / 방치 ---------- */
  encounter(type){const r=encounter(type),b=r.bot;save();
    const T={duel:['⚔️ 결투 신청!',b.name+'님이 승부를 걸어왔다!'],share:['🎁 나눔','님이 가진 것을 나눠줬다!'],heal:['💚 치유','님의 파트너가 상처를 치료해줬다!'],buff:['✨ 응원','님의 파트너가 힘을 북돋아줬다!'],weapon:['🔨 대장간','님이 무기를 손봐줬다!']}[r.type];
    const msg=r.type==='duel'?T[1]:b.name+T[1];
    const m=this.modal(`<h3>${T[0]}</h3><div class="enc">${sprEl(b.app,3,0)}${sprEl(b.pApp,3,0)}</div><div class="card sm"><b>${esc(b.name)}</b> <small>(${b.cls}) · 파트너 ${esc(b.pName)} · ${esc(b.intro)}</small><br>“${esc(b.pLine)}”</div>
      <div class="card"><b>${msg}</b>${r.lines.map(l=>`<div>${l}</div>`).join('')}</div><div class="grid2"><button class="btn" data-m="fr">친구 신청</button><button class="btn" data-m="close">확인</button></div>`,
      {on:(id,el,close)=>{if(id==='fr'){if(!S.friends.find(f=>f.name===b.name)){S.friends.push({name:b.name,app:b.app,pName:b.pName});this.toast('친구 신청을 보냈어요!');}el.classList.add('off');}},onClose:()=>{this.renderPanel(true);}});
    say('enc');},
  offline(r){const h=Math.floor(r.sec/3600),mi=Math.floor(r.sec%3600/60);this.modal(`<h3>방치 보상</h3><div class="card sm">${h?h+'시간 ':''}${mi}분 동안 모험했어요! (최대 8시간)</div><div class="card"><div>처치 약 ${fmt(r.kills)}마리</div><div>🪙 골드 +${fmt(r.gold)}</div><div>🔩 강화석 +${r.stones}</div></div><button class="btn" data-m="close">받기</button>`);},
  /* ---------- 파트너 생성 / 편집 ---------- */
  creator(init,done,editing){
    const P=JSON.parse(JSON.stringify(init||{name:'',cat:'아이돌',pers:'상냥',role:'dealer',intro:'',lines:[],app:randomAppearance()}));
    const partRows=[['hairBack','뒷머리'],['hairFront','앞머리'],['eye','눈'],['outfit','의상'],['prop','소품']];
    const colRows=[['hair','머리색'],['eye','눈색'],['skin','피부'],['main','의상색'],['acc','포인트'],['prop','소품색']];
    const html=`<h3>${editing?'파트너 편집':'함께할 최애를 만들어요'}</h3><div class="cprev"><canvas id="cpv"></canvas><button class="btn mini2" data-m="rand">🎲 랜덤</button></div>
    ${partRows.map(([k,n])=>`<div class="prow"><span>${n}</span><button data-m="p-${k}--1">◀</button><b id="pl-${k}"></b><button data-m="p-${k}-1">▶</button></div>`).join('')}
    ${colRows.map(([k,n])=>`<div class="crow"><span>${n}</span><div id="cs-${k}">${COLORS[k].map(c=>`<i data-m="c-${k}-${c}" style="background:${c}"></i>`).join('')}</div></div>`).join('')}
    <div class="form"><label>이름<input id="pn" maxlength="10" value="${esc(P.name)}" placeholder="좋아하는 캐릭터 이름 (2~10자)"></label>
    <label>분류<select id="pc">${['아이돌','애니 캐릭터','기타'].map(x=>`<option ${P.cat===x?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>성격<select id="pp">${Object.keys(PERS).map(x=>`<option ${P.pers===x?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>역할<select id="pr">${Object.keys(ROLES).map(x=>`<option value="${x}" ${P.role===x?'selected':''}>${ROLES[x].n} - ${ROLES[x].sk}: ${ROLES[x].d}</option>`).join('')}</select></label>
    <label>소개 한 줄<input id="pi" maxlength="24" value="${esc(P.intro)}" placeholder="예) 무대 위의 센터"></label>
    <label>응원 대사 (줄바꿈, 최대 8줄 · 비우면 성격 기본 대사)<textarea id="pl" rows="3" maxlength="200" placeholder="{p} = 내 이름">${esc((P.lines||[]).join('\n'))}</textarea></label></div>
    <button class="btn wide" data-m="ok">${editing?'저장':'이 파트너와 떠난다!'}</button>${editing?'<button class="btn wide" data-m="close">취소</button>':''}`;
    let frm=0;const m=this.modal(html,{full:true,cls:'creator',on:(id,el,close)=>{
      if(id==='rand'){P.app=randomAppearance();refresh();}
      else if(id.startsWith('p-')){const[,k,d]=id.match(/^p-(\w+)-(-?1)$/);const n=PARTS[k].length;P.app[k]=(P.app[k]+ +d+n)%n;refresh();}
      else if(id.startsWith('c-')){const[,k,c]=id.match(/^c-(\w+)-(#\w+)$/);P.app.col[k]=c;refresh();}
      else if(id==='ok'){P.name=$('#pn').value.trim();P.cat=$('#pc').value;P.pers=$('#pp').value;P.role=$('#pr').value;P.intro=$('#pi').value.trim();P.lines=$('#pl').value.split('\n').map(s=>s.trim().slice(0,30)).filter(Boolean).slice(0,8);
        if(P.name.length<2||P.name.length>10)return this.toast('이름은 2~10자로 입력하세요');
        if(bannedHit(P.name+P.intro+P.lines.join(' ')))return this.toast('사용할 수 없는 단어가 포함되어 있어요');
        clearInterval(iv);close();done(P);}}});
    const cvp=m.querySelector('#cpv');
    function refresh(){const src=charCanvas(P.app,frm),sc=6;cvp.width=src.width*sc;cvp.height=src.height*sc;const g=cvp.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,cvp.width,cvp.height);
      partRows.forEach(([k])=>{const e=m.querySelector('#pl-'+k);e.textContent=PARTS[k][P.app[k]].n;});
      colRows.forEach(([k])=>m.querySelectorAll('#cs-'+k+' i').forEach(i=>i.classList.toggle('on',i.dataset.m.endsWith(P.app.col[k]))));}
    const iv=setInterval(()=>{if(!m.parentNode){clearInterval(iv);return;}frm^=1;refresh();},450);refresh();return m;
  },
  /* ---------- 오프닝 ---------- */
  opening(){
    const steps=[{t:'빠아아아앙——!!!',k:'black',shake:1},{t:'…쾅.',k:'black'},{t:'……여긴 어디지?',k:'store'},{t:'나는 분명 트럭에 치이고… 편의점 앞에서 정신을 잃었는데…',k:'store'},{t:'……이, 이세계?!',k:'store',shake:1}];
    let i=0,sign=true;
    const m=this.modal(`<div class="cut"><canvas id="cc" width="120" height="90"></canvas><div class="dlg"><div id="ct"></div><div class="hint">▼ 탭하여 계속</div></div></div>`,{full:true,cls:'cutbox'});
    const cc=m.querySelector('#cc'),g=cc.getContext('2d');g.imageSmoothingEnabled=false;
    const draw=()=>{const s=steps[i];g.clearRect(0,0,120,90);
      if(s.k==='black'){g.fillStyle='#000';g.fillRect(0,0,120,90);const tr=truckCanvas();g.drawImage(tr,Math.min(80,(i===0?30:80)),44,tr.width*1,tr.height*1);}
      else{for(let y=0;y<62;y+=2){g.fillStyle=mixc('#8ed1f0','#d4f0fa',y/62);g.fillRect(0,y,120,2);}g.fillStyle='#6ab04c';g.fillRect(0,62,120,28);g.fillStyle='#3f7a2c';g.fillRect(0,62,120,2);
        const st=storeCanvas(sign);g.drawImage(st,10,22,st.width*2,st.height*2);const h=charCanvas(CLASSES[0].app,0);g.save();g.translate(88,84);g.rotate(-1.57);g.drawImage(h,-12,-12);g.restore();}
      const t=m.querySelector('#ct');t.textContent=s.t;cc.classList.toggle('shake',!!s.shake);};
    const iv=setInterval(()=>{sign=!sign;if(m.parentNode)draw();else clearInterval(iv);},500);
    draw();
    m.addEventListener('click',()=>{i++;if(i>=steps.length){clearInterval(iv);m.close();this.nameStep();}else draw();});
  },
  nameStep(){const m=this.modal(`<div class="cut"><h3>이름을 알려줘</h3><div class="dlg"><div>“……내 이름은…”</div></div><input id="nm" maxlength="8" placeholder="2~8자" autofocus><button class="btn wide" data-m="ok">다음</button></div>`,{full:true,cls:'cutbox',on:(id)=>{const v=$('#nm').value.trim();if(v.length<2||v.length>8)return this.toast('이름은 2~8자로 입력하세요');if(bannedHit(v))return this.toast('사용할 수 없는 이름이에요');S.name=v;m.close();this.classStep();}});},
  classStep(){let sel=0;const m=this.modal(`<h3>어떤 모습으로 모험할까?</h3><div class="cls">${CLASSES.map((c,i)=>`<div class="ccard ${i===0?'on':''}" data-m="cl-${i}">${sprEl(c.app,4,0)}<b>${c.n}</b><small>${c.desc}</small></div>`).join('')}</div><button class="btn wide" data-m="ok">결정</button>`,{full:true,cls:'cutbox',
    on:(id)=>{if(id.startsWith('cl-')){sel=+id.slice(3);m.querySelectorAll('.ccard').forEach((e,j)=>e.classList.toggle('on',j===sel));}else if(id==='ok'){S.cls=sel;m.close();this.creator(null,p=>{p.aff=0;p.exp=0;S.partner=p;this.startGame();},false);}}});},
  startGame(){checkDay();dirty=true;G.started=true;G.heroHp=stats().hp;this.buildStatic();this.setTab('adv');save();
    setTimeout(()=>say('idle'),1200);},
  boot(){
    resize();
    $('#nav').addEventListener('click',e=>{const d=e.target.closest('[data-t]');if(d)this.setTab(d.dataset.t);});
    $('#content').addEventListener('click',e=>{const d=e.target.closest('[data-a]');if(d)this.act(d.dataset.a,d);});
    $('#field').addEventListener('click',e=>{const d=e.target.closest('[data-s]');if(d)this.side(d.dataset.s);});
    document.addEventListener('pointerdown',()=>this.pdown=true);['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,()=>this.pdown=false));
    if(load()){checkDay();const sec=(Date.now()-S.last)/1000;this.startGame();const r=offlineReward(sec);if(r)this.offline(r);}
    else this.opening();
    requestAnimationFrame(frame);
  }
};
window.UI=UI;
window.addEventListener('load',()=>UI.boot());
