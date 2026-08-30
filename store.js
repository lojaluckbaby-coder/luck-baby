const PUBLIC_KEYS = ['products','banners','brands','categories','promo','settings','shipping'];

function cors(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, X-Admin-Password','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}; }
function response(data,status=200){ return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...cors()}}); }
function isAdmin(request,env){ return !!env.ADMIN_PASSWORD && request.headers.get('X-Admin-Password') === env.ADMIN_PASSWORD; }
function publicData(db){ const out={}; for(const k of PUBLIC_KEYS) out[k]=db[k]; return out; }

export async function onRequestOptions(){ return new Response(null,{status:204,headers:cors()}); }

export async function onRequestGet({request,env}){
  if(!env.DB) return response({ok:false,error:'D1 não configurado. Crie um banco D1 e ligue-o como DB.'},503);
  const row=await env.DB.prepare('SELECT data,updated_at FROM store WHERE id=1').first();
  if(!row) return response({ok:true,data:publicData({})});
  let db; try{db=JSON.parse(row.data)}catch{return response({ok:false,error:'Dados da loja inválidos.'},500)}
  const admin=request.url.includes('admin=1') && isAdmin(request,env);
  return response({ok:true,data:admin?db:publicData(db),updated_at:row.updated_at,admin});
}

export async function onRequestPost({request,env}){
  if(!isAdmin(request,env)) return response({ok:false,error:'Acesso administrativo negado.'},401);
  if(!env.DB) return response({ok:false,error:'D1 não configurado.'},503);
  const body=await request.json();
  if(!body || typeof body!=='object') return response({ok:false,error:'Dados inválidos.'},400);
  const now=new Date().toISOString();
  await env.DB.prepare('INSERT INTO store(id,data,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(JSON.stringify(body),now).run();
  return response({ok:true,updated_at:now});
}
