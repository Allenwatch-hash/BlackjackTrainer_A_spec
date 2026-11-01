import { basicStrategy, dealerColumns, getChartCell, type ChartAction, type ChartCellAction, type ChartSection, type DealerColumn } from "../data/basicStrategy";
import { dealerColumnFor, rankForStrategy, valueOf, type Card } from "./shoe";

export type Move = "hit" | "stand" | "double" | "split" | "surrender";

export interface CellReference {
  section: ChartSection;
  row: string;
  dealer: DealerColumn;
}

export interface StrategyDecision {
  move: Move;
  cell: CellReference;
  cellAction: ChartCellAction;
  handLabel: string;
  reason: string;
  signature: string;
}

export interface RuleOptions {
  das: boolean;
  surrender: boolean;
  doubleAllowed: boolean;
}

export const defaultRules: RuleOptions = {
  das: true,
  surrender: true,
  doubleAllowed: true,
};

function handTotal(cards: readonly Card[]): { total: number; soft: boolean } {
  let total = cards.reduce((sum, card) => sum + valueOf(card), 0);
  let aces = cards.filter((card) => card.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: cards.some((card) => card.rank === "A") && cards.reduce((sum, card) => sum + valueOf(card), 0) <= 21 };
}

function moveFor(action: ChartCellAction, rules: RuleOptions): Move {
  if (action === "-") return "hit";
  switch (action) {
    case "H":
      return "hit";
    case "S":
      return "stand";
    case "D":
      return rules.doubleAllowed ? "double" : "hit";
    case "Ds":
      return rules.doubleAllowed ? "double" : "stand";
    case "Y":
      return "split";
    case "Y/N":
      return rules.das ? "split" : "hit";
    case "N":
      throw new Error("A no-split cell must continue to the total strategy.");
    case "SUR":
      return "surrender";
  }
}

function makeDecision(
  move: Move,
  section: ChartSection,
  row: string,
  dealer: DealerColumn,
  action: ChartAction | "-",
  handLabel: string,
  reason: string,
): StrategyDecision {
  const cell = { section, row, dealer };
  return {
    move,
    cell,
    cellAction: action,
    handLabel,
    reason,
    signature: `${section}:${row}:${dealer}`,
  };
}

export function getDecision(
  player: readonly [Card, Card],
  dealer: Card,
  rules: RuleOptions = defaultRules,
): StrategyDecision {
  const dealerColumn = dealerColumnFor(dealer);
  const dealerIndex = dealerColumns.indexOf(dealerColumn);
  const playerRanks = player.map(rankForStrategy);
  const pairRow = playerRanks[0] === playerRanks[1] ? `${playerRanks[0]},${playerRanks[1]}` : undefined;
  const { total, soft } = handTotal(player);
  const otherCard = player.find((card) => card.rank !== "A");
  const softRow = player.some((card) => card.rank === "A") && otherCard
    ? `A,${rankForStrategy(otherCard)}`
    : undefined;
  const pairAction = pairRow ? getChartCell("pairs", pairRow, dealerColumn) : undefined;
  const hardFallback = basicStrategy.hard[String(Math.min(total, 17))]?.[dealerIndex] ?? "H";
  const hardAction = hardFallback === "D" && !rules.doubleAllowed ? "H" : hardFallback;
  const handLabel = player.map((card) => card.rank).join(" + ");

  if (pairRow && pairAction === "Y") {
    return makeDecision("split", "pairs", pairRow, dealerColumn, pairAction, handLabel, "This is a pair, so the pair decision is checked first. This cell says to split.");
  }
  if (pairRow && pairAction === "Y/N" && rules.das) {
    return makeDecision("split", "pairs", pairRow, dealerColumn, pairAction, handLabel, "This pair cell allows a split when double after split is offered.");
  }
  if (pairRow && pairAction === "Y/N" && !rules.das) {
    return makeDecision("hit", "pairs", pairRow, dealerColumn, pairAction, handLabel, "This pair cell needs DAS to split. Without DAS, the v1 fallback is to hit.");
  }

  if (rules.surrender && !soft && total >= 14 && total <= 16) {
    const surrenderAction = getChartCell("surrender", String(total), dealerColumn) ?? "-";
    if (surrenderAction === "SUR") {
      return makeDecision("surrender", "surrender", String(total), dealerColumn, surrenderAction, handLabel, "This hard total is in the late-surrender range, and this dealer upcard has a surrender entry.");
    }
  }

  if (pairRow && pairAction === "N") {
    const reason = `The pair cell says not to split. Continue with the hard-total strategy for ${total}.`;
    if (total < 8) {
      return makeDecision("hit", "pairs", pairRow, dealerColumn, pairAction, handLabel, `${reason} The hard-total table starts at 8, so hit.`);
    }
    if (total >= 18) {
      return makeDecision("stand", "pairs", pairRow, dealerColumn, pairAction, handLabel, reason);
    }
    return makeDecision(moveFor(hardAction, rules), "hard", String(Math.min(total, 17)), dealerColumn, hardAction, handLabel, reason);
  }

  if (soft && softRow && basicStrategy.soft[softRow]) {
    const action = getChartCell("soft", softRow, dealerColumn) ?? "S";
    return makeDecision(moveFor(action, rules), "soft", softRow, dealerColumn, action, handLabel, "This hand has a usable Ace, so the soft-total row applies.");
  }

  if (total >= 18) {
    return makeDecision("stand", "hard", String(total), dealerColumn, "-", handLabel, "This total is above the chart's hard-total rows, so stand.");
  }

  if (total < 8) {
    return makeDecision("hit", "hard", String(total), dealerColumn, "-", handLabel, "This total is below the chart's hard-total rows, so hit.");
  }
  const row = String(total);
  const action = getChartCell("hard", row, dealerColumn) ?? "H";
  return makeDecision(moveFor(action, rules), "hard", row, dealerColumn, action, handLabel, "No split or surrender applies, so use the hard-total row.");
}

export function answerLabel(move: Move): string {
  return {
    hit: "Hit",
    stand: "Stand",
    double: "Double",
    split: "Split",
    surrender: "Surrender",
  }[move];
}

export function feedbackReason(decision: StrategyDecision): string {
  const actionDescription: Record<Move, string> = {
    hit: "Hit — take another card.",
    stand: "Stand — take no more cards.",
    double: "Double — double the wager and take one card.",
    split: "Split — play the pair as two hands.",
    surrender: "Surrender — give up the hand under the late-surrender rule.",
  };
  return `${actionDescription[decision.move]} ${decision.reason}`;
}

export function availableChartCells(): Array<{ section: ChartSection; row: string; dealer: DealerColumn; action: ChartCellAction }> {
  const sections: ChartSection[] = ["hard", "soft", "pairs", "surrender"];
  return sections.flatMap((section) =>
    Object.entries(basicStrategy[section]).flatMap(([row, actions]) =>
      dealerColumns.map((dealer, index) => ({
        section,
        row,
        dealer,
        action: actions[index],
      })),
    ),
  );
}
