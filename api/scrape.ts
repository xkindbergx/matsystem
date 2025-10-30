import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const body = req.body as { url?: string };
  if (!body?.url) return res.status(400).json({ error: "Missing url" });

  try {
    const r = await fetch(body.url, {
      headers: { "User-Agent": "RecipeImporter/1.0" },
    });
    const html = await r.text();

    const match = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    if (!match) return res.status(404).json({ error: "No recipe data found" });

    let recipeData: any;
    for (const block of match) {
      try {
        const json = JSON.parse(block.replace(/<\/?script[^>]*>/g, ""));
        if (json["@type"] === "Recipe" || json["@type"]?.includes("Recipe")) {
          recipeData = json;
          break;
        }
      } catch {}
    }

    if (!recipeData) return res.status(404).json({ error: "No Recipe found" });

    const response = {
      title: recipeData.name,
      image: recipeData.image,
      ingredients: recipeData.recipeIngredient,
      steps: recipeData.recipeInstructions,
      servings: recipeData.recipeYield,
      sourceUrl: body.url,
    };

    res.status(200).json(response);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
