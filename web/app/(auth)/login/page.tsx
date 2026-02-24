"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmail(data.email, data.password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithGoogle();
      // Google 로그인 후 역할이 없으면 역할 선택 페이지로 이동
      // 역할이 있으면 홈으로 이동
      router.push("/role-select");
    } catch (err: any) {
      setError(err.message || "구글 로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-light text-[#faf6f0] mb-2">로그인</h1>
          <p className="text-[#8a807a] text-sm">인디필름에 오신 것을 환영합니다</p>
        </div>
        <Card className="border-[#5a5248]/30 bg-[#100e0a]">
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="rounded-md bg-[#c03020]/10 border border-[#c03020]/30 p-3 text-sm text-[#e08080]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#8a807a]">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-[#181410] border-[#5a5248]/50 text-[#faf6f0] placeholder:text-[#5a5248] focus:border-[#e8a020]"
                  placeholder="example@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-[#e8a020] font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#8a807a]">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-[#181410] border-[#5a5248]/50 text-[#faf6f0] placeholder:text-[#5a5248] focus:border-[#e8a020]"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-[#e8a020] font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full bg-[#e8a020] text-[#0a0805] hover:bg-[#f0b030] font-medium" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#5a5248]/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#100e0a] px-2 text-[#5a5248]">
                또는
              </span>
            </div>
          </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[#5a5248]/50 text-[#8a807a] hover:border-[#e8a020] hover:text-[#e8a020] hover:bg-[#e8a020]/10"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google로 로그인
            </Button>

            <div className="text-center text-sm text-[#8a807a]">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-[#e8a020] hover:text-[#e8a020]/80 hover:underline">
                회원가입
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
