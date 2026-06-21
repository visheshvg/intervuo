"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setServerError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <span className="h-4 w-4 rounded-[4px] bg-primary" />
        <span className="text-base font-semibold tracking-tight text-ink">Intervuo</span>
      </div>

      <p className="eyebrow text-primary">Welcome back</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-soft">Pick up where you left off.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
        />
        {serverError && <p className="text-xs text-red-600">{serverError}</p>}
        <Button size="full" type="submit" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
