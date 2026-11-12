'use strict';
/* ================= 데이터 ================= */
const AREAS=[
  {n:'시작의 초원',sky:['#8ed1f0','#d4f0fa'],far:'#c9d3d8',ground:['#6ab04c','#3f7a2c'],mid:'#4a9a3a',
   mons:[{n:'슬라임',k:'slime',c:'#5fcf6a'},{n:'버섯',k:'mushroom',c:'#d6403a'},{n:'뿔토끼',k:'rabbit',c:'#f5efe6'}],boss:{n:'킹슬라임',k:'slime',c:'#4a8be8'}},
  {n:'고블린 숲',sky:['#6fb08a','#c4e8c8'],far:'#7aa88a',ground:['#4d8f3a','#2f5f24'],mid:'#2f6a2f',
   mons:[{n:'고블린',k:'goblin',c:'#6fae4a'},{n:'늑대',k:'wolf',c:'#8a8a98'},{n:'고블린 궁수',k:'goblin',c:'#8fbe5a',x:1}],boss:{n:'고블린 대장',k:'goblin',c:'#c0402a'}},
  {n:'잊혀진 묘지',sky:['#4a4468','#9a8ab0'],far:'#6a6088',ground:['#6a6a78','#3a3a48'],mid:'#55506e',
   mons:[{n:'스켈레톤',k:'skeleton',c:''},{n:'좀비',k:'zombie',c:''},{n:'유령',k:'ghost',c:''}],boss:{n:'리치',k:'skeleton',c:'#8a5be0'}},
  {n:'용암 동굴',sky:['#6a2418','#e08a3a'],far:'#8a3a22',ground:['#7a3a22','#4a2010'],mid:'#5a2a1a',
   mons:[{n:'불도마뱀',k:'lizard',c:'#e0532b'},{n:'골렘',k:'golem',c:''},{n:'용암 슬라임',k:'slime',c:'#ff8a2a'}],boss:{n:'용암 드래곤',k:'lizard',c:'#a8201a'}}
];
const areaOf=s=>Math.floor((s-1)/30)%4;
const OPTS={atk:{n:'공격력',b:1},as:{n:'공격속도',b:.6},crit:{n:'치명타 확률',b:.4},cdmg:{n:'치명타 피해',b:1},hp:{n:'체력',b:1.2},gold:{n:'골드 획득',b:1},drop:{n:'드랍률',b:.8},boss:{n:'보스 피해',b:1}};
const OPT_KEYS=Object.keys(OPTS);
const GBASE=[.05,.08,.12,.18,.25,.35],GRADE_N=['일반','고급','희귀','영웅','전설','신화'],GRADE_COL=['#9a9a9a','#5fbf5f','#4a8be8','#a45be8','#f08a24','#e8504a'];
const OPT_COUNT=[1,2,3,3,4,4],MAX_LV=[10,12,15,20,25,30];
const ACC_TYPES=['반지','목걸이','귀걸이','팔찌','벨트'],ACC_EMOJI=['💍','📿','🧿','⌚','🎗️'];
const SUMMON_W=[45,30,17,6,1.8,.2],DROP_W=[70,22,6,1.8,.2,0],BOSS_W=[45,30,17,6,1.8,.2];
const ROLES={dealer:{n:'딜러',sk:'강타',d:'6배 피해'},support:{n:'서포터',sk:'응원',d:'공격력·공속 버프'},healer:{n:'힐러',sk:'치유',d:'체력 35% 회복'},wealth:{n:'재물',sk:'행운',d:'즉시 골드'}};
const PERS={'상냥':['오늘도 같이 힘내요, {p}!','다치지 않게 조심해요~','{p}라면 할 수 있어요!','정말 멋져요!','조금만 더 힘내요!'],
  '츤데레':['ㅂ, 별로 걱정한 건 아니거든!','흥, 이 정도는 당연하지.','착각하지 마, 도와주는 거 아니니까!','…조심해, 바보.','잘했어. 아니, 그냥 그렇다고!'],
  '쿨':['…계속 가자.','문제없어.','적이 온다.','나쁘지 않네.','무리하지 마.'],
  '활발':['가자가자~! 두근두근!','와아, 대박이야!!','오늘도 최고야!','다 쓰러뜨리자!','야호~! 신난다!']};
