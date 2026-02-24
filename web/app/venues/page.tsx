"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVenues } from "@/lib/venues";
import { Venue } from "@/lib/venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Zap, Car } from "lucide-react";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const list = await getVenues();
      setVenues(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-amber-400">촬영 장소</h1>
        {venues.length === 0 ? (
          <p className="text-gray-500">등록된 장소가 없습니다.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <Card key={v.id} className="border-amber-900/30 bg-[#1a1a1a]">
                <CardContent className="p-6">
                  <h3 className="mb-2 text-lg font-bold text-amber-400">{v.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <MapPin className="h-4 w-4" /> {v.location}
                  </div>
                  {v.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{v.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {v.area && <span className="rounded bg-amber-900/30 px-2 py-1">{v.area}㎡</span>}
                    {v.pricePerHour && <span className="rounded bg-amber-900/30 px-2 py-1">시간당 {v.pricePerHour.toLocaleString()}원</span>}
                    {v.hasElectricity && <span className="flex items-center gap-1 rounded bg-amber-900/30 px-2 py-1"><Zap className="h-3 w-3" /> 전기</span>}
                    {v.hasParking && <span className="flex items-center gap-1 rounded bg-amber-900/30 px-2 py-1"><Car className="h-3 w-3" /> 주차</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
