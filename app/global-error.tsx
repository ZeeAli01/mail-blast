"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#070711", color: "#f8fafc" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <section
            style={{
              maxWidth: "520px",
              padding: "40px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "24px",
              background: "rgba(255,255,255,.04)",
            }}
          >
            <p style={{ color: "#c4b5fd", fontWeight: 700 }}>MAILBLAST</p>
            <h1>Application unavailable</h1>
            <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>
              A critical page component could not load. Please retry the
              request. No email was sent.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "16px",
                border: 0,
                borderRadius: "12px",
                padding: "12px 20px",
                background: "#7c3aed",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
