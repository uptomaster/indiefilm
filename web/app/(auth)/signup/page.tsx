"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth";
import { UserRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const signupSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  role: z.enum(["filmmaker", "actor", "viewer", "venue"], {
    message: "역할을 선택해주세요",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "viewer",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: SignupForm) => {
    try {
      setLoading(true);
      setError(null);
      await signUpWithEmail(data.email, data.password, data.role as UserRole);
      // 역할에 따라 적절한 페이지로 리다이렉트
      if (data.role === "actor") {
        router.push("/actors/me/view");
      } else if (data.role === "venue") {
        router.push("/venues/me");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "회원가입에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithGoogle();
      // Google 로그인 후 역할 선택 페이지로 이동
      router.push("/role-select");
    } catch (err: any) {
      setError(err.message || "구글 회원가입에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a2f38] via-[#4a3f48] to-[#3a2f38] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold film-gold mb-2">SIGN UP</h1>
          <p className="text-gray-300">IndieFilm Hub에 가입하고 시작하세요</p>
        </div>
        <Card className="border-violet-500/20 bg-[#4a3f48]/50 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="rounded-md bg-violet-900/20 border border-violet-600/30 p-3 text-sm text-violet-300">
                {error}
                {error.includes("configuration-not-found") && (
                  <div className="mt-2 text-xs">
                    💡 개발 서버를 재시작하고 .env.local 파일을 확인하세요.
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  placeholder="example@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-violet-400 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-violet-400 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-violet-400 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">당신은 누구인가요?</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-3 transition-all ${
                    selectedRole === "filmmaker"
                      ? "border-violet-500 bg-violet-500/20 scale-105"
                      : "border-gray-700 hover:bg-indigo-900/20"
                  }`}>
                    <input
                      type="radio"
                      value="filmmaker"
                      {...register("role")}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">🎬</span>
                    <span className="text-sm font-medium text-gray-300">제작자</span>
                  </label>
                  <label className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-3 transition-all ${
                    selectedRole === "actor"
                      ? "border-violet-500 bg-violet-500/20 scale-105"
                      : "border-gray-700 hover:bg-indigo-900/20"
                  }`}>
                    <input
                      type="radio"
                      value="actor"
                      {...register("role")}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">🎭</span>
                    <span className="text-sm font-medium text-gray-300">배우</span>
                  </label>
                  <label className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-3 transition-all ${
                    selectedRole === "viewer"
                      ? "border-violet-500 bg-violet-500/20 scale-105"
                      : "border-gray-700 hover:bg-indigo-900/20"
                  }`}>
                    <input
                      type="radio"
                      value="viewer"
                      {...register("role")}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">👁️</span>
                    <span className="text-sm font-medium text-gray-300">관객</span>
                  </label>
                  <label className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-3 transition-all ${
                    selectedRole === "venue"
                      ? "border-violet-500 bg-violet-500/20 scale-105"
                      : "border-gray-700 hover:bg-indigo-900/20"
                  }`}>
                    <input
                      type="radio"
                      value="venue"
                      {...register("role")}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">🏢</span>
                    <span className="text-sm font-medium text-gray-300">장소대여자</span>
                  </label>
                </div>
                {errors.role && (
                  <p className="text-sm text-violet-400 font-medium">{errors.role.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600" disabled={loading}>
                {loading ? "가입 중..." : "회원가입"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#4a3f48]/50 px-2 text-gray-400">
                  또는
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
              onClick={handleGoogleSignUp}
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
              Google로 회원가입
            </Button>

            <div className="text-center text-sm text-gray-400">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 hover:underline">
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
