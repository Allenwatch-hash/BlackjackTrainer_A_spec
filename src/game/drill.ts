import { getDecision, type StrategyDecision } from "./strategy";
import { CUT_CARD_COUNT, createShoe, shuffle, type Card, type Shoe } from "./shoe";

export interface DrillQuestion {
  player: [Card, Card];
  dealer: Card;
  decision: StrategyDecision;
  isWeakSpotRepeat: boolean;
}

function remainingCards(shoe: Shoe): Card[] {
  return shoe.cards.slice(shoe.cursor);
}

function shuffleAtCut(shoe: Shoe, random: () => number): void {
  if (shoe.cards.length - shoe.cursor <= CUT_CARD_COUNT) {
    shoe.cards = shuffle(shoe.cards, random);
    shoe.cursor = 0;
  }
}

function takeSequentialTriple(shoe: Shoe, random: () => number): [Card, Card, Card] {
  shuffleAtCut(shoe, random);
  if (shoe.cards.length - shoe.cursor < 3) {
    shoe.cards = shuffle(shoe.cards, random);
    shoe.cursor = 0;
  }
  const cards = shoe.cards.slice(shoe.cursor, shoe.cursor + 3) as [Card, Card, Card];
  shoe.cursor += 3;
  return cards;
}

function targetedTriple(shoe: Shoe, signature: string, random: () => number): [Card, Card, Card] | undefined {
  const cards = remainingCards(shoe);
  const matches: Array<[number, number, number]> = [];
  for (let first = 0; first < cards.length - 2; first += 1) {
    for (let second = first + 1; second < cards.length - 1; second += 1) {
      for (let dealer = 0; dealer < cards.length; dealer += 1) {
        if (dealer === first || dealer === second) continue;
        const player = [cards[first], cards[second]] as const;
        const decision = getDecision(player, cards[dealer]);
        if (decision.signature === signature) matches.push([first, second, dealer]);
      }
    }
  }
  if (matches.length === 0) return undefined;
  const [first, second, dealer] = matches[Math.floor(random() * matches.length)];
  const selected = [cards[first], cards[second], cards[dealer]] as [Card, Card, Card];
  const selectedIds = new Set(selected);
  const remainder = cards.filter((card) => !selectedIds.has(card));
  shoe.cards = [...shoe.cards.slice(0, shoe.cursor), ...selected, ...remainder];
  return takeSequentialTriple(shoe, random);
}

export function dealQuestion(
  shoe: Shoe,
  random: () => number = Math.random,
  weakSpotSignature?: string,
): DrillQuestion {
  shuffleAtCut(shoe, random);

  if (weakSpotSignature) {
    const matching = targetedTriple(shoe, weakSpotSignature, random);
    if (matching) {
      const [first, second, dealer] = matching;
      return {
        player: [first, second],
        dealer,
        decision: getDecision([first, second], dealer),
        isWeakSpotRepeat: true,
      };
    }
  }

  for (let attempt = 0; attempt < 52; attempt += 1) {
    const [first, second, dealer] = takeSequentialTriple(shoe, random);
    const decision = getDecision([first, second], dealer);
    const drillable = decision.cellAction !== "-";
    if (drillable) {
      return {
        player: [first, second],
        dealer,
        decision,
        isWeakSpotRepeat: false,
      };
    }
  }
  throw new Error("Unable to deal a charted hand from the shoe.");
}

export function freshQuestion(random: () => number = Math.random): { shoe: Shoe; question: DrillQuestion } {
  const shoe = createShoe(random);
  return { shoe, question: dealQuestion(shoe, random) };
}
