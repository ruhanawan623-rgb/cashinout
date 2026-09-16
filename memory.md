# Project Memory: MediCash — Medical Store Cash Management

> **Project Name:** MediCash  
> **Repository / Corpus:** `ruhanawan623-rgb/spicybite`  
> **Workspace Path:** `c:\whaj 2\project`  
> **Created:** 2026-09-07  
> **Status:** Production-Ready & Verified  

---

## 1. Operating Framework & Methodology

### A. Spec Kit (Spec-Driven Development)
1. **Constitution (`specs/constitution.md`):** Immutable financial records, mandatory void reasons, 1 active session per cashier, closing math invariants.
2. **Specify (`specs/spec.md`):** Complete user journeys, RBAC matrix (Admin, Cashier, Accountant), API contracts.
3. **Plan (`implementation_plan.md`):** Approved technical architecture and data flow.
4. **Tasks (`specs/tasks.md`):** Granular, trackable task breakdown.

### B. GStack Sprint Methodology (Multi-Role Engineering)
- 👑 **CEO / Product:** Verified seamless shift handover, zero reconciliation disputes, quick 1-click test logins.
- 🎨 **Lead Designer:** Clean enterprise SaaS aesthetic, aligned matching font colors across stat cards (emerald for Cash In, rose for Cash Out, emerald for Net Surplus & Drawer Cash) and payment mode indicators.
- 🏛️ **System Architect:** Next.js 14 App Router, route handlers, Prisma ORM with connection pooling, and dual SQLite/PostgreSQL compatibility.
- 💻 **Senior Engineer:** Clean modular architecture, reusable UI kit (`Button`, `Card`, `Badge`, `Modal`, `Input`, `Select`), strongly-typed DTOs.
- 🧪 **QA / Test Lead (Test Skill):** Automated financial invariant tests in `tests/reconciliation.test.ts`.
- 🛡️ **Security Auditor:** Soft-void with user attribution, Bcrypt password hashing, HTTP-only JWT cookies, RBAC route protection.

---

## 2. Implemented Features
- **Authentication & RBAC:**
  - Roles: `ADMIN`, `CASHIER`, `ACCOUNTANT`.
  - 1-Click demo login switcher on `/login` page.
- **Dashboard (`/`):**
  - Today's Cash In, Cash Out, Net Balance, and Physical Drawer Cash.
  - Active session banner with live calculated expected drawer cash.
  - Quick "+ Cash In" and "- Cash Out" modals with dynamic category filtering and payment mode toggles.
  - Recent transactions table with Void action.
- **Register Sessions (`/sessions`):**
  - Open session with opening float.
  - Close session with physical cash count.
  - Real-time expected balance computation and variance indicator (Balanced, Shortage, Overage).
- **Cash In / Out Ledger (`/transactions`):**
  - Search by reference #, note, or category.
  - Filters by Type, Mode, Category, Date range.
  - CSV Export function.
  - Void transaction modal with mandatory reason.
- **Category Master (`/categories`):**
  - Separate management for Cash In and Cash Out categories.
  - Enable/Disable toggles.
- **Financial Reports & Analytics (`/reports`):**
  - Date-range filtering.
  - Payment mode breakdown.
  - Category-wise analysis with visual progress bars.
  - Staff / Cashier activity audit.
- **Printable Daily Cash Sheet (`/reports/print`):**
  - Official print-optimized daily settlement sheet with cashier and manager signature blocks.

---

## 3. Default Seed Credentials
- **Admin:** `admin@medicash.local` / `admin123`
- **Cashier:** `cashier@medicash.local` / `cashier123`
- **Accountant:** `accountant@medicash.local` / `accountant123`
