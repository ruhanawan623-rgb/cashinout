export type UserRole = "ADMIN" | "CASHIER" | "ACCOUNTANT";

export type SessionStatus = "OPEN" | "CLOSED";

export type TransactionType = "CASH_IN" | "CASH_OUT";

export type PaymentMode = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER";

export interface UserSessionPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CashSessionDTO {
  id: string;
  userId: string;
  userName?: string;
  openingBalance: number;
  actualClosingBalance?: number | null;
  expectedClosingBalance?: number | null;
  difference?: number | null;
  status: SessionStatus;
  openedAt: string;
  closedAt?: string | null;
  notes?: string | null;
  totalCashIn?: number;
  totalCashOut?: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  type: TransactionType;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CashTransactionDTO {
  id: string;
  sessionId?: string | null;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName?: string;
  paymentMode: PaymentMode;
  referenceNo?: string | null;
  note?: string | null;
  isVoided: boolean;
  voidReason?: string | null;
  voidedById?: string | null;
  voidedByName?: string | null;
  voidedAt?: string | null;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailySummaryReport {
  date: string;
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  cashRegisterBalance: number;
  modeBreakdown: {
    cashIn: Record<PaymentMode, number>;
    cashOut: Record<PaymentMode, number>;
  };
  categoryBreakdown: {
    cashIn: { category: string; amount: number }[];
    cashOut: { category: string; amount: number }[];
  };
  activeSession: CashSessionDTO | null;
  transactionsCount: number;
  activeTransactionsCount?: number;
  voidedCount: number;
}
