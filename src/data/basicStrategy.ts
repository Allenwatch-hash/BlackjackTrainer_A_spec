export const dealerColumns = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"] as const;

export type DealerColumn = (typeof dealerColumns)[number];
export type ChartAction = "H" | "S" | "D" | "Ds" | "Y" | "N" | "Y/N" | "SUR";
export type ChartSection = "hard" | "soft" | "pairs" | "surrender";
export type ChartCellAction = ChartAction | "-";
export type StrategyRows = Readonly<Record<string, readonly ChartCellAction[]>>;

export const basicStrategy: Readonly<Record<ChartSection, StrategyRows>> = {
  hard: {
    "17": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    "16": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    "15": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    "14": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    "13": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    "12": ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
    "11": ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D"],
    "10": ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
    "9": ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    "8": ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  },
  soft: {
    "A,9": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    "A,8": ["S", "S", "S", "S", "Ds", "S", "S", "S", "S", "S"],
    "A,7": ["Ds", "Ds", "Ds", "Ds", "Ds", "S", "H", "H", "H", "H"],
    "A,6": ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    "A,5": ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
    "A,4": ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
    "A,3": ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
    "A,2": ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  },
  pairs: {
    "A,A": ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
    "T,T": ["N", "N", "N", "N", "N", "N", "N", "N", "N", "N"],
    "9,9": ["Y", "Y", "Y", "Y", "Y", "N", "Y", "Y", "N", "N"],
    "8,8": ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
    "7,7": ["Y", "Y", "Y", "Y", "Y", "Y", "N", "N", "N", "N"],
    "6,6": ["Y/N", "Y", "Y", "Y", "Y", "N", "N", "N", "N", "N"],
    "5,5": ["N", "N", "N", "N", "N", "N", "N", "N", "N", "N"],
    "4,4": ["N", "N", "N", "Y/N", "Y/N", "N", "N", "N", "N", "N"],
    "3,3": ["Y/N", "Y/N", "Y", "Y", "Y", "Y", "N", "N", "N", "N"],
    "2,2": ["Y/N", "Y/N", "Y", "Y", "Y", "Y", "N", "N", "N", "N"],
  },
  surrender: {
    "16": ["-", "-", "-", "-", "-", "-", "-", "SUR", "SUR", "SUR"],
    "15": ["-", "-", "-", "-", "-", "-", "-", "-", "SUR", "-"],
    "14": ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
  },
};

export function getChartCell(
  section: ChartSection,
  row: string,
  dealer: DealerColumn,
): ChartCellAction | undefined {
  const index = dealerColumns.indexOf(dealer);
  return index < 0 ? undefined : basicStrategy[section][row]?.[index];
}
