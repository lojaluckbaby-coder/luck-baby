export async function onRequestGet(context) {
  try {
    const db = context.env.DB;

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

  } catch (error) {

    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });

  }
}
