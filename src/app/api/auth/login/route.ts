import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken, getSessionCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or account is inactive" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "CASHIER" | "ACCOUNTANT",
    };

    const token = generateToken(payload);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      user: payload,
    });

    response.cookies.set(cookieOpts.name, token, cookieOpts);
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