const BANNED=['시발','씨발','병신','좆','섹스','sex','fuck','개새','지랄'];
const BOT_NAMES=['별빛냥','달토끼','치킨러버','밤하늘','솜사탕','용사K','편의점알바','야식왕','푸른여우','하늘이','코코넛','마녀수습','고양이집사','쿠키몬스터','새벽산책','트럭조심'];
const BOT_PARTNERS=['하루','미유','세이라','리나','유키','아이리','소라','카논','시온','나나','레이','미코'];
const BOT_LINES=['같이 힘내자!','오늘도 화이팅~','잘 부탁드려요!','최애는 역시 우리 애!','모험은 즐거워!'];

/* ================= 상태 ================= */
const SAVE_KEY='reisekai_save_v1';
function newState(){return{v:1,name:'',cls:0,partner:null,gold:0,gems:900,stones:5,rerolls:2,bond:0,stars:0,stage:1,kills:0,best:1,
  up:{atk:0,as:0,crit:0,cdmg:0,hp:0},weapon:0,inv:[],eq:[null,null,null,null,null],pity:0,uid:1,bossAuto:true,kpm:12,last:Date.now(),
  buffs:[],enc:{day:'',count:0,next:25},friends:[],dq:{day:'',kills:0,ups:0,summon:0,enc:0,claimed:[]},freeDay:'',totalKills:0,log:[],met:0};}
let S=newState();
const G={started:false,mon:null,heroHp:1,heroDead:0,atkT:0,lunge:0,skillT:6,wait:.5,bossT:0,scroll:0,time:0,flash:0,modal:0,kwin:0,kwinT:0,bossNow:false,bossBlocked:false,idleT:12,lowSaid:false,mhit:0};
let dirty=true,_st=null;
const today=()=>new Date().toISOString().slice(0,10);
function save(){try{S.last=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const j=localStorage.getItem(SAVE_KEY);if(!j)return false;const o=JSON.parse(j);S=Object.assign(newState(),o);S.up=Object.assign(newState().up,o.up||{});S.dq=Object.assign(newState().dq,o.dq||{});S.enc=Object.assign(newState().enc,o.enc||{});return !!S.partner;}catch(e){return false;}}
function resetSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}location.reload();}

function fmt(n){n=Math.floor(n);if(n<1000)return''+n;const u=['','K','M','B','T','Qa','Qi'];let i=0,v=n;while(v>=1000&&i<u.length-1){v/=1000;i++;}return (v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2))+u[i];}
const rnd=(a,b)=>a+Math.random()*(b-a),ri=a=>Math.floor(Math.random()*a),pick=a=>a[ri(a.length)];
function wpick(w){const t=w.reduce((a,b)=>a+b,0);let r=Math.random()*t;for(let i=0;i<w.length;i++){r-=w[i];if(r<0)return i;}return 0;}
function toast(t){if(window.UI)UI.toast(t);}

