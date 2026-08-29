export async function onRequest(context) {
  const db = context.env.DB;
  const method = context.request.method;

  try {

    /* =========================
       GET - LISTAR PRODUTOS
    ========================= */

    if (method === "GET") {

      const result = await db
        .prepare(`
          SELECT *
          FROM products
          WHERE active = 1
          ORDER BY created_at DESC
        `)
        .all();

      return Response.json({
        success: true,
        products: result.results || []
      });
    }


    /* =========================
       POST - NOVO PRODUTO
    ========================= */

    if (method === "POST") {

      const data = await context.request.json();

      const id =
        data.id ||
        "p" + Date.now();

      const name =
        String(data.name || "").trim();

      if (!name) {
        return Response.json({
          success: false,
          error: "Nome do produto é obrigatório."
        }, { status: 400 });
      }

      const price =
        Number(data.price || 0);

      const promo =
        Number(data.promo || 0);

      const sizes =
        String(data.sizes || "");

      const category =
        String(data.category || "");

      const brand =
        String(data.brand || "");

      const emoji =
        String(data.emoji || "👕");

      const description =
        String(
          data.description ||
          data.desc ||
          ""
        );

      let images = [];

      if (Array.isArray(data.images)) {
        images = data.images
          .filter(x => typeof x === "string")
          .slice(0, 5);
      }

      const slug =
        String(
          data.slug ||
          name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        );

      await db
        .prepare(`
          INSERT INTO products
          (
            id,
            name,
            price,
            promo,
            sizes,
            category,
            brand,
            emoji,
            description,
            images,
            slug,
            active,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `)
        .bind(
          id,
          name,
          price,
          promo,
          sizes,
          category,
          brand,
          emoji,
          description,
          JSON.stringify(images),
          slug
        )
        .run();

      return Response.json({
        success: true,
        product: {
          id,
          name,
          price,
          promo,
          sizes,
          category,
          brand,
          emoji,
          description,
          images,
          slug,
          active: 1
        }
      });
    }


    /* =========================
       PUT - EDITAR PRODUTO
    ========================= */

    if (method === "PUT") {

      const data =
        await context.request.json();

      const id =
        String(data.id || "");

      if (!id) {
        return Response.json({
          success: false,
          error: "ID do produto não informado."
        }, { status: 400 });
      }

      const name =
        String(data.name || "").trim();

      if (!name) {
        return Response.json({
          success: false,
          error: "Nome do produto é obrigatório."
        }, { status: 400 });
      }

      const price =
        Number(data.price || 0);

      const promo =
        Number(data.promo || 0);

      const sizes =
        String(data.sizes || "");

      const category =
        String(data.category || "");

      const brand =
        String(data.brand || "");

      const emoji =
        String(data.emoji || "👕");

      const description =
        String(
          data.description ||
          data.desc ||
          ""
        );

      let images = [];

      if (Array.isArray(data.images)) {
        images = data.images
          .filter(x => typeof x === "string")
          .slice(0, 5);
      }

      const slug =
        String(
          data.slug ||
          name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        );

      const result =
        await db
          .prepare(`
            UPDATE products
            SET
              name = ?,
              price = ?,
              promo = ?,
              sizes = ?,
              category = ?,
              brand = ?,
              emoji = ?,
              description = ?,
              images = ?,
              slug = ?
            WHERE id = ?
          `)
          .bind(
            name,
            price,
            promo,
            sizes,
            category,
            brand,
            emoji,
            description,
            JSON.stringify(images),
            slug,
            id
          )
          .run();

      return Response.json({
        success: true,
        updated: result.meta?.changes || 0
      });
    }


    /* =========================
       DELETE - EXCLUIR PRODUTO
    ========================= */

    if (method === "DELETE") {

      const url =
        new URL(context.request.url);

      const id =
        url.searchParams.get("id");

      if (!id) {
        return Response.json({
          success: false,
          error: "ID do produto não informado."
        }, { status: 400 });
      }

      await db
        .prepare(`
          UPDATE products
          SET active = 0
          WHERE id = ?
        `)
        .bind(id)
        .run();

      return Response.json({
        success: true,
        message: "Produto removido."
      });
    }


    /* =========================
       MÉTODO NÃO SUPORTADO
    ========================= */

    return Response.json({
      success: false,
      error: "Método não permitido."
    }, { status: 405 });


  } catch (error) {

    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });

  }
}
