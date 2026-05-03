/** Option B: Classic hand pointer cursor — universally recognised as "click" */
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
        {/* Hand pointer cursor */}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          style={{ flexShrink: 0, opacity: 0.75 }}
          aria-hidden="true"
        >
          <path d="M13.5 1.5a1.5 1.5 0 0 0-1.5 1.5v6.29l-1.36-.77a1.5 1.5 0 0 0-1.5 2.6l4.86 2.8A4.5 4.5 0 0 0 18.5 10v-1a1.5 1.5 0 0 0-1.5-1.5 1.5 1.5 0 0 0-1.09.47A1.5 1.5 0 0 0 14.5 7a1.5 1.5 0 0 0-.91.31A1.5 1.5 0 0 0 13.5 7V3a1.5 1.5 0 0 0-1.5-1.5z" opacity="0" />
          <path d="M9 12.38V7a2 2 0 0 1 4 0v3.06A2 2 0 0 1 15 12a2 2 0 0 1 2 1.58A2 2 0 0 1 19 15.5V17a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5v-1.5a2 2 0 0 1 1-1.73V7a1 1 0 0 1 2 0v4.59a2 2 0 0 1-.97.89zM11 7v5.42a2 2 0 0 1-1 1.73V17a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3v-1.5a.5.5 0 0 0-.5-.5.5.5 0 0 0-.5.5v.5h-2v-.5A2 2 0 0 0 13 14a2 2 0 0 0-.09-.58V13h-.82A1 1 0 0 1 11 12V7a1 1 0 0 1 2 0v3h2V7a1 1 0 0 1 2 0v2.34A1 1 0 0 1 17 10a1 1 0 0 1 1 1v.5A3 3 0 0 1 15 14.5v.5h-4v-.38z" opacity="0"/>
          {/* Clean pointing hand */}
          <path d="M10.5 2a1.5 1.5 0 0 0-1.5 1.5v7.1l-.47-.27a1.5 1.5 0 1 0-1.5 2.6l4.5 2.6A4.5 4.5 0 0 0 18 11.5V9a1.5 1.5 0 0 0-2.6-1 1.5 1.5 0 0 0-2.4-1.2V3.5A1.5 1.5 0 0 0 11.5 2h-1z" opacity="0"/>
          <path d="M8 12.8V6.5a1 1 0 0 1 2 0v4h1V5.5a1 1 0 0 1 2 0v5h1V7.5a1 1 0 0 1 2 0V11a4 4 0 0 1-4 4h-.34A3 3 0 0 1 9 12.8zm1-6.3C9 5.69 9.45 5 10.5 5S12 5.69 12 6.5v.25C11.68 6.28 11.1 6 10.5 6S9.32 6.28 9 6.75V6.5z" opacity="0"/>
          {/* Simple clean hand icon path */}
          <path d="M13 1c-.55 0-1 .45-1 1v5.29c-.31-.18-.67-.29-1-.29-.55 0-1.06.22-1.42.59-.37-.37-.88-.59-1.43-.59C7.52 7 7 7.52 7 8.5V15c0 2.76 2.24 5 5 5s5-2.24 5-5v-4c0-.98-.52-1.5-1.15-1.5-.28 0-.54.1-.74.27C14.94 9.48 14.5 9 13.85 9c-.3 0-.57.11-.78.3-.18-.17-.43-.3-.72-.3-.19 0-.35.06-.5.13V2c0-.55-.45-1-1-1zm0 1h-.15c.05.15.15.28.15.45V10.5a.5.5 0 0 0 1 0V9c0-.28.22-.5.5-.5s.5.22.5.5v1.5a.5.5 0 0 0 1 0V9c0-.28.22-.5.5-.5.19 0 .5.13.5.5v4c0 2.21-1.79 4-4 4s-4-1.79-4-4V8.5c0-.28.22-.5.5-.5s.5.22.5.5v4a.5.5 0 0 0 1 0V8c0-.28.22-.5.5-.5s.5.22.5.5v3.5a.5.5 0 0 0 1 0V2.45c0-.17.1-.3.15-.45H13z" />
        </svg>
      </div>
    </div>
  );
}
