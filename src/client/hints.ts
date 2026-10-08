// Tiered hint content per level (GME-009): identify the failing relationship,
// point at the tool, demonstrate a partial move — full solution behind an
// explicit second choice.

export interface HintLadderContent {
  tiers: string[];
  solution?: { caption: string; lines: string[] };
}

export const PFT_HINTS: Record<string, HintLadderContent> = {
  "pft-01": {
    tiers: [
      "The lantern is on the west bank; the only way across to Middle Landing is the deployed plank bridge. Walk west first.",
      "The ferry carries exactly one courier and one parcel. Deliveries on the East Shore can only happen while you are standing there — ride it east with your cargo.",
      "The museum wants the bridge itself. It can only be packed from Middle Landing — but packing it strands anything left on the west bank. Do the west errand first, then pack.",
    ],
    solution: {
      caption: "One nine-move contract:",
      lines: [
        "Walk to the west bank",
        "Pick up the Harbor Lantern",
        "Walk to Middle Landing",
        "Ride the ferry to East Shore",
        "Deliver the lantern to the East Orchard",
        "Ride the ferry back to Middle Landing",
        "Pack up the plank bridge",
        "Ride the ferry to East Shore",
        "Deliver the bridge to the East Museum",
      ],
    },
  },
};
