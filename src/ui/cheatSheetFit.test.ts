import { describe, expect, it } from "vitest";
import { getCheatSheetFit, MIN_CHEAT_SHEET_SCALE } from "./cheatSheetFit";

describe("cheat sheet viewport fit", () => {
  it("scales to fit the available screen while keeping the full chart visible", () => {
    expect(getCheatSheetFit(900, 1000, 900, 850)).toEqual({ mode: "fit", scale: 0.85 });
  });

  it("keeps a readable minimum size and enables scrolling when the chart cannot fit", () => {
    expect(getCheatSheetFit(900, 1000, 900, 700)).toEqual({
      mode: "scroll",
      scale: MIN_CHEAT_SHEET_SCALE,
    });
  });
});
