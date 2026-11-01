import { describe, expect, it } from "vitest";
import { basicStrategy, dealerColumns, getChartCell } from "../data/basicStrategy";
import { availableChartCells, getDecision, type RuleOptions } from "./strategy";
import type { Card, Rank, Suit } from "./shoe";

function card(rank: Rank, suit: Suit = "♠"): Card {
  return { rank, suit };
}

function dealer(column: string): Card {
  const rank = column === "A" ? "A" : column === "10" ? "10" : column as Rank;
  return card(rank, "♦");
}

describe("strategy resolution", () => {
  it("maps every chart cell through its coordinate without dropping a cell", () => {
    const cells = availableChartCells();
    expect(cells).toHaveLength(310);
    for (const { section, row, dealer: upcard, action } of cells) {
      const columnIndex = dealerColumns.indexOf(upcard);
      expect(getChartCell(section, row, upcard)).toBe(basicStrategy[section][row][columnIndex]);
      expect(action).toBe(basicStrategy[section][row][columnIndex]);
    }
  });

  it("resolves pair decisions before surrender and totals", () => {
    const decision = getDecision([card("8"), card("8", "♥")], dealer("10"));
    expect(decision.move).toBe("split");
    expect(decision.cell).toEqual({ section: "pairs", row: "8,8", dealer: "10" });
  });

  it("continues from a no-split pair into the hard total", () => {
    const decision = getDecision([card("5"), card("5", "♥")], dealer("2"));
    expect(decision.move).toBe("double");
    expect(decision.cell).toEqual({ section: "hard", row: "10", dealer: "2" });
  });

  it("uses the pair cell when a no-split hand is below the chart's hard-total range", () => {
    const decision = getDecision([card("2"), card("2", "♥")], dealer("8"));
    expect(decision.move).toBe("hit");
    expect(decision.cell).toEqual({ section: "pairs", row: "2,2", dealer: "8" });
    expect(decision.cellAction).toBe("N");
  });

  it("applies every surrender cell only to the initial two-card hard hand", () => {
    for (const column of dealerColumns) {
      const sixteen = getDecision([card("10"), card("6", "♥")], dealer(column));
      const fifteen = getDecision([card("10"), card("5", "♥")], dealer(column));
      const fourteen = getDecision([card("10"), card("4", "♥")], dealer(column));
      const expectedMove = (total: string) => {
        if (getChartCell("surrender", total, column) === "SUR") return "surrender";
        const action = getChartCell("hard", total, column);
        return action === "S" ? "stand" : action === "D" ? "double" : "hit";
      };
      expect(sixteen.move).toBe(expectedMove("16"));
      expect(fifteen.move).toBe(expectedMove("15"));
      expect(fourteen.move).toBe(expectedMove("14"));
    }
    const pair = getDecision([card("8"), card("8", "♥")], dealer("10"));
    expect(pair.move).toBe("split");
    expect(getDecision([card("A"), card("5", "♥")], dealer("10")).move).not.toBe("surrender");
  });

  it("falls back to the hard-total chart when surrender is disabled", () => {
    const noSurrender: RuleOptions = { das: true, surrender: false, doubleAllowed: true };
    expect(getDecision([card("10"), card("6", "♥")], dealer("9"), noSurrender).move).toBe("hit");
    expect(getDecision([card("10"), card("5", "♥")], dealer("10"), noSurrender).move).toBe("hit");
  });

  it("falls back for double and double-or-stand when doubling is unavailable", () => {
    const noDouble: RuleOptions = { das: true, surrender: true, doubleAllowed: false };
    expect(getDecision([card("5"), card("6", "♥")], dealer("A"), noDouble).move).toBe("hit");
    expect(getDecision([card("A"), card("7", "♥")], dealer("2"), noDouble).move).toBe("stand");
  });

  it("splits each Y/N cell only with DAS and hits for every fallback", () => {
    const noDas: RuleOptions = { das: false, surrender: true, doubleAllowed: true };
    const withDas: RuleOptions = { das: true, surrender: true, doubleAllowed: true };
    const rankByPair: Record<string, Rank> = {
      "A,A": "A", "6,6": "6", "4,4": "4", "3,3": "3", "2,2": "2",
    };
    const fallbackCells = availableChartCells().filter((cell) => cell.section === "pairs" && cell.action === "Y/N");
    expect(fallbackCells.length).toBeGreaterThan(0);
    for (const cell of fallbackCells) {
      const rank = rankByPair[cell.row];
      const hand = [card(rank), card(rank, "♥")] as const;
      expect(getDecision(hand, dealer(cell.dealer), withDas).move, `${cell.row} vs ${cell.dealer}`).toBe("split");
      expect(getDecision(hand, dealer(cell.dealer), noDas).move, `${cell.row} vs ${cell.dealer}`).toBe("hit");
    }
  });

  it("keeps all DAS-off fallback cells as charted Y/N entries", () => {
    for (const cell of availableChartCells().filter((entry) => entry.section === "pairs" && entry.action === "Y/N")) {
      expect(getChartCell("pairs", cell.row, cell.dealer)).toBe("Y/N");
    }
  });
});
