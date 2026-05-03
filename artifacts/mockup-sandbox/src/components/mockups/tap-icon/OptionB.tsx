/** Option B: Outline hand pointer with curved arc lines (softer, more "tap" feel) */
export function OptionB() {
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
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0.85 }}
          aria-hidden="true"
        >
          {/* Curved arc lines radiating from fingertip — near */}
          <path d="M24 11 Q32 6 40 11" />
          {/* Curved arc lines radiating from fingertip — far */}
          <path d="M20 7 Q32 0 44 7" />

          {/* Index finger pointing up */}
          <rect x="27.5" y="15" width="9" height="20" rx="4.5" />

          {/* Palm / hand base */}
          <path d="
            M27.5 29
            L22 29 C19 29 19 33 19 33
            L19 42 C19 51 32 52 32 52
            C32 52 45 51 45 42
            L45 33 C45 33 45 29 42 29
            L36.5 29
          " />

          {/* Knuckle dividers on palm */}
          <line x1="27.5" y1="33" x2="27.5" y2="40" />
          <line x1="36.5" y1="33" x2="36.5" y2="40" />
        </svg>
      </div>
    </div>
  );
}
