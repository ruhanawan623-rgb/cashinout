import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMode } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date;

    if (startDateParam) {
      startDate = new Date(startDateParam);
    } else {
      // Default: today from midnight
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch transactions in date range
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: { select: { name: true } },
      },
    });

    // Active session for today
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: "OPEN" },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { openedAt: "desc" },
    });

    let totalCashIn = 0;
    let totalCashOut = 0;
    let voidedCount = 0;

    const modeCashIn: Record<PaymentMode, number> = {
      CASH: 0,
      CARD: 0,
      UPI: 0,
      BANK_TRANSFER: 0,
    };

    const modeCashOut: Record<PaymentMode, number> = {
      CASH: 0,
      CARD: 0,
      UPI: 0,
      BANK_TRANSFER: 0,
    };

    const catInMap: Record<string, number> = {};
    const catOutMap: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.isVoided) {
        voidedCount++;
        continue;
      }

      const amt = tx.amount;
      const mode = tx.paymentMode as PaymentMode;
      const catName = tx.category?.name || "Uncategorized";

      if (tx.type === "CASH_IN") {
        totalCashIn += amt;
        modeCashIn[mode] = (modeCashIn[mode] || 0) + amt;
        catInMap[catName] = (catInMap[catName] || 0) + amt;
      } else if (tx.type === "CASH_OUT") {
        totalCashOut += amt;
        modeCashOut[mode] = (modeCashOut[mode] || 0) + amt;
        catOutMap[catName] = (catOutMap[catName] || 0) + amt;
      }
    }

    const netBalance = totalCashIn - totalCashOut;
    const cashRegisterBalance = (activeSession?.openingBalance || 0) + modeCashIn.CASH - modeCashOut.CASH;

    const categoryBreakdownIn = Object.entries(catInMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    const categoryBreakdownOut = Object.entries(catOutMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    return NextResponse.json({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalCashIn,
      totalCashOut,
      netBalance,
      cashRegisterBalance,
      modeBreakdown: {
        cashIn: modeCashIn,
        cashOut: modeCashOut,
      },
      categoryBreakdown: {
        cashIn: categoryBreakdownIn,
        cashOut: categoryBreakdownOut,
      },
      transactionsCount: transactions.length,
      activeTransactionsCount: transactions.length - voidedCount,
      voidedCount,
      activeSession: activeSession
        ? {
            id: activeSession.id,
            userName: activeSession.user.name,
            openingBalance: activeSession.openingBalance,
            openedAt: activeSession.openedAt,
            notes: activeSession.notes,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Report summary error:", error);
    return NextResponse.json({ error: "Failed to generate summary report" }, { status: 500 });
  }
}
