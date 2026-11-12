'use strict';
/* 코드로 그리는 도트 스프라이트 엔진: 파츠 조합 + 팔레트 스왑 + 자동 외곽선 */
const OUT = '#2a1a10';
function hex2rgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function mixc(a,b,t){const A=hex2rgb(a),B=hex2rgb(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function tones(c){return {l:mixc(c,'#ffffff',.4),m:c,d:mixc(c,'#000000',.35)};}

class Grid{
  constructor(w,h,oy=0){this.w=w;this.h=h;this.oy=oy;this.d=new Array(w*h).fill(null);}
  px(x,y,c){y+=this.oy;if(x>=0&&y>=0&&x<this.w&&y<this.h)this.d[y*this.w+x]=c;}
  rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.px(x+i,y+j,c);}
  clr(x,y){this.px(x,y,null);}
  render(alpha=1){
    const cv=document.createElement('canvas');cv.width=this.w+2;cv.height=this.h+2;
    const g=cv.getContext('2d');g.globalAlpha=alpha;
    const at=(x,y)=>(x<0||y<0||x>=this.w||y>=this.h)?null:this.d[y*this.w+x];
    for(let y=-1;y<=this.h;y++)for(let x=-1;x<=this.w;x++){
      const c=at(x,y);
      if(c){g.fillStyle=c;g.fillRect(x+1,y+1,1,1);}
      else if(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)){g.fillStyle=OUT;g.fillRect(x+1,y+1,1,1);}
    }
    return cv;
  }
}

/* ---------- 색상 팔레트 ---------- */
const COLORS={
  hair:['#2b2b3a','#6b4a2a','#a8703a','#e8c060','#f0e6c8','#d6403a','#f08ab0','#ff6fb5','#8a5be0','#4a8be8','#4ac0e8','#4fb36a','#9bd64a','#e8e8f0','#ff9a3a','#7a7a8a'],
  eye:['#2b2b3a','#6b4a2a','#4a8be8','#4fb36a','#8a5be0','#d6403a','#e8b030','#4ac0e8','#ff6fb5','#9bd64a','#7a7a8a','#f0f0f0'],
  skin:['#ffe0c8','#fbd0b0','#f2b890','#d9966a','#b87848','#ffeee6'],
  main:['#ffffff','#2b2b3a','#d6403a','#f08ab0','#ff6fb5','#8a5be0','#4a8be8','#4ac0e8','#4fb36a','#9bd64a','#e8b030','#ff9a3a','#8a95a5','#6b4a2a','#3a3a58','#f0e6c8'],
  acc:['#e8b030','#ffffff','#2b2b3a','#d6403a','#ff6fb5','#8a5be0','#4a8be8','#4ac0e8','#4fb36a','#ff9a3a','#f0e6c8','#a8703a','#8a95a5','#f08ab0','#9bd64a','#7a7a8a'],
  prop:['#e8b030','#b0b7c0','#2b2b3a','#d6403a','#ff6fb5','#8a5be0','#4a8be8','#4ac0e8','#4fb36a','#ff9a3a','#a8703a','#ffffff','#f08ab0','#9bd64a','#6b4a2a','#7a7a8a']
};
function palette(c){
  const h=tones(c.hair),a=tones(c.main),b=tones(c.acc),p=tones(c.prop);
  return {h1:h.l,h2:h.m,h3:h.d,a1:a.l,a2:a.m,a3:a.d,b1:b.l,b2:b.m,b3:b.d,p1:p.l,p2:p.m,p3:p.d,
    s:c.skin,sd:mixc(c.skin,'#000000',.15),e:c.eye,w:'#ffffff'};
}

