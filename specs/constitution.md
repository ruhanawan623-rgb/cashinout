# SpecKit Constitution: MediCash Management Platform

## Principle 1: Ledger Immutability & Audit Trail
- **No Hard Deletes:** Financial transactions in `cash_transactions` can NEVER be permanently deleted from the database.
- **Voiding Protocol:** A transaction can only be marked as voided (`is_voided = true`). Voiding requires:
  - `void_reason` (string, minimum 5 characters, mandatory)
  - `voided_by_id` (foreign key to the user who authorized the void)
  - `voided_at` (timestamp of voiding)
- **Reporting Exclusion:** All financial balance calculations, expected register balances, and daily summaries must strictly exclude transactions where `is_voided = true`.

## Principle 2: Cash Session Integrity & Mathematical Invariants
- **One Active Session Per Cashier:** A cashier user may only operate one `OPEN` cash session at any given time.
- **Session Linking:** Any `CASH` transaction must be linked to an active `cash_session`. Non-cash transactions (`CARD`, `UPI`, `BANK_TRANSFER`) can optionally associate with the shift or the store day.
- **Cash Reconciliation Invariant:**
  $$\text{Expected Closing Balance} = \text{Opening Balance} + \sum \text{Cash In (PaymentMode = CASH)} - \sum \text{Cash Out (PaymentMode = CASH)}$$
  $$\text{Discrepancy / Variance} = \text{Actual Counted Balance} - \text{Expected Closing Balance}$$
  - $\text{Variance} > 0 \implies \text{Overage (Surplus)}$
  - $\text{Variance} < 0 \implies \text{Shortage (Deficit)}$
  - $\text{Variance} = 0 \implies \text{Balanced Draw}$

## Principle 3: Role-Based Access Control (RBAC)
- **ADMIN:** Unrestricted operational and administrative authority. Can manage users, categories, view all sessions, void transactions, and export all reports.
- **ACCOUNTANT:** Read and audit authority. Full access to daily summaries, reports, category tracking, and ledger audits. Can void transactions with audit log. Cannot perform drawer open/close unless assigned a cashier shift.
- **CASHIER:** Front-of-store register authority. Can open/close own session, record Cash In and Cash Out. Cannot void transactions without manager approval. Cannot edit system categories or view other cashiers' private audit logs.

## Principle 4: User Experience & Design Standard
- **Clarity over Complexity:** Fast numeric entry, keyboard-friendly input flow, unambiguous color indicators (Emerald green for Inflow, Crimson red for Outflow, Amber for Warnings/Discrepancies).
- **Zero Ambiguity:** Every balance difference is explicitly flagged as "Exact Match", "Shortage (Rs. X)", or "Overage (Rs. X)".
