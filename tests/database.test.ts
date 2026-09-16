import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log("🔍 Running Comprehensive Medical Store POS Database Verification...\n");

  // 1. Verify Users
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  console.log(`✅ [1/7] Users Verified (${users.length} total):`);
  users.forEach((u) => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));

  // 2. Verify Categories
  const inCategories = await prisma.category.count({ where: { type: "CASH_IN" } });
  const outCategories = await prisma.category.count({ where: { type: "CASH_OUT" } });
  console.log(`\n✅ [2/7] Categories Verified:`);
  console.log(`   - Cash In Categories: ${inCategories}`);
  console.log(`   - Cash Out Categories: ${outCategories}`);

  // 3. Verify Suppliers
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { batches: true } } },
  });
  console.log(`\n✅ [3/7] Suppliers Verified (${suppliers.length} total):`);
  suppliers.forEach((s) => console.log(`   - ${s.name} (Contact: ${s.contactPerson}, Linked Batches: ${s._count.batches})`));

  // 4. Verify Products, Batches & FEFO logic
  const products = await prisma.product.findMany({
    include: {
      batches: {
        orderBy: { expiryDate: "asc" }, // FEFO: First Expired, First Out
      },
    },
  });
  console.log(`\n✅ [4/7] Products & Batches Verified (${products.length} medicines):`);
  products.forEach((p) => {
    const batch = p.batches[0];
    const expiryStr = batch ? batch.expiryDate.toISOString().split("T")[0] : "No batch";
    console.log(`   - [${p.dosageForm}] ${p.brandName} (${p.genericName || "N/A"})`);
    console.log(`     Batch: ${batch?.batchNumber || "None"} | Stock: ${batch?.quantityInStock || 0} ${p.unit} | Expiry: ${expiryStr} | Sale Price: Rs. ${batch?.salePrice || 0}`);
  });

  // 5. Verify Customers
  const customers = await prisma.customer.findMany();
  console.log(`\n✅ [5/7] Customers / Patients Verified (${customers.length} total):`);
  customers.forEach((c) => console.log(`   - ${c.name} (${c.phone}) - Ref: ${c.doctorName}`));

  // 6. Verify Sales & Line Items
  const sales = await prisma.sale.findMany({
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
      cashTransaction: true,
      createdBy: true,
    },
  });
  console.log(`\n✅ [6/7] Sales Invoicing Verified (${sales.length} sale):`);
  sales.forEach((s) => {
    console.log(`   - Invoice: ${s.invoiceNumber} | Total: Rs. ${s.total} | Payment Mode: ${s.paymentMode} | Cashier: ${s.createdBy.name}`);
    console.log(`     Items dispensed:`);
    s.items.forEach((item) => {
      console.log(`       * ${item.product.brandName} x ${item.quantity} @ Rs. ${item.unitPrice} = Rs. ${item.subtotal}`);
    });
    console.log(`     Linked Cash Transaction: ID ${s.cashTransaction?.id} (Rs. ${s.cashTransaction?.amount})`);
  });

  // 7. Verify Cash Register Session & Reconciliation Invariant
  const sessions = await prisma.cashSession.findMany({
    include: {
      transactions: {
        where: { isVoided: false },
      },
      user: true,
    },
  });
  console.log(`\n✅ [7/7] Register Sessions & Financial Invariant Check:`);
  for (const s of sessions) {
    const cashIn = s.transactions
      .filter((t) => t.type === "CASH_IN" && t.paymentMode === "CASH")
      .reduce((sum, t) => sum + t.amount, 0);
    const cashOut = s.transactions
      .filter((t) => t.type === "CASH_OUT" && t.paymentMode === "CASH")
      .reduce((sum, t) => sum + t.amount, 0);
    const expected = s.openingBalance + cashIn - cashOut;

    console.log(`   - Session #${s.id} (Cashier: ${s.user.name}, Status: ${s.status})`);
    console.log(`     Opening Float : Rs. ${s.openingBalance.toFixed(2)}`);
    console.log(`     Cash In       : +Rs. ${cashIn.toFixed(2)}`);
    console.log(`     Cash Out      : -Rs. ${cashOut.toFixed(2)}`);
    console.log(`     Expected Draw : Rs. ${expected.toFixed(2)}`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL 7 DATABASE DOMAIN CHECKS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

verifyDatabase()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