/* ---------- 캐릭터 파츠 (16x20, 좌표는 oy=2 기준) ---------- */
const PARTS={
  hairBack:[
    {n:'긴 생머리',f:(g,P)=>{g.rect(2,2,12,14,P.h3);g.rect(2,2,1,12,P.h2);g.rect(13,2,1,12,P.h2);}},
    {n:'트윈테일',f:(g,P)=>{g.rect(1,4,2,10,P.h2);g.rect(13,4,2,10,P.h2);g.px(1,4,P.b1);g.px(14,4,P.b1);g.rect(1,12,2,2,P.h3);g.rect(13,12,2,2,P.h3);}},
    {n:'단발',f:(g,P)=>{g.rect(2,2,12,9,P.h3);g.rect(2,2,1,8,P.h2);g.rect(13,2,1,8,P.h2);}},
    {n:'포니테일',f:(g,P)=>{g.rect(12,3,3,11,P.h2);g.rect(13,13,2,3,P.h3);g.px(12,4,P.b1);}},
    {n:'짧은 머리',f:(g,P)=>{g.rect(3,2,10,4,P.h3);}}
  ],
  hairFront:[
    {n:'일자 앞머리',f:(g,P)=>{g.rect(3,1,10,3,P.h2);g.rect(3,4,2,3,P.h2);g.rect(11,4,2,3,P.h2);g.rect(5,2,3,1,P.h1);}},
    {n:'가르마',f:(g,P)=>{g.rect(3,1,10,2,P.h2);g.rect(3,3,5,2,P.h2);g.rect(3,5,2,2,P.h2);g.rect(11,3,2,4,P.h2);g.rect(5,1,3,1,P.h1);}},
    {n:'뾰족머리',f:(g,P)=>{g.rect(3,1,10,2,P.h2);g.px(4,0,P.h2);g.px(7,0,P.h2);g.px(8,-1,P.h2);g.px(10,0,P.h2);g.rect(3,3,2,3,P.h2);g.rect(11,3,2,3,P.h2);g.px(9,3,P.h2);g.px(6,3,P.h2);g.rect(5,1,2,1,P.h1);}},
    {n:'아호게',f:(g,P)=>{g.rect(3,1,10,3,P.h2);g.rect(3,4,2,3,P.h2);g.rect(11,4,2,3,P.h2);g.px(8,0,P.h2);g.px(8,-1,P.h2);g.px(9,-2,P.h2);g.rect(5,2,3,1,P.h1);}},
    {n:'사이드 뱅',f:(g,P)=>{g.rect(3,1,10,2,P.h2);g.rect(3,3,7,1,P.h2);g.rect(3,4,3,1,P.h2);g.rect(3,5,2,2,P.h2);g.rect(11,3,2,4,P.h2);g.rect(6,1,3,1,P.h1);}}
  ],
  eye:[
    {n:'또렷한 눈',f:(g,P)=>{g.rect(5,5,2,2,P.e);g.rect(9,5,2,2,P.e);g.px(5,5,P.w);g.px(9,5,P.w);}},
    {n:'웃는 눈',f:(g,P)=>{[5,9].forEach(x=>{g.px(x,6,P.e);g.px(x+1,5,P.e);g.px(x+2,6,P.e);});}},
    {n:'큰 눈',f:(g,P)=>{g.rect(4,4,3,3,P.e);g.rect(9,4,3,3,P.e);g.px(4,4,P.w);g.px(5,4,P.w);g.px(9,4,P.w);g.px(10,4,P.w);}},
    {n:'졸린 눈',f:(g,P)=>{g.rect(5,6,2,1,P.e);g.rect(9,6,2,1,P.e);g.px(5,5,P.sd);g.px(10,5,P.sd);}}
  ],
  outfit:[
    {n:'아이돌 드레스',f:(g,P)=>{g.rect(5,10,6,4,P.a2);g.rect(5,10,6,1,P.b2);g.px(8,11,P.b1);g.rect(3,10,2,4,P.s);g.rect(11,10,2,4,P.s);g.rect(3,10,2,1,P.a2);g.rect(11,10,2,1,P.a2);g.rect(3,14,10,3,P.a2);g.rect(3,16,10,1,P.b2);g.rect(4,14,2,2,P.a1);}},
    {n:'교복',f:(g,P)=>{g.rect(5,10,6,4,P.a1);g.rect(3,10,2,4,P.a2);g.rect(11,10,2,4,P.a2);g.rect(3,13,2,1,P.s);g.rect(11,13,2,1,P.s);g.px(8,11,P.b1);g.px(8,12,P.b1);g.rect(4,14,8,3,P.b2);g.px(6,15,P.b3);g.px(9,15,P.b3);g.px(7,16,P.b3);}},
    {n:'후드티',f:(g,P)=>{g.rect(4,9,8,8,P.a2);g.rect(5,9,6,1,P.a3);g.rect(6,13,4,2,P.a3);g.rect(2,10,2,5,P.a2);g.rect(12,10,2,5,P.a2);g.px(2,15,P.s);g.px(3,15,P.s);g.px(12,15,P.s);g.px(13,15,P.s);g.rect(4,16,8,1,P.a3);g.px(7,11,P.a1);g.px(9,11,P.a1);}},
    {n:'전투복',f:(g,P)=>{g.rect(5,10,6,5,P.a3);g.rect(6,10,4,2,P.a1);g.rect(3,10,2,4,P.a2);g.rect(11,10,2,4,P.a2);g.rect(3,14,2,1,P.s);g.rect(11,14,2,1,P.s);g.rect(5,14,6,1,P.b2);g.px(8,14,P.b1);g.rect(5,15,6,2,P.b3);}},
    {n:'마법 로브',f:(g,P)=>{g.rect(4,10,8,7,P.a2);g.rect(7,10,2,7,P.b2);g.rect(3,10,2,5,P.a3);g.rect(11,10,2,5,P.a3);g.px(3,15,P.s);g.px(12,15,P.s);g.rect(4,16,8,1,P.b2);g.rect(5,10,6,1,P.a1);}}
  ],
  prop:[
    {n:'없음',f:()=>{}},
    {n:'마이크',f:(g,P)=>{g.rect(12,10,2,2,P.p1);g.rect(13,12,1,3,P.p3);g.px(12,10,P.p2);}},
    {n:'리본',f:(g,P)=>{g.rect(9,0,2,2,P.p1);g.rect(12,0,2,2,P.p1);g.px(11,1,P.p3);}},
    {n:'고양이 귀',f:(g,P)=>{g.rect(3,-1,2,2,P.h2);g.rect(11,-1,2,2,P.h2);g.px(4,0,P.p1);g.px(11,0,P.p1);}},
    {n:'헤드셋',f:(g,P)=>{g.rect(2,3,1,4,P.p2);g.rect(13,3,1,4,P.p2);g.rect(3,0,10,1,P.p2);g.rect(11,7,2,1,P.p2);}},
    {n:'마법봉',f:(g,P)=>{g.rect(14,9,1,8,P.p3);g.rect(13,7,3,3,P.p1);g.px(14,8,P.w);}}
  ],
  weapon:{
    sword:(g,P)=>{g.rect(14,5,1,9,'#dfe6ee');g.rect(14,5,1,1,'#fff');g.rect(13,14,3,1,P.p2);g.rect(14,15,1,2,P.p3);},
    bow:(g,P)=>{g.rect(14,6,1,10,P.p3);g.px(13,6,P.p3);g.px(13,15,P.p3);g.px(15,8,'#dfe6ee');g.px(15,13,'#dfe6ee');},
    staff:(g,P)=>{g.rect(14,8,1,9,P.p3);g.rect(13,5,3,3,P.p1);g.px(14,6,'#fff');},
    dagger:(g,P)=>{g.rect(14,11,1,4,'#dfe6ee');g.rect(13,15,3,1,P.p2);g.px(14,16,P.p3);}
  }
};

