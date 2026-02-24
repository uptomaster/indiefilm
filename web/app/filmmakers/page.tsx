"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFilmmakers, Filmmaker, FilmmakerType } from "@/lib/filmmakers";
import { IndiePageWrapper } from "@/components/IndiePageWrapper";
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
    <IndiePageWrapper title="제작자" subtitle="당신의 다음 작품을 함께 만들 제작자를 찾아보세요" sectionNum="04">
      <div className="mx-auto max-w-3xl mb-10">
        <div className="space-y-4">
          <Input
            placeholder="이름, 소개, 전문 분야로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#181410] border-[#5a5248]/50 text-[#faf6f0] placeholder:text-[#5a5248] focus:border-[#e8a020] font-medium"
          />
          <div className="flex flex-wrap gap-2 justify-center">
            <Select
              value={selectedType || "all"}
              onValueChange={(value) =>
                setSelectedType(value === "all" ? null : (value as FilmmakerType))
              }
            >
              <SelectTrigger className="w-[140px] bg-[#181410] border-[#5a5248]/50 text-[#faf6f0] font-medium">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent className="bg-[#181410] border-[#5a5248]/30">
                <SelectItem value="all" className="text-[#faf6f0] hover:bg-[#e8a020]/20 focus:bg-[#e8a020]/20 cursor-pointer font-medium">
                  전체 유형
                </SelectItem>
                <SelectItem value="individual" className="text-[#faf6f0] hover:bg-[#e8a020]/20 focus:bg-[#e8a020]/20 cursor-pointer font-medium">
                  개인
                </SelectItem>
                <SelectItem value="team" className="text-[#faf6f0] hover:bg-[#e8a020]/20 focus:bg-[#e8a020]/20 cursor-pointer font-medium">
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
              <SelectTrigger className="w-[140px] bg-[#181410] border-[#5a5248]/50 text-[#faf6f0] font-medium">
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent className="bg-[#181410] border-[#5a5248]/30">
                <SelectItem value="all" className="text-[#faf6f0] hover:bg-[#e8a020]/20 focus:bg-[#e8a020]/20 cursor-pointer font-medium">
                  전체 지역
                </SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc} className="text-[#faf6f0] hover:bg-[#e8a020]/20 focus:bg-[#e8a020]/20 cursor-pointer font-medium">
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        {loading && filmmakers.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
            <p className="mt-4 text-[#8a807a] font-semibold">로딩 중...</p>
          </div>
        ) : filteredFilmmakers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#8a807a] font-semibold">
              조건에 맞는 제작자가 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-[#8a807a] font-semibold tracking-tight">
              총 {filteredFilmmakers.length}명의 제작자
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {filteredFilmmakers.map((filmmaker) => (
                <Link key={filmmaker.id} href={`/filmmakers/${filmmaker.id}`}>
                  <div className="group relative h-[260px] sm:h-[300px] md:h-[340px] lg:h-[380px] overflow-hidden rounded-lg border border-[#5a5248]/30 hover:border-[#e8a020]/50 transition-all">
                    {filmmaker.mainPhotoUrl ? (
                      <LazyImage
                        src={filmmaker.mainPhotoUrl}
                        alt={filmmaker.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#181410]">
                        <div className="text-center">
                          <div className="mb-4 text-6xl">🎬</div>
                          <div className="text-2xl font-bold text-[#8a807a]">
                            {filmmaker.name}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-5 lg:p-6">
                      <div className="mb-1.5 md:mb-2">
                        <span className="rounded-full bg-[#e8a020]/20 px-2 md:px-3 py-0.5 md:py-1 text-xs text-[#e8a020] font-semibold">
                          {filmmaker.type === "team" ? "팀" : "개인"}
                        </span>
                      </div>
                      <h3 className="mb-1.5 md:mb-2 text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white tracking-tight">
                        {filmmaker.name}
                      </h3>
                      {filmmaker.location && (
                        <span className="text-xs md:text-sm text-[#8a807a] font-medium">
                          {filmmaker.location}
                        </span>
                      )}
                      {filmmaker.specialties && filmmaker.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {filmmaker.specialties.slice(0, 3).map((specialty, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-[#e8a020]/20 px-2 py-1 text-xs text-white font-semibold backdrop-blur-sm"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute right-4 top-4 z-20">
                      <div className="rounded-full bg-[#e8a020]/90 px-3 py-1 text-xs text-[#0a0805] backdrop-blur-sm font-semibold shadow-sm">
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
    </IndiePageWrapper>
  );
}
