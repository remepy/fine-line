import type { BridgeSession } from "../lib/cyanBridge";
import { copy } from "../lib/copy";
interface Props {
  onStart: () => void;
  onExit: () => void;
  session: BridgeSession | null;
}

export function InstructionSlide({ onStart, onExit, session }: Props) {
  return (
    <div className="instr-overlay">
      <div className="instr-card">
        <ul className="instr-body">
          <li>{copy(session, "instruction1")}</li>
          <li>{copy(session, "instruction2")}</li>
          <li>{copy(session, "instruction3")}</li>
        </ul>

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
