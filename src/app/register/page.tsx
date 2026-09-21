import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Register to book appointments and view your records online.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm serverError={error} />
        </CardContent>
      </Card>
    </div>
  );
}
