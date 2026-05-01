import { useRef } from "react";
import { Zone } from "../lib/hitmap";

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

interface MarkerData {
  zone: Zone;
  type: "found" | "hint";
  ordinal: number | null;
  colorIndex: number;
}

interface GameImageProps {
  src: string;
  alt: string;
  zones: Zone[];
  foundIds: number[];
  hintIds: number[];
  onTap: (x: number, y: number, el: HTMLElement) => void;
}

export function GameImage({
  src,
  alt,
  zones,
  foundIds,
  hintIds,
  onTap,
}: GameImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const markers: MarkerData[] = [];

  foundIds.forEach((id, idx) => {
    const zone = zones.find((z) => z.id === id);
    if (zone) {
      markers.push({
        zone,
        type: "found",
        ordinal: idx + 1,
        colorIndex: idx % MARKER_COLORS.length,
      });
    }
  });

  hintIds.forEach((id) => {
    const zone = zones.find((z) => z.id === id);
    if (zone && !foundIds.includes(id)) {
      markers.push({
        zone,
        type: "hint",
        ordinal: null,
        colorIndex: -1,
      });
    }
  });

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

      {markers.map((m) => {
        const color =
          m.type === "hint" ? HINT_COLOR : MARKER_COLORS[m.colorIndex];
        return (
          <div
            key={`${m.type}-${m.zone.id}`}
            style={{
              position: "absolute",
              left: `${m.zone.cx * 100}%`,
              top: `${m.zone.cy * 100}%`,
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
                animation: "markerPop 0.25s ease-out",
              }}
            >
              {m.type === "hint" ? "💡" : m.ordinal}
            </div>
          </div>
        );
      })}
    </div>
  );
}
