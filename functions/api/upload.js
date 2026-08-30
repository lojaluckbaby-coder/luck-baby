function cors(){
  return {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type,X-Admin-Password',
    'Access-Control-Allow-Methods':'POST,OPTIONS'
  };
}

function json(data,status=200){
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:{
        'Content-Type':'application/json',
        ...cors()
      }
    }
  );
}

export async function onRequestOptions(){
  return new Response(null,{
    status:204,
    headers:cors()
  });
}

export async function onRequestPost({request,env}){

  /* =====================================================
     AUTENTICAÇÃO DO PAINEL
     O endpoint continua protegido.
     O index.html envia a senha automaticamente depois
     que o administrador já entrou no painel.
     ===================================================== */

  const adminPassword = request.headers.get('X-Admin-Password');

  if(
    !env.ADMIN_PASSWORD ||
    !adminPassword ||
    adminPassword !== env.ADMIN_PASSWORD
  ){
    return json({
      ok:false,
      error:'Acesso administrativo negado.'
    },401);
  }

  /* =====================================================
     VERIFICAÇÃO DO R2
     ===================================================== */

  if(!env.BUCKET){
    return json({
      ok:false,
      error:'R2 não configurado. Crie um bucket e ligue-o como BUCKET.'
    },503);
  }

  /* =====================================================
     RECEBER ARQUIVO
     ===================================================== */

  let form;

  try{
    form = await request.formData();
  }catch(e){
    return json({
      ok:false,
      error:'Não foi possível receber o arquivo.'
    },400);
  }

  const file = form.get('file');

  if(!(file instanceof File)){
    return json({
      ok:false,
      error:'Arquivo não enviado.'
    },400);
  }

  /* =====================================================
     LIMITES DE SEGURANÇA
     ===================================================== */

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if(!allowedTypes.includes(file.type)){
    return json({
      ok:false,
      error:'Formato de imagem não permitido.'
    },400);
  }

  /* Limite de 10 MB por imagem */
  if(file.size > 10 * 1024 * 1024){
    return json({
      ok:false,
      error:'A imagem é muito grande. O limite é 10 MB.'
    },400);
  }

  /* =====================================================
     EXTENSÃO
     ===================================================== */

  const ext =
    (file.type.split('/')[1] || 'bin')
      .replace(/[^a-z0-9]/gi,'')
      .slice(0,8) || 'bin';

  /* =====================================================
     NOME ÚNICO
     ===================================================== */

  const key =
    `uploads-${crypto.randomUUID()}.${ext}`;

  /* =====================================================
     SALVAR NO CLOUDFLARE R2
     ===================================================== */

  try{

    await env.BUCKET.put(
      key,
      file.stream(),
      {
        httpMetadata:{
          contentType:
            file.type ||
            'application/octet-stream',

          cacheControl:
            'public,max-age=31536000,immutable'
        }
      }
    );

  }catch(e){

    return json({
      ok:false,
      error:'Não foi possível salvar a imagem no servidor.'
    },500);
  }

  /* =====================================================
     RESPOSTA
     ===================================================== */

  return json({
    ok:true,
    key,
    url:`/api/image/${encodeURIComponent(key)}`
  });
}
