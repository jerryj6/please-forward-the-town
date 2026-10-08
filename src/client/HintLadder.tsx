import { useState } from "react";
import type { HintLadderContent } from "./hints";

/**
 * Tiered hints (GME-009): identify the failing relationship, point at the
 * tool, demonstrate a partial move — and a clearly labeled full solution only
 * as a separate choice the player explicitly opens.
 */
export default function HintLadder({ content }: { content: HintLadderContent }) {
  const [revealed, setRevealed] = useState(0);
  const [solutionOpen, setSolutionOpen] = useState(false);
  return (
    <section className="hint-ladder" aria-label="Hints">
      <h3>Hints</h3>
      <ol>
        {content.tiers.map((text, i) => (
          <li key={i} className={i < revealed ? "hint revealed" : "hint"}>
            {i < revealed ? (
              text
            ) : (
              <button
                type="button"
                className="hint-reveal"
                data-testid={`hint-${i + 1}`}
                onClick={() => setRevealed(Math.max(revealed, i + 1))}
              >
                Reveal hint {i + 1}
              </button>
            )}
          </li>
        ))}
      </ol>
      {content.solution ? (
        <div className="hint-solution">
          {solutionOpen ? (
            <div className="hint-solution-body">
              <strong>{content.solution.caption}</strong>
              <ol>
                {content.solution.lines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ol>
            </div>
          ) : (
            <button
              type="button"
              className="hint-reveal"
              data-testid="hint-solution"
              onClick={() => setSolutionOpen(true)}
            >
              Show a full solution
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