/* ================= 스탯 ================= */
function accVal(a,k){let s=0;a.opts.forEach(o=>{if(o.k===k)s+=o.v*(1+.08*a.lv);});return s;}
function accBonus(){const r={};OPT_KEYS.forEach(k=>r[k]=0);S.eq.forEach(id=>{const a=S.inv.find(x=>x.id===id);if(a)a.opts.forEach(o=>r[o.k]+=o.v*(1+.08*a.lv));});return r;}
function buffSum(k){return S.buffs.filter(b=>b.k===k).reduce((a,b)=>a+b.v,0);}
function stats(){
  if(!dirty&&_st)return _st;
  const c=CLASSES[S.cls].bonus,p=S.partner,role=p.role,ab=accBonus();
  const wm=1+.15*S.weapon,star=1+.1*S.stars;
  const atk=(5+3*S.up.atk)*Math.pow(2,Math.floor(S.up.atk/25))*wm*(1+ab.atk)*star*(1+.02*partnerLv())*(role==='dealer'?1.1:1)*(1+(c.atk||0))*(1+buffSum('atk'));
  const as=Math.min(4,(1+.02*S.up.as)*(1+ab.as)*(1+(c.as||0))*(1+buffSum('as')));
  const crit=Math.min(.9,.05+.005*S.up.crit+ab.crit+(c.crit||0)+buffSum('crit'));
  const cdmg=1.5+.05*S.up.cdmg+ab.cdmg;
  const hp=(50+25*S.up.hp)*(1+ab.hp)*(1+(c.hp||0))*(role==='healer'?1.15:1);
  const gold=ab.gold+(role==='wealth'?.15:0)+.05*S.stars+buffSum('gold');
  _st={atk,as,crit,cdmg,hp,gold,drop:ab.drop,boss:ab.boss,dps:atk*as*(1+crit*(cdmg-1))};dirty=false;return _st;
}
const partnerLv=()=>S.partner?S.partner.aff:0;
const expNeed=l=>50*(l+1);
function addAff(x){const p=S.partner;p.exp+=x;while(p.exp>=expNeed(p.aff)){p.exp-=expNeed(p.aff);p.aff++;dirty=true;say('lv');toast('💖 애정도 Lv.'+p.aff+' 달성!');}}
const monHp=n=>10*Math.pow(1.13,n-1),monAtk=n=>3*Math.pow(1.12,n-1),goldPer=n=>8*Math.pow(1.12,n-1);

/* ================= 강화 ================= */
const UPDEF={atk:{n:'공격력',base:50,g:1.12,cap:9999,d:l=>'ATK '+fmt((5+3*l)*Math.pow(2,Math.floor(l/25)))},
  as:{n:'공격속도',base:200,g:1.16,cap:40,d:l=>'+'+(l*2)+'%'},
  crit:{n:'치명타 확률',base:300,g:1.16,cap:100,d:l=>'+'+(l*.5).toFixed(1)+'%'},
  cdmg:{n:'치명타 피해',base:300,g:1.16,cap:100,d:l=>'+'+(l*5)+'%'},
  hp:{n:'체력',base:40,g:1.12,cap:9999,d:l=>'HP '+fmt(50+25*l)}};
const upCost=(k,l)=>Math.floor(UPDEF[k].base*Math.pow(UPDEF[k].g,l));
function buyUp(k,n){let c=0;for(let i=0;i<n;i++){const l=S.up[k];if(l>=UPDEF[k].cap)break;const cost=upCost(k,l);if(S.gold<cost)break;S.gold-=cost;S.up[k]++;c++;}
  if(c){dirty=true;S.dq.ups+=c;if(k==='hp')G.heroHp=Math.min(stats().hp,G.heroHp+25);}return c;}
function maxBuy(k){let g=S.gold,l=S.up[k],c=0;while(l<UPDEF[k].cap){const x=upCost(k,l);if(g<x)break;g-=x;l++;c++;if(c>=500)break;}return c;}
const wCost=w=>({gold:Math.floor(200*Math.pow(1.3,w)),stones:2+w*2});
function enhanceWeapon(){if(S.weapon>=20)return false;const c=wCost(S.weapon);if(S.gold<c.gold||S.stones<c.stones)return false;S.gold-=c.gold;S.stones-=c.stones;S.weapon++;dirty=true;S.dq.ups++;return true;}

