import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/src/server/templates/renderer";

describe("template renderer", () => {
  it("escapes user content and always renders legal identity and unsubscribe", () => {
    const rendered = renderTemplate({
      schemaVersion: 1,
      blocks: [
        {
          type: "heading",
          level: "1",
          text: "Hello <script>alert(1)</script>",
        },
        { type: "button", text: "Visit", url: "https://example.com" },
      ],
      legalFooter: {
        organizationName: "Acme & Co",
        postalAddress: "1 Main Street",
        unsubscribeUrl: "{{unsubscribe_url}}",
      },
    });
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("Acme &amp; Co");
    expect(rendered.html).toContain("Unsubscribe");
    expect(rendered.text).toContain("{{unsubscribe_url}}");
    expect(rendered.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
