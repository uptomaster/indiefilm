"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getActors, Actor, AgeRange, getAgeRangeLabel } from "@/lib/actors";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gradient-to-br from-[#3a2f38] via-[#4a3f48] to-[#3a2f38] text-white">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-[#3a2f38] via-[#4a3f48] to-[#3a2f38]">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight film-gold">
              CASTING
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              당신의 다음 작품을 위한 완벽한 배우를 찾아보세요
            </p>

            {/* 검색 및 필터 */}
            <div className="space-y-4">
              <Input
                placeholder="이름, 스킬, 경력으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#251a20]/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500"
              />

              <div className="flex flex-wrap gap-2 justify-center">
                <Select
                  value={selectedLocation || "all"}
                  onValueChange={(value) =>
                    setSelectedLocation(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[140px] bg-[#251a20]/50 border-gray-700 text-white">
                    <SelectValue placeholder="지역" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a3f48] border-red-500/30">
                    <SelectItem value="all" className="text-red-400 hover:bg-pink-900/20 focus:bg-pink-900/20 cursor-pointer">전체 지역</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc} className="text-red-400 hover:bg-pink-900/20 focus:bg-pink-900/20 cursor-pointer">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedAgeRange || "all"}
                  onValueChange={(value) =>
                    setSelectedAgeRange(
                      value === "all" ? null : (value as AgeRange)
                    )
                  }
                >
                  <SelectTrigger className="w-[140px] bg-[#251a20]/50 border-gray-700 text-white">
                    <SelectValue placeholder="나이대" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#4a3f48] border-red-500/30">
                    <SelectItem value="all" className="text-red-400 hover:bg-pink-900/20 focus:bg-pink-900/20 cursor-pointer">전체 나이대</SelectItem>
                    {ageRanges.map((age) => (
                      <SelectItem key={age} value={age} className="text-red-400 hover:bg-pink-900/20 focus:bg-pink-900/20 cursor-pointer">
                        {getAgeRangeLabel(age)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 배우 목록 */}
      <div className="container mx-auto px-4 py-12">
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
              <div className="text-sm text-gray-400">
                총 {filteredAndSortedActors.length}명의 배우
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[140px] bg-[#4a3f48]/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#4a3f48] border-red-500/30">
                  <SelectItem value="latest" className="text-red-400 hover:bg-pink-900/20">최신순</SelectItem>
                  <SelectItem value="name" className="text-red-400 hover:bg-pink-900/20">이름순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredAndSortedActors.map((actor) => (
                <Link key={actor.id} href={`/actors/${actor.id}`}>
                  <div className="actor-card group relative h-[380px] overflow-hidden rounded-lg cinematic-shadow">
                    {actor.mainPhotoUrl ? (
                      <LazyImage
                        src={actor.mainPhotoUrl}
                        alt={actor.stageName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                        <div className="text-center">
                          <div className="mb-4 text-6xl">🎭</div>
                          <div className="text-2xl font-bold text-gray-600">
                            {actor.stageName}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="film-overlay absolute inset-0 z-10" />
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
                      <h3 className="mb-2 text-2xl font-bold text-white">
                        {actor.stageName}
                      </h3>
                      <div className="mb-3 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-400">
                          {getAgeRangeLabel(actor.ageRange)}
                        </span>
                        <span className="rounded-full bg-gray-800/50 px-3 py-1 text-gray-300">
                          {actor.location}
                        </span>
                        {actor.heightCm && (
                          <span className="rounded-full bg-gray-800/50 px-3 py-1 text-gray-300">
                            {actor.heightCm}cm
                          </span>
                        )}
                      </div>
                      {actor.bio && (
                        <p className="line-clamp-2 text-sm text-gray-300">
                          {actor.bio}
                        </p>
                      )}
                      {actor.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {actor.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute right-4 top-4 z-20">
                      <div className="rounded-full bg-[#3a2f38]/50 px-3 py-1 text-xs text-red-400 backdrop-blur-sm">
                        프로필 보기 →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="border-red-500/50 bg-[#3a2f38]/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  더 보기
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
