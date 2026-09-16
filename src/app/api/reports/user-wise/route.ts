import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canViewReports(sessionUser.role)) {
      return NextResponse.json(
        { error: "Access denied. Only Admin and Accountant can view user reports." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDateParam) dateFilter.gte = new Date(startDateParam);
    if (endDateParam) {
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        transactions: {
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          select: {
            amount: true,
            type: true,
            paymentMode: true,
            isVoided: true,
          },
        },
        sessions: {
          select: {
            id: true,
            status: true,
            difference: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const report = users.map((u) => {
      let totalIn = 0;
      let totalOut = 0;
      let voided = 0;

      for (const t of u.transactions) {
        if (t.isVoided) {
          voided++;
          continue;
        }
        if (t.type === "CASH_IN") totalIn += t.amount;
        if (t.type === "CASH_OUT") totalOut += t.amount;
      }

      return {
        userId: u.id,
        userName: u.name,
        email: u.email,
        role: u.role,
        totalTransactions: u.transactions.length,
        activeTransactions: u.transactions.length - voided,
        totalCashIn: totalIn,
        totalCashOut: totalOut,
        netContribution: totalIn - totalOut,
        voidedCount: voided,
        sessionsOperated: u.sessions.length,
      };
    });

    return NextResponse.json({ userReport: report });
  } catch (error: any) {
    console.error("User-wise report error:", error);
    return NextResponse.json({ error: "Failed to generate user report" }, { status: 500 });
  }
}
