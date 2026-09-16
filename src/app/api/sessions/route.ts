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
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Cashiers can only view their own sessions unless admin/accountant
    const filterUserId = sessionUser.role === "CASHIER" ? sessionUser.id : (userId || undefined);

    const sessions = await prisma.cashSession.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(filterUserId ? { userId: filterUserId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        transactions: {
          where: { isVoided: false },
          select: {
            amount: true,
            type: true,
            paymentMode: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
      take: 50,
    });

    const formattedSessions = sessions.map((s) => {
      let inSum = 0;
      let outSum = 0;
      for (const t of s.transactions) {
        if (t.type === "CASH_IN") inSum += t.amount;
        if (t.type === "CASH_OUT") outSum += t.amount;
      }

      return {
        id: s.id,
        userId: s.userId,
        userName: s.user.name,
        userEmail: s.user.email,
        openingBalance: s.openingBalance,
        actualClosingBalance: s.actualClosingBalance,
        expectedClosingBalance: s.expectedClosingBalance,
        difference: s.difference,
        status: s.status,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        notes: s.notes,
        totalCashIn: inSum,
        totalCashOut: outSum,
      };
    });

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error: any) {
    console.error("List sessions error:", error);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}
