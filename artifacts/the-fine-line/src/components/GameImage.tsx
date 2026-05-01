import { useRef, useState, useEffect } from "react";
import { Zone } from "../lib/hitmap";
import { FoundMarker } from "../hooks/useGame";

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

interface MarkerProps {
  zone: Zone;
  type: "found" | "hint";
  ordinal: number | null;
  color: string;
  tapX: number; // fraction 0-1, where the tap landed (relative to image)
  tapY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function Marker({ zone, type, ordinal, color, tapX, tapY, containerRef }: MarkerProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSettled(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const rect = containerRef.current?.getBoundingClientRect();
  const dx = rect ? (tapX - zone.cx) * rect.width : 0;
  const dy = rect ? (tapY - zone.cy) * rect.height : 0;

  const transform = settled
    ? "translate(-50%, -50%) scale(1)"
    : `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`;

  return (
    <div
      style={{
        position: "absolute",
        left: `${zone.cx * 100}%`,
        top: `${zone.cy * 100}%`,
        transform,
        opacity: settled ? 1 : 0,
        transition:
          "transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.25s ease",
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
        }}
      >
        {type === "hint" ? "💡" : ordinal}
      </div>
    </div>
  );
}

interface GameImageProps {
  src: string;
  alt: string;
  zones: Zone[];
  foundMarkers: FoundMarker[];
  hintIds: number[];
  onTap: (x: number, y: number, el: HTMLElement) => void;
}

export function GameImage({
  src,
  alt,
  zones,
  foundMarkers,
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

      {foundMarkers.map((marker, idx) => {
        const zone = zones.find((z) => z.id === marker.id);
        if (!zone) return null;
        return (
          <Marker
            key={`found-${marker.id}`}
            zone={zone}
            type="found"
            ordinal={idx + 1}
            color={MARKER_COLORS[idx % MARKER_COLORS.length]}
            tapX={marker.tapX}
            tapY={marker.tapY}
            containerRef={containerRef}
          />
        );
      })}

      {hintIds
        .filter((id) => !foundMarkers.some((m) => m.id === id))
        .map((id) => {
          const zone = zones.find((z) => z.id === id);
          if (!zone) return null;
          return (
            <Marker
              key={`hint-${id}`}
              zone={zone}
              type="hint"
              ordinal={null}
              color={HINT_COLOR}
              tapX={zone.cx}
              tapY={zone.cy}
              containerRef={containerRef}
            />
          );
        })}
    </div>
  );
}