const _cache={};
function charCanvas(app,frame){
  const key=JSON.stringify(app)+'|'+frame;
  if(_cache[key])return _cache[key];
  const g=new Grid(16,22,2),P=palette(app.col);
  PARTS.hairBack[app.hairBack].f(g,P);
  // 다리
  const lift=frame===1;
  g.rect(5,17,2,lift?2:3,P.s);g.rect(9,17,2,3,P.s);
  g.rect(4,lift?18:19,3,1,'#5a3a22');g.rect(9,19,3,1,'#5a3a22');
  g.rect(7,9,2,1,P.sd);
  PARTS.outfit[app.outfit].f(g,P);
  // 머리
  g.rect(3,2,10,7,P.s);g.clr(3,2);g.clr(12,2);g.clr(3,8);g.clr(12,8);
  g.px(5,7,'#ff9aa2');g.px(10,7,'#ff9aa2');g.px(7,7,'#c0505a');g.px(8,7,'#c0505a');
  PARTS.eye[app.eye].f(g,P);
  PARTS.hairFront[app.hairFront].f(g,P);
  if(app.weapon)PARTS.weapon[app.weapon](g,P);
  else PARTS.prop[app.prop].f(g,P);
  return _cache[key]=g.render();
}

/* ---------- 몬스터 (16x16) ---------- */
const MONS={
  slime:(g,c)=>{const t=tones(c);g.rect(3,9,10,5,t.m);g.rect(4,7,8,2,t.m);g.rect(6,6,4,1,t.m);g.rect(3,13,10,1,t.d);g.px(5,8,t.l);g.px(6,7,t.l);g.rect(5,10,1,2,'#222');g.rect(10,10,1,2,'#222');g.rect(7,12,2,1,'#222');},
  mushroom:(g,c)=>{const t=tones(c);g.rect(2,4,12,4,t.m);g.rect(4,3,8,1,t.m);g.px(4,5,'#fff');g.rect(8,4,2,2,'#fff');g.px(12,6,'#fff');g.rect(2,7,12,1,t.d);g.rect(5,8,6,6,'#f2e2c4');g.rect(5,13,6,1,'#d8c4a0');g.px(6,10,'#222');g.px(9,10,'#222');g.rect(7,12,2,1,'#222');},
  rabbit:(g,c)=>{const t=tones(c);g.rect(4,8,8,6,t.m);g.rect(5,5,6,4,t.m);g.rect(5,1,2,5,t.m);g.rect(9,1,2,5,t.m);g.px(6,2,'#f6a');g.px(10,2,'#f6a');g.rect(7,3,2,2,'#e8b030');g.px(6,7,'#c22');g.px(9,7,'#c22');g.rect(4,13,8,1,t.d);},
  goblin:(g,c,bow)=>{const t=tones(c);g.rect(4,3,8,5,t.m);g.rect(2,4,2,2,t.m);g.rect(12,4,2,2,t.m);g.px(6,5,'#ff0');g.px(9,5,'#ff0');g.rect(6,7,4,1,'#222');g.rect(5,8,6,5,'#8a5a34');g.rect(5,13,2,2,t.d);g.rect(9,13,2,2,t.d);
    if(bow){g.rect(13,4,1,9,'#c9a066');g.px(12,5,'#c9a066');g.px(12,12,'#c9a066');}else{g.rect(13,6,2,7,'#5a3a22');g.rect(12,5,4,3,'#6b4426');}},
  wolf:(g,c)=>{const t=tones(c);g.rect(2,7,9,5,t.m);g.rect(10,5,5,4,t.m);g.rect(14,7,2,2,t.l);g.px(11,4,t.d);g.px(13,4,t.d);g.px(12,6,'#ff0');g.rect(0,6,3,2,t.m);g.rect(3,12,2,3,t.d);g.rect(8,12,2,3,t.d);g.rect(2,11,9,1,t.d);},
  skeleton:(g)=>{g.rect(4,2,8,6,'#e8e8e0');g.rect(5,8,6,1,'#cfcfc4');g.rect(5,4,2,2,'#222');g.rect(9,4,2,2,'#222');g.px(8,6,'#222');g.rect(6,9,4,5,'#e8e8e0');g.rect(6,10,4,1,'#222');g.rect(6,12,4,1,'#222');g.rect(4,9,1,4,'#e8e8e0');g.rect(11,9,1,4,'#e8e8e0');g.rect(6,14,1,2,'#e8e8e0');g.rect(9,14,1,2,'#e8e8e0');},
  zombie:(g)=>{g.rect(5,2,6,5,'#8fae7a');g.px(6,4,'#fff');g.px(9,4,'#c22');g.rect(7,6,2,1,'#3a2a2a');g.rect(5,7,6,5,'#5a6e8a');g.rect(11,8,4,2,'#8fae7a');g.rect(1,8,4,2,'#8fae7a');g.rect(5,12,2,3,'#4a4a5a');g.rect(9,12,2,3,'#4a4a5a');},
  ghost:(g)=>{g.rect(4,3,8,9,'#e9f2ff');g.rect(5,2,6,1,'#e9f2ff');[4,6,8,10].forEach(x=>g.px(x,12,'#e9f2ff'));g.rect(6,6,1,2,'#222');g.rect(9,6,1,2,'#222');g.rect(7,9,2,2,'#222');g.rect(4,4,1,3,'#fff');},
  lizard:(g,c)=>{const t=tones(c);g.rect(2,8,10,4,t.m);g.rect(11,6,4,4,t.m);g.rect(0,9,3,2,t.m);g.rect(4,6,2,2,'#ffb030');g.rect(7,6,2,2,'#ffb030');g.px(13,7,'#ff0');g.rect(3,12,2,2,t.d);g.rect(9,12,2,2,t.d);g.rect(2,11,10,1,t.d);},
  golem:(g)=>{g.rect(3,5,10,8,'#8c8070');g.rect(1,6,3,5,'#7a6e60');g.rect(12,6,3,5,'#7a6e60');g.rect(5,2,6,4,'#9a8e7e');g.px(6,3,'#ff6a2a');g.px(9,3,'#ff6a2a');g.px(8,8,'#ff6a2a');g.px(7,9,'#ff6a2a');g.px(8,10,'#ff6a2a');g.rect(4,13,3,2,'#6a5e50');g.rect(9,13,3,2,'#6a5e50');}
};
const _mc={};
function monCanvas(kind,color,extra){
  const k=kind+color+extra;if(_mc[k])return _mc[k];
  const g=new Grid(16,16,0);MONS[kind](g,color,extra);
  return _mc[k]=g.render(kind==='ghost'?.85:1);
}

