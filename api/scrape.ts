// api/scrape.ts  (REN ersättning – klistra in allt)
export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const body = (req.body || {}) as { url?: string };
  if (!body.url) return res.status(400).json({ error: "Missing url" });

  try {
    const fetchUrl = body.url.startsWith("http") ? body.url : `https://${body.url}`;
    const r = await fetch(fetchUrl, { headers: { "User-Agent": "RecipeImporter/1.0" } });
    const html = await r.text();

    const blocks = Array.from(
      html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    ).map((m) => m[1]);

    let recipe: any = null;
    const flatten = (obj: any): any[] => {
      if (!obj) return [];
      if (Array.isArray(obj)) return obj.flatMap(flatten);
      if (typeof obj === "object") {
        return [obj, ...(obj["@graph"] ? flatten(obj["@graph"]) : [])];
      }
      return [];
    };

    for (const block of blocks) {
      try {
        const json = JSON.parse(block.trim());
        const list = flatten(json);
        for (const node of list) {
          const t = node?.["@type"];
          const types = Array.isArray(t) ? t : t ? [t] : [];
          if (types.includes("Recipe")) {
            recipe = node;
            break;
          }
        }
        if (recipe) break;
      } catch {
        // ignorera dåligt formaterade <script>-block
      }
    }

    if (!recipe) return res.status(404).json({ error: "No Recipe schema found" });

    const normalizeImage = (img: any) =>
      typeof img === "string"
        ? img
        : Array.isArray(img)
        ? typeof img[0] === "string"
          ? img[0]
          : img[0]?.url
        : img?.url || img?.["@id"];

    const toSteps = (x: any): string[] =>
      !x
        ? []
        : typeof x === "string"
        ? [x]
        : Array.isArray(x)
        ? x.flatMap(toSteps)
        : x.text
        ? [String(x.text)]
        : x.itemListElement
        ? toSteps(x.itemListElement)
        : [];

    const payload = {
      title: recipe.name || recipe.headline,
      image: normalizeImage(recipe.image),
      ingredients: recipe.recipeIngredient,
      steps: toSteps(recipe.recipeInstructions),
      servings:
        typeof recipe.recipeYield === "number"
          ? recipe.recipeYield
          : typeof recipe.recipeYield === "string"
          ? Number((recipe.recipeYield.match(/(\d+(?:[.,]\d+)?)/)?.[1] || "").replace(",", "."))
          : undefined,
      sourceUrl: fetchUrl,
    };

    return res.status(200).json(payload);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch page" });
  }
}

