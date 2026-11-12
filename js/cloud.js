'use strict';
/* 로그인(이름+4자리 비밀번호) + 암호화 저장.
   - 저장 데이터는 브라우저에서 AES-GCM으로 암호화한 뒤에만 밖으로 나갑니다. (키 = PBKDF2(이름+비번+salt))
   - CONFIG.API가 있으면 서버(Worker)가 GitHub 저장소에 한 번 더 암호화해서 커밋, 없으면 이 기기에만 저장 */
const Cloud={
  ready:false,id:null,auth:null,key:null,salt:null,blob:null,dirtyRemote:false,lastPut:0,_t:null,
  enc:new TextEncoder(),dec:new TextDecoder(),
  b64(buf){let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s);},
  unb64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));},
  hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');},
  async sha(str){return this.hex(await crypto.subtle.digest('SHA-256',this.enc.encode(str)));},
  async pbkdf2(pass,salt,usage){const km=await crypto.subtle.importKey('raw',this.enc.encode(pass),'PBKDF2',false,['deriveBits','deriveKey']);
    const p={name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'};
    if(usage==='bits')return this.hex(await crypto.subtle.deriveBits(p,km,256));
    return crypto.subtle.deriveKey(p,km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);},
  async encrypt(obj){const iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},this.key,this.enc.encode(JSON.stringify(obj)));
    return{v:1,salt:this.b64(this.salt),iv:this.b64(iv),ct:this.b64(ct)};},
  async decrypt(blob){const key=await this.pbkdf2('enc|'+this.name+'|'+this.pin,this.unb64(blob.salt));
    const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:this.unb64(blob.iv)},key,this.unb64(blob.ct));
    this.key=key;this.salt=this.unb64(blob.salt);return JSON.parse(this.dec.decode(pt));},
  localKey(){return'reisekai_acc_'+this.id;},
  async remote(method,body,keepalive){
    const r=await fetch(CONFIG.API.replace(/\/$/,'')+'/save/'+this.id,{method,keepalive:!!keepalive,headers:{'content-type':'application/json','x-auth':this.auth},body:body?JSON.stringify(body):undefined});
    return r;},
  /* 로그인: {status:'new'} | {status:'ok',state} / 실패 시 throw {code} */
  async login(name,pin){
    this.name=name.trim();this.pin=pin;const n=this.name.toLowerCase();
    this.id=await this.sha('reisekai-v1|'+n);
    this.auth=await this.pbkdf2('auth|'+n+'|'+pin,this.enc.encode('reisekai-auth-v1'),'bits');
    let blob=null,local=null;
    try{local=JSON.parse(localStorage.getItem(this.localKey())||'null');}catch(e){}
    if(CONFIG.API){
      let r;try{r=await this.remote('GET');}catch(e){if(!local)throw{code:'net'};r=null;}
      if(r){if(r.status===403)throw{code:'badpw'};if(r.status===429)throw{code:'locked'};
        if(r.status===404)blob=null;else if(r.ok){blob=(await r.json()).blob;}else throw{code:'net'};}
      else{ if(local.authH!==await this.sha(this.auth))throw{code:'badpw'};blob=local.blob;}
    }else{
      if(local){if(local.authH!==await this.sha(this.auth))throw{code:'badpw'};blob=local.blob;}
    }
    if(!blob){this.salt=crypto.getRandomValues(new Uint8Array(16));this.key=await this.pbkdf2('enc|'+this.name+'|'+pin,this.salt);this.ready=true;return{status:'new'};}
    let state;try{state=await this.decrypt(blob);}catch(e){throw{code:'badpw'};}
    this.blob=blob;this.ready=true;return{status:'ok',state};
  },
  async save(S){
    if(!this.ready)return;
    this.blob=await this.encrypt(S);
    try{localStorage.setItem(this.localKey(),JSON.stringify({authH:await this.sha(this.auth),blob:this.blob}));}catch(e){}
    if(CONFIG.API){this.dirtyRemote=true;this.schedule();}
  },
  schedule(){const wait=Math.max(0,this.lastPut+20000-Date.now());clearTimeout(this._t);this._t=setTimeout(()=>this.flush(),wait);},
  async flush(keepalive){
    if(!CONFIG.API||!this.ready||!this.dirtyRemote||!this.blob)return;
    this.dirtyRemote=false;this.lastPut=Date.now();
    try{const r=await this.remote('PUT',{blob:this.blob},keepalive);if(!r.ok)this.dirtyRemote=true;}catch(e){this.dirtyRemote=true;}
  }
};
