import { PFT01_LAST_CROSSING } from "./pft01-last-crossing.js";
import { PFT02_TWO_PARCELS_ONE_BOAT, PFT02_CARD } from "./pft02-two-parcels-one-boat.js";
import { PFT03_A_BRIDGE_WITH_TWO_ADDRESSES, PFT03_CARD } from "./pft03-a-bridge-with-two-addresses.js";
import { PFT04_THE_UPSTAIRS_ADDRESS, PFT04_CARD } from "./pft04-the-upstairs-address.js";

export const LEVELS = [
  { id: "PFT-01", def: PFT01_LAST_CROSSING },
  { id: "PFT-02", def: PFT02_TWO_PARCELS_ONE_BOAT },
  { id: "PFT-03", def: PFT03_A_BRIDGE_WITH_TWO_ADDRESSES },
  { id: "PFT-04", def: PFT04_THE_UPSTAIRS_ADDRESS },
] as const;

export const CARDS: Record<string, { hints: readonly string[]; coopNote?: string }> = {
  "PFT-02": PFT02_CARD,
  "PFT-03": PFT03_CARD,
  "PFT-04": PFT04_CARD,
};