/* 오프닝 편의점 (48x30) */
function storeCanvas(sign){
  const g=new Grid(48,32,0);
  g.rect(2,8,44,22,'#f4f4ee');g.rect(2,4,44,5,'#2a8a4a');g.rect(2,9,44,2,'#e8b030');g.rect(2,11,44,1,'#d6403a');
  g.rect(6,15,14,13,'#8ed1f0');g.rect(6,15,14,1,'#fff');g.rect(24,15,10,15,'#6ab0d0');g.rect(28,15,1,15,'#2a1a10');g.rect(36,15,8,10,'#8ed1f0');
  g.rect(4,28,40,2,'#9a9a9a');
  if(sign){g.rect(8,5,32,3,'#fff6a0');for(let x=10;x<38;x+=4)g.rect(x,6,2,1,'#2a8a4a');}
  return g.render();
}
function truckCanvas(){
  const g=new Grid(40,20,0);
  g.rect(0,4,26,12,'#e8e8e8');g.rect(26,7,12,9,'#d6403a');g.rect(30,8,6,4,'#8ed1f0');g.rect(2,16,34,2,'#555');
  [6,16,31].forEach(x=>{g.rect(x,14,5,5,'#222');g.rect(x+1,15,3,3,'#888');});g.rect(37,12,2,2,'#ffee66');
  return g.render();
}

