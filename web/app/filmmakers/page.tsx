"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFilmmakers, Filmmaker, FilmmakerType } from "@/lib/filmmakers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LazyImage } from "@/components/LazyImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const locations = ["서울", "부산", "인천", "대구", "광주", "대전", "울산", "기타"];

export default function FilmmakersPage() {
  const [filmmakers, setFilmmakers] = useState<Filmmaker[]>([]);
  const [selectedType, setSelectedType] = useState<FilmmakerType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilmmakers();
  }, [selectedType, selectedLocation]);

  const loadFilmmakers = async () => {
    try {
      setLoading(true);
      const result = await getFilmmakers({
        type: selectedType || undefined,
        location: selectedLocation || undefined,
        limitCount: 50,
      });
      setFilmmakers(result.filmmakers);
    } catch (error) {
      console.error("Error loading filmmakers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFilmmakers = filmmakers.filter((filmmaker) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      filmmaker.name.toLowerCase().includes(query) ||
      filmmaker.bio?.toLowerCase().includes(query) ||
      filmmaker.specialties?.some((s) => s.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-pink-100 via-pink-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-6 md:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-2 md:mb-4 text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight film-gold px-2">
              FILMMAKERS
            </h1>
            <p className="mb-4 md:mb-8 text-base md:text-lg lg:text-xl text-gray-800 font-semibold tracking-tight px-2">
              당신의 다음 작품을 함께 만들 제작자를 찾아보세요
            </p>

            {/* 검색 및 필터 */}
            <div className="space-y-4">
              <Input
                placeholder="이름, 소개, 전문 분야로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-red-500 font-medium"
              />

              <div className="flex flex-wrap gap-2 justify-center">
                <Select
                  value={selectedType || "all"}
                  onValueChange={(value) =>
                    setSelectedType(value === "all" ? null : (value as FilmmakerType))
                  }
                >
                  <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900 font-medium">
                    <SelectValue placeholder="유형" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">
                      전체 유형
                    </SelectItem>
                    <SelectItem value="individual" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">
                      개인
                    </SelectItem>
                    <SelectItem value="team" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">
                      팀
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedLocation || "all"}
                  onValueChange={(value) =>
                    setSelectedLocation(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900 font-medium">
                    <SelectValue placeholder="지역" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">
                      전체 지역
                    </SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc} className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 제작자 목록 */}
      <div className="container mx-auto px-4 py-4 md:py-8 lg:py-12">
        {loading && filmmakers.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            <p className="mt-4 text-gray-700 font-semibold">로딩 중...</p>
          </div>
        ) : filteredFilmmakers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-700 font-semibold">
              조건에 맞는 제작자가 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-700 font-semibold tracking-tight">
              총 {filteredFilmmakers.length}명의 제작자
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {filteredFilmmakers.map((filmmaker) => (
                <Link key={filmmaker.id} href={`/filmmakers/${filmmaker.id}`}>
                  <div className="group relative h-[260px] sm:h-[300px] md:h-[340px] lg:h-[380px] overflow-hidden rounded-lg shadow-lg border border-gray-200 hover:border-red-300 transition-all">
                    {filmmaker.mainPhotoUrl ? (
                      <LazyImage
                        src={filmmaker.mainPhotoUrl}
                        alt={filmmaker.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div className="text-center">
                          <div className="mb-4 text-6xl">🎬</div>
                          <div className="text-2xl font-bold text-gray-700">
                            {filmmaker.name}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-5 lg:p-6">
                      <div className="mb-1.5 md:mb-2">
                        <span className="rounded-full bg-red-50 px-2 md:px-3 py-0.5 md:py-1 text-xs text-red-600 font-semibold">
                          {filmmaker.type === "team" ? "팀" : "개인"}
                        </span>
                      </div>
                      <h3 className="mb-1.5 md:mb-2 text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white tracking-tight">
                        {filmmaker.name}
                      </h3>
                      {filmmaker.location && (
                        <span className="text-xs md:text-sm text-gray-200 font-medium">
                          {filmmaker.location}
                        </span>
                      )}
                      {filmmaker.specialties && filmmaker.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {filmmaker.specialties.slice(0, 3).map((specialty, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-red-500/20 px-2 py-1 text-xs text-white font-semibold backdrop-blur-sm"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute right-4 top-4 z-20">
                      <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-red-600 backdrop-blur-sm font-semibold shadow-sm">
                        프로필 보기 →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
