import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { pushConfigured, pushToUser } from "@/lib/push";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!pushConfigured) return NextResponse.json({ error: "Push is not configured on the server" }, { status: 503 });
  const r = await pushToUser(user.id, {
    title: "Notifications are on ✅",
    body: `Great, ${user.name.split(" ")[0]}! You'll get a morning plan around 6 AM and reminders when your planned tasks start.`,
    url: "/planner",
    tag: "test",
  });
  return NextResponse.json(r);
}
