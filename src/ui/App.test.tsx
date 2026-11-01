import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDecision, answerLabel } from "../game/strategy";
import type { Card, Rank, Suit } from "../game/shoe";
import App from "./App";

describe("drill interface", () => {
  it("opens and closes the cheat sheet without replacing the current hand", () => {
    render(<App />);
    const hand = screen.getByLabelText("Current hand");
    const initialCards = hand.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Open cheat sheet" }));
    expect(screen.getByRole("dialog", { name: "Basic strategy cheat sheet" })).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Basic strategy cheat sheet" });
    expect(within(dialog).getAllByRole("table")).toHaveLength(4);
    expect(within(dialog).getAllByRole("row")).toHaveLength(31 + 4);
    fireEvent.click(screen.getByRole("button", { name: "Close cheat sheet" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Current hand").textContent).toBe(initialCards);
  });

  it("keeps the Tips drawer empty", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Tips/ }));
    expect(screen.getByRole("dialog", { name: "Tips drawer" })).toBeInTheDocument();
    expect(screen.getByLabelText("No tips available")).toHaveTextContent("Tips are not available yet.");
  });

  it("shows incorrect feedback, the correct move, and highlights the corresponding cell", () => {
    render(<App />);
    const playerCards = screen.getAllByRole("img", { name: /Player card/ }).map((element) => parseCard(element.getAttribute("aria-label")!));
    const dealerCard = parseCard(screen.getByRole("img", { name: /Dealer upcard/ }).getAttribute("aria-label")!);
    const correctMove = answerLabel(getDecision([playerCards[0], playerCards[1]], dealerCard).move);
    const wrongMove = ["Hit", "Stand", "Double", "Split", "Surrender"].find((move) => move !== correctMove);
    expect(wrongMove).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: wrongMove! }));
    expect(screen.getByRole("heading", { name: "Incorrect" })).toBeInTheDocument();
    expect(screen.getByText(/Correct move:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open cheat sheet" }));
    expect(screen.getByRole("dialog", { name: "Basic strategy cheat sheet" }).querySelector(".highlight-cell")).toBeInTheDocument();
  });
});

function parseCard(label: string): Card {
  const encoded = label.slice(label.lastIndexOf(" ") + 1);
  return {
    rank: encoded.slice(0, -1) as Rank,
    suit: encoded.slice(-1) as Suit,
  };
}
