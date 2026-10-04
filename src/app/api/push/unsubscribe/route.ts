import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (body?.endpoint) await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint: body.endpoint } });
  return NextResponse.json({ ok: true });
}
