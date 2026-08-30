export async function onRequestGet({params,env}){
  if(!env.BUCKET){
    return new Response('R2 não configurado.',{status:503});
  }

  const key=decodeURIComponent(params.key||'');
  if(!key){
    return new Response('Imagem não encontrada.',{status:404});
  }

  const object=await env.BUCKET.get(key);

  if(!object){
    return new Response('Imagem não encontrada.',{status:404});
  }

  const headers=new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control','public,max-age=31536000,immutable');
  headers.set('Access-Control-Allow-Origin','*');

  return new Response(object.body,{headers});
}
