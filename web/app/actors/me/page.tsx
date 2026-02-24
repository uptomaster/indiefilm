"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ActorProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    // 인증 상태가 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 사용자가 없으면 로그인 페이지로
    if (!user) {
      router.push("/login");
      return;
    }

    // 사용자 프로필이 로딩되었을 때
    if (userProfile) {
      // 역할이 없으면 역할 선택 페이지로
      if (!userProfile.role) {
        router.push("/role-select");
        return;
      }
      // 역할이 actor가 아니면 역할 선택 페이지로
      if (userProfile.role !== "actor") {
        router.push("/role-select");
        return;
      }
      // 역할이 actor면 프로필 상세 보기 페이지로 리다이렉트
      router.push("/actors/me/view");
    }
  }, [user, userProfile, authLoading, router]);

  return (
    <div className="min-h-screen bg-[#0a0805] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
        <p className="mt-4 text-[#b8a898]">로딩 중...</p>
      </div>
    </div>
  );
}
