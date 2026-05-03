export function IceBlue() {
  const overlayBg = "rgba(15,23,42,0.58)";
  const overlayBorder = "rgba(255,255,255,0.08)";
  const accent = "#7dd3fc";
  const textSecondary = "#94a3b8";

  const pillStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 12px", background: overlayBg,
    backdropFilter: "blur(10px)", border: `1px solid ${overlayBorder}`, borderRadius: 999,
  };
  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 34, height: 34, borderRadius: 999,
    border: `1px solid ${overlayBorder}`, background: overlayBg,
    backdropFilter: "blur(10px)", cursor: "pointer",
  };
  const btnOff: React.CSSProperties = { ...btnBase, color: "rgba(226,232,240,0.45)" };
  const btnOn: React.CSSProperties = {
    ...btnBase, color: accent,
    background: "rgba(125,211,252,0.14)", borderColor: "rgba(125,211,252,0.38)",
    boxShadow: "0 0 8px rgba(125,211,252,0.22)",
  };
  const dots = [true, true, true, false, false, false, false];

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 14px",
      fontFamily: "'Segoe UI','Arial','Helvetica Neue',Arial,sans-serif",
      direction: "rtl",
    }}>
      <div style={pillStyle}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>הקו הדק</span>
        <span style={{
          background: "rgba(125,211,252,0.13)", color: "#bae6fd",
          border: "1px solid rgba(125,211,252,0.32)", borderRadius: 999,
          padding: "1px 8px", fontSize: 11, fontWeight: 700,
        }}>שלב 2</span>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "6px 10px", background: overlayBg, border: `1px solid ${overlayBorder}`, borderRadius: 999 }}>
        {dots.map((found, i) => (
          <div key={i} style={{
            width: 9, height: 9, borderRadius: "50%",
            background: found ? accent : "rgba(255,255,255,0.22)",
            boxShadow: found ? "0 0 6px rgba(125,211,252,0.45)" : undefined,
            transform: found ? "scale(1.15)" : undefined,
          }} />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={pillStyle} dir="ltr">
          <span style={{ fontSize: 15, fontWeight: 800, color: accent }}>3</span>
          <span style={{ color: "rgba(148,163,184,0.5)", fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: textSecondary, fontWeight: 600 }}>7</span>
        </div>
        <button style={btnOn}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </button>
        <button style={btnOff}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
