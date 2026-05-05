import { useState } from "react";
import { useGame } from "../hooks/useGame";
import { useIsRotated } from "../hooks/useIsRotated";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";
import { useFullscreen } from "../hooks/useFullscreen";
import { GameImage } from "../components/GameImage";
import { SparklesLayer } from "../components/Sparkle";
import { SuccessModal } from "../components/SuccessModal";
import { PortraitOverlay } from "../components/PortraitOverlay";
import { A2HSBanner } from "../components/A2HSBanner";

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
  const [hasUsedFullscreen, setHasUsedFullscreen] = useState(false);
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

          {/* Top-left (RTL trailing): score + music toggle — always visible */}
          <div className="overlay overlay-score">
              <div className="score-pill" dir="ltr">
                {diffCount > 0 && (
                  <>
                    <span className="score-value">{revealedCount}</span>
                    <span className="score-sep">/</span>
                    <span className="score-total">{diffCount}</span>
                  </>
                )}
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
                  className={`fs-toggle ${isFullscreen ? "is-on" : "is-off"}${!hasUsedFullscreen ? " fs-pulse-active" : ""}`}
                  onClick={() => { setHasUsedFullscreen(true); toggleFullscreen(); }}
                  title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
                  aria-label={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
                  aria-pressed={isFullscreen}
                >
                  {isFullscreen ? (
                    /* Minimize: arrows pointing inward */
                    <svg
                      className="fs-icon"
                      viewBox="0 0 24 24"
                      width="27"
                      height="27"
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
                      width="27"
                      height="27"
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

          {/* Bottom-right (RTL leading): subtitle */}
          {!loading && diffCount > 0 && (
            <div className="overlay-subtitle">
              זהו {diffCount} הבדלים
              <svg
                className="tap-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M8 13V4.5C8 4.10218 8.15804 3.72064 8.43934 3.43934C8.72064 3.15804 9.10218 3 9.5 3C9.89782 3 10.2794 3.15804 10.5607 3.43934C10.842 3.72064 11 4.10218 11 4.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 11.5V9.5C11 9.10218 11.158 8.72064 11.4393 8.43934C11.7206 8.15804 12.1022 8 12.5 8C12.8978 8 13.2794 8.15804 13.5607 8.43934C13.842 8.72064 14 9.10218 14 9.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 10.5C14 10.1022 14.158 9.72064 14.4393 9.43934C14.7206 9.15804 15.1022 9 15.5 9C15.8978 9 16.2794 9.15804 16.5607 9.43934C16.842 9.72064 17 10.1022 17 10.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.0002 11.5C17.0002 11.1022 17.1582 10.7206 17.4395 10.4393C17.7208 10.158 18.1024 10 18.5002 10C18.898 10 19.2795 10.158 19.5608 10.4393C19.8421 10.7206 20.0002 11.1022 20.0002 11.5V16C20.0002 17.5913 19.368 19.1174 18.2428 20.2426C17.1176 21.3679 15.5915 22 14.0002 22H12.0002H12.2082C11.2145 22.0002 10.2364 21.7535 9.36157 21.2823C8.48676 20.811 7.7427 20.1299 7.19618 19.3L7.00018 19C6.68818 18.521 5.59318 16.612 3.71418 13.272C3.52263 12.9315 3.47147 12.5298 3.57157 12.1522C3.67166 11.7745 3.91513 11.4509 4.25018 11.25C4.60706 11.0359 5.02526 10.9471 5.43834 10.9978C5.85143 11.0486 6.23572 11.2359 6.53018 11.53L8.00018 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 3L4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 7H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 3L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 6H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
      <A2HSBanner />
    </>
  );
}
