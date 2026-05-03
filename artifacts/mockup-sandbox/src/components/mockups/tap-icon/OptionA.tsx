/** Option A: Outline hand pointer with short straight impact lines (precise & sharp) */
export function OptionA() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "999px",
          fontSize: "16px",
          color: "#94a3b8",
          direction: "rtl",
        }}
      >
        <span>זהו 7 הבדלים</span>
        <svg
          viewBox="0 0 64 64"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0.85 }}
          aria-hidden="true"
        >
          {/* Impact lines above fingertip */}
          <line x1="32" y1="4"  x2="32" y2="10" />
          <line x1="20" y1="7"  x2="23" y2="12" />
          <line x1="44" y1="7"  x2="41" y2="12" />

          {/* Pointing finger */}
          <rect x="27" y="14" width="10" height="18" rx="5" />

          {/* Hand body — four fingers folded */}
          <path d="
            M27 26
            C27 26 21 26 21 31 L21 40
            C21 40 21 55 32 55
            C43 55 43 40 43 40 L43 31
            C43 26 37 26 37 26
          " />
          {/* Fold lines for the other fingers */}
          <line x1="27" y1="31" x2="27" y2="38" />
          <line x1="37" y1="31" x2="37" y2="38" />
          <line x1="21" y1="34" x2="43" y2="34" opacity="0" />
        </svg>
      </div>
    </div>
  );
}
