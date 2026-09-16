# SpecKit Task Breakdown: MediCash

## Phase 1: Environment & Scaffolding
- [x] Create project specification and constitution artifacts (`specs/`).
- [ ] Initialize Next.js project with Tailwind CSS, Lucide icons, and TypeScript.
- [ ] Configure `package.json` scripts, tsconfig, and Tailwind styling.

## Phase 2: Database Schema & Seed Data
- [ ] Configure Prisma schema with `User`, `CashSession`, `Category`, `CashTransaction`.
- [ ] Configure PostgreSQL / SQLite dual-ready datasource.
- [ ] Implement seed script (`prisma/seed.ts`) with Admin, Cashier, Accountant users & medical store categories.
- [ ] Run Prisma generate and initialize database tables.

## Phase 3: Authentication & Core Architecture
- [ ] Implement secure password hashing and JWT cookie utility (`lib/auth.ts`).
- [ ] Implement RBAC permission checks (`lib/permissions.ts`).
- [ ] Implement financial calculation routines (`lib/calculations.ts`).
- [ ] Implement Next.js API route handlers:
  - Auth routes: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
  - Session routes: `/api/sessions/active`, `/api/sessions/open`, `/api/sessions/close`, `/api/sessions`.
  - Transaction routes: `/api/transactions`, `/api/transactions/[id]/void`.
  - Category routes: `/api/categories`.
  - Report routes: `/api/reports/summary`, `/api/reports/user-wise`.

## Phase 4: UI Components & Dashboard
- [ ] Build reusable UI kit: Button, Card, Badge, Modal, Input, Select, Table, StatCard.
- [ ] Build Medical Dashboard Navigation & Layout (Sidebar, Header with Active Session indicator).
- [ ] Build Authentication Page (`/login`) with role demo switch buttons.
- [ ] Build Main Dashboard (`/`): Today's In, Out, Net Balance, Active Session widget, recent ledger.

## Phase 5: Transaction & Session Management
- [ ] Build Cash Transaction Page (`/transactions`) with filters, search, and pagination.
- [ ] Build Add Cash In / Cash Out interactive modals with payment mode selectors.
- [ ] Build Void Modal with mandatory reason and security checks.
- [ ] Build Sessions Page (`/sessions`) with Open/Close workflows and live difference calculator.

## Phase 6: Category Management & Reporting
- [ ] Build Category Management (`/categories`) for Cash In and Cash Out categories.
- [ ] Build Reports Page (`/reports`) with daily cash summary, date-range filtering, and category breakdowns.
- [ ] Build Printable Daily Cash Sheet (`/reports/print`).

## Phase 7: Verification & Test Skill Execution
- [ ] Test reconciliation math (`opening + in - out = expected`).
- [ ] Test transaction void immutability.
- [ ] Test role authorization restrictions (Admin vs Cashier vs Accountant).
- [ ] Produce `walkthrough.md` with visual verification and instructions.
