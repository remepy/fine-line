import { useGame } from "../hooks/useGame";
import { useIsRotated } from "../hooks/useIsRotated";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";
import { useFullscreen } from "../hooks/useFullscreen";
import { GameImage } from "../components/GameImage";
import { SparklesLayer } from "../components/Sparkle";
import { SuccessModal } from "../components/SuccessModal";
import { PortraitOverlay } from "../components/PortraitOverlay";

const BASE = import.meta.env.BASE_URL;

export default function GamePage() {
  const {
    level,
    imageSet,
    zones,
    revealedMarkers,
    sparks,
    loading,
    showSuccess,
    hintsLeft,
    handleTap,
    handleHint,
    nextLevel,
  } = useGame();

  const isRotated = useIsRotated();
  const { isPlaying: musicPlaying, toggle: toggleMusic } = useBackgroundMusic();
  const {
    isFullscreen,
    toggle: toggleFullscreen,
    isSupported: fullscreenSupported,
  } = useFullscreen();
  const diffCount = zones.length;
  const revealedCount = revealedMarkers.length;
  const hintButtonDisabled = loading || hintsLeft <= 0;

  return (
    <>
      <div className="outer-wrapper" />

      <div className="rotation-wrapper">
        <div className="phone-frame" dir="rtl">
          <main className="images-area">
            {loading || !imageSet ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>טוען תמונות...</p>
              </div>
            ) : (
              <>
                <div className="image-half">
                  <GameImage
                    src={`${BASE}${imageSet.original}`}
                    alt="תמונה מקורית"
                    zones={zones}
                    revealedMarkers={revealedMarkers}
                    isRotated={isRotated}
                    onTap={handleTap}
                  />
                </div>
                <div className="divider-line" />
                <div className="image-half">
                  <GameImage
                    src={`${BASE}${imageSet.modified}`}
                    alt="תמונה שונה"
                    zones={zones}
                    revealedMarkers={revealedMarkers}
                    isRotated={isRotated}
                    onTap={handleTap}
                  />
                </div>
              </>
            )}
          </main>

          {/* ─── Floating overlays ─── */}

          {/* Top-right (RTL leading): title + level */}
          <div className="overlay overlay-title">
            <div className="title-pill">
              <span className="game-title">הקו הדק</span>
              <span className="level-badge">שלב {level}</span>
            </div>
          </div>

          {/* Top-center: progress dots */}
          {!loading && diffCount > 0 && (
            <div className="overlay overlay-progress">
              <div className="progress-row">
                {zones.map((z) => {
                  const marker = revealedMarkers.find((m) => m.id === z.id);
                  const isFound = marker?.type === "found";
                  const isHinted = marker?.type === "hint";
                  return (
                    <div
                      key={z.id}
                      className={`progress-dot ${
                        isFound ? "found" : isHinted ? "hinted" : ""
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Top-left (RTL trailing): score + music toggle */}
          {!loading && diffCount > 0 && (
            <div className="overlay overlay-score">
              <div className="score-pill" dir="ltr">
                <span className="score-value">{revealedCount}</span>
                <span className="score-sep">/</span>
                <span className="score-total">{diffCount}</span>
              </div>
              <button
                type="button"
                className={`music-toggle ${musicPlaying ? "is-on" : "is-off"}`}
                onClick={toggleMusic}
                title={musicPlaying ? "השתק מוזיקה" : "הפעל מוזיקה"}
                aria-label={musicPlaying ? "השתק מוזיקה" : "הפעל מוזיקה"}
                aria-pressed={musicPlaying}
              >
                <svg
                  className="music-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
                {!musicPlaying && (
                  <span className="music-slash" aria-hidden="true" />
                )}
              </button>
              {fullscreenSupported && (
                <button
                  type="button"
                  className={`fs-toggle ${isFullscreen ? "is-on" : "is-off"}`}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
                  aria-label={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
                  aria-pressed={isFullscreen}
                >
                  {isFullscreen ? (
                    /* Minimize: arrows pointing inward */
                    <svg
                      className="fs-icon"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
                    </svg>
                  ) : (
                    /* Maximize: arrows pointing outward */
                    <svg
                      className="fs-icon"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Bottom-right (RTL leading): subtitle */}
          {!loading && diffCount > 0 && (
            <div className="overlay-subtitle">
              זהו {diffCount} הבדלים בין התמונות
            </div>
          )}

          {/* Bottom-left (RTL trailing): hint FAB */}
          <button
            className="hint-fab"
            onClick={handleHint}
            disabled={hintButtonDisabled}
            title="רמז"
            aria-label="רמז"
          >
            <span className="hint-icon">💡</span>
            {hintsLeft > 0 && <span className="hint-count">{hintsLeft}</span>}
          </button>
        </div>
      </div>

      {/* SparklesLayer and SuccessModal live OUTSIDE the rotation-wrapper so
          they use viewport (not rotated) coordinates and form their own
          top-level stacking contexts. Modal must come after SparklesLayer in
          DOM order so it always paints above. */}
      <SparklesLayer sparks={sparks} />

      <SuccessModal
        isOpen={showSuccess}
        level={level}
        onNext={nextLevel}
      />

      <PortraitOverlay visible={isRotated} />
    </>
  );
}
