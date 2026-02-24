"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function FilmmakerProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    if (userProfile) {
      if (!userProfile.role) {
        router.push("/role-select");
        return;
      }
      if (userProfile.role !== "filmmaker") {
        router.push("/role-select");
        return;
      }
      router.push("/filmmakers/me/view");
    }
  }, [user, userProfile, authLoading, router]);

  return (
    <div className="min-h-screen bg-[#0a0805] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
        <p className="mt-4 text-[#8a807a]">로딩 중...</p>
      </div>
    </div>
  );
}
