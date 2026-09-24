import celebrationImage from "@assets/Artist's_Brush_1777619872196.png";
import type { BridgeSession } from "../lib/cyanBridge";
import { copy } from "../lib/copy";

interface SuccessModalProps {
  isOpen: boolean;
  level: number;
  onNext: () => void;
  onExit: () => void;
  session: BridgeSession | null;
  reducedMotion: boolean;
}

export function SuccessModal({ isOpen, level, onNext, onExit, session, reducedMotion }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.65)",
        zIndex: 10000,
        animation: reducedMotion ? "none" : "fadeIn 0.3s ease-out",
      }}
    >
      <div
        dir={session?.locale === "en-US" ? "ltr" : "rtl"}
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "32px 24px",
          textAlign: "center",
          maxWidth: "320px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          animation: reducedMotion ? "none" : "modalPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <img
          src={celebrationImage}
          alt=""
          aria-hidden="true"
          style={{
            display: "block",
            width: "120px",
            height: "120px",
            margin: "0 auto 12px",
            objectFit: "contain",
          }}
        />

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#1e293b",
            marginBottom: "8px",
            lineHeight: "1.4",
          }}
        >
          {copy(session, "success")}
        </h2>
        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginBottom: "28px",
          }}
        >
          {copy(session, "complete", level)}
        </p>

        <button
          onClick={onNext}
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(16,185,129,0.4)",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(0.97)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {copy(session, "next")}
        </button>

        <button
          onClick={onExit}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "15px",
            cursor: "pointer",
            padding: "8px",
            textDecoration: "underline",
          }}
        >
          {copy(session, "quit")}
        </button>
      </div>
    </div>
  );
}
