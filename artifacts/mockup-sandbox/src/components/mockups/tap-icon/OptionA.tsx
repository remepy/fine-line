/** Option A: Fingertip tap with ripple rings — unmistakably "touch this" */
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
        {/* Fingertip with ripple */}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          style={{ flexShrink: 0, opacity: 0.75 }}
          aria-hidden="true"
        >
          {/* Outer ripple ring */}
          <circle cx="12" cy="17" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
          {/* Inner ripple ring */}
          <circle cx="12" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
          {/* Fingertip dot */}
          <circle cx="12" cy="17" r="1.6" fill="currentColor" />
          {/* Finger body */}
          <path
            d="M12 3 L12 13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Knuckle bumps */}
          <path
            d="M9.5 7 Q12 5.5 14.5 7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
}
