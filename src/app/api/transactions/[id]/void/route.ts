import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canVoidTransactions(sessionUser.role)) {
      return NextResponse.json(
        { error: "Access denied. Only Admin or Accountant roles can void transactions." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const voidReason = body.voidReason?.trim();

    if (!voidReason || voidReason.length < 5) {
      return NextResponse.json(
        { error: "A valid void reason of at least 5 characters is required for audit compliance" },
        { status: 400 }
      );
    }

    const existingTx = await prisma.cashTransaction.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!existingTx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existingTx.isVoided) {
      return NextResponse.json(
        { error: "This transaction has already been voided." },
        { status: 400 }
      );
    }

    // Mark as voided with full audit trail
    const voidedTx = await prisma.cashTransaction.update({
      where: { id },
      data: {
        isVoided: true,
        voidReason,
        voidedById: sessionUser.id,
        voidedAt: new Date(),
      },
      include: {
        voidedBy: { select: { name: true, role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      transaction: voidedTx,
      message: `Transaction ${id} successfully voided.`,
    });
  } catch (error: any) {
    console.error("Void transaction error:", error);
    return NextResponse.json({ error: "Failed to void transaction" }, { status: 500 });
  }
}
