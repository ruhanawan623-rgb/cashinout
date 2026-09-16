import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";
import { calculateExpectedClosingBalance, calculateSessionDifference } from "@/lib/calculations";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canOperateRegister(sessionUser.role)) {
      return NextResponse.json(
        { error: "Only Admin or Cashier roles can close a cash session" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId } = body;
    const actualClosingBalance = Number(body.actualClosingBalance);
    const closingNotes = body.notes?.trim() || null;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    if (isNaN(actualClosingBalance) || actualClosingBalance < 0) {
      return NextResponse.json(
        { error: "Valid actual counted closing balance is required" },
        { status: 400 }
      );
    }

    const session = await prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: {
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
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "CLOSED") {
      return NextResponse.json({ error: "This session is already closed" }, { status: 400 });
    }

    if (sessionUser.role === "CASHIER" && session.userId !== sessionUser.id) {
      return NextResponse.json(
        { error: "You are not authorized to close another cashier's session" },
        { status: 403 }
      );
    }

    // Mathematical reconciliation: Expected = Opening + Sum(Cash In) - Sum(Cash Out) (CASH only)
    const calculation = calculateExpectedClosingBalance(
      session.openingBalance,
      session.transactions as any
    );

    const diffCalculation = calculateSessionDifference(
      actualClosingBalance,
      calculation.expectedClosing
    );

    const combinedNotes = session.notes
      ? `${session.notes} | Close Note: ${closingNotes || "None"}`
      : closingNotes;

    const closedSession = await prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        actualClosingBalance,
        expectedClosingBalance: calculation.expectedClosing,
        difference: diffCalculation.difference,
        status: "CLOSED",
        closedAt: new Date(),
        notes: combinedNotes,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      session: closedSession,
      reconciliation: {
        openingBalance: session.openingBalance,
        totalCashIn: calculation.totalCashInOnly,
        totalCashOut: calculation.totalCashOutOnly,
        expectedClosingBalance: calculation.expectedClosing,
        actualClosingBalance,
        difference: diffCalculation.difference,
        status: diffCalculation.status,
        formattedStatus: diffCalculation.formattedText,
      },
    });
  } catch (error: any) {
    console.error("Close session error:", error);
    return NextResponse.json({ error: "Failed to close cash session" }, { status: 500 });
  }
}
