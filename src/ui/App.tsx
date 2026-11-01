import { useState } from "react";
import { basicStrategy, dealerColumns, type ChartAction, type ChartSection } from "../data/basicStrategy";
import { dealQuestion, type DrillQuestion } from "../game/drill";
import { answerLabel, feedbackReason, type Move } from "../game/strategy";
import { createShoe, type Card, type Shoe } from "../game/shoe";

const moveChoices: Move[] = ["hit", "stand", "double", "split", "surrender"];

interface DrillSession {
  shoe: Shoe;
  question: DrillQuestion;
  score: number;
  streak: number;
  weakSpots: string[];
  answer: Move | null;
}

function createSession(): DrillSession {
  const shoe = createShoe();
  return {
    shoe,
    question: dealQuestion(shoe),
    score: 0,
    streak: 0,
    weakSpots: [],
    answer: null,
  };
}

function formatCard(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function moveText(action: ChartAction | "-"): string {
  if (action === "-") return "—";
  return action;
}

const sectionTitles: Record<ChartSection, string> = {
  hard: "Hard totals",
  soft: "Soft totals",
  pairs: "Pair splitting",
  surrender: "Surrender",
};

function CheatSheet({
  highlighted,
  onClose,
}: {
  highlighted?: DrillQuestion["decision"]["cell"] | null;
  onClose: () => void;
}) {
  const sections: ChartSection[] = ["hard", "soft", "pairs", "surrender"];
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-label="Basic strategy cheat sheet" aria-modal="true" className="sheet-panel" role="dialog">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">REFERENCE</p>
            <h2>Basic strategy</h2>
          </div>
          <button aria-label="Close cheat sheet" className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <p className="sheet-caption">Dealer upcard</p>
        <div className="strategy-tables">
          {sections.map((section) => (
            <div className="strategy-block" key={section}>
              <h3>{sectionTitles[section]}</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Hand</th>
                      {dealerColumns.map((dealer) => <th key={dealer} scope="col">{dealer}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(basicStrategy[section]).map(([row, actions]) => (
                      <tr key={row}>
                        <th scope="row">{row}</th>
                        {actions.map((action, index) => {
                          const isHighlighted = highlighted?.section === section
                            && highlighted.row === row
                            && highlighted.dealer === dealerColumns[index];
                          return (
                            <td className={isHighlighted ? "highlight-cell" : ""} key={`${row}-${index}`}>
                              <span>{moveText(action)}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <p className="keyline"><b>H</b> Hit <b>S</b> Stand <b>D</b> Double or hit <b>Ds</b> Double or stand <b>Y</b> Split <b>N</b> Don’t split <b>Y/N</b> Split only with DAS <b>SUR</b> Surrender</p>
      </section>
    </div>
  );
}

function TipsDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-label="Tips drawer" aria-modal="true" className="tips-panel" role="dialog">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">TRAINING</p>
            <h2>Tips</h2>
          </div>
          <button aria-label="Close tips" className="icon-button" onClick={onClose} type="button">×</button>
        </div>
        <div className="tips-empty" aria-label="No tips available">
          <span className="tips-mark" aria-hidden="true">✦</span>
          <p>Tips are not available yet.</p>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(createSession);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const { question } = session;
  const { decision } = question;

  function answer(move: Move) {
    if (session.answer) return;
    const correct = move === decision.move;
    setSession((current) => ({
      ...current,
      answer: move,
      score: current.score + Number(correct),
      streak: correct ? current.streak + 1 : 0,
      weakSpots: correct ? current.weakSpots : [...current.weakSpots, decision.signature],
    }));
  }

  function nextHand() {
    setSession((current) => {
      const shoe = { ...current.shoe, cards: [...current.shoe.cards] };
      const target = current.weakSpots[0];
      const next = dealQuestion(shoe, Math.random, target);
      const weakSpots = next.isWeakSpotRepeat ? current.weakSpots.slice(1) : current.weakSpots;
      return { ...current, shoe, question: next, weakSpots, answer: null };
    });
  }

  const answeredCorrectly = session.answer === decision.move;
  const chartHighlighted = session.answer && !answeredCorrectly ? decision.cell : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a aria-label="Blackjack Trainer home" className="brand" href="./">
          <span aria-hidden="true" className="brand-mark">B</span>
          <span>BLACKJACK <b>TRAINER</b></span>
        </a>
        <div className="top-actions">
          <button className="text-button" onClick={() => setShowTips(true)} type="button">Tips <span aria-hidden="true">↗</span></button>
        </div>
      </header>

      <div className="content">
        <div className="session-heading">
          <div>
            <p className="eyebrow">BASIC STRATEGY · H17</p>
            <h1>Drill</h1>
          </div>
          <div aria-label="Session score" className="scoreboard">
            <div><span>Correct</span><strong>{session.score}</strong></div>
            <div><span>Streak</span><strong>{session.streak}<i aria-hidden="true">×</i></strong></div>
          </div>
        </div>

        <section aria-label="Current hand" className="table-card">
          <div className="hand-display">
            <div className="hand-group dealer-group">
              <span className="hand-label">DEALER SHOWS</span>
              <div className="cards">
                <div aria-label={`Dealer upcard ${formatCard(question.dealer)}`} className={`playing-card ${question.dealer.suit === "♥" || question.dealer.suit === "♦" ? "red-suit" : ""}`} role="img">
                  <span>{question.dealer.rank}</span><span>{question.dealer.suit}</span>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="table-divider"><span>VS</span></div>
            <div className="hand-group player-group">
              <span className="hand-label">YOUR HAND</span>
              <div className="cards">
                {question.player.map((card, index) => (
                  <div aria-label={`Player card ${formatCard(card)}`} className={`playing-card ${card.suit === "♥" || card.suit === "♦" ? "red-suit" : ""}`} key={`${card.rank}-${card.suit}-${index}`} role="img">
                    <span>{card.rank}</span><span>{card.suit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {question.isWeakSpotRepeat && <p className="repeat-label">WEAK SPOT REPEAT</p>}
        </section>

        <section aria-labelledby="prompt-heading" className="decision-area">
          <div className="prompt-line">
            <div>
              <p className="eyebrow">YOUR MOVE</p>
              <h2 id="prompt-heading">What do you do?</h2>
            </div>
            <span className="turn-indicator"><i aria-hidden="true" /> YOUR TURN</span>
          </div>
          <div className="move-grid">
            {moveChoices.map((move) => (
              <button
                aria-label={answerLabel(move)}
                className={`move-button move-${move}`}
                disabled={Boolean(session.answer)}
                key={move}
                onClick={() => answer(move)}
                type="button"
              >
                {answerLabel(move)}
              </button>
            ))}
          </div>
          {session.answer && (
            <div aria-live="polite" className={`feedback-card ${answeredCorrectly ? "feedback-correct" : "feedback-incorrect"}`}>
              <div className="feedback-icon" aria-hidden="true">{answeredCorrectly ? "✓" : "×"}</div>
              <div className="feedback-copy">
                <h3>{answeredCorrectly ? "Correct" : "Incorrect"}</h3>
                <p><strong>Correct move: {answerLabel(decision.move)}.</strong> {feedbackReason(decision)}</p>
                {!answeredCorrectly && <p className="highlight-hint">The correct cell is highlighted in the cheat sheet.</p>}
              </div>
              <button className="next-button" onClick={nextHand} type="button">Next hand <span aria-hidden="true">→</span></button>
            </div>
          )}
        </section>

        <p className="session-note">One shoe · no saved progress · new run on refresh</p>
      </div>

      <button aria-label="Open cheat sheet" className="cheat-button" onClick={() => setShowCheatSheet(true)} type="button">
        <span aria-hidden="true">▦</span> Cheat sheet
      </button>
      {showCheatSheet && <CheatSheet highlighted={chartHighlighted} onClose={() => setShowCheatSheet(false)} />}
      {showTips && <TipsDrawer onClose={() => setShowTips(false)} />}
    </main>
  );
}
