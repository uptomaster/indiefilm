"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getVenueByUserId, createVenue, updateVenue } from "@/lib/venues";
import { Venue } from "@/lib/venues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function VenueEditPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    area: "",
    pricePerHour: "",
    pricePerDay: "",
    availableHours: "",
    hasElectricity: true,
    hasParking: false,
    noiseRestriction: "",
    isPublic: true,
  });

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
      if (v) {
        setForm({
          name: v.name || "",
          description: v.description || "",
          location: v.location || "",
          area: v.area?.toString() || "",
          pricePerHour: v.pricePerHour?.toString() || "",
          pricePerDay: v.pricePerDay?.toString() || "",
          availableHours: v.availableHours || "",
          hasElectricity: v.hasElectricity ?? true,
          hasParking: v.hasParking ?? false,
          noiseRestriction: v.noiseRestriction || "",
          isPublic: v.isPublic ?? true,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userProfile?.role !== "venue") return;
    try {
      setLoading(true);
      setError(null);
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim(),
        area: form.area ? Number(form.area) : undefined,
        pricePerHour: form.pricePerHour ? Number(form.pricePerHour) : undefined,
        pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : undefined,
        availableHours: form.availableHours.trim() || undefined,
        hasElectricity: form.hasElectricity,
        hasParking: form.hasParking,
        noiseRestriction: form.noiseRestriction.trim() || undefined,
        isPublic: form.isPublic,
      };

      if (!data.name || !data.location) {
        setError("장소명과 위치는 필수입니다.");
        return;
      }

      const existing = await getVenueByUserId(user.uid);
      if (existing) {
        await updateVenue(user.uid, data);
      } else {
        await createVenue(user.uid, data);
      }
      router.push("/venues/me/view");
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="mt-4 text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || userProfile?.role !== "venue") return null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/venues/me" className="mb-6 inline-block text-amber-400 hover:text-amber-300">
          ← 장소 관리
        </Link>
        <h1 className="mb-8 text-2xl font-bold text-amber-400">장소 등록 / 수정</h1>
        <Card className="border-amber-800/50 bg-[#1a1a1a]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-900/30 border border-red-600/50 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>장소명 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 서울 필름 스튜디오"
                  className="bg-[#0d0d0d] border-[#e8a020]/35"
                />
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="장소 소개"
                  rows={3}
                  className="w-full rounded-md border border-[#e8a020]/35 bg-[#0d0d0d] px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>위치 *</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="예: 서울시 강남구, 부산 해운대"
                  className="bg-[#0d0d0d] border-[#e8a020]/35"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>면적 (㎡)</Label>
                  <Input
                    type="number"
                    value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    placeholder="50"
                    className="bg-[#0d0d0d] border-[#e8a020]/35"
                  />
                </div>
                <div className="space-y-2">
                  <Label>대여 가능 시간대</Label>
                  <Input
                    value={form.availableHours}
                    onChange={(e) => setForm((f) => ({ ...f, availableHours: e.target.value }))}
                    placeholder="예: 09:00-22:00"
                    className="bg-[#0d0d0d] border-[#e8a020]/35"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>시간당 가격 (원)</Label>
                  <Input
                    type="number"
                    value={form.pricePerHour}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerHour: e.target.value }))}
                    placeholder="50000"
                    className="bg-[#0d0d0d] border-[#e8a020]/35"
                  />
                </div>
                <div className="space-y-2">
                  <Label>일당 가격 (원)</Label>
                  <Input
                    type="number"
                    value={form.pricePerDay}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                    placeholder="300000"
                    className="bg-[#0d0d0d] border-[#e8a020]/35"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasElectricity}
                    onChange={(e) => setForm((f) => ({ ...f, hasElectricity: e.target.checked }))}
                    className="rounded border-gray-600 bg-[#0d0d0d] text-amber-500"
                  />
                  전기 사용 가능
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasParking}
                    onChange={(e) => setForm((f) => ({ ...f, hasParking: e.target.checked }))}
                    className="rounded border-gray-600 bg-[#0d0d0d] text-amber-500"
                  />
                  주차 가능
                </label>
              </div>
              <div className="space-y-2">
                <Label>소음 제한</Label>
                <Input
                  value={form.noiseRestriction}
                  onChange={(e) => setForm((f) => ({ ...f, noiseRestriction: e.target.value }))}
                  placeholder="예: 22시 이후 음소거"
                  className="bg-[#0d0d0d] border-[#e8a020]/35"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="rounded border-gray-600 bg-[#0d0d0d] text-amber-500"
                />
                공개
              </label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/venues/me")}
                  className="border-gray-600"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-500 text-black"
                >
                  {loading ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
