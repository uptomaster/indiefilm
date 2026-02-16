"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createUserProfile } from "@/lib/auth";
import { UserRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoleSelectPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 이미 역할이 설정되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && userProfile?.role) {
      // 역할이 actor면 프로필 페이지로, 아니면 홈으로
      if (userProfile.role === "actor") {
        router.push("/actors/me/view");
      } else {
        router.push("/");
      }
    }
  }, [userProfile, authLoading, router]);

  const handleRoleSelect = async (role: UserRole) => {
    if (!user) {
      router.push("/login");
      return;
    }

    // 즉시 시각적 피드백
    setSelectedRole(role);
    setError(null);

    try {
      setLoading(true);
      console.log("역할 선택 시작:", role);
      
      await createUserProfile(user, role);
      console.log("프로필 생성 완료");
      
      // 성공 메시지 표시
      setError(null);
      
      // 프로필 생성 후 약간의 지연을 두고 리다이렉트
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // 역할에 따라 적절한 페이지로 리다이렉트
      if (role === "actor") {
        window.location.href = "/actors/me/view";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error("역할 설정 에러:", err);
      setError(err.message || "역할 설정에 실패했습니다");
      setSelectedRole(null);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">로그인이 필요합니다</p>
            <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
              로그인하러 가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 이미 역할이 설정되어 있으면 표시하지 않음 (useEffect에서 리다이렉트됨)
  if (userProfile?.role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a2f38] via-[#4a3f48] to-[#3a2f38] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold film-gold mb-4">ROLE SELECTION</h1>
          <p className="text-xl text-gray-300">IndieFilm Hub에서 어떤 역할로 활동하시나요?</p>
        </div>
        <Card className="border-red-500/20 bg-[#4a3f48]/50 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-900/20 border border-red-600/30 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              <button
                onClick={() => handleRoleSelect("filmmaker")}
                disabled={loading}
                className={`flex flex-col items-center rounded-lg border-2 p-8 transition-all disabled:opacity-50 ${
                  selectedRole === "filmmaker"
                    ? "border-red-500 bg-red-500/20 scale-105 cinematic-shadow"
                    : "border-gray-700 hover:border-red-500/50 hover:bg-pink-900/20"
                } ${loading ? "cursor-wait" : "cursor-pointer"}`}
              >
                <span className="text-6xl mb-4">🎬</span>
                <h3 className="text-xl font-bold mb-3 film-gold">제작자</h3>
                <p className="text-sm text-gray-400 text-center leading-relaxed">
                  영화를 제작하고 업로드하며 배우를 찾습니다
                </p>
                {selectedRole === "filmmaker" && loading && (
                  <div className="mt-4">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleSelect("actor")}
                disabled={loading}
                className={`flex flex-col items-center rounded-lg border-2 p-8 transition-all disabled:opacity-50 ${
                  selectedRole === "actor"
                    ? "border-red-500 bg-red-500/20 scale-105 cinematic-shadow"
                    : "border-gray-700 hover:border-red-500/50 hover:bg-pink-900/20"
                } ${loading ? "cursor-wait" : "cursor-pointer"}`}
              >
                <span className="text-6xl mb-4">🎭</span>
                <h3 className="text-xl font-bold mb-3 film-gold">배우</h3>
                <p className="text-sm text-gray-400 text-center leading-relaxed">
                  프로필을 만들고 오디션 기회를 찾습니다
                </p>
                {selectedRole === "actor" && loading && (
                  <div className="mt-4">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleSelect("viewer")}
                disabled={loading}
                className={`flex flex-col items-center rounded-lg border-2 p-8 transition-all disabled:opacity-50 ${
                  selectedRole === "viewer"
                    ? "border-red-500 bg-red-500/20 scale-105 cinematic-shadow"
                    : "border-gray-700 hover:border-red-500/50 hover:bg-pink-900/20"
                } ${loading ? "cursor-wait" : "cursor-pointer"}`}
              >
                <span className="text-6xl mb-4">👁️</span>
                <h3 className="text-xl font-bold mb-3 film-gold">관객</h3>
                <p className="text-sm text-gray-400 text-center leading-relaxed">
                  인디 영화를 감상하고 즐깁니다
                </p>
                {selectedRole === "viewer" && loading && (
                  <div className="mt-4">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  </div>
                )}
              </button>
            </div>

            {loading && (
              <div className="text-center text-sm text-gray-400">
                설정 중...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
