import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://a4africa.org";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { getPublicStoriesClient } = await import("@/lib/public-stories.server");
        const supabase = getPublicStoriesClient();
        const { data } = await supabase
          .from("stories")
          .select("id, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1000);

        const urls = [
          { loc: `${SITE_URL}/`, lastmod: null as string | null },
          ...["about", "guidelines", "contact", "privacy"].map((page) => ({
            loc: `${SITE_URL}/${page}`,
            lastmod: null as string | null,
          })),
          ...(data ?? []).map((story) => ({
            loc: `${SITE_URL}/stories/${story.id}`,
            lastmod: story.created_at as string | null,
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${
      url.lastmod
        ? `
    <lastmod>${escapeXml(url.lastmod.slice(0, 10))}</lastmod>`
        : ""
    }
  </url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
