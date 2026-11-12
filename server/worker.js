/* 저장 API (Cloudflare Worker). 브라우저는 GitHub 토큰을 갖지 않고, 이 Worker만 토큰을 가집니다.
   환경 변수(시크릿): GH_TOKEN(저장소 Contents 쓰기 권한 fine-grained 토큰), GH_REPO("owner/repo"),
                      SERVER_KEY(base64 32바이트), PEPPER(임의 문자열), ALLOW_ORIGIN(예: https://owner.github.io)
   선택: GH_BRANCH(기본 "saves") — 저장 전용 브랜치(미리 생성)
   저장 형식: saves/<id>.json = { authH, fails, lock, data(서버키로 한 번 더 암호화한 클라이언트 암호문) } */
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const te=new TextEncoder(),td=new TextDecoder();
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',te.encode(s)));
const srvKey=env=>crypto.subtle.importKey('raw',unb64(env.SERVER_KEY),'AES-GCM',false,['encrypt','decrypt']);
async function wrap(env,obj){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},await srvKey(env),te.encode(JSON.stringify(obj)));return{iv:b64(iv),ct:b64(ct)};}
async function unwrap(env,w){return JSON.parse(td.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(w.iv)},await srvKey(env),unb64(w.ct))));}
const gh=(env,path,init={})=>fetch(`https://api.github.com/repos/${env.GH_REPO}/contents/${path}`,{...init,headers:{authorization:'Bearer '+env.GH_TOKEN,'user-agent':'reisekai-save','accept':'application/vnd.github+json',...(init.headers||{})}});
async function readFile(env,id){const br=env.GH_BRANCH||'saves';const r=await gh(env,`saves/${id}.json?ref=${br}`);if(r.status===404)return null;if(!r.ok)throw new Error('gh '+r.status);const j=await r.json();return{sha:j.sha,doc:JSON.parse(td.decode(unb64(j.content.replace(/\n/g,''))))};}
async function writeFile(env,id,doc,sha){const br=env.GH_BRANCH||'saves';const body={message:'save '+id.slice(0,8),content:btoa(String.fromCharCode(...te.encode(JSON.stringify(doc)))),branch:br};if(sha)body.sha=sha;
  const r=await gh(env,`saves/${id}.json`,{method:'PUT',body:JSON.stringify(body)});if(!r.ok)throw new Error('gh put '+r.status);}
export default{
  async fetch(req,env){
    const cors={'access-control-allow-origin':env.ALLOW_ORIGIN||'*','access-control-allow-methods':'GET,PUT,OPTIONS','access-control-allow-headers':'content-type,x-auth','vary':'origin'};
    const out=(status,obj)=>new Response(obj?JSON.stringify(obj):null,{status,headers:{...cors,'content-type':'application/json'}});
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    const m=new URL(req.url).pathname.match(/^\/save\/([0-9a-f]{64})$/);if(!m)return out(404,{error:'not found'});
    const id=m[1],auth=req.headers.get('x-auth')||'';if(!/^[0-9a-f]{64}$/.test(auth))return out(400,{error:'bad auth'});
    const authH=await sha(auth+env.PEPPER);
    try{
      const f=await readFile(env,id);
      if(f){ // 기존 계정: 비밀번호 확인 + 잠금
        const d=f.doc;if(d.lock&&d.lock>Date.now())return out(429,{error:'locked'});
        if(d.authH!==authH){d.fails=(d.fails||0)+1;if(d.fails>=5){d.lock=Date.now()+10*60*1000;d.fails=0;}await writeFile(env,id,d,f.sha);return out(d.lock&&d.lock>Date.now()?429:403,{error:'denied'});}
        if(req.method==='GET'){if(d.fails||d.lock){d.fails=0;d.lock=0;await writeFile(env,id,d,f.sha);}return out(200,{blob:await unwrap(env,d.data)});}
      }else if(req.method==='GET')return out(404,{error:'no account'});
      if(req.method==='PUT'){
        const body=await req.json();const b=body&&body.blob;if(!b||typeof b.ct!=='string'||b.ct.length>200000)return out(400,{error:'bad blob'});
        await writeFile(env,id,{authH,fails:0,lock:0,data:await wrap(env,{salt:b.salt,iv:b.iv,ct:b.ct,v:b.v})},f&&f.sha);return out(200,{ok:true});}
      return out(405,{error:'method'});
    }catch(e){return out(502,{error:'upstream'});}
  }
};
