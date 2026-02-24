"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getVenueByUserId } from "@/lib/venues";
import { Venue } from "@/lib/venues";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, MessageSquare } from "lucide-react";

export default function VenueMePage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (userProfile && !userProfile.role) {
      router.push("/role-select");
      return;
    }
    if (userProfile && userProfile.role !== "venue") {
      router.push("/");
      return;
    }
    loadVenue();
  }, [user, userProfile, authLoading]);

  const loadVenue = async () => {
    if (!user) return;
    try {
      const v = await getVenueByUserId(user.uid);
      setVenue(v);
      if (v) router.replace("/venues/me/view");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && userProfile?.role === "venue" && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
          <p className="mt-4 text-[#b8a898]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || userProfile?.role !== "venue") return null;

  // 장소 미등록: 등록 유도 화면
  return (
    <div className="min-h-screen bg-[#0a0805] text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 text-7xl">🏢</div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-[#e8a020]">
            촬영 장소를 등록하세요
          </h1>
          <p className="mb-8 text-[#b8a898] leading-relaxed">
            사진, 위치, 면적, 대여 가능 시간대, 가격, 전기/주차/소음 여부 등
            촬영에 필요한 정보를 입력하고 제작진과 연결하세요.
          </p>
          <Link href="/venues/me/edit">
            <Button
              size="lg"
              className="btn-primary-gradient text-black font-semibold px-8 py-6"
            >
              장소 등록하기
            </Button>
          </Link>
          <div className="mt-12 flex justify-center gap-8 text-sm text-[#b8a898]">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> 위치·면적·가격
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> 예약 캘린더
            </span>
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> 제작진 채팅
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