/* ================= 악세사리 ================= */
function rollOpt(g,k){k=k||pick(OPT_KEYS);return{k,v:GBASE[g]*OPTS[k].b*rnd(.8,1.2)};}
function genAcc(g,type){const a={id:S.uid++,type:type==null?ri(5):type,grade:g,lv:0,opts:[]};const ks=[...OPT_KEYS].sort(()=>Math.random()-.5);for(let i=0;i<OPT_COUNT[g];i++)a.opts.push(rollOpt(g,ks[i]));return a;}
function addAcc(a){if(S.inv.length>=150){S.stones+=1+a.grade*2;return false;}S.inv.push(a);return true;}
const accName=a=>GRADE_N[a.grade]+' '+ACC_TYPES[a.type];
const accMaxLv=a=>MAX_LV[a.grade];
const accCost=a=>({gold:Math.floor(100*Math.pow(1.25,a.lv)),stones:a.lv+1});
function enhanceAcc(id){const a=S.inv.find(x=>x.id===id);if(!a||a.lv>=accMaxLv(a))return 0;const c=accCost(a);if(S.gold<c.gold||S.stones<c.stones)return 0;S.gold-=c.gold;S.stones-=c.stones;a.lv++;dirty=true;S.dq.ups++;return 1;}
function rerollOpt(id,i){const a=S.inv.find(x=>x.id===id);if(!a||S.rerolls<1)return false;S.rerolls--;a.opts[i]=rollOpt(a.grade);dirty=true;return true;}
function dismantle(id){const a=S.inv.find(x=>x.id===id);if(!a||S.eq.includes(id))return 0;const s=1+a.grade*2+Math.floor(a.lv/2);S.stones+=s;S.inv=S.inv.filter(x=>x.id!==id);return s;}
function dismantleLow(){let s=0,n=0;S.inv.filter(a=>a.grade<=0&&!S.eq.includes(a.id)).forEach(a=>{s+=dismantle(a.id);n++;});return{s,n};}
function equip(id){const a=S.inv.find(x=>x.id===id);if(!a)return;S.eq[a.type]=id;dirty=true;}
function unequip(slot){S.eq[slot]=null;dirty=true;}
function mergeAcc(grade){const list=S.inv.filter(a=>a.grade===grade&&!S.eq.includes(a.id)).sort((a,b)=>a.lv-b.lv).slice(0,3);if(list.length<3||grade>=5)return null;
  list.forEach(a=>{S.inv=S.inv.filter(x=>x.id!==a.id);});const up=Math.random()<.5;const n=genAcc(up?grade+1:grade);addAcc(n);return{n,up};}
function summon(count){const cost=count===10?2700:300;if(S.gems<cost)return null;S.gems-=cost;S.dq.summon++;const res=[];
  for(let i=0;i<count;i++){S.pity++;let g=wpick(SUMMON_W);if(S.pity>=90){g=Math.random()<.9?4:5;}if(g>=4)S.pity=0;const a=genAcc(g);addAcc(a);res.push(a);}return res;}
function eqIds(){return S.eq.filter(Boolean);}
function autoEquip(a){const cur=S.inv.find(x=>x.id===S.eq[a.type]);if(!cur||a.grade>cur.grade)equip(a.id);}

/* ================= 파트너 ================= */
function lineOf(kind){const p=S.partner;const arr=(p.lines&&p.lines.length)?p.lines:(PERS[p.pers]||PERS['상냥']);return pick(arr).replace(/\{p\}/g,S.name);}
let _bt=0;
function say(kind){if(!G.started||performance.now()<_bt)return;_bt=performance.now()+2800;if(window.UI)UI.bubble(lineOf(kind));}
function castSkill(){const st=stats(),p=S.partner,m=G.mon;
  if(p.role==='dealer'&&m&&m.state==='fight'){dmgMon(st.atk*6,true,'#ff8a2a');}
  else if(p.role==='support'){S.buffs=S.buffs.filter(b=>b.src!=='skill');S.buffs.push({k:'atk',v:.25,t:6,src:'skill'},{k:'as',v:.15,t:6,src:'skill'});dirty=true;}
  else if(p.role==='healer'){if(G.heroHp>st.hp*.7)return false;G.heroHp=Math.min(st.hp,G.heroHp+st.hp*.35);}
  else if(p.role==='wealth'){S.gold+=goldPer(S.stage)*(1+st.gold)*5;}
  else return false;
  G.flash=.2;if(window.UI)UI.pop(ROLES[p.role].sk+'!',pCssX(),pCssY()-20,'skill');say('skill');return true;}

