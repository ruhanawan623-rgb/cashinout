import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canOperateRegister(sessionUser.role)) {
      return NextResponse.json(
        { error: "Only Admin or Cashier roles can open a cash session" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const openingBalance = Number(body.openingBalance);
    const notes = body.notes?.trim() || null;

    if (isNaN(openingBalance) || openingBalance < 0) {
      return NextResponse.json(
        { error: "Valid opening balance is required (cannot be negative)" },
        { status: 400 }
      );
    }

    // Check if user already has an open session
    const existingOpenSession = await prisma.cashSession.findFirst({
      where: {
        userId: sessionUser.id,
        status: "OPEN",
      },
    });

    if (existingOpenSession) {
      return NextResponse.json(
        { error: "You already have an active open session. Please close it first." },
        { status: 400 }
      );
    }

    const newSession = await prisma.cashSession.create({
      data: {
        userId: sessionUser.id,
        openingBalance,
        status: "OPEN",
        notes,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      session: newSession,
    });
  } catch (error: any) {
    console.error("Open session error:", error);
    return NextResponse.json({ error: "Failed to open cash session" }, { status: 500 });
  }
}
