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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-primary">Intervuo</h1>
        <p className="mb-7 text-sm text-gray-400">Create your free account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          {serverError && <p className="text-xs text-red-500">{serverError}</p>}
          <Button size="full" type="submit" loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
