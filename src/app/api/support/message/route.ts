import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        userId: (session.user as any).id,
        content
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to submit support message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
