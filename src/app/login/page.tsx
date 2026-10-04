import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/AuthForms";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <AuthLayout title="Welcome back 👋" subtitle="Log in to continue your preparation streak.">
      <LoginForm />
    </AuthLayout>
  );
}
