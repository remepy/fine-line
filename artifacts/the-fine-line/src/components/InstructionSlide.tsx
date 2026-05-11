interface Props {
  onStart: () => void;
}

export function InstructionSlide({ onStart }: Props) {
  return (
    <div className="instr-overlay" dir="rtl">
      <div className="instr-card">
        <h1 className="instr-title">מצאו את ההבדלים</h1>

        <ul className="instr-body">
          <li>זהו 7 הבדלים בין התמונות שעל המסך.</li>
          <li>הקישו על ההבדל שמצאתם בכל אחת מהתמונות.</li>
          <li>מצאו את כל ההבדלים כדי לעבור לשלב הבא.</li>
        </ul>

        <p className="instr-fs-hint">
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
        </p>

        <button className="instr-start-btn" onClick={onStart}>
          בואו נתחיל
        </button>
      </div>
    </div>
  );
}
