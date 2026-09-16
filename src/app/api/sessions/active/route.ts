import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateExpectedClosingBalance } from "@/lib/calculations";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the current active open session
    // For cashiers: own open session; for admin/accountant: any open session or latest active
    const activeSession = await prisma.cashSession.findFirst({
      where: {
        status: "OPEN",
        ...(sessionUser.role === "CASHIER" ? { userId: sessionUser.id } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        transactions: {
          where: { isVoided: false },
          select: {
            amount: true,
            type: true,
            paymentMode: true,
            isVoided: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    if (!activeSession) {
      return NextResponse.json({ activeSession: null });
    }

    // Calculate current live expected drawer balance
    const calculation = calculateExpectedClosingBalance(
      activeSession.openingBalance,
      activeSession.transactions as any
    );

    let totalAllIn = 0;
    let totalAllOut = 0;
    for (const t of activeSession.transactions) {
      if (t.type === "CASH_IN") totalAllIn += t.amount;
      if (t.type === "CASH_OUT") totalAllOut += t.amount;
    }

    return NextResponse.json({
      activeSession: {
        id: activeSession.id,
        userId: activeSession.userId,
        userName: activeSession.user.name,
        openingBalance: activeSession.openingBalance,
        status: activeSession.status,
        openedAt: activeSession.openedAt,
        notes: activeSession.notes,
        totalCashIn: totalAllIn,
        totalCashOut: totalAllOut,
        cashDrawerOnlyIn: calculation.totalCashInOnly,
        cashDrawerOnlyOut: calculation.totalCashOutOnly,
        expectedClosingBalance: calculation.expectedClosing,
      },
    });
  } catch (error: any) {
    console.error("Get active session error:", error);
    return NextResponse.json({ error: "Failed to fetch active session" }, { status: 500 });
  }
}