/* ================= 전투 ================= */
function heroX(){return Math.floor(W*.3);}
function groundY(){return Math.floor(H*.74);}
function spawnMon(){
  const boss=S.kills>=10&&((S.bossAuto&&!G.bossBlocked)||G.bossNow);const A=AREAS[areaOf(S.stage)];
  const def=boss?A.boss:pick(A.mons);const hp=monHp(S.stage)*(boss?8:1);
  G.mon={def,boss,x:W+12,hp,max:hp,state:'walk',die:0,atkT:1.4,phase:Math.random()*6};
  if(boss){G.bossT=30;if(window.UI)UI.pop('⚠ BOSS',cssX(W*.6),cssY(H*.3),'skill');say('boss');}
}
function dmgMon(d,crit,col){const m=G.mon;if(!m||m.state==='die')return;m.hp-=d;G.mhit=.1;if(window.UI)UI.pop(fmt(d)+(crit?'!':''),cssX(m.x),cssY(groundY()-(m.boss?44:26)),crit?'crit':'',col);if(m.hp<=0)killMon();}
function killMon(){
  const m=G.mon,st=stats();m.state='die';m.die=.35;
  const gp=goldPer(S.stage)*(m.boss?10:1)*(1+st.gold);S.gold+=gp;S.totalKills++;S.dq.kills++;G.kwin++;
  if(window.UI)UI.pop('+'+fmt(gp),cssX(m.x),cssY(groundY()-34),'gold');
  addAff(m.boss?10:1);
  if(Math.random()<.05*(1+st.drop))S.stones+=1;
  const dropP=.04*(1+st.drop);
  if(m.boss||Math.random()<dropP){const g=wpick(m.boss?BOSS_W:DROP_W);const a=genAcc(g);if(addAcc(a)){autoEquip(a);toast('획득: '+accName(a));}}
  if(m.boss){S.stones+=2+Math.floor(S.stage/10);if(S.stage>=S.best){S.gems+=20;S.best=S.stage+1;toast('💎 보스 첫 클리어! +20');}S.stage++;S.kills=0;G.bossBlocked=false;G.bossNow=false;toast('STAGE '+S.stage+' 돌입!');}
  else{if(S.kills<10)S.kills++;G.heroHp=Math.min(st.hp,G.heroHp+st.hp*.05);}
  if(Math.random()<.04)say('kill');
}
function bossFail(){G.bossBlocked=true;G.bossNow=false;G.mon=null;G.wait=1;toast('보스 도전 실패… 조금 더 강해져서 다시!');say('hurt');}
function manualBoss(){if(S.kills>=10){G.bossBlocked=false;G.bossNow=true;if(G.mon&&!G.mon.boss&&G.mon.state!=='die'){G.mon=null;G.wait=.2;}return true;}return false;}

function update(dt){
  if(!G.started)return;
  G.time+=dt;const st=stats();
  // 버프
  if(S.buffs.length){S.buffs.forEach(b=>b.t-=dt);const n=S.buffs.length;S.buffs=S.buffs.filter(b=>b.t>0);if(S.buffs.length!==n)dirty=true;}
  G.kwinT+=dt;if(G.kwinT>=60){S.kpm=S.kpm*.7+G.kwin*.3;G.kwin=0;G.kwinT=0;}
  // 파트너
  G.skillT-=dt;if(G.skillT<=0&&G.mon&&G.mon.state==='fight'||(G.skillT<=0&&S.partner.role!=='dealer')){if(castSkill())G.skillT=10;else G.skillT=2;}
  G.idleT-=dt;if(G.idleT<=0){say('idle');G.idleT=rnd(15,30);}
  if(G.flash>0)G.flash-=dt;if(G.lunge>0)G.lunge-=dt;if(G.mhit>0)G.mhit-=dt;
  // 사망
  if(G.heroDead>0){G.heroDead-=dt;if(G.heroDead<=0){G.heroHp=st.hp;G.wait=.5;}return;}
  if(G.bossT>0&&G.mon&&G.mon.boss&&G.mon.state!=='die'){G.bossT-=dt;if(G.bossT<=0){bossFail();return;}}
  const m=G.mon;
  if(!m){G.scroll+=45*dt;G.wait-=dt;if(G.wait<=0)spawnMon();return;}
  if(m.state==='walk'){G.scroll+=45*dt;m.x-=70*dt;if(m.x<=heroX()+(m.boss?34:20)){m.state='fight';G.atkT=.2;}}
  else if(m.state==='fight'){
    G.atkT-=dt;if(G.atkT<=0){G.atkT+=1/st.as;G.lunge=.12;const c=Math.random()<st.crit;dmgMon(st.atk*(c?st.cdmg:1)*(m.boss?1+st.boss:1),c);if(c&&Math.random()<.15)say('crit');if(!G.mon||G.mon.state==='die')return;}
    m.atkT-=dt;if(m.atkT<=0){m.atkT+=m.boss?1.1:1.4;const d=monAtk(S.stage)*(m.boss?2.2:1);G.heroHp-=d;if(window.UI)UI.pop('-'+fmt(d),cssX(heroX()),cssY(groundY()-40),'hurt');
      if(G.heroHp<st.hp*.3&&!G.lowSaid){G.lowSaid=true;say('hurt');}if(G.heroHp>st.hp*.6)G.lowSaid=false;
      if(G.heroHp<=0){G.heroHp=0;G.heroDead=2.5;if(m.boss){G.bossBlocked=true;G.bossNow=false;toast('보스에게 패배…');}G.mon=null;return;}}
  }else if(m.state==='die'){m.die-=dt;if(m.die<=0){G.mon=null;G.wait=.4;}}
}

