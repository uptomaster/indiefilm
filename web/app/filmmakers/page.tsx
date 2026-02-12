"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFilmmakers, Filmmaker, FilmmakerType } from "@/lib/filmmakers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-yellow-900/30 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight film-gold">
              FILMMAKERS
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              당신의 다음 작품을 함께 만들 제작자를 찾아보세요
            </p>

            {/* 검색 및 필터 */}
            <div className="space-y-4">
              <Input
                placeholder="이름, 소개, 전문 분야로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-600"
              />

              <div className="flex flex-wrap gap-2 justify-center">
                <Select
                  value={selectedType || "all"}
                  onValueChange={(value) =>
                    setSelectedType(value === "all" ? null : (value as FilmmakerType))
                  }
                >
                  <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="유형" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-yellow-600/30">
                    <SelectItem value="all" className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                      전체 유형
                    </SelectItem>
                    <SelectItem value="individual" className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                      개인
                    </SelectItem>
                    <SelectItem value="team" className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
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
                  <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="지역" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-yellow-600/30">
                    <SelectItem value="all" className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                      전체 지역
                    </SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc} className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
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
      <div className="container mx-auto px-4 py-12">
        {loading && filmmakers.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent" />
            <p className="mt-4 text-gray-400">로딩 중...</p>
          </div>
        ) : filteredFilmmakers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400">
              조건에 맞는 제작자가 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-400">
              총 {filteredFilmmakers.length}명의 제작자
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredFilmmakers.map((filmmaker) => (
                <Link key={filmmaker.id} href={`/filmmakers/${filmmaker.id}`}>
                  <div className="group relative h-[400px] overflow-hidden rounded-lg cinematic-shadow">
                    {filmmaker.mainPhotoUrl ? (
                      <img
                        src={filmmaker.mainPhotoUrl}
                        alt={filmmaker.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                        <div className="text-center">
                          <div className="mb-4 text-6xl">🎬</div>
                          <div className="text-2xl font-bold text-gray-600">
                            {filmmaker.name}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="film-overlay absolute inset-0 z-10" />
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
                      <div className="mb-2">
                        <span className="rounded-full bg-yellow-600/20 px-3 py-1 text-xs text-yellow-400">
                          {filmmaker.type === "team" ? "팀" : "개인"}
                        </span>
                      </div>
                      <h3 className="mb-2 text-2xl font-bold text-white">
                        {filmmaker.name}
                      </h3>
                      {filmmaker.location && (
                        <span className="text-sm text-gray-300">
                          {filmmaker.location}
                        </span>
                      )}
                      {filmmaker.specialties && filmmaker.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {filmmaker.specialties.slice(0, 3).map((specialty, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-yellow-600/10 px-2 py-1 text-xs text-yellow-400"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute right-4 top-4 z-20">
                      <div className="rounded-full bg-black/50 px-3 py-1 text-xs text-yellow-400 backdrop-blur-sm">
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
