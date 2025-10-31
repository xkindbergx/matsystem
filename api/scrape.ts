// /api/scrape.ts – förbättrad heuristik för fler sajter (WP-plugins + svenska rubriker)

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const body = (req.body || {}) as { url?: string };
  if (!body.url) return res.status(400).json({ error: "Missing url" });

  const fetchUrl = body.url.startsWith("http") ? body.url : `https://${body.url}`;

  try {
    const r = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 RecipeImporter/1.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const html = await r.text();

    const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // ---------- OG fallback ----------
    const ogTitle =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

    // ---------- JSON-LD ----------
    const ldBlocks = Array.from(
      html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    ).map((m) => m[1]);

    const flatten = (obj: any): any[] => {
      if (!obj) return [];
      if (Array.isArray(obj)) return obj.flatMap(flatten);
      if (typeof obj === "object") {
        const out: any[] = [obj];
        if (obj["@graph"]) out.push(...flatten(obj["@graph"]));
        if (obj.itemListElement) out.push(...flatten(obj.itemListElement));
        return out;
      }
      return [];
    };

    let recipeNode: any = null;
    for (const raw of ldBlocks) {
      const candidates: any[] = [];
      try {
        candidates.push(JSON.parse(raw));
      } catch {
        raw
          .split(/\n(?=\s*[{[])/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => {
            try {
              candidates.push(JSON.parse(s));
            } catch {}
          });
      }
      for (const c of candidates) {
        for (const n of flatten(c)) {
          const t = n?.["@type"];
          const types = Array.isArray(t) ? t : t ? [t] : [];
          if (types.includes("Recipe")) {
            recipeNode = n;
            break;
          }
        }
        if (recipeNode) break;
      }
      if (recipeNode) break;
    }

    const normalizeImage = (img: any): string | undefined => {
      if (!img) return;
      if (typeof img === "string") return img;
      if (Array.isArray(img)) return typeof img[0] === "string" ? img[0] : img[0]?.url;
      if (typeof img === "object") return img.url || img["@id"];
    };

    const toSteps = (x: any): string[] => {
      if (!x) return [];
      if (typeof x === "string") return [x.trim()];
      if (Array.isArray(x)) return x.flatMap(toSteps).filter(Boolean);
      if (x.text) return [String(x.text).trim()];
      if (x.itemListElement) return toSteps(x.itemListElement);
      return [];
    };

    // ---------- Heuristik: rubriker + listor ----------
    const section = (names: string[]) => {
      const nameRe = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const re = new RegExp(
        `<h[1-6][^>]*>\\s*([^<]*(?:${nameRe})[^<]*)<\\/h[1-6]>[\\s\\S]{0,1600}?((?:<ul[\\s\\S]*?<\\/ul>)|(?:<ol[\\s\\S]*?<\\/ol>)|(?:<p[\\s\\S]*?<\\/p>)+)`,
        "i"
      );
      return html.match(re)?.[2] || null;
    };

    const grabListTexts = (blockHtml: string | null): string[] => {
      if (!blockHtml) return [];
      const lis = Array.from(blockHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((m) =>
        strip(m[1])
      );
      if (lis.length) return lis;
      const ps = Array.from(blockHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((m) =>
        strip(m[1])
      );
      return ps.filter(Boolean);
    };

    // ---------- Heuristik: kända plugin-containrar ----------
    const grabByKnownSelectors = (type: "ingredients" | "instructions"): string[] => {
      const sel = type === "ingredients"
        ? [
            // WP Recipe Maker
            /<div[^>]+class=["'][^"']*wprm-recipe-ingredients[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
            // Tasty Recipes
            /<div[^>]+class=["'][^"']*tasty-recipes-ingredients[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
            // Mediavine Create
            /<div[^>]+class=["'][^"']*mv-create-ingredients[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
            // Generic
            /<(?:div|section)[^>]+class=["'][^"']*(?:ingredient|ingredients)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
            /<(?:div|section)[^>]+id=["'][^"']*(?:ingredient|ingredients)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
          ]
        : [
            /<div[^>]+class=["'][^"']*wprm-recipe-instructions[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
            /<div[^>]+class=["'][^"']*tasty-recipes-instructions[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
            /<div[^>]+class=["'][^"']*mv-create-instructions[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
            /<(?:div|section)[^>]+class=["'][^"']*(?:instruction|instructions|direction|directions|method)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
            /<(?:div|section)[^>]+id=["'][^"']*(?:instruction|instructions|direction|directions|method)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
          ];
      for (const re of sel) {
        const m = re.exec(html);
        if (m?.[1]) {
          const list = grabListTexts(m[1]);
          if (list.length) return list;
        }
      }
      return [];
    };

    // ---------- Bygg svar ----------
    let title: string | undefined;
    let image: string | undefined;
    let ingredients: any[] | undefined;
    let steps: string[] | undefined;
    let servings: number | undefined;

    if (recipeNode) {
      title = recipeNode.name || recipeNode.headline || ogTitle;
      image = normalizeImage(recipeNode.image) || ogImage;
      if (Array.isArray(recipeNode.recipeIngredient)) ingredients = recipeNode.recipeIngredient;
      steps = toSteps(recipeNode.recipeInstructions);
      const y = recipeNode.recipeYield;
      if (typeof y === "number") servings = y;
      else if (typeof y === "string") {
        const m = y.match(/(\d+(?:[.,]\d+)?)/);
        if (m) servings = Number(m[1].replace(",", "."));
      }
    }

    // Fallback: kända selectors
    if (!ingredients?.length) ingredients = grabByKnownSelectors("ingredients");
    if (!steps?.length) steps = grabByKnownSelectors("instructions");

    // Fallback: rubriker
    if (!ingredients?.length) {
      const ingHtml = section(["Ingredienser", "Ingredients", "Ingredient"]);
      const list = grabListTexts(ingHtml);
      if (list.length) ingredients = list;
    }
    if (!steps?.length) {
      const stepHtml = section(["Gör så här", "Tillagning", "Instructions", "Method", "Directions"]);
      const list = grabListTexts(stepHtml);
      if (list.length) steps = list;
    }

    // Fyll titel/bild från OG om saknas
    if (!title) title = ogTitle;
    if (!image) image = ogImage;

    if (!title && !ingredients?.length && !steps?.length) {
      return res.status(404).json({ error: "No recipe data found (schema & fallback failed)." });
    }

    return res.status(200).json({
      title,
      image,
      ingredients,
      steps,
      servings,
      sourceUrl: fetchUrl,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch/parse page" });
  }
}
