import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissions } from "@/lib/permissions";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("List categories error:", error);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canManageCategories(sessionUser.role)) {
      return NextResponse.json(
        { error: "Access denied. Only Admin or Accountant can create categories." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, type, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!type || !["CASH_IN", "CASH_OUT"].includes(type)) {
      return NextResponse.json({ error: "Type must be CASH_IN or CASH_OUT" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check for existing category with same name & type
    const existing = await prisma.category.findUnique({
      where: {
        name_type: {
          name: trimmedName,
          type,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A ${type} category named '${trimmedName}' already exists.` },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: trimmedName,
        type,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canManageCategories(sessionUser.role)) {
      return NextResponse.json(
        { error: "Access denied. Only Admin or Accountant can update categories." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error: any) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}
