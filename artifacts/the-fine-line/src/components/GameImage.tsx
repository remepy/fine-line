import { useRef } from "react";
import { Zone } from "../lib/hitmap";
import { FoundItem } from "../hooks/useGame";

const MARKER_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#6366f1",
];

const HINT_COLOR = "#f59e0b";

interface GameImageProps {
  src: string;
  alt: string;
  zones: Zone[];
  foundItems: FoundItem[];
  hintIds: number[];
  onTap: (x: number, y: number, el: HTMLElement) => void;
}

export function GameImage({
  src,
  alt,
  zones,
  foundItems,
  hintIds,
  onTap,
}: GameImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onTap(x, y, containerRef.current);
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        cursor: "crosshair",
        userSelect: "none",
        touchAction: "none",
        flex: "1 1 0",
        minWidth: 0,
        minHeight: 0,
        aspectRatio: "1 / 1",
      }}
      onPointerDown={handlePointerDown}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          borderRadius: "8px",
        }}
      />

      {/* Player-found markers — placed at the exact tap position */}
      {foundItems.map((item, idx) => {
        const color = MARKER_COLORS[idx % MARKER_COLORS.length];
        return (
          <div
            key={`found-${item.id}`}
            style={{
              position: "absolute",
              left: `${item.relX * 100}%`,
              top: `${item.relY * 100}%`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                backgroundColor: color,
                color: "white",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                border: "2px solid rgba(255,255,255,0.8)",
                animation: "markerFadeIn 0.3s ease-out forwards",
              }}
            >
              {idx + 1}
            </div>
          </div>
        );
      })}

      {/* Hint markers — placed at the zone centre (no tap position available) */}
      {hintIds.map((id) => {
        const zone = zones.find((z) => z.id === id);
        const alreadyFound = foundItems.some((f) => f.id === id);
        if (!zone || alreadyFound) return null;
        return (
          <div
            key={`hint-${id}`}
            style={{
              position: "absolute",
              left: `${zone.cx * 100}%`,
              top: `${zone.cy * 100}%`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                backgroundColor: HINT_COLOR,
                color: "white",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                border: "2px solid rgba(255,255,255,0.8)",
                animation: "markerFadeIn 0.3s ease-out forwards",
              }}
            >
              💡
            </div>
          </div>
        );
      })}
    </div>
  );
}
