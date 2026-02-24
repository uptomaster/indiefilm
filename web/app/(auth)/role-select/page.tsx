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

  // 이미 역할이 설정되어 있으면 역할별 대시보드로 리다이렉트
  useEffect(() => {
    if (!authLoading && userProfile?.role) {
      if (userProfile.role === "actor") {
        router.push("/actors/me/view");
      } else if (userProfile.role === "venue") {
        router.push("/venues/me");
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
      } else if (role === "venue") {
        window.location.href = "/venues/me";
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0805]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
          <p className="mt-4 text-[#b8a898]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0805]">
        <Card className="w-full max-w-md border-[#e8a020]/30 bg-[#100e0a]">
          <CardContent className="pt-6">
            <p className="text-center text-[#faf6f0]">로그인이 필요합니다</p>
            <Button className="mt-4 w-full bg-[#e8a020] text-[#0a0805] hover:bg-[#f0b030]" onClick={() => router.push("/login")}>
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
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl font-light text-[#faf6f0] mb-4">당신은 누구인가요?</h1>
          <p className="text-xl text-[#b8a898]">인디필름에서 활동할 역할을 선택해주세요</p>
        </div>
        <Card className="border-[#e8a020]/30 bg-[#100e0a]">
          <CardContent className="pt-6 space-y-6">
            {error && (
              <div className="rounded-md bg-[#c03020]/10 border border-[#c03020]/30 p-3 text-sm text-[#e08080]">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => handleRoleSelect("filmmaker")}
                disabled={loading}
                className={`flex flex-col items-center rounded-lg border-2 p-8 transition-all disabled:opacity-50 ${
                  selectedRole === "filmmaker"
                    ? "border-[#e8a020] bg-[#e8a020]/20 scale-105"
                    : "border-[#e8a020]/35 hover:border-[#e8a020]/50 hover:bg-[#e8a020]/10"
                } ${loading ? "cursor-wait" : "cursor-pointer"}`}
              >
                <span className="text-6xl mb-4">🎬</span>
                <h3 className="text-xl font-semibold mb-3 text-[#e8a020]">제작자</h3>
                <p className="text-sm text-[#b8a898] text-center leading-relaxed">
                  영화를 제작하고 업로드하며 배우를 찾습니다
                </p>
                {selectedRole === "filmmaker" && loading && (
                  <div className="mt-4">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#e8a020] border-t-transparent" />
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleSelect("actor")}
                disabled={loading}
                className={`flex flex-col items-center rounded-lg border-2 p-8 transition-all disabled:opacity-50 ${
                  selectedRole === "actor"
                    ? "border-[#e8a020] bg-[#e8a020]/20 scale-105"
                    : "border-[#e8a020]/35 hover:border-[#e8a020]/50 hover:bg-[#e8a020]/10"
                } ${loading ? "cursor-wait" : "cursor-pointer"}`}
              >
                <span className="text-6xl mb-4">🎭</span>
                <h3 className="text-xl font-semibold mb-3 text-[#e8a020]">배우</h3>
                <p className="text-sm text-[#b8a898] text-center leading-relaxed">
                  프로필을 만들고 오디션 기회를 찾습니다
                </p>
                {selectedRole === "actor" && loading && (
                  <div className="mt-4">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#e8a020] border-t-transparent" />
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleSelect("viewer")}
                disabled={loading}
                className={`flex flex-col items-center rounded-lg border-2 p-8 transition-all disabled:opacity-50 ${
                  selectedRole === "viewer"
                    ? "border-[#e8a020] bg-[#e8a020]/20 scale-105"
                    : "border-[#e8a020]/35 hover:border-[#e8a020]/50 hover:bg-[#e8a020]/10"
                } ${loading ? "cursor-wait" : "cursor-pointer"}`}
              >
                <span className="text-6xl mb-4">👁️</span>
                <h3 className="text-xl font-semibold mb-3 text-[#e8a020]">관객</h3>
                <p className="text-sm text-[#b8a898] text-center leading-relaxed">
                  인디 영화를 감상하고 즐깁니다
                </p>
                {selectedRole === "viewer" && loading && (
                  <div className="mt-4">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#e8a020] border-t-transparent" />
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleSelect("venue")}
                disabled={loading}
                className={`flex flex-col items-center rounded-lg border-2 p-8 transition-all disabled:opacity-50 ${
                  selectedRole === "venue"
                    ? "border-[#e8a020] bg-[#e8a020]/20 scale-105"
                    : "border-[#e8a020]/35 hover:border-[#e8a020]/50 hover:bg-[#e8a020]/10"
                } ${loading ? "cursor-wait" : "cursor-pointer"}`}
              >
                <span className="text-6xl mb-4">🏢</span>
                <h3 className="text-xl font-semibold mb-3 text-[#e8a020]">장소대여자</h3>
                <p className="text-sm text-[#b8a898] text-center leading-relaxed">
                  촬영 장소를 등록하고 제작진과 연결합니다
                </p>
                {selectedRole === "venue" && loading && (
                  <div className="mt-4">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#e8a020] border-t-transparent" />
                  </div>
                )}
              </button>
            </div>

            {loading && (
              <div className="text-center text-sm text-[#b8a898]">
                설정 중...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
