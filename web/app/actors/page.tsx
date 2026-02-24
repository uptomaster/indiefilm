"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getActors, Actor, AgeRange, getAgeRangeLabel } from "@/lib/actors";
import { IndiePageWrapper } from "@/components/IndiePageWrapper";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActorCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { LazyImage } from "@/components/LazyImage";
import { useToastContext } from "@/components/ToastProvider";

const ageRanges: AgeRange[] = ["10s", "20s", "30s", "40s", "50plus"];
const locations = ["서울", "부산", "인천", "대구", "광주", "대전", "울산", "기타"];

type SortOption = "latest" | "name";

export default function ActorsPage() {
  const { error: showError } = useToastContext();
  const [actors, setActors] = useState<Actor[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  useEffect(() => {
    loadActors();
  }, [selectedLocation, selectedAgeRange]);

  const loadActors = async () => {
    try {
      setLoading(true);
      const result = await getActors({
        location: selectedLocation || undefined,
        ageRange: selectedAgeRange || undefined,
        limitCount: 12,
      });
      console.log("✅ 로드된 배우 수:", result.actors.length);
      console.log("✅ 배우 목록:", result.actors.map(a => ({ 
        id: a.id, 
        stageName: a.stageName, 
        isPublic: a.isPublic,
        location: a.location,
        ageRange: a.ageRange
      })));
      setActors(result.actors);
      setLastDoc(result.lastDoc);
      setHasMore(result.actors.length === 12);
    } catch (error) {
      console.error("Error loading actors:", error);
      showError("배우 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || !hasMore) return;

    try {
      const result = await getActors({
        location: selectedLocation || undefined,
        ageRange: selectedAgeRange || undefined,
        limitCount: 12,
        lastDoc,
      });
      setActors((prev) => [...prev, ...result.actors]);
      setLastDoc(result.lastDoc);
      setHasMore(result.actors.length === 12);
    } catch (error) {
      console.error("Error loading more actors:", error);
    }
  };

  const filteredAndSortedActors = useMemo(() => {
    let filtered = actors.filter((actor) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        actor.stageName.toLowerCase().includes(query) ||
        actor.bio.toLowerCase().includes(query) ||
        actor.skills.some((skill) => skill.toLowerCase().includes(query)) ||
        actor.experience.some((exp) => exp.toLowerCase().includes(query))
      );
    });

    // 정렬
    const sorted = [...filtered];
    switch (sortBy) {
      case "latest":
        return sorted.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
      case "name":
        return sorted.sort((a, b) => a.stageName.localeCompare(b.stageName));
      default:
        return sorted;
    }
  }, [actors, searchQuery, sortBy]);

  return (
    <IndiePageWrapper title="배우" subtitle="당신의 다음 작품을 위한 완벽한 배우를 찾아보세요" sectionNum="03">
      {/* 검색 및 필터 */}
      <div className="space-y-4 mb-8">
        <Input
          placeholder="이름, 스킬, 경력으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#181410] border-[#5a5248] text-[#f0e8d8] placeholder:text-[#5a5248] focus:border-[#e8a020] h-10 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Select value={selectedLocation || "all"} onValueChange={(v) => setSelectedLocation(v === "all" ? null : v)}>
            <SelectTrigger className="w-[140px] bg-[#181410] border-[#5a5248] text-[#f0e8d8] h-9 text-xs">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent className="bg-[#181410] border-[#5a5248]">
              <SelectItem value="all" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">전체 지역</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedAgeRange || "all"} onValueChange={(v) => setSelectedAgeRange(v === "all" ? null : (v as AgeRange))}>
            <SelectTrigger className="w-[140px] bg-[#181410] border-[#5a5248] text-[#f0e8d8] h-9 text-xs">
              <SelectValue placeholder="나이대" />
            </SelectTrigger>
            <SelectContent className="bg-[#181410] border-[#5a5248]">
              <SelectItem value="all" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">전체 나이대</SelectItem>
              {ageRanges.map((age) => (
                <SelectItem key={age} value={age} className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">{getAgeRangeLabel(age)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
        {loading && actors.length === 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ActorCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedActors.length === 0 ? (
          <EmptyState type="actors" />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-[#8a807a]">총 {filteredAndSortedActors.length}명의 배우</div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px] bg-[#181410] border-[#5a5248] text-[#f0e8d8] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#181410] border-[#5a5248]">
                  <SelectItem value="latest" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">최신순</SelectItem>
                  <SelectItem value="name" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">이름순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {filteredAndSortedActors.map((actor) => (
                <Link key={actor.id} href={`/actors/${actor.id}`} className="group block">
                  <div className="relative h-[280px] sm:h-[320px] overflow-hidden rounded border border-[#5a5248]/30 bg-[#181410] transition-all hover:border-[#e8a020]/40 hover:scale-[1.02]">
                    {actor.mainPhotoUrl ? (
                      <LazyImage src={actor.mainPhotoUrl} alt={actor.stageName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1510] to-[#0a0805]">
                        <div className="text-center">
                          <div className="mb-2 text-5xl">🎭</div>
                          <div className="text-lg font-bold text-[#8a807a]">{actor.stageName}</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white">{actor.stageName}</h3>
                      <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                        <span className="rounded bg-[#e8a020]/20 px-2 py-0.5 text-[#e8a020]">{getAgeRangeLabel(actor.ageRange)}</span>
                        <span className="rounded bg-[#5a5248]/50 px-2 py-0.5 text-[#8a807a]">{actor.location}</span>
                      </div>
                      {actor.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {actor.skills.slice(0, 3).map((s, i) => (
                            <span key={i} className="rounded bg-[#e8a020]/10 px-1.5 py-0.5 text-[10px] text-[#e8a020]">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-[#e8a020] px-2.5 py-1 text-[10px] font-semibold text-[#0a0805] opacity-0 group-hover:opacity-100 transition-opacity">
                      프로필 →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button onClick={loadMore} className="px-6 py-2.5 border border-[#5a5248] text-[#8a807a] text-sm hover:border-[#e8a020] hover:text-[#e8a020] transition-colors">
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
    </IndiePageWrapper>
  );
}
