interface Props {
  onStart: () => void;
  showFullscreenHint: boolean;
}

export function InstructionSlide({ onStart, showFullscreenHint }: Props) {
  return (
    <div className="instr-overlay" dir="rtl">
      <div className="instr-card">
        <ul className="instr-body">
          <li>זהו 7 הבדלים בין התמונות שעל המסך.</li>
          <li>מצאתם הבדל? הקישו עליו באחת התמונות.</li>
          <li>מצאו את כל ההבדלים כדי לעבור לשלב הבא.</li>
        </ul>

        {showFullscreenHint && <p className="instr-fs-hint">
          לחצו על
          <span className="instr-fs-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
            </svg>
          </span>
          להצגת התמונות במסך מלא
        </p>}

        <button className="instr-start-btn" onClick={onStart}>
          בואו נתחיל
        </button>
      </div>
    </div>
  );
}
