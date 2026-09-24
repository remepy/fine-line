import type { BridgeSession } from "../lib/cyanBridge";
import { copy } from "../lib/copy";
interface Props {
  onStart: () => void;
  onExit: () => void;
  showFullscreenHint: boolean;
  session: BridgeSession | null;
}

export function InstructionSlide({ onStart, onExit, showFullscreenHint, session }: Props) {
  return (
    <div className="instr-overlay">
      <div className="instr-card">
        <ul className="instr-body">
          <li>{copy(session, "instruction1")}</li>
          <li>{copy(session, "instruction2")}</li>
          <li>{copy(session, "instruction3")}</li>
        </ul>

        {showFullscreenHint && <p className="instr-fs-hint">
          {copy(session, "fullscreenHint")}
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
        </p>}

        <button className="instr-start-btn" onClick={onStart}>
          {copy(session, "start")}
        </button>
        {session && <button type="button" className="instr-exit-btn" onClick={onExit}>
          {copy(session, "quit")}
        </button>}
      </div>
    </div>
  );
}
