export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const password = body?.password ?? body?.senha;

    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: "Senha não informada" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const adminPassword = "lucas251400";

    if (!adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Senha do administrador não configurada" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Senha incorreta" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Requisição inválida" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
   
 
