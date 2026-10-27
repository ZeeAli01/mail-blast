import { createHash } from "node:crypto";
import { z } from "zod";

const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    text: z.string().max(500),
    level: z.enum(["1", "2", "3"]),
  }),
  z.object({ type: z.literal("paragraph"), text: z.string().max(20_000) }),
  z.object({
    type: z.literal("button"),
    text: z.string().max(200),
    url: z.url(),
  }),
  z.object({ type: z.literal("divider") }),
]);

export const templateDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(blockSchema).max(250),
  legalFooter: z.object({
    organizationName: z.string().min(1).max(300),
    postalAddress: z.string().min(1).max(1000),
    unsubscribeUrl: z.string().min(1),
  }),
});

export type TemplateDocument = z.infer<typeof templateDocumentSchema>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderTemplate(document: TemplateDocument) {
  const parsed = templateDocumentSchema.parse(document);
  const htmlBlocks = parsed.blocks.map((block) => {
    if (block.type === "heading")
      return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
    if (block.type === "paragraph")
      return `<p>${escapeHtml(block.text).replaceAll("\n", "<br>")}</p>`;
    if (block.type === "button")
      return `<p><a href="${escapeHtml(block.url)}" style="display:inline-block;padding:12px 18px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px">${escapeHtml(block.text)}</a></p>`;
    return "<hr>";
  });
  const footer = `<footer><p>${escapeHtml(parsed.legalFooter.organizationName)} · ${escapeHtml(parsed.legalFooter.postalAddress)}</p><p><a href="${escapeHtml(parsed.legalFooter.unsubscribeUrl)}">Unsubscribe</a></p></footer>`;
  const html = `<!doctype html><html><body>${htmlBlocks.join("")}${footer}</body></html>`;
  const text = [
    ...parsed.blocks.flatMap((block) =>
      block.type === "divider"
        ? ["---"]
        : block.type === "button"
          ? [`${block.text}: ${block.url}`]
          : [block.text],
    ),
    "",
    `${parsed.legalFooter.organizationName} · ${parsed.legalFooter.postalAddress}`,
    `Unsubscribe: ${parsed.legalFooter.unsubscribeUrl}`,
  ].join("\n\n");
  return {
    html,
    text,
    rendererVersion: "1",
    contentHash: createHash("sha256").update(`${html}\n${text}`).digest("hex"),
  };
}