/* ================= 방치 보상 ================= */
function offlineReward(sec){sec=Math.min(sec,8*3600);if(sec<60)return null;
  const st=stats(),kills=sec/60*S.kpm*.7,gold=Math.floor(kills*goldPer(S.stage)*(1+st.gold)),stones=Math.floor(kills*.04);
  S.gold+=gold;S.stones+=stones;addAff(Math.floor(kills*.3));S.totalKills+=Math.floor(kills);return{sec,kills:Math.floor(kills),gold,stones};}

/* ================= 환생 / 일일 ================= */
const rebirthGain=()=>S.stage>=100?Math.floor(S.stage/20):0;
function rebirth(){const g=rebirthGain();if(!g)return false;S.stars+=g;S.gold=0;S.stage=1;S.kills=0;S.up={atk:0,as:0,crit:0,cdmg:0,hp:0};S.weapon=0;S.buffs=[];G.mon=null;G.heroHp=1;dirty=true;G.heroHp=stats().hp;return g;}
function checkDay(){const t=today();if(S.dq.day!==t)S.dq={day:t,kills:0,ups:0,summon:0,enc:0,claimed:[]};if(S.enc.day!==t){S.enc.day=t;S.enc.count=0;}}
const QUESTS=[{id:'kills',n:'몬스터 50마리 처치',k:'kills',need:50,gem:50},{id:'ups',n:'강화 5회',k:'ups',need:5,gem:30},{id:'summon',n:'악세사리 소환 1회',k:'summon',need:1,gem:50},{id:'enc',n:'플레이어와 3번 만나기',k:'enc',need:3,gem:40}];
function claimQuest(id){const q=QUESTS.find(x=>x.id===id);if(!q||S.dq.claimed.includes(id)||S.dq[q.k]<q.need)return false;S.dq.claimed.push(id);S.gems+=q.gem;return true;}

/* ================= 플레이어 조우 (NPC 봇 스냅샷) ================= */
function makeBot(){const cls=pick(CLASSES);return{name:pick(BOT_NAMES)+ri(100),app:cls.app,cls:cls.n,pName:pick(BOT_PARTNERS),pApp:randomAppearance(),pLine:pick(BOT_LINES),intro:pick(['아이돌 지망생','마법소녀','츤데레 검사','졸린 천재'])};}
function encounter(forceType){
  const bot=makeBot(),st=stats(),gp=goldPer(S.stage)*(1+st.gold);
  const type=forceType||['duel','share','heal','buff','weapon'][wpick([30,25,15,20,10])];
  const r={bot,type,lines:[]};
  S.met++;S.dq.enc++;S.enc.count++;S.bond+=type==='duel'?2:5;
  if(type==='duel'){const win=Math.random()<.65;r.win=win;if(win){const g=Math.floor(gp*20);S.gold+=g;S.stones+=1;r.lines.push('승리! 골드 +'+fmt(g),'강화석 +1');}else{const g=Math.floor(gp*5);S.gold+=g;r.lines.push('아쉽게 패배… 위로금 골드 +'+fmt(g));}}
  else if(type==='share'){const k=ri(4);if(k===0){const g=Math.floor(gp*30);S.gold+=g;r.lines.push('골드 +'+fmt(g));}else if(k===1){const s=1+ri(3);S.stones+=s;r.lines.push('강화석 +'+s);}else if(k===2){S.rerolls++;r.lines.push('재굴림석 +1');}else{const g=10+ri(21);S.gems+=g;r.lines.push('젬 +'+g);}}
  else if(type==='heal'){G.heroHp=st.hp;G.skillT=0;r.lines.push('체력 전부 회복! 파트너 스킬 즉시 준비');}
  else if(type==='buff'){const k=pick([['atk',.3,'공격력 +30%'],['as',.3,'공격속도 +30%'],['crit',.15,'치명타 확률 +15%'],['gold',.5,'골드 획득 +50%']]);S.buffs.push({k:k[0],v:k[1],t:300,src:'enc'});dirty=true;r.lines.push(k[2]+' (5분)');}
  else{S.stones+=3;r.lines.push('강화석 +3');if(Math.random()<.3&&S.weapon<20){S.weapon++;dirty=true;r.lines.push('🔨 무기 강화 +1! (현재 +'+S.weapon+')');}}
  r.lines.push('인연 포인트 +'+(type==='duel'?2:5));
  S.enc.next=rnd(90,180);
  return r;}

