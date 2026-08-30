const PUBLIC_KEYS = [
  'products',
  'banners',
  'brands',
  'categories',
  'promo',
  'settings',
  'shipping'
];

function cors(){
  return {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type, X-Admin-Password',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS'
  };
}

function response(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'Content-Type':'application/json',
      ...cors()
    }
  });
}

function isAdmin(request,env){
  return !!env.ADMIN_PASSWORD &&
    request.headers.get('X-Admin-Password') === env.ADMIN_PASSWORD;
}

function publicData(db){
  const out={};

  for(const k of PUBLIC_KEYS){
    out[k]=db[k];
  }

  return out;
}

export async function onRequestOptions(){
  return new Response(null,{
    status:204,
    headers:cors()
  });
}

export async function onRequestGet({request,env}){
  if(!env.DB){
    return response({
      ok:false,
      error:'D1 não configurado. Crie um banco D1 e ligue-o como DB.'
    },503);
  }

  try{
    const row=await env.DB
      .prepare('SELECT data,updated_at FROM store WHERE id=1')
      .first();

    if(!row){
      return response({
        ok:true,
        data:publicData({}),
        updated_at:null,
        admin:false
      });
    }

    let db;

    try{
      db=JSON.parse(row.data);
    }catch{
      return response({
        ok:false,
        error:'Dados da loja inválidos no D1.'
      },500);
    }

    const admin=
      new URL(request.url).searchParams.get('admin')==='1' &&
      isAdmin(request,env);

    return response({
      ok:true,
      data:admin ? db : publicData(db),
      updated_at:row.updated_at,
      admin
    });

  }catch(error){
    return response({
      ok:false,
      error:'Erro ao ler os dados da loja.',
      detail:error?.message || String(error)
    },500);
  }
}

/*
 * SALVAMENTO
 *
 * IMPORTANTE:
 * NÃO exige senha aqui.
 *
 * A senha fica somente para entrar
 * no Painel Administrativo.
 */
export async function onRequestPost({request,env}){

  if(!env.DB){
    return response({
      ok:false,
      error:'D1 não configurado. Verifique se o banco está ligado como DB.'
    },503);
  }

  let body;

  try{
    body=await request.json();
  }catch(error){
    return response({
      ok:false,
      error:'JSON inválido.',
      detail:error?.message || String(error)
    },400);
  }

  if(!body || typeof body!=='object' || Array.isArray(body)){
    return response({
      ok:false,
      error:'Dados inválidos.'
    },400);
  }

  const now=new Date().toISOString();

  try{
    await env.DB
      .prepare(`
        INSERT INTO store (id, data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at
      `)
      .bind(
        1,
        JSON.stringify(body),
        now
      )
      .run();

    return response({
      ok:true,
      updated_at:now
    });

  }catch(error){
    return response({
      ok:false,
      error:'Não foi possível salvar no D1.',
      detail:error?.message || String(error)
    },500);
  }
}
