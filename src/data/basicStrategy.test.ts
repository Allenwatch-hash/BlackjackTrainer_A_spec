import { describe, expect, it } from "vitest";
import { basicStrategy, dealerColumns, getChartCell, type ChartSection } from "./basicStrategy";

describe("Allen basic strategy matrix", () => {
  it.each(["hard", "soft", "pairs", "surrender"] as const)("%s includes every transcription cell", (section) => {
    const rows = basicStrategy[section];
    expect(Object.keys(rows).length).toBe(section === "hard" || section === "pairs" ? 10 : section === "soft" ? 8 : 3);
    for (const [row, actions] of Object.entries(rows)) {
      expect(actions).toHaveLength(10);
      actions.forEach((action, index) => {
        expect(getChartCell(section, row, dealerColumns[index])).toBe(action);
      });
    }
  });

  it("contains only the chart key and the blank surrender marker", () => {
    const allowed = new Set(["H", "S", "D", "Ds", "Y", "N", "Y/N", "SUR", "-"]);
    for (const rows of Object.values(basicStrategy)) {
      for (const actions of Object.values(rows)) {
        for (const action of actions) expect(allowed.has(action)).toBe(true);
      }
    }
  });

  it("contains exactly the four approved chart sections and 310 cells", () => {
    const sections = Object.keys(basicStrategy) as ChartSection[];
    expect(sections).toEqual(["hard", "soft", "pairs", "surrender"]);
    expect(sections.reduce((sum, section) => sum + Object.values(basicStrategy[section]).flat().length, 0)).toBe(310);
  });

  it("matches the complete verified H17 transcription", () => {
    const text = Object.entries(basicStrategy)
      .map(([section, rows]) => `${section}\n${Object.entries(rows).map(([row, actions]) => `${row}:${actions.join(",")}`).join("\n")}`)
      .join("\n");
    let fingerprint = 0xcbf29ce484222325n;
    for (const character of text) {
      fingerprint ^= BigInt(character.charCodeAt(0));
      fingerprint = (fingerprint * 0x100000001b3n) & 0xffffffffffffffffn;
    }
    expect(fingerprint.toString(16).padStart(16, "0")).toBe("8f6fd822b0508b7a");
  });

  it("uses only the declared dealer columns", () => {
    expect(dealerColumns).toEqual(["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"]);
    expect(getChartCell("hard", "8", "A")).toBe("H");
  });
});
