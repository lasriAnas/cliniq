import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findPatientRecord, createPortalAccount } from "./actions";

export default async function PortalRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; patientId?: string; name?: string }>;
}) {
  const { error, patientId, name } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <h1 className="text-xl font-semibold">Create a portal account</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll match your details to your clinic record.
          </p>
        </div>

        {!patientId ? (
          <Card>
            <CardHeader>
              <CardTitle>Find your record</CardTitle>
              <CardDescription>Enter your name and date of birth exactly as given at the clinic.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={findPatientRecord} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" required autoComplete="name" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" name="dob" type="date" required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  Find my record
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Set up your account</CardTitle>
              <CardDescription>
                Record found for <strong>{name}</strong>. Choose an email and password for your portal login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createPortalAccount} className="flex flex-col gap-4">
                <input type="hidden" name="patientId" value={patientId} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  Create account &amp; sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/portal/login" className="underline hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
