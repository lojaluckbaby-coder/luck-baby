function cors(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,X-Admin-Password','Access-Control-Allow-Methods':'POST,OPTIONS'}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...cors()}})}
export async function onRequestOptions(){return new Response(null,{status:204,headers:cors()})}
export async function onRequestPost({request,env}){
  if(!env.ADMIN_PASSWORD || request.headers.get('X-Admin-Password')!==env.ADMIN_PASSWORD) return json({ok:false,error:'Acesso administrativo negado.'},401)
  if(!env.BUCKET) return json({ok:false,error:'R2 não configurado. Crie um bucket e ligue-o como BUCKET.'},503)
  const form=await request.formData(); const file=form.get('file');
  if(!(file instanceof File)) return json({ok:false,error:'Arquivo não enviado.'},400)
  const ext=(file.type.split('/')[1]||'bin').replace(/[^a-z0-9]/gi,'').slice(0,8)||'bin';
  const key=`uploads-${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key,file.stream(),{httpMetadata:{contentType:file.type||'application/octet-stream',cacheControl:'public,max-age=31536000,immutable'}});
  return json({ok:true,key,url:`/api/image/${encodeURIComponent(key)}`});
}
