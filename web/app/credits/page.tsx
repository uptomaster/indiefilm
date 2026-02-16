"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCredits, CreditWithMovies } from "@/lib/credits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const commonRoles = [
  "감독",
  "각본",
  "제작",
  "촬영",
  "편집",
  "음악",
  "음향",
  "미술",
  "의상",
  "분장",
  "조명",
  "주연",
  "조연",
  "출연",
];

export default function CreditsPage() {
  const [creditsByRole, setCreditsByRole] = useState<Map<string, CreditWithMovies[]>>(new Map());
  const [filteredCredits, setFilteredCredits] = useState<CreditWithMovies[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  useEffect(() => {
    filterCredits();
  }, [creditsByRole, selectedRole, searchQuery]);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const credits = await getAllCredits();
      setCreditsByRole(credits);
    } catch (error) {
      console.error("Error loading credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCredits = () => {
    let filtered: CreditWithMovies[] = [];

    if (selectedRole) {
      // 특정 역할의 제작진만
      const roleCredits = creditsByRole.get(selectedRole) || [];
      filtered = roleCredits;
    } else {
      // 모든 제작진
      creditsByRole.forEach((credits) => {
        filtered.push(...credits);
      });
    }

    // 검색어로 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (credit) =>
          credit.name.toLowerCase().includes(query) ||
          credit.role.toLowerCase().includes(query)
      );
    }

    // 참여 영화 수로 정렬
    filtered.sort((a, b) => b.movieCount - a.movieCount);

    setFilteredCredits(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            <p className="mt-4 text-gray-700 font-medium">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const allRoles = Array.from(creditsByRole.keys()).sort();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-pink-100 via-pink-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-6 md:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-2 md:mb-4 text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight film-gold px-2">
              CREDITS
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-800 font-semibold tracking-tight px-2">
              영화 제작에 참여한 모든 제작진을 만나보세요
            </p>
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="container mx-auto px-4 py-4 md:py-6 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <Input
              placeholder="이름 또는 역할로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-red-500 font-medium"
            />
          </div>
          <Select
            value={selectedRole || "all"}
            onValueChange={(value) =>
              setSelectedRole(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full md:w-[200px] bg-white border-gray-300 text-gray-900 font-medium">
              <SelectValue placeholder="역할 선택" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all" className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium">
                전체 역할
              </SelectItem>
              {allRoles.map((role) => (
                <SelectItem
                  key={role}
                  value={role}
                  className="text-gray-900 hover:bg-red-50 focus:bg-red-50 cursor-pointer font-medium"
                >
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 제작진 목록 */}
        {filteredCredits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-700 font-semibold">
              조건에 맞는 제작진이 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-700 font-semibold tracking-tight">
              총 {filteredCredits.length}명의 제작진
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredCredits.map((credit, index) => (
                <Card
                  key={`${credit.name}_${credit.role}_${index}`}
                  className="border-gray-200 bg-white hover:border-red-300 hover:shadow-lg transition-all shadow-sm"
                >
                  <CardHeader className="p-3 md:p-4 lg:p-6 pb-2 md:pb-3">
                    <CardTitle className="text-base md:text-lg lg:text-xl film-gold font-bold tracking-tight">
                      {credit.name}
                    </CardTitle>
                    <p className="text-xs md:text-sm text-red-600 font-semibold">{credit.role}</p>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                    <div className="mb-3 md:mb-4">
                      <p className="text-xs md:text-sm text-gray-700 font-medium">
                        참여 영화: <span className="text-red-600 font-bold">{credit.movieCount}편</span>
                      </p>
                    </div>
                    {credit.profileLink && (
                      <div className="mb-4">
                        <a
                          href={credit.profileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-red-600 hover:text-red-500 hover:underline font-semibold"
                        >
                          프로필 보기 →
                        </a>
                      </div>
                    )}
                    {credit.actorId && (
                      <Link href={`/actors/${credit.actorId}`}>
                        <Button
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                        >
                          배우 프로필 보기
                        </Button>
                      </Link>
                    )}
                    {credit.movies.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">참여 작품:</p>
                        <div className="space-y-1">
                          {credit.movies.slice(0, 3).map((movie) => (
                            <Link
                              key={movie.id}
                              href={`/movies/${movie.id}`}
                              className="block text-xs text-gray-700 hover:text-red-600 truncate font-medium"
                            >
                              • {movie.title}
                            </Link>
                          ))}
                          {credit.movies.length > 3 && (
                            <p className="text-xs text-gray-600 font-medium">
                              +{credit.movies.length - 3}편 더
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
