import { Pointer } from "lucide-react";

/** Option A: Lucide Pointer — hand cursor, clean and universal */
export function OptionA() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "999px", fontSize: "16px", color: "#94a3b8", direction: "rtl" }}>
        <span>זהו 7 הבדלים</span>
        <Pointer size={18} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.85 }} aria-hidden="true" />
      </div>
    </div>
  );
}
