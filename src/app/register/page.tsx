import { redirect } from "next/navigation";
import { EXAMS } from "@/data/exams";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/AuthForms";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <AuthLayout title="Create your free account" subtitle="Tell us your goal – we'll build your preparation dashboard around it.">
      <RegisterForm exams={EXAMS.map((e) => ({ slug: e.slug, short: e.short, category: e.category }))} />
    </AuthLayout>
  );
}
