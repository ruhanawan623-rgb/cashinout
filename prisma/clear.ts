import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearData() {
  console.log("🧹 Starting database cleanup: Clearing all dummy transactions, sales, and dummy records...\n");

  // 1. Delete dependent transactional records
  const deletedSaleItems = await prisma.saleItem.deleteMany({});
  console.log(`🗑️  Deleted ${deletedSaleItems.count} Sale Items`);

  const deletedCashTransactions = await prisma.cashTransaction.deleteMany({});
  console.log(`🗑️  Deleted ${deletedCashTransactions.count} Cash Transactions`);

  const deletedSales = await prisma.sale.deleteMany({});
  console.log(`🗑️  Deleted ${deletedSales.count} Sales`);

  const deletedSessions = await prisma.cashSession.deleteMany({});
  console.log(`🗑️  Deleted ${deletedSessions.count} Cash Register Sessions`);

  // 2. Delete inventory & entity dummy data
  const deletedBatches = await prisma.batch.deleteMany({});
  console.log(`🗑️  Deleted ${deletedBatches.count} Product Batches`);

  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`🗑️  Deleted ${deletedProducts.count} Products / Medicines`);

  const deletedSuppliers = await prisma.supplier.deleteMany({});
  console.log(`🗑️  Deleted ${deletedSuppliers.count} Suppliers`);

  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`🗑️  Deleted ${deletedCustomers.count} Customers / Patients`);

  console.log("\n✅ Operational data cleared!");
  console.log("🔒 Preserved clean system users & standard cash categories so login and register remain functional.");

  // Check remaining counts
  const userCount = await prisma.user.count();
  const categoryCount = await prisma.category.count();
  const txCount = await prisma.cashTransaction.count();
  const sessionCount = await prisma.cashSession.count();

  console.log("\n📊 Current Database State:");
  console.log(`   - Users: ${userCount} (Admin, Cashier, Accountant available for login)`);
  console.log(`   - Categories: ${categoryCount} (Ready for transactions)`);
  console.log(`   - Sessions: ${sessionCount} (Clean slate — Cashier can open a fresh shift)`);
  console.log(`   - Cash Transactions: ${txCount} (Pristine zero-balance ledger)`);
  console.log("\n✨ Database is now fresh, clean, and ready for real store operations!");
}

clearData()
  .catch((e) => {
    console.error("❌ Error clearing data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