/* 파트너/영웅 기본 */
function randomAppearance(){
  const r=a=>Math.floor(Math.random()*a);
  const pick=a=>a[r(a.length)];
  return {hairBack:r(PARTS.hairBack.length),hairFront:r(PARTS.hairFront.length),eye:r(PARTS.eye.length),outfit:r(PARTS.outfit.length),prop:r(PARTS.prop.length),
    col:{hair:pick(COLORS.hair),eye:pick(COLORS.eye),skin:pick(COLORS.skin),main:pick(COLORS.main),acc:pick(COLORS.acc),prop:pick(COLORS.prop)}};
}
const CLASSES=[
  {id:'warrior',n:'전사',desc:'체력 +20%',app:{hairBack:4,hairFront:2,eye:0,outfit:3,prop:0,weapon:'sword',col:{hair:'#6b4a2a',eye:'#2b2b3a',skin:'#fbd0b0',main:'#8a95a5',acc:'#d6403a',prop:'#b0b7c0'}},bonus:{hp:.2}},
  {id:'archer',n:'궁수',desc:'공격속도 +10%',app:{hairBack:3,hairFront:1,eye:0,outfit:2,prop:0,weapon:'bow',col:{hair:'#e8c060',eye:'#4fb36a',skin:'#ffe0c8',main:'#4fb36a',acc:'#a8703a',prop:'#a8703a'}},bonus:{as:.1}},
  {id:'mage',n:'마법사',desc:'공격력 +10%',app:{hairBack:2,hairFront:3,eye:2,outfit:4,prop:0,weapon:'staff',col:{hair:'#8a5be0',eye:'#4ac0e8',skin:'#ffe0c8',main:'#8a5be0',acc:'#e8b030',prop:'#e8b030'}},bonus:{atk:.1}},
  {id:'rogue',n:'도적',desc:'치명타 +5%',app:{hairBack:4,hairFront:4,eye:3,outfit:2,prop:0,weapon:'dagger',col:{hair:'#2b2b3a',eye:'#d6403a',skin:'#fbd0b0',main:'#3a3a58',acc:'#d6403a',prop:'#7a7a8a'}},bonus:{crit:.05}}
];
