import { useRef, useState, useEffect } from "react";
import { Zone } from "../lib/hitmap";
import { RevealedMarker } from "../hooks/useGame";

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
  ordinal: number;
  color: string;
  tapX: number;
  tapY: number;
  isRotated: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function Marker({
  zone,
  type,
  ordinal,
  color,
  tapX,
  tapY,
  isRotated,
  containerRef,
}: MarkerProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSettled(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const rect = containerRef.current?.getBoundingClientRect();
  // The marker lives inside the (rotated) container, so its translate is
  // applied in the container's *natural* (un-rotated) local pixel space.
  // When the container is rotated 90° CW, visual width = natural height
  // and vice versa, so we must use the swapped dimensions here.
  const naturalW = rect ? (isRotated ? rect.height : rect.width) : 0;
  const naturalH = rect ? (isRotated ? rect.width : rect.height) : 0;
  const dx = (tapX - zone.cx) * naturalW;
  const dy = (tapY - zone.cy) * naturalH;

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
        {ordinal}
      </div>
    </div>
  );
}

interface GameImageProps {
  src: string;
  alt: string;
  zones: Zone[];
  revealedMarkers: RevealedMarker[];
  isRotated: boolean;
  onLoadError?: () => void;
  onTap: (
    relX: number,
    relY: number,
    naturalW: number,
    naturalH: number,
    viewportX: number,
    viewportY: number
  ) => void;
}

export function GameImage({
  src,
  alt,
  zones,
  revealedMarkers,
  isRotated,
  onLoadError,
  onTap,
}: GameImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Visual-space offset from the visual top-left of the (possibly rotated) container
    const vx = e.clientX - rect.left;
    const vy = e.clientY - rect.top;

    let relX: number;
    let relY: number;
    let naturalW: number;
    let naturalH: number;

    if (isRotated) {
      // Container is rotated 90° clockwise via CSS.
      // Visual width = natural height; visual height = natural width.
      // Mapping: naturalX = vy, naturalY = visualWidth - vx
      naturalW = rect.height;
      naturalH = rect.width;
      relX = vy / rect.height;
      relY = 1 - vx / rect.width;
    } else {
      naturalW = rect.width;
      naturalH = rect.height;
      relX = vx / rect.width;
      relY = vy / rect.height;
    }

    onTap(relX, relY, naturalW, naturalH, e.clientX, e.clientY);
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        cursor: "crosshair",
        userSelect: "none",
        touchAction: "none",
        height: "100%",
        aspectRatio: "1 / 1",
        maxWidth: "100%",
        maxHeight: "100%",
      }}
      onPointerDown={handlePointerDown}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={onLoadError}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {revealedMarkers.map((marker, idx) => {
        const zone = zones.find((z) => z.id === marker.id);
        if (!zone) return null;
        const color =
          marker.type === "hint"
            ? HINT_COLOR
            : MARKER_COLORS[idx % MARKER_COLORS.length];
        return (
          <Marker
            key={`marker-${marker.id}`}
            zone={zone}
            type={marker.type}
            ordinal={idx + 1}
            color={color}
            tapX={marker.tapX}
            tapY={marker.tapY}
            isRotated={isRotated}
            containerRef={containerRef}
          />
        );
      })}
    </div>
  );
}
