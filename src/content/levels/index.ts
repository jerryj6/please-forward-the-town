import { PFT01_LAST_CROSSING } from "./pft01-last-crossing.js";
import { PFT02_TWO_PARCELS_ONE_BOAT, PFT02_CARD } from "./pft02-two-parcels-one-boat.js";
import { PFT03_A_BRIDGE_WITH_TWO_ADDRESSES, PFT03_CARD } from "./pft03-a-bridge-with-two-addresses.js";
import { PFT04_THE_UPSTAIRS_ADDRESS, PFT04_CARD } from "./pft04-the-upstairs-address.js";
import { PFT05_RETURN_TO_SENDER, PFT05_CARD } from "./pft05-return-to-sender.js";
import { PFT06_THE_FERRYS_LAST_FARE, PFT06_CARD } from "./pft06-the-ferrys-last-fare.js";
import { PFT07_THE_MOVING_ADDRESS, PFT07_CARD } from "./pft07-the-moving-address.js";
import { PFT08_NO_ONE_LEFT_ON_WEST, PFT08_CARD } from "./pft08-no-one-left-on-west.js";
import { PFT09_THREE_USEFUL_PARCELS, PFT09_CARD } from "./pft09-three-useful-parcels.js";
import { PFT10_THE_DETOUR_DIVIDEND, PFT10_CARD } from "./pft10-the-detour-dividend.js";
import { PFT11_MAIL_THE_POST_OFFICE, PFT11_CARD } from "./pft11-mail-the-post-office.js";
import { PFT12_EVERYTHING_MUST_GO, PFT12_CARD } from "./pft12-everything-must-go.js";

export const LEVELS = [
  { id: "PFT-01", def: PFT01_LAST_CROSSING },
  { id: "PFT-02", def: PFT02_TWO_PARCELS_ONE_BOAT },
  { id: "PFT-03", def: PFT03_A_BRIDGE_WITH_TWO_ADDRESSES },
  { id: "PFT-04", def: PFT04_THE_UPSTAIRS_ADDRESS },
  { id: "PFT-05", def: PFT05_RETURN_TO_SENDER },
  { id: "PFT-06", def: PFT06_THE_FERRYS_LAST_FARE },
  { id: "PFT-07", def: PFT07_THE_MOVING_ADDRESS },
  { id: "PFT-08", def: PFT08_NO_ONE_LEFT_ON_WEST },
  { id: "PFT-09", def: PFT09_THREE_USEFUL_PARCELS },
  { id: "PFT-10", def: PFT10_THE_DETOUR_DIVIDEND },
  { id: "PFT-11", def: PFT11_MAIL_THE_POST_OFFICE },
  { id: "PFT-12", def: PFT12_EVERYTHING_MUST_GO },
] as const;

export const CARDS: Record<string, { hints: readonly string[]; coopNote?: string }> = {
  "PFT-02": PFT02_CARD,
  "PFT-03": PFT03_CARD,
  "PFT-04": PFT04_CARD,
  "PFT-05": PFT05_CARD,
  "PFT-06": PFT06_CARD,
  "PFT-07": PFT07_CARD,
  "PFT-08": PFT08_CARD,
  "PFT-09": PFT09_CARD,
  "PFT-10": PFT10_CARD,
  "PFT-11": PFT11_CARD,
  "PFT-12": PFT12_CARD,
};
