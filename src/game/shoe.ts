export const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export const suits = ["♠", "♥", "♦", "♣"] as const;
export type Rank = (typeof ranks)[number];
export type Suit = (typeof suits)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface Shoe {
  cards: Card[];
  cursor: number;
}

export const CUT_CARD_COUNT = 15;

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createShoe(random: () => number = Math.random): Shoe {
  const cards = suits.flatMap((suit) => ranks.map((rank) => ({ rank, suit })));
  return { cards: shuffle(cards, random), cursor: 0 };
}

export function valueOf(card: Card): number {
  if (card.rank === "A") return 11;
  if (card.rank === "J" || card.rank === "Q" || card.rank === "K") return 10;
  return Number(card.rank);
}

export function rankForStrategy(card: Card): string {
  if (card.rank === "J" || card.rank === "Q" || card.rank === "K") return "T";
  return card.rank;
}

export function dealerColumnFor(card: Card): "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A" {
  return card.rank === "J" || card.rank === "Q" || card.rank === "K" ? "10" : card.rank;
}
