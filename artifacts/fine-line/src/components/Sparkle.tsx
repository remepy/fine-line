import { SparkleEffect } from "../hooks/useGame";

interface SparklesLayerProps {
  sparks: SparkleEffect[];
}

export function SparklesLayer({ sparks }: SparklesLayerProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {sparks.map((spark) => (
        <div
          key={spark.id}
          style={{
            position: "absolute",
            left: spark.x,
            top: spark.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          {spark.success ? (
            <div className="sparkle-burst">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="sparkle-ray"
                  style={{ "--angle": `${i * 45}deg` } as React.CSSProperties}
                />
              ))}
              <div className="sparkle-center" />
            </div>
          ) : (
            <div className="wrong-tap">
              <span>✗</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
