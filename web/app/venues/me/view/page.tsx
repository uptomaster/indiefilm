"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getVenueByUserId } from "@/lib/venues";
import { Venue } from "@/lib/venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Zap, Car, Volume2, Calendar, Edit } from "lucide-react";

export default function VenueViewPage() {
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
      if (!v) {
        router.replace("/venues/me");
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!venue) return null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400">{venue.name}</h1>
          <Link href="/venues/me/edit">
            <Button variant="outline" size="sm" className="border-amber-600/50 text-amber-400">
              <Edit className="mr-2 h-4 w-4" /> 수정
            </Button>
          </Link>
        </div>

        <Card className="border-amber-800/50 bg-[#1a1a1a] mb-6">
          <CardContent className="p-6 space-y-4">
            {venue.description && (
              <p className="text-gray-300 leading-relaxed">{venue.description}</p>
            )}
            <div className="flex items-center gap-2 text-amber-400">
              <MapPin className="h-5 w-5" />
              <span>{venue.location}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {venue.area && <span>면적 {venue.area}㎡</span>}
              {venue.availableHours && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {venue.availableHours}
                </span>
              )}
              {venue.pricePerHour && <span>시간당 {venue.pricePerHour.toLocaleString()}원</span>}
              {venue.pricePerDay && <span>일당 {venue.pricePerDay.toLocaleString()}원</span>}
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              {venue.hasElectricity && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Zap className="h-4 w-4" /> 전기
                </span>
              )}
              {venue.hasParking && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Car className="h-4 w-4" /> 주차
                </span>
              )}
              {venue.noiseRestriction && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Volume2 className="h-4 w-4" /> {venue.noiseRestriction}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-[#b8a898]">
          향후 예약 캘린더 및 제작진 채팅 기능이 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}
