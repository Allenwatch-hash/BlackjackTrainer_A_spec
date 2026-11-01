import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDecision, answerLabel } from "../game/strategy";
import type { Card, Rank, Suit } from "../game/shoe";
import App from "./App";
import "./strategy-chart.css";

describe("drill interface", () => {
  it("keeps the home link within the hosted app path", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Blackjack Trainer home" })).toHaveAttribute("href", "./");
  });

  it("opens and closes the cheat sheet without replacing the current hand", () => {
    render(<App />);
    const hand = screen.getByLabelText("Current hand");
    const initialCards = hand.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Open cheat sheet" }));
    expect(screen.getByRole("dialog", { name: "Basic strategy cheat sheet" })).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Basic strategy cheat sheet" });
    expect(within(dialog).getAllByRole("table")).toHaveLength(4);
    expect(within(dialog).getAllByRole("row")).toHaveLength(31 + 4);
    expect([...dialog.querySelectorAll(".strategy-block h3")].map((heading) => heading.textContent)).toEqual([
      "Hard totals",
      "Soft totals",
      "Pair splitting",
      "Surrender",
    ]);
    expect(dialog.querySelector(".table-scroll")).not.toBeInTheDocument();
    expect(getComputedStyle(dialog).overflowX).toBe("hidden");
    expect(getComputedStyle(dialog).overflowY).toBe("hidden");
    for (const table of within(dialog).getAllByRole("table")) {
      expect(getComputedStyle(table).width).toBe("100%");
      expect(getComputedStyle(table).minWidth).toBe("0");
      expect(getComputedStyle(table).tableLayout).toBe("fixed");
      expect(within(table).getAllByRole("columnheader")).toHaveLength(11);
    }
    expect(dialog.querySelector(".insurance-note")).toHaveTextContent("INSURANCE / EVEN MONEY DON'T TAKE");
    fireEvent.click(screen.getByRole("button", { name: "Close cheat sheet" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Current hand").textContent).toBe(initialCards);
  });

  it("uses dark grey headers and label cells on all four charts", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open cheat sheet" }));
    const dialog = screen.getByRole("dialog", { name: "Basic strategy cheat sheet" });
    const tables = within(dialog).getAllByRole("table");

    expect(tables).toHaveLength(4);
    for (const table of tables) {
      for (const header of within(table).getAllByRole("columnheader")) {
        expect(getComputedStyle(header).backgroundColor).toBe("rgb(51, 51, 51)");
        expect(getComputedStyle(header).color).toBe("rgb(255, 255, 255)");
      }
      for (const label of within(table).getAllByRole("rowheader")) {
        expect(getComputedStyle(label).backgroundColor).toBe("rgb(51, 51, 51)");
        expect(getComputedStyle(label).color).toBe("rgb(255, 255, 255)");
      }
    }
  });

  it("uses the approved v2 action colors", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open cheat sheet" }));
    const dialog = screen.getByRole("dialog", { name: "Basic strategy cheat sheet" });
    const approvedStyles = [
      ["action-h", "rgb(0, 0, 0)", "rgb(255, 255, 255)"],
      ["action-n", "rgb(0, 0, 0)", "rgb(255, 255, 255)"],
      ["action-s", "rgb(201, 184, 255)", "rgb(0, 0, 0)"],
      ["action-d", "rgb(255, 122, 0)", "rgb(0, 0, 0)"],
      ["action-y", "rgb(255, 122, 0)", "rgb(0, 0, 0)"],
      ["action-sur", "rgb(255, 122, 0)", "rgb(0, 0, 0)"],
      ["action-ds", "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
      ["action-y-n", "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
    ];

    for (const [className, background, color] of approvedStyles) {
      const cell = dialog.querySelector(`td.${className}`);
      expect(cell).not.toBeNull();
      expect(getComputedStyle(cell!).backgroundColor).toBe(background);
      expect(getComputedStyle(cell!).color).toBe(color);
    }
    for (const className of ["action-ds", "action-y-n"]) {
      expect(getComputedStyle(dialog.querySelector(`td.${className}`)!).borderColor).toBe("rgb(255, 122, 0)");
    }
  });

  it("uses the yellow highlight over every chart action color", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open cheat sheet" }));
    const dialog = screen.getByRole("dialog", { name: "Basic strategy cheat sheet" });
    const actionClasses = [
      "action-h",
      "action-s",
      "action-d",
      "action-ds",
      "action-y",
      "action-n",
      "action-y-n",
      "action-sur",
    ];

    for (const actionClass of actionClasses) {
      const cell = dialog.querySelector(`td.${actionClass}`);
      expect(cell).not.toBeNull();
      cell!.classList.add("highlight-cell");
      const styles = getComputedStyle(cell!);
      expect(styles.backgroundColor, actionClass).toBe("rgb(255, 235, 59)");
      expect(styles.color, actionClass).toBe("rgb(0, 0, 0)");
      expect(styles.borderTopWidth, actionClass).toBe("3px");
      expect(styles.borderTopColor, actionClass).toBe("rgb(0, 0, 0)");
    }
  });

  it("keeps the Tips drawer empty", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Tips/ }));
    expect(screen.getByRole("dialog", { name: "Tips drawer" })).toBeInTheDocument();
    expect(screen.getByLabelText("No tips available")).toHaveTextContent("Tips are not available yet.");
  });

  it("shows incorrect feedback, the correct move, and highlights the corresponding cell", () => {
    render(<App />);
    const initialCards = screen.getByLabelText("Current hand").textContent;
    const playerCards = screen.getAllByRole("img", { name: /Player card/ }).map((element) => parseCard(element.getAttribute("aria-label")!));
    const dealerCard = parseCard(screen.getByRole("img", { name: /Dealer upcard/ }).getAttribute("aria-label")!);
    const decision = getDecision([playerCards[0], playerCards[1]], dealerCard);
    const correctMove = answerLabel(decision.move);
    const wrongMove = ["Hit", "Stand", "Double", "Split", "Surrender"].find((move) => move !== correctMove);
    expect(wrongMove).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: wrongMove! }));
    expect(screen.getByRole("heading", { name: "Incorrect" })).toBeInTheDocument();
    expect(screen.getByText(/Correct move:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open cheat sheet" }));
    const dialog = screen.getByRole("dialog", { name: "Basic strategy cheat sheet" });
    const highlighted = dialog.querySelector('[data-highlighted="true"]');
    expect(highlighted).toBeInTheDocument();
    expect(highlighted).toHaveAttribute(
      "aria-label",
      `${{ hard: "Hard totals", soft: "Soft totals", pairs: "Pair splitting", surrender: "Surrender" }[decision.cell.section]} ${decision.cell.row} against ${decision.cell.dealer}: ${decision.cellAction}`,
    );
    expect(highlighted).toHaveClass("highlight-cell");
    fireEvent.click(screen.getByRole("button", { name: "Close cheat sheet" }));
    expect(screen.getByLabelText("Current hand").textContent).toBe(initialCards);
  });
});

function parseCard(label: string): Card {
  const encoded = label.slice(label.lastIndexOf(" ") + 1);
  return {
    rank: encoded.slice(0, -1) as Rank,
    suit: encoded.slice(-1) as Suit,
  };
}
