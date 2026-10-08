// Committed-order ledger — PFT is incremental (each commit mutates the world),
// so the "timeline" is the journal: newest commits on top, each with its
// emitted events. Read-only; the engine's undo restores prior checkpoints.

import type { GameEvent } from "../engine/contracts.js";
import { describeAction, describeEvent } from "./describe";
import type { PftAction } from "../engine/pft/types.js";

export interface LedgerEntry {
  commandId: string;
  action: PftAction;
  events: GameEvent[];
}

export default function LedgerView({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="ledger empty" aria-label="Order ledger">
        <p className="dim">The ledger is blank — no orders written yet.</p>
      </section>
    );
  }
  return (
    <section className="ledger" aria-label="Order ledger">
      <ol className="ledger-list" data-testid="ledger">
        {[...entries].reverse().map((e) => (
          <li key={e.commandId} className="ledger-entry">
            <div className="ledger-action">{describeAction(e.action)}</div>
            <ul className="ledger-events">
              {e.events.map((ev, i) => (
                <li key={i} className={`event type-${ev.type}`}>
                  {describeEvent(ev)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
