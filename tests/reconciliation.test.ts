import {
  calculateExpectedClosingBalance,
  calculateSessionDifference,
  calculateNetBalance,
} from "../src/lib/calculations";
import { PaymentMode, TransactionType } from "../src/types";

console.log("🧪 Running Test Skill: Financial Calculations & Invariants Suite...\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

// Test 1: Opening float + Cash In - Cash Out for CASH only
const testTransactions = [
  { amount: 1500, type: "CASH_IN" as TransactionType, paymentMode: "CASH" as PaymentMode, isVoided: false },
  { amount: 3000, type: "CASH_IN" as TransactionType, paymentMode: "UPI" as PaymentMode, isVoided: false }, // Should not affect drawer cash
  { amount: 500, type: "CASH_OUT" as TransactionType, paymentMode: "CASH" as PaymentMode, isVoided: false },
  { amount: 800, type: "CASH_IN" as TransactionType, paymentMode: "CASH" as PaymentMode, isVoided: true }, // Voided! Should be ignored
  { amount: 200, type: "CASH_OUT" as TransactionType, paymentMode: "BANK_TRANSFER" as PaymentMode, isVoided: false }, // Should not affect drawer cash
];

const openingFloat = 5000;
const expectedResult = calculateExpectedClosingBalance(openingFloat, testTransactions);

// Expected: 5000 (opening) + 1500 (cash in) - 500 (cash out) = 6000
assert(expectedResult.expectedClosing === 6000, "Expected closing drawer balance must be exactly 6000");
assert(expectedResult.totalCashInOnly === 1500, "Cash drawer only cash-in must be 1500 (ignoring UPI & voided)");
assert(expectedResult.totalCashOutOnly === 500, "Cash drawer only cash-out must be 500 (ignoring bank transfer)");

// Test 2: Reconciliation variance - Balanced
const diffBalanced = calculateSessionDifference(6000, 6000);
assert(diffBalanced.status === "BALANCED", "Difference with equal actual and expected must be BALANCED");
assert(diffBalanced.difference === 0, "Balanced difference must be 0");

// Test 3: Reconciliation variance - Shortage (Deficit)
const diffShortage = calculateSessionDifference(5850, 6000);
assert(diffShortage.status === "SHORTAGE", "Actual less than expected must be SHORTAGE");
assert(diffShortage.difference === -150, "Shortage difference must be -150");

// Test 4: Reconciliation variance - Overage (Surplus)
const diffOverage = calculateSessionDifference(6120, 6000);
assert(diffOverage.status === "OVERAGE", "Actual greater than expected must be OVERAGE");
assert(diffOverage.difference === 120, "Overage difference must be +120");

// Test 5: Net revenue calculation
const net = calculateNetBalance(4500, 700);
assert(net === 3800, "Net balance 4500 - 700 must equal 3800");

console.log(`\n========================================`);
console.log(`🏁 Test Skill Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
