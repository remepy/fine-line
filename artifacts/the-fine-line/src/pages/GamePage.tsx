import { useGame } from "../hooks/useGame";
import { GameImage } from "../components/GameImage";
import { SparklesLayer } from "../components/Sparkle";
import { SuccessModal } from "../components/SuccessModal";

const BASE = import.meta.env.BASE_URL;

export default function GamePage() {
  const {
    level,
    imageSet,
    zones,
    foundItems,
    foundIds,
    hintIds,
    sparks,
    loading,
    allFound,
    handleTap,
    handleHint,
    nextLevel,
  } = useGame();

  const diffCount = zones.length;
  const revealedCount = foundIds.length + hintIds.length;
  const hintsLeft = diffCount - foundIds.length - hintIds.length;

  return (
    <div className="outer-wrapper">
      <div className="phone-frame" dir="rtl">
        <header className="game-header">
          <div className="header-top">
            <div className="title-group">
              <h1 className="game-title">הקו הדק</h1>
              <span className="level-badge">שלב {level}</span>
            </div>
            <button
              className="hint-btn"
              onClick={handleHint}
              disabled={loading || hintsLeft <= 0}
              title="רמז"
            >
              <span className="hint-icon">💡</span>
              {hintsLeft > 0 && (
                <span className="hint-count">{hintsLeft}</span>
              )}
            </button>
          </div>
          <p className="subtitle">
            {loading
              ? "טוען..."
              : diffCount > 0
              ? `זהו ${diffCount} הבדלים בתמונה שלפניכם`
              : "זהו את ההבדלים בין שתי התמונות"}
          </p>

          <div className="progress-row">
            {zones.map((z) => {
              const isFound = foundIds.includes(z.id);
              const isHinted = hintIds.includes(z.id);
              return (
                <div
                  key={z.id}
                  className={`progress-dot ${isFound ? "found" : isHinted ? "hinted" : ""}`}
                />
              );
            })}
          </div>
        </header>

        <main className="images-area">
          {loading || !imageSet ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>טוען תמונות...</p>
            </div>
          ) : (
            <>
              <GameImage
                src={`${BASE}${imageSet.original}`}
                alt="תמונה מקורית"
                zones={zones}
                foundItems={foundItems}
                hintIds={hintIds}
                onTap={handleTap}
              />
              <div className="divider-line" />
              <GameImage
                src={`${BASE}${imageSet.modified}`}
                alt="תמונה שונה"
                zones={zones}
                foundItems={foundItems}
                hintIds={hintIds}
                onTap={handleTap}
              />
            </>
          )}
        </main>

        <footer className="game-footer">
          <div className="score-display">
            <span className="score-label">זיהית:</span>
            <span className="score-value">
              {revealedCount} / {diffCount}
            </span>
          </div>
          <p className="tap-hint">לחץ על כל הבדל בכל אחת מהתמונות</p>
        </footer>
      </div>

      <SparklesLayer sparks={sparks} />

      <SuccessModal
        isOpen={allFound && !loading}
        level={level}
        onNext={nextLevel}
      />
    </div>
  );
}
