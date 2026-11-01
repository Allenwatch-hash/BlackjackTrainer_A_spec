export const MIN_CHEAT_SHEET_SCALE = 0.8;

export interface CheatSheetFit {
  mode: "fit" | "scroll";
  scale: number;
}

export function getCheatSheetFit(
  contentWidth: number,
  contentHeight: number,
  availableWidth: number,
  availableHeight: number,
): CheatSheetFit {
  if (contentWidth <= 0 || contentHeight <= 0 || availableWidth <= 0 || availableHeight <= 0) {
    return { mode: "fit", scale: 1 };
  }

  const scale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight);
  return scale >= MIN_CHEAT_SHEET_SCALE
    ? { mode: "fit", scale }
    : { mode: "scroll", scale: MIN_CHEAT_SHEET_SCALE };
}
