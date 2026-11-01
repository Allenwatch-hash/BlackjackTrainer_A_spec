import { describe, expect, it } from "vitest";
import { dealQuestion, freshQuestion } from "./drill";
import { createShoe, CUT_CARD_COUNT, type Card } from "./shoe";

function cardIdentity(card: Card): string {
  return `${card.rank}${card.suit}`;
}

describe("one-deck shoe", () => {
  it("starts with 52 unique cards", () => {
    const shoe = createShoe();
    expect(shoe.cards).toHaveLength(52);
    expect(new Set(shoe.cards.map(cardIdentity)).size).toBe(52);
  });

  it("deals only cards from the shoe without replacement", () => {
    const shoe = createShoe();
    const dealt = dealQuestion(shoe);
    const consumed = shoe.cards.slice(0, shoe.cursor).map(cardIdentity);
    expect(shoe.cursor).toBeGreaterThanOrEqual(3);
    expect(new Set(shoe.cards.map(cardIdentity)).size).toBe(52);
    expect(dealt.player.concat(dealt.dealer)).toHaveLength(3);
    for (const card of dealt.player.concat(dealt.dealer)) {
      expect(consumed).toContain(cardIdentity(card));
    }
  });

  it("reshuffles the 52-card shoe at the cut", () => {
    const shoe = createShoe();
    shoe.cursor = shoe.cards.length - CUT_CARD_COUNT;
    dealQuestion(shoe, () => 0.37);
    expect(shoe.cards).toHaveLength(52);
    expect(shoe.cursor).toBeLessThan(CUT_CARD_COUNT);
    expect(new Set(shoe.cards.map(cardIdentity)).size).toBe(52);
  });

  it("starts each fresh run with a new in-memory shoe", () => {
    const first = freshQuestion();
    const second = freshQuestion();
    expect(first.shoe).not.toBe(second.shoe);
    expect(first.question).not.toBe(second.question);
    expect(first.shoe.cards).toHaveLength(52);
    expect(second.shoe.cards).toHaveLength(52);
  });

  it("deals a queued weak spot from the same shoe without duplicating cards", () => {
    const shoe = createShoe();
    const first = dealQuestion(shoe);
    const repeat = dealQuestion(shoe, Math.random, first.decision.signature);
    expect(repeat.isWeakSpotRepeat).toBe(true);
    expect(repeat.decision.signature).toBe(first.decision.signature);
    expect(new Set(shoe.cards.map(cardIdentity)).size).toBe(52);
    expect(shoe.cursor).toBeGreaterThanOrEqual(6);
  });
});
