import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // CASH_IN or CASH_OUT
    const paymentMode = searchParams.get("paymentMode");
    const categoryId = searchParams.get("categoryId");
    const sessionId = searchParams.get("sessionId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const includeVoided = searchParams.get("includeVoided") !== "false"; // default true so ledger shows void status

    const whereClause: any = {};

    if (type) whereClause.type = type;
    if (paymentMode) whereClause.paymentMode = paymentMode;
    if (categoryId) whereClause.categoryId = categoryId;
    if (sessionId) whereClause.sessionId = sessionId;

    if (!includeVoided) {
      whereClause.isVoided = false;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day if single date provided
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (search) {
      whereClause.OR = [
        { referenceNo: { contains: search } },
        { note: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }

    const transactions = await prisma.cashTransaction.findMany({
      where: whereClause,
      include: {
        category: { select: { id: true, name: true, type: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        voidedBy: { select: { id: true, name: true } },
        session: { select: { id: true, status: true, openedAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      sessionId: t.sessionId,
      sessionStatus: t.session?.status,
      type: t.type,
      amount: t.amount,
      categoryId: t.categoryId,
      categoryName: t.category?.name || "Uncategorized",
      paymentMode: t.paymentMode,
      referenceNo: t.referenceNo,
      note: t.note,
      isVoided: t.isVoided,
      voidReason: t.voidReason,
      voidedById: t.voidedById,
      voidedByName: t.voidedBy?.name || null,
      voidedAt: t.voidedAt,
      createdById: t.createdById,
      createdByName: t.createdBy?.name || "Unknown",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({ transactions: formatted });
  } catch (error: any) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, categoryId, paymentMode = "CASH", referenceNo, note } = body;
    const amount = Number(body.amount);

    if (!type || !["CASH_IN", "CASH_OUT"].includes(type)) {
      return NextResponse.json(
        { error: "Valid transaction type (CASH_IN or CASH_OUT) is required" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Valid positive transaction amount is required" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return NextResponse.json(
        { error: "Selected category does not exist or is inactive" },
        { status: 400 }
      );
    }

    // Category type must match transaction type
    if (category.type !== type) {
      return NextResponse.json(
        { error: `Category '${category.name}' is designated for ${category.type}, but transaction is ${type}` },
        { status: 400 }
      );
    }

    // Find active cash session for this cashier or active session in store
    const activeSession = await prisma.cashSession.findFirst({
      where: {
        status: "OPEN",
        ...(sessionUser.role === "CASHIER" ? { userId: sessionUser.id } : {}),
      },
      orderBy: { openedAt: "desc" },
    });

    // If payment mode is CASH, having an open register session is recommended
    // For convenience in testing/admin, if session exists, link it
    const transaction = await prisma.cashTransaction.create({
      data: {
        sessionId: activeSession ? activeSession.id : null,
        type,
        amount,
        categoryId,
        paymentMode,
        referenceNo: referenceNo?.trim() || null,
        note: note?.trim() || null,
        createdById: sessionUser.id,
      },
      include: {
        category: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        categoryName: transaction.category.name,
        createdByName: transaction.createdBy.name,
      },
    });
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
