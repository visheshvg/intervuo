"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await api.auth.register(data.email, data.name, data.password);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setServerError("Account created but login failed. Please sign in manually.");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Registration failed.");
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <span className="h-4 w-4 rounded-[4px] bg-primary" />
        <span className="text-base font-semibold tracking-tight text-ink">Intervuo</span>
      </div>

      <p className="eyebrow text-primary">Get started</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-soft">Free, and takes about a minute.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="Full name"
          placeholder="Arjun Sharma"
          error={errors.name?.message}
          {...register("name")}
        />
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
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        {serverError && <p className="text-xs text-red-600">{serverError}</p>}
        <Button size="full" type="submit" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
