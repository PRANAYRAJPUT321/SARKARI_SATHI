"use server";

import { redirect } from "next/navigation";
import { adminLoginBlocked, adminPasswordMatches, endAdminSession, startAdminSession } from "@/lib/admin";

export async function adminLoginAction(formData: FormData) {
  const guard = await adminLoginBlocked();
  if (guard.blocked) redirect("/admin?e=wait");
  if (!adminPasswordMatches(String(formData.get("password") ?? ""))) {
    guard.fail();
    redirect("/admin?e=wrong");
  }
  await startAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin");
}