/* ================= 렌더링 ================= */
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
let W=180,H=130,SC=3;
function resize(){const r=cv.parentElement.getBoundingClientRect();if(!r.width)return;SC=Math.max(2,Math.round(r.width/140));W=Math.ceil(r.width/SC);H=Math.ceil(r.height/SC);cv.width=W;cv.height=H;ctx.imageSmoothingEnabled=false;}
const cssX=x=>x*(cv.clientWidth/W),cssY=y=>y*(cv.clientHeight/H);
const pCssX=()=>cssX(heroX()-22),pCssY=()=>cssY(groundY()-24);
const hash=n=>{n=Math.imul(n^61,0x45d9f3b);n^=n>>>15;return(n>>>0)%1000/1000;};

function drawBG(ai,scroll){
  const A=AREAS[ai],gy=groundY();
  for(let y=0;y<gy;y+=2){ctx.fillStyle=mixc(A.sky[0],A.sky[1],y/gy);ctx.fillRect(0,y,W,2);}
  if(ai<2){ctx.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<3;i++){const cx=((i*90-scroll*.05)%(W+60)+W+60)%(W+60)-30,cy=10+i*9;ctx.fillRect(cx,cy,24,5);ctx.fillRect(cx+4,cy-3,14,4);}}
  ctx.fillStyle=A.far;for(let x=0;x<W;x++){const X=x+scroll*.15,h=20+Math.floor(16*Math.abs(Math.sin(X*.03))+8*Math.abs(Math.sin(X*.011+1)));ctx.fillRect(x,gy-h,1,h);}
  const per=34,off=scroll*.5;
  for(let i=-1;i<W/per+2;i++){const idx=i+Math.floor(off/per),bx=i*per-(off%per),r=hash(idx);
    if(ai===0){ctx.fillStyle=A.mid;ctx.fillRect(bx,gy-10-r*6,18,10+r*6);ctx.fillRect(bx+3,gy-14-r*6,12,4);ctx.fillStyle='#3a7a2a';ctx.fillRect(bx,gy-3,18,3);}
    else if(ai===1){ctx.fillStyle='#4a3020';ctx.fillRect(bx+8,gy-26,4,26);ctx.fillStyle=A.mid;ctx.fillRect(bx,gy-40-r*8,20,18);ctx.fillRect(bx+4,gy-46-r*8,12,8);}
    else if(ai===2){ctx.fillStyle=A.mid;ctx.fillRect(bx+4,gy-16-r*8,10,16+r*8);ctx.fillRect(bx+6,gy-19-r*8,6,3);ctx.fillStyle='#3a3650';ctx.fillRect(bx+8,gy-12-r*8,2,8);}
    else{ctx.fillStyle=A.mid;ctx.beginPath();ctx.moveTo(bx,gy);ctx.lineTo(bx+9,gy-22-r*14);ctx.lineTo(bx+18,gy);ctx.fill();ctx.fillStyle='#ff8a2a';ctx.fillRect(bx+8,gy-10-r*6,2,3);}
  }
  ctx.fillStyle=A.ground[0];ctx.fillRect(0,gy,W,H-gy);ctx.fillStyle=A.ground[1];ctx.fillRect(0,gy,W,2);
  ctx.fillStyle=mixc(A.ground[0],'#000000',.2);for(let x=-10;x<W+10;x+=12){const X=x-(scroll%12);ctx.fillRect(X+(hash(Math.floor((x+scroll)/12))*8|0),gy+4+(Math.floor(x/12)%3)*5,3,1);}
}
function drawImg(c,x,y,sc,alpha){ctx.globalAlpha=alpha==null?1:alpha;ctx.drawImage(c,Math.round(x-c.width*sc/2),Math.round(y-c.height*sc),Math.round(c.width*sc),Math.round(c.height*sc));ctx.globalAlpha=1;}
function bar(x,y,w,p,col){ctx.fillStyle='#2a1a10';ctx.fillRect(x-1,y-1,w+2,4);ctx.fillStyle='#600';ctx.fillRect(x,y,w,2);ctx.fillStyle=col;ctx.fillRect(x,y,Math.max(0,w*p),2);}
function render(){
  if(!G.started||!S.partner)return;
  const t=G.time,gy=groundY(),hx=heroX(),walking=!G.mon||G.mon.state==='walk';
  drawBG(areaOf(S.stage),G.scroll);
  const m=G.mon;
  if(m){const c=monCanvas(m.def.k,m.def.c,m.def.x||0),sc=m.boss?2.4:1,bob=m.state==='fight'||m.state==='walk'?Math.abs(Math.sin(t*6+m.phase))*2:0;
    const a=m.state==='die'?Math.max(0,m.die/.35):1;drawImg(c,m.x,gy+1-bob-(m.state==='die'?(1-a)*8:0),sc,a);
    if(G.mhit>0){ctx.globalAlpha=.5;ctx.fillStyle='#fff';ctx.fillRect(m.x-8*sc,gy-16*sc,16*sc,16*sc);ctx.globalAlpha=1;}
    if(m.state!=='die'){const bw=m.boss?40:22;bar(Math.round(m.x-bw/2),gy-c.height*sc-4,bw,m.hp/m.max,'#e8504a');}}
  const frame=walking&&G.heroDead<=0?Math.floor(t*6)%2:0,bobH=walking?0:Math.sin(t*3)*.6;
  const pc=charCanvas(S.partner.app,frame),hc=charCanvas(CLASSES[S.cls].app,frame);
  drawImg(pc,hx-22,gy+1-Math.abs(Math.sin(t*5+1))*(walking?2:0),.9);
  ctx.save();if(G.heroDead>0){ctx.translate(hx,gy);ctx.rotate(-1.4);ctx.translate(-hx,-gy);}
  drawImg(hc,hx+(G.lunge>0?5:0),gy+1+bobH-(walking?Math.abs(Math.sin(t*6)):0),1);ctx.restore();
  if(G.heroDead<=0)bar(hx-10,gy-hc.height-3,20,Math.max(0,G.heroHp/stats().hp),'#5fbf5f');
  if(G.flash>0){ctx.globalAlpha=G.flash*2.5;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
  if(G.heroDead>0){ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,W,H);}
}

/* ================= 메인 루프 ================= */
let _last=performance.now(),_saveT=0;
function frame(now){const dt=Math.min(.1,(now-_last)/1000);_last=now;
  try{update(dt);render();
    if(G.started&&!G.modal){S.enc.next-=dt;checkDay();if(S.enc.next<=0){if(S.enc.count<20&&window.UI)UI.encounter();else S.enc.next=120;}}
    _saveT+=dt;if(_saveT>5){_saveT=0;save();}
    if(window.UI)UI.tick(dt);
  }catch(e){console.error(e);}
  requestAnimationFrame(frame);}
window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();}else if(G.started){const sec=(Date.now()-S.last)/1000;if(sec>60){const r=offlineReward(sec);if(r&&window.UI)UI.offline(r);}}});
window.addEventListener('beforeunload',save);
