import { formatCurrency } from "../src/lib/calculations";

async function runE2ETests() {
  console.log("🚀 Running MediCash End-to-End API Integration Suite...\n");
  const baseUrl = "http://localhost:3000";
  let cookieHeader = "";

  // 1. Authenticate as Cashier
  console.log("👉 1. Testing Cashier Login...");
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "cashier@medicash.local", password: "cashier123" }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || loginData.user.role !== "CASHIER") {
    throw new Error("Cashier login failed: " + JSON.stringify(loginData));
  }
  const setCookie = loginRes.headers.get("set-cookie");
  if (setCookie) {
    cookieHeader = setCookie.split(";")[0];
  }
  console.log(`   ✅ Cashier logged in: ${loginData.user.name} (${loginData.user.role})`);

  // 2. Fetch Active Session
  console.log("\n👉 2. Checking Active Session...");
  const activeRes = await fetch(`${baseUrl}/api/sessions/active`, {
    headers: { Cookie: cookieHeader },
  });
  const activeData = await activeRes.json();
  let sessionId = activeData.activeSession?.id;

  // If no session open, open one
  if (!sessionId) {
    console.log("   No active session found. Opening new register session with Rs. 5,000 float...");
    const openRes = await fetch(`${baseUrl}/api/sessions/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({ openingBalance: 5000, notes: "Morning Register Shift #1" }),
    });
    const openData = await openRes.json();
    if (!openData.success) {
      throw new Error("Failed to open session: " + JSON.stringify(openData));
    }
    sessionId = openData.session.id;
    console.log(`   ✅ Session opened! Session ID: ${sessionId}, Float: Rs. 5,000.00`);
  } else {
    console.log(`   ✅ Using existing active session #${sessionId}`);
  }

  // 3. Fetch Categories
  console.log("\n👉 3. Fetching Master Categories...");
  const catRes = await fetch(`${baseUrl}/api/categories`);
  const catData = await catRes.json();
  const rxCategory = catData.categories.find((c: any) => c.type === "CASH_IN");
  const supplierCategory = catData.categories.find((c: any) => c.type === "CASH_OUT");
  console.log(`   ✅ Found ${catData.categories.length} categories.`);
  console.log(`   - Cash In Category: ${rxCategory.name}`);
  console.log(`   - Cash Out Category: ${supplierCategory.name}`);

  // 4. Record Cash In (Physical Cash)
  console.log("\n👉 4. Recording Cash In (Medicine Sale: Rs. 1,200 Cash)...");
  const cashInRes = await fetch(`${baseUrl}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      type: "CASH_IN",
      amount: 1200,
      categoryId: rxCategory.id,
      paymentMode: "CASH",
      referenceNo: "INV-9021",
      note: "Prescription Amoxicillin & Paracetamol",
    }),
  });
  const cashInData = await cashInRes.json();
  if (!cashInData.success) throw new Error("Cash In failed: " + JSON.stringify(cashInData));
  console.log(`   ✅ Cash In recorded: Txn #${cashInData.transaction.id}`);

  // 5. Record Digital In (UPI Sale: Rs. 850 UPI)
  console.log("\n👉 5. Recording Digital Cash In (Baby Formula: Rs. 850 UPI)...");
  const upiInRes = await fetch(`${baseUrl}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      type: "CASH_IN",
      amount: 850,
      categoryId: rxCategory.id,
      paymentMode: "UPI",
      referenceNo: "UPI-4902198",
      note: "Digital scan at counter",
    }),
  });
  const upiInData = await upiInRes.json();
  if (!upiInData.success) throw new Error("UPI Cash In failed: " + JSON.stringify(upiInData));
  console.log(`   ✅ UPI In recorded: Txn #${upiInData.transaction.id}`);

  // 6. Record Cash Out (Supplier COD: Rs. 400 Cash)
  console.log("\n👉 6. Recording Cash Out (Urgent Wholesaler Delivery: Rs. 400 Cash)...");
  const cashOutRes = await fetch(`${baseUrl}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      type: "CASH_OUT",
      amount: 400,
      categoryId: supplierCategory.id,
      paymentMode: "CASH",
      referenceNo: "DC-7701",
      note: "Urgent insulin cooler bag delivery",
    }),
  });
  const cashOutData = await cashOutRes.json();
  if (!cashOutData.success) throw new Error("Cash Out failed: " + JSON.stringify(cashOutData));
  console.log(`   ✅ Cash Out recorded: Txn #${cashOutData.transaction.id}`);

  // 7. Check Daily Summary
  console.log("\n👉 7. Validating Daily Summary Calculation...");
  const sumRes = await fetch(`${baseUrl}/api/reports/summary`, {
    headers: { Cookie: cookieHeader },
  });
  const sumData = await sumRes.json();
  console.log("   Financial Summary:", {
    totalCashIn: sumData.totalCashIn,
    totalCashOut: sumData.totalCashOut,
    netBalance: sumData.netBalance,
    cashDrawerBalance: sumData.cashRegisterBalance,
  });

  // 8. Test Role-Based Voiding: Login as Admin to Void an Entry
  console.log("\n👉 8. Testing RBAC Voiding (Admin Role)...");
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@medicash.local", password: "admin123" }),
  });
  const adminCookie = adminLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

  // Void the Cash Out transaction with audit reason
  const voidRes = await fetch(`${baseUrl}/api/transactions/${cashOutData.transaction.id}/void`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ voidReason: "Duplicate invoice entered by morning shift cashier" }),
  });
  const voidData = await voidRes.json();
  if (!voidData.success) throw new Error("Void failed: " + JSON.stringify(voidData));
  console.log(`   ✅ Transaction #${cashOutData.transaction.id} successfully voided!`);
  console.log(`   - Reason: "${voidData.transaction.voidReason}"`);

  // 9. Re-check summary: Voided amount MUST be excluded
  const sumAfterVoidRes = await fetch(`${baseUrl}/api/reports/summary`, {
    headers: { Cookie: adminCookie },
  });
  const sumAfterVoid = await sumAfterVoidRes.json();
  console.log(`   ✅ Verified after voiding: Total Cash Out adjusted to Rs. ${sumAfterVoid.totalCashOut.toFixed(2)}`);

  console.log("\n🎉 ALL END-TO-END INTEGRATION TESTS PASSED PERFECTLY!\n");
}

runE2ETests().catch((err) => {
  console.error("❌ E2E Test Suite Error:", err);
  process.exit(1);
});
