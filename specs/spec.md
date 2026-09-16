# SpecKit Functional Specification: MediCash

## 1. Domain Model & Terminology
- **Cash Session:** A cashier's physical drawer register session for a shift, initiated with a counted opening cash amount and terminated with a physical cash count.
- **Cash In:** Inflow of funds into the medical store (e.g., OTC Medicine Sales, Prescription Refills, Doctor Consultation Fees, Vendor Rebates).
- **Cash Out:** Outflow of funds from the medical store drawer (e.g., Medicine Wholesaler Urgent Delivery COD, Store Consumables, Courier/Logistics, Staff Advance, Petty Cash).
- **Payment Modes:** `CASH` (impacts physical register balance), `CARD` (POS terminal), `UPI` (QR code/digital scan), `BANK_TRANSFER` (direct NEFT/IMPS).
- **Category:** Classification tag for incoming and outgoing funds to provide granular P&L / Cash Flow reporting.

---

## 2. User Roles & Capabilities Matrix

| Capability / Action | ADMIN | ACCOUNTANT | CASHIER |
| :--- | :---: | :---: | :---: |
| Open / Close Own Register Session | ✅ | ❌ | ✅ |
| Record Cash In / Cash Out | ✅ | ❌ | ✅ |
| View Active Register Status | ✅ | ✅ | ✅ (Own) |
| View Daily Summary Dashboard | ✅ | ✅ | ✅ (Current shift) |
| Manage Categories (Add / Edit / Toggle) | ✅ | ✅ | ❌ |
| Void a Transaction (with Reason) | ✅ | ✅ | ❌ |
| View Full Audit Trail (Void logs, Created by) | ✅ | ✅ | ❌ |
| Export Reports (CSV / Print Sheet) | ✅ | ✅ | ❌ |

---

## 3. Core User Flows

### Flow 1: Register Shift Lifecycle (Cashier)
1. Cashier logs in (`cashier@medicash.local`).
2. Dashboard detects no active session $\to$ displays "Open Register Session" action.
3. Cashier inputs physical opening drawer cash (e.g., Rs. 5,000.00) and optional shift notes.
4. System updates session state to `OPEN`.
5. Cashier processes sales and payouts throughout shift.
6. At shift end, cashier clicks "Close Session".
7. Cashier enters actual counted physical cash in drawer.
8. System presents real-time reconciliation summary:
   - Opening Balance: Rs. 5,000.00
   - Cash In (Cash Mode): +Rs. 14,250.00
   - Cash Out (Cash Mode): -Rs. 3,100.00
   - Expected Closing: Rs. 16,150.00
   - Actual Counted: Rs. 16,150.00
   - Difference: Rs. 0.00 (Balanced)
9. Session status transitions to `CLOSED`.

### Flow 2: Cash In / Out Transaction Entry
1. Cashier or Admin clicks "New Cash In" or "New Cash Out".
2. Selects Category (filtered by transaction type).
3. Enters Amount (positive numeric, formatted to 2 decimals).
4. Selects Payment Mode: Cash, Card, UPI, or Bank Transfer.
5. Enters Reference Number (optional for cash, recommended for UPI/Card/Bank).
6. Enters Note (e.g., "Batch #4902 Amoxicillin delivery").
7. Saves transaction: Immediate update to Dashboard metrics, session totals, and ledger table.

### Flow 3: Audit Voiding (Admin / Accountant)
1. User with Admin/Accountant role navigates to Transactions ledger.
2. Identifies mistaken or duplicated entry.
3. Clicks "Void" button.
4. Modal prompts for mandatory reason: e.g., "Duplicate entry by cashier on register 2".
5. Submitting updates `isVoided = true`, sets `voidedAt = now()`, `voidedById = currentUserId`.
6. Dashboard, daily summaries, and session totals recalculate instantly excluding the voided record.

---

## 4. API Endpoints Contract

### Auth
- `POST /api/auth/login`: `{ email, password }` $\to$ Set HTTP-only JWT cookie + return user profile.
- `POST /api/auth/logout`: Clear session cookie.
- `GET /api/auth/me`: Return current user profile with role.

### Sessions
- `GET /api/sessions/active`: Return active session for current user or store.
- `POST /api/sessions/open`: `{ openingBalance, notes }` $\to$ Create `OPEN` session.
- `POST /api/sessions/close`: `{ sessionId, actualClosingBalance, notes }` $\to$ Calculate expected balance, record difference, mark `CLOSED`.
- `GET /api/sessions`: List past sessions with cashier name, opening, closing, difference, and duration.

### Transactions
- `GET /api/transactions`: Query params (`type`, `paymentMode`, `categoryId`, `sessionId`, `startDate`, `endDate`, `search`).
- `POST /api/transactions`: `{ type, amount, categoryId, paymentMode, referenceNo, note }`.
- `POST /api/transactions/[id]/void`: `{ voidReason }` $\to$ Mark transaction voided.

### Categories
- `GET /api/categories`: List active and inactive categories grouped by `CASH_IN` and `CASH_OUT`.
- `POST /api/categories`: `{ name, type, description }`.
- `PUT /api/categories/[id]`: `{ name, description, isActive }`.

### Reports
- `GET /api/reports/summary`: Returns opening, cash in breakdown by mode, cash out breakdown by mode, net balance, expected vs actual cash.
- `GET /api/reports/user-wise`: Returns transaction counts, total in, total out, and void counts grouped by cashier/user.
