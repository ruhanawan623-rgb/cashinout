import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting complete database seeding for MediCash Medical Store POS...");

  // -------------------------------------------------------------
  // STEP 1: Users & RBAC Credentials
  // -------------------------------------------------------------
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("admin123", salt);
  const cashierPassword = await bcrypt.hash("cashier123", salt);
  const accountantPassword = await bcrypt.hash("accountant123", salt);

  const admin = await prisma.user.upsert({
    where: { email: "admin@medicash.local" },
    update: {},
    create: {
      email: "admin@medicash.local",
      name: "Dr. Farhan (Store Owner & Admin)",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@medicash.local" },
    update: {},
    create: {
      email: "cashier@medicash.local",
      name: "Bilal Ahmad (Counter Cashier)",
      passwordHash: cashierPassword,
      role: "CASHIER",
      isActive: true,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: "accountant@medicash.local" },
    update: {},
    create: {
      email: "accountant@medicash.local",
      name: "Sarah Khan (Lead Accountant)",
      passwordHash: accountantPassword,
      role: "ACCOUNTANT",
      isActive: true,
    },
  });

  console.log("✅ Step 1: Users seeded:", [admin.email, cashier.email, accountant.email]);

  // -------------------------------------------------------------
  // STEP 2: Cash Flow Categories
  // -------------------------------------------------------------
  const defaultCategories = [
    // CASH IN
    { name: "Prescription Medicines", type: "CASH_IN", description: "Doctor prescribed pharmaceutical dispensing" },
    { name: "OTC Products & First-Aid", type: "CASH_IN", description: "Over-the-counter pain relievers, vitamins, bandages" },
    { name: "Medical Equipment & Devices", type: "CASH_IN", description: "BP monitors, glucometer strips, thermometers" },
    { name: "Baby Care & Nutrition", type: "CASH_IN", description: "Infant milk formula, diapers, pediatrics supplements" },
    { name: "Doctor Consultation Fee", type: "CASH_IN", description: "In-store clinic doctor examination fee collection" },
    { name: "Supplier Rebate / Return Refund", type: "CASH_IN", description: "Refunds or cash discounts received from wholesalers" },
    // CASH OUT
    { name: "Medicine Wholesaler Delivery (COD)", type: "CASH_OUT", description: "Urgent cash payment to pharmaceutical distributors" },
    { name: "Store Packaging & Consumables", type: "CASH_OUT", description: "Medicine bags, thermal receipt rolls, gloves" },
    { name: "Power & Generator Fuel (Cold Chain)", type: "CASH_OUT", description: "Electricity bill & diesel fuel for vaccine refrigerator" },
    { name: "Staff Advance & Daily Allowance", type: "CASH_OUT", description: "Short-term staff salary advance or daily counter allowances" },
    { name: "Emergency Logistics / Courier", type: "CASH_OUT", description: "Urgent hospital courier and rider dispatch fees" },
    { name: "Petty Cash & Cleaning", type: "CASH_OUT", description: "Store sanitation, drinking water cans, tea, minor maintenance" },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name_type: { name: cat.name, type: cat.type } },
      update: {},
      create: {
        name: cat.name,
        type: cat.type,
        description: cat.description,
        isActive: true,
      },
    });
  }
  console.log(`✅ Step 2: Seeded ${defaultCategories.length} Cash Flow Categories.`);

  // -------------------------------------------------------------
  // STEP 3: Pharmaceutical Suppliers / Wholesalers
  // -------------------------------------------------------------
  const suppliersData = [
    { name: "Getz Pharma Distribution", contactPerson: "Naveed Qureshi", phone: "+92 300 5551122", email: "dist@getz.com", address: "Plot 24, Industrial Area, Karachi" },
    { name: "GSK Healthcare Supplies", contactPerson: "Imran Tariq", phone: "+92 321 8882233", email: "orders@gsk.local", address: "Warehouse 7, Logistics Hub, Lahore" },
    { name: "Searle Pharmaceuticals", contactPerson: "Kamran Ali", phone: "+92 333 4443355", email: "sales@searle.local", address: "Pharma Depot, Rawalpindi" },
    { name: "Abbott Laboratories Supplies", contactPerson: "Zubair Shah", phone: "+92 312 9994466", email: "dist@abbott.local", address: "Federal B Area, Karachi" },
  ];

  const suppliers: Record<string, string> = {};
  for (const s of suppliersData) {
    const created = await prisma.supplier.upsert({
      where: { id: s.name.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: {},
      create: {
        id: s.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: s.name,
        contactPerson: s.contactPerson,
        phone: s.phone,
        email: s.email,
        address: s.address,
      },
    });
    suppliers[s.name] = created.id;
  }
  console.log(`✅ Step 3: Seeded ${suppliersData.length} Suppliers.`);

  // -------------------------------------------------------------
  // STEP 4: Medical Products & Formulations
  // -------------------------------------------------------------
  const productsData = [
    {
      brandName: "Augmentin 625mg",
      genericName: "Amoxicillin + Clavulanic Acid",
      dosageForm: "TABLET",
      strength: "625mg",
      manufacturer: "GSK Healthcare Supplies",
      sku: "SKU-AUG-625",
      barcode: "89640001001",
      unit: "Strip",
      minStockLevel: 15,
      requiresPrescription: true,
      batchNumber: "B-2026-AUG01",
      expiryDate: new Date("2027-11-30"),
      purchasePrice: 280.0,
      salePrice: 350.0,
      initialStock: 80,
    },
    {
      brandName: "Panadol Extra 500mg",
      genericName: "Paracetamol + Caffeine",
      dosageForm: "TABLET",
      strength: "500mg/65mg",
      manufacturer: "GSK Healthcare Supplies",
      sku: "SKU-PAN-EXT",
      barcode: "89640001002",
      unit: "Strip",
      minStockLevel: 50,
      requiresPrescription: false,
      batchNumber: "B-2026-PAN02",
      expiryDate: new Date("2028-06-30"),
      purchasePrice: 35.0,
      salePrice: 50.0,
      initialStock: 300,
    },
    {
      brandName: "Brufen 400mg",
      genericName: "Ibuprofen",
      dosageForm: "TABLET",
      strength: "400mg",
      manufacturer: "Abbott Laboratories Supplies",
      sku: "SKU-BRU-400",
      barcode: "89640001003",
      unit: "Strip",
      minStockLevel: 30,
      requiresPrescription: false,
      batchNumber: "B-2026-BRU03",
      expiryDate: new Date("2027-08-15"),
      purchasePrice: 42.0,
      salePrice: 60.0,
      initialStock: 150,
    },
    {
      brandName: "Risek 40mg",
      genericName: "Omeprazole",
      dosageForm: "CAPSULE",
      strength: "40mg",
      manufacturer: "Getz Pharma Distribution",
      sku: "SKU-RIS-040",
      barcode: "89640001004",
      unit: "Box",
      minStockLevel: 10,
      requiresPrescription: true,
      batchNumber: "B-2026-RIS04",
      expiryDate: new Date("2027-10-31"),
      purchasePrice: 480.0,
      salePrice: 620.0,
      initialStock: 45,
    },
    {
      brandName: "Ventolin Inhaler 100mcg",
      genericName: "Salbutamol",
      dosageForm: "MEDICAL_DEVICE",
      strength: "100mcg/dose",
      manufacturer: "GSK Healthcare Supplies",
      sku: "SKU-VEN-INH",
      barcode: "89640001005",
      unit: "Piece",
      minStockLevel: 8,
      requiresPrescription: true,
      batchNumber: "B-2026-VEN05",
      expiryDate: new Date("2027-05-31"),
      purchasePrice: 320.0,
      salePrice: 420.0,
      initialStock: 25,
    },
    {
      brandName: "Hydryllin Cough Syrup 120ml",
      genericName: "Aminophylline + Diphenhydramine",
      dosageForm: "SYRUP",
      strength: "120ml",
      manufacturer: "Searle Pharmaceuticals",
      sku: "SKU-HYD-SYR",
      barcode: "89640001006",
      unit: "Bottle",
      minStockLevel: 20,
      requiresPrescription: false,
      batchNumber: "B-2026-HYD06",
      expiryDate: new Date("2027-04-30"),
      purchasePrice: 110.0,
      salePrice: 145.0,
      initialStock: 60,
    },
    {
      brandName: "Accu-Chek Active Test Strips 50s",
      genericName: "Blood Glucose Test Strips",
      dosageForm: "MEDICAL_DEVICE",
      strength: "50 Strips",
      manufacturer: "Abbott Laboratories Supplies",
      sku: "SKU-ACC-STR",
      barcode: "89640001007",
      unit: "Box",
      minStockLevel: 5,
      requiresPrescription: false,
      batchNumber: "B-2026-ACC07",
      expiryDate: new Date("2026-12-31"),
      purchasePrice: 1850.0,
      salePrice: 2250.0,
      initialStock: 15,
    },
  ];

  const seededProducts: Record<string, { product: any; batch: any }> = {};

  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        brandName: item.brandName,
        genericName: item.genericName,
        dosageForm: item.dosageForm,
        strength: item.strength,
        manufacturer: item.manufacturer,
        sku: item.sku,
        barcode: item.barcode,
        unit: item.unit,
        minStockLevel: item.minStockLevel,
        requiresPrescription: item.requiresPrescription,
        isActive: true,
      },
    });

    const batch = await prisma.batch.upsert({
      where: {
        productId_batchNumber: {
          productId: product.id,
          batchNumber: item.batchNumber,
        },
      },
      update: {},
      create: {
        productId: product.id,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        quantityInStock: item.initialStock,
        supplierId: suppliers[item.manufacturer] || null,
      },
    });

    seededProducts[item.brandName] = { product, batch };
  }
  console.log(`✅ Step 4: Seeded ${productsData.length} Products & Batches with Expiry Dates.`);

  // -------------------------------------------------------------
  // STEP 5: Customer / Patient Records
  // -------------------------------------------------------------
  const customersData = [
    { name: "Muhammad Tariq", phone: "+92 300 1234567", doctorName: "Dr. Aslam (Cardiologist)", address: "House 12, Street 4, F-8, Islamabad" },
    { name: "Ayesha Malik", phone: "+92 321 7654321", doctorName: "Dr. Farhan (General Physician)", address: "Flat 401, Gulberg Greens, Lahore" },
  ];

  const customers: any[] = [];
  for (const c of customersData) {
    const cust = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: c,
    });
    customers.push(cust);
  }
  console.log(`✅ Step 5: Seeded ${customers.length} Customers.`);

  // -------------------------------------------------------------
  // STEP 6: Active Register Session & Integrated POS Sale
  // -------------------------------------------------------------
  // Find or create active cash session for cashier
  let activeSession = await prisma.cashSession.findFirst({
    where: { userId: cashier.id, status: "OPEN" },
  });

  if (!activeSession) {
    activeSession = await prisma.cashSession.create({
      data: {
        userId: cashier.id,
        openingBalance: 5000.0,
        status: "OPEN",
        notes: "Morning Shift (Counter 1)",
      },
    });
  }

  // Check if a sample sale already exists
  const existingSale = await prisma.sale.findFirst({
    where: { invoiceNumber: "INV-2026-0001" },
  });

  if (!existingSale && seededProducts["Augmentin 625mg"] && seededProducts["Panadol Extra 500mg"]) {
    const aug = seededProducts["Augmentin 625mg"];
    const pan = seededProducts["Panadol Extra 500mg"];

    // Sale items: 1 Augmentin (350) + 2 Panadol (50 * 2 = 100) = 450
    const subtotal = 450.0;
    const discount = 20.0;
    const total = 430.0;

    const rxCategory = await prisma.category.findFirst({
      where: { name: "Prescription Medicines", type: "CASH_IN" },
    });

    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: "INV-2026-0001",
        sessionId: activeSession.id,
        customerId: customers[0]?.id,
        subtotal,
        discount,
        tax: 0,
        total,
        paymentMode: "CASH",
        status: "COMPLETED",
        createdById: cashier.id,
        items: {
          create: [
            {
              productId: aug.product.id,
              batchId: aug.batch.id,
              quantity: 1,
              unitPrice: 350.0,
              subtotal: 350.0,
            },
            {
              productId: pan.product.id,
              batchId: pan.batch.id,
              quantity: 2,
              unitPrice: 50.0,
              subtotal: 100.0,
            },
          ],
        },
        // Automatic integrated cash transaction into register
        cashTransaction: {
          create: {
            sessionId: activeSession.id,
            type: "CASH_IN",
            amount: total,
            categoryId: rxCategory?.id || (await prisma.category.findFirstOrThrow()).id,
            paymentMode: "CASH",
            referenceNo: "INV-2026-0001",
            note: "Counter Sale #0001 (Augmentin + Panadol)",
            createdById: cashier.id,
          },
        },
      },
    });

    // Also record a sample Cash Out (packaging rolls)
    const packagingCat = await prisma.category.findFirst({
      where: { name: "Store Packaging & Consumables", type: "CASH_OUT" },
    });

    if (packagingCat) {
      await prisma.cashTransaction.create({
        data: {
          sessionId: activeSession.id,
          type: "CASH_OUT",
          amount: 350.0,
          categoryId: packagingCat.id,
          paymentMode: "CASH",
          referenceNo: "PKG-772",
          note: "Thermal printer receipt rolls (5 rolls)",
          createdById: cashier.id,
        },
      });
    }

    console.log(`✅ Step 6: Created sample Sale (${sale.invoiceNumber}) & connected to Cash Ledger!`);
  }

  console.log("\n🎉 Database setup and seeding completed with 100% relational integrity!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
