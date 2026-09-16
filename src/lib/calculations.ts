import { PaymentMode, TransactionType } from "@/types";

export interface TransactionSummaryInput {
  amount: number | string;
  type: TransactionType;
  paymentMode: PaymentMode;
  isVoided: boolean;
}

/**
 * Calculates net balance: Total Active Cash In - Total Active Cash Out
 */
export function calculateNetBalance(
  totalCashIn: number,
  totalCashOut: number
): number {
  return Number((totalCashIn - totalCashOut).toFixed(2));
}

/**
 * Calculates expected closing balance for physical drawer session:
 * Expected = Opening Balance + Sum(Cash In where mode = CASH) - Sum(Cash Out where mode = CASH)
 */
export function calculateExpectedClosingBalance(
  openingBalance: number,
  transactions: TransactionSummaryInput[]
): {
  totalCashInOnly: number;
  totalCashOutOnly: number;
  expectedClosing: number;
} {
  let totalCashInOnly = 0;
  let totalCashOutOnly = 0;

  for (const t of transactions) {
    if (t.isVoided) continue;
    if (t.paymentMode !== "CASH") continue;

    const amt = Number(t.amount) || 0;
    if (t.type === "CASH_IN") {
      totalCashInOnly += amt;
    } else if (t.type === "CASH_OUT") {
      totalCashOutOnly += amt;
    }
  }

  const expectedClosing = openingBalance + totalCashInOnly - totalCashOutOnly;

  return {
    totalCashInOnly: Number(totalCashInOnly.toFixed(2)),
    totalCashOutOnly: Number(totalCashOutOnly.toFixed(2)),
    expectedClosing: Number(expectedClosing.toFixed(2)),
  };
}

/**
 * Calculates register reconciliation variance:
 * Variance = Actual Counted Balance - Expected Balance
 * If variance > 0: Overage (Surplus)
 * If variance < 0: Shortage (Deficit)
 * If variance == 0: Exact Match (Balanced)
 */
export function calculateSessionDifference(
  actualClosing: number,
  expectedClosing: number
): {
  difference: number;
  status: "BALANCED" | "OVERAGE" | "SHORTAGE";
  formattedText: string;
} {
  const diff = Number((actualClosing - expectedClosing).toFixed(2));

  if (Math.abs(diff) < 0.001) {
    return {
      difference: 0,
      status: "BALANCED",
      formattedText: "Balanced (Exact Match)",
    };
  }

  if (diff > 0) {
    return {
      difference: diff,
      status: "OVERAGE",
      formattedText: `Overage of +${diff.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`,
    };
  }

  return {
    difference: diff,
    status: "SHORTAGE",
    formattedText: `Shortage of -${Math.abs(diff).toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`,
  };
}

/**
 * Formats a currency amount into a clean, locale-aware string (default: Rs. / INR style or standard)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rs. 0.00";
  return `Rs. ${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
