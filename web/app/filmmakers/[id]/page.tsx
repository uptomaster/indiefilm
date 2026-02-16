"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getFilmmakerById, getFilmmakerMovies, Filmmaker } from "@/lib/filmmakers";
import { Movie } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/LazyImage";

export default function FilmmakerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [filmmaker, setFilmmaker] = useState<Filmmaker | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadFilmmaker(params.id as string);
    }
  }, [params.id]);

  const loadFilmmaker = async (filmmakerId: string) => {
    try {
      setLoading(true);
      const filmmakerData = await getFilmmakerById(filmmakerId);
      setFilmmaker(filmmakerData);
      
      if (filmmakerData) {
        const filmmakerMovies = await getFilmmakerMovies(filmmakerData.id);
        setMovies(filmmakerMovies);
      }
    } catch (error) {
      console.error("Error loading filmmaker:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            <p className="mt-4 text-gray-800 font-semibold">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!filmmaker) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="mb-4 text-xl text-gray-800 font-semibold">
              제작자 프로필을 찾을 수 없습니다.
            </p>
            <Link href="/filmmakers">
              <Button className="border-red-300 bg-red-50 text-red-600 hover:bg-red-100 font-semibold">
                제작자 목록으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 히어로 섹션 - 배경만 */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden border-b border-gray-200 bg-gradient-to-b from-pink-100 via-pink-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        
        {/* 상단 네비게이션 */}
        <div className="absolute left-0 right-0 top-0 z-20">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <Link
              href="/filmmakers"
              className="rounded-full bg-white/90 px-4 py-2 text-sm text-gray-800 backdrop-blur-sm transition-colors hover:bg-gray-50 border border-gray-200 shadow-sm font-semibold"
            >
              ← 제작자 목록
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* 좌측: 메인 정보 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 프로필 헤더 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-gray-200">
              {/* 프로필 사진 */}
              <div className="flex-shrink-0">
                <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-red-200 shadow-lg">
                  {filmmaker.mainPhotoUrl ? (
                    <img
                      src={filmmaker.mainPhotoUrl}
                      alt={filmmaker.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-4xl md:text-5xl">🎬</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 기본 정보 */}
              <div className="flex-1">
                <div className="mb-2">
                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-600 font-bold">
                    {filmmaker.type === "team" ? "팀" : "개인"}
                  </span>
                </div>
                <h1 className="mb-4 text-4xl md:text-5xl font-bold film-gold tracking-tight">
                  {filmmaker.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-lg">
                  {filmmaker.location && (
                    <span className="text-gray-700 font-semibold">{filmmaker.location}</span>
                  )}
                  {filmmaker.website && (
                    <>
                      <span className="text-gray-400">•</span>
                      <a
                        href={filmmaker.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-500 font-semibold"
                      >
                        웹사이트
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* 소개 */}
            {filmmaker.bio && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold tracking-tight">
                  PROFILE
                </h2>
                <p className="whitespace-pre-wrap text-lg leading-snug text-gray-800 font-medium tracking-tight">
                  {filmmaker.bio}
                </p>
              </section>
            )}

            {/* 전문 분야 */}
            {filmmaker.specialties && filmmaker.specialties.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold tracking-tight">
                  SPECIALTIES
                </h2>
                <div className="flex flex-wrap gap-2">
                  {filmmaker.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-red-50 px-4 py-2 text-red-600 font-semibold"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 경력 */}
            {filmmaker.experience && filmmaker.experience.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold tracking-tight">
                  EXPERIENCE
                </h2>
                <ul className="space-y-3">
                  {filmmaker.experience.map((exp, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 border-l-2 border-red-200 pl-4"
                    >
                      <span className="text-red-600 font-bold">▸</span>
                      <span className="text-gray-800 font-medium tracking-tight">{exp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 보유 장비 */}
            {filmmaker.equipment && filmmaker.equipment.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold tracking-tight">
                  EQUIPMENT
                </h2>
                <div className="flex flex-wrap gap-2">
                  {filmmaker.equipment.map((item, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-4 py-2 text-gray-800 font-semibold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 팀 멤버 */}
            {filmmaker.type === "team" &&
              filmmaker.teamMembers &&
              filmmaker.teamMembers.length > 0 && (
                <section>
                  <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold tracking-tight">
                    TEAM MEMBERS
                  </h2>
                  <div className="space-y-3">
                    {filmmaker.teamMembers.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 border-l-2 border-red-200 pl-4"
                      >
                        <div>
                          <span className="font-bold text-red-600">
                            {member.name}
                          </span>
                          <span className="ml-2 text-gray-700 font-medium">
                            - {member.role}
                          </span>
                          {member.profileLink && (
                            <a
                              href={member.profileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-red-600 hover:text-red-500 hover:underline font-semibold"
                            >
                              프로필 →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* 제작 영화 */}
            {movies.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold tracking-tight">
                  FILMOGRAPHY
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {movies.map((movie) => (
                    <Link key={movie.id} href={`/movies/${movie.id}`}>
                      <Card className="border-gray-200 bg-white hover:border-red-300 hover:shadow-lg transition-all cursor-pointer shadow-sm">
                        <CardContent className="p-0">
                          {movie.thumbnailUrl && (
                            <div className="aspect-video overflow-hidden">
                              <LazyImage
                                src={movie.thumbnailUrl}
                                alt={movie.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                              {movie.title}
                            </h3>
                            <p className="text-sm text-gray-700 line-clamp-2 font-medium tracking-tight">
                              {movie.logline}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 갤러리 */}
            {filmmaker.gallery && filmmaker.gallery.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold tracking-tight">
                  GALLERY
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {filmmaker.gallery.map((item, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-lg cinematic-shadow"
                    >
                      <img
                        src={item.url}
                        alt={`Gallery ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 우측: 사이드바 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* 프로필 정보 */}
              <div className="rounded-lg border border-yellow-600/20 bg-gray-900/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">
                  프로필 정보
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">유형</span>
                    <span className="text-white">
                      {filmmaker.type === "team" ? "팀" : "개인"}
                    </span>
                  </div>
                  {filmmaker.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-semibold">지역</span>
                      <span className="text-white">{filmmaker.location}</span>
                    </div>
                  )}
                  {filmmaker.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">이메일</span>
                      <a
                        href={`mailto:${filmmaker.email}`}
                        className="text-red-600 hover:text-red-500 font-semibold"
                      >
                        연락하기
                      </a>
                    </div>
                  )}
                  {filmmaker.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-semibold">전화번호</span>
                      <a
                        href={`tel:${filmmaker.phone}`}
                        className="text-red-600 hover:text-red-500 font-semibold"
                      >
                        연락하기
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 제작 영화 통계 */}
              <div className="rounded-lg border border-yellow-600/20 bg-gray-900/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">
                  제작 통계
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {movies.length}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">제작 영화</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
