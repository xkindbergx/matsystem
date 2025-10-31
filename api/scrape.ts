// /api/scrape.ts
// Serverless endpoint för att importera recept från en länk.
// 1) Försök JSON-LD (schema.org/Recipe)
// 2) Fallback: OpenGraph + heuristiker för "Ingredienser" / "Gör så här"

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

  const fetchUrl = body.url.startsWith("http") ? body.url : `https://${body.url}`;

  try {
    const resp = await fetch(fetchUrl, {
      headers: {
        // En snäll user agent; vissa sajter returnerar tomt annars
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 RecipeImporter/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const html = await resp.text();

    // ============ JSON-LD =============
    const ldBlocks = Array.from(
      html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      )
    ).map((m) => m[1]);

    const flatten = (obj: any): any[] => {
      if (!obj) return [];
      if (Array.isArray(obj)) return obj.flatMap(flatten);
      if (typeof obj === "object") {
        const arr: any[] = [obj];
        if (obj["@graph"]) arr.push(...flatten(obj["@graph"]));
        if (obj.itemListElement) arr.push(...flatten(obj.itemListElement));
        return arr;
      }
      return [];
    };

    let recipeNode: any = null;
    for (const raw of ldBlocks) {
      const candidates: any[] = [];
      try {
        candidates.push(JSON.parse(raw));
      } catch {
        // Ibland flera JSON-objekt i samma script – försök splitta
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
      if (Array.isArray(img)) {
        const f = img[0];
        return typeof f === "string" ? f : f?.url;
      }
      if (typeof img === "object") return img.url || img["@id"];
    };

    const toSteps = (x: any): string[] => {
      if (!x) return [];
      if (typeof x === "string") return [x.trim()];
      if (Array.isArray(x)) return x.flatMap(toSteps).filter(Boolean);
      if (typeof x === "object") {
        if (x.text) return [String(x.text).trim()];
        if (x.itemListElement) return toSteps(x.itemListElement);
      }
      return [];
    };

    const extractText = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // ============ Fallback: OpenGraph =============
    const og = {
      title:
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1],
      image: html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1],
    };

    // ============ Heuristik för sektioner ============
    const section = (name: string): string | null => {
      // Hitta rubrik (h1–h4) som innehåller namnet och ta följande <ul>/<ol> eller stycken
      const re = new RegExp(
        `<h[1-6][^>]*>\\s*([^<]*${name}[^<]*)<\\/h[1-6]>[\\s\\S]{0,1000}?((?:<ul[\\s\\S]*?<\\/ul>)|(?:<ol[\\s\\S]*?<\\/ol>)|(?:<p[\\s\\S]*?<\\/p>)+)`,
        "i"
      );
      const m = html.match(re);
      return m ? m[2] : null;
    };

    const grabListItems = (blockHtml: string | null): string[] => {
      if (!blockHtml) return [];
      const lis = Array.from(blockHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((m) =>
        extractText(m[1])
      );
      if (lis.length) return lis;
      const ps = Array.from(blockHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((m) =>
        extractText(m[1])
      );
      return ps.filter(Boolean);
    };

    // ============ Bygg svar ============
    let title: string | undefined;
    let image: string | undefined;
    let ingredients: any[] | undefined;
    let steps: string[] | undefined;
    let servings: number | undefined;

    if (recipeNode) {
      title = recipeNode.name || recipeNode.headline || og.title;
      image = normalizeImage(recipeNode.image) || og.image;
      if (Array.isArray(recipeNode.recipeIngredient)) {
        ingredients = recipeNode.recipeIngredient;
      }
      steps = toSteps(recipeNode.recipeInstructions);
      const y = recipeNode.recipeYield;
      if (typeof y === "number") servings = y;
      else if (typeof y === "string") {
        const m = y.match(/(\d+(?:[.,]\d+)?)/);
        if (m) servings = Number(m[1].replace(",", "."));
      }
    } else {
      // Fallback: OG + heuristik
      title = og.title;
      image = og.image;
      const ingHtml = section("Ingredienser|Ingredients|Ingredient");
      const stepHtml = section("Gör så här|Instructions|Method|Tillagning");
      const ingList = grabListItems(ingHtml);
      const stepList = grabListItems(stepHtml);
      if (ingList.length) ingredients = ingList;
      if (stepList.length) steps = stepList;
    }

    if (!title && !ingredients && !steps) {
      return res.status(404).json({
        error:
          "Could not find recipe data (no schema.org/Recipe and heuristics failed for this page).",
      });
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
    return res
      .status(500)
      .json({ error: e?.message || "Failed to fetch or parse the page" });
  }
}
