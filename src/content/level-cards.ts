/**
 * level-cards.ts — complete LevelCard map for the campaign, including
 * PFT-01 whose canonical upstream file has no card export.
 */
import { CARDS } from "./levels/index.js";

export interface LevelCard {
  readonly winningTraceSummary: string;
  readonly wrongApproaches: readonly string[];
  readonly hints: readonly string[];
  readonly coopNote?: string;
}

const PFT01_CARD: LevelCard = {
  winningTraceSummary:
    "The nine-move contract: walk west, take the lantern, return to Middle, " +
    "ride the packet ferry east, deliver the lantern at the orchard, ride " +
    "back, pack the Town Span plank at Middle, ride east once more, and " +
    "file the plank at the museum.",
  wrongApproaches: [
    "Pack the Town Span while the courier still needs the west bank — " +
      "the lantern order strands with no route left (redeploy recovers while it is carried).",
    "Deliver the plank first — the bridge is the only crossing tool; " +
      "handing it to the museum early strands every later west-bank errand (undo-only).",
    "Try to send the lantern by post — the postal link only fires once the " +
      "relay mailbox stands deployed, and this contract has no spare piece.",
  ],
  hints: [
    "Everything depends on the Town Span: only pack it when nobody — and nothing — still needs the far shore.",
    "Ferry hops are cheap; the plank is not. Do the errands on foot, keep the boat for cargo.",
    "Order matters: lantern home first, then pack the span, then the museum run.",
  ],
};

export const LEVEL_CARDS: Record<string, LevelCard> = {
  ...(CARDS as Record<string, LevelCard>),
  "PFT-01": PFT01_CARD,
};
