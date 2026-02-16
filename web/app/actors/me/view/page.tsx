"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getActorByUserId, Actor, extractVideoId, getAgeRangeLabel } from "@/lib/actors";
import { getUserMovieRatings, MovieRatingWithMovie } from "@/lib/movieRatings";
import { getUnreadRequestCount } from "@/lib/requests";
import { Button } from "@/components/ui/button";
import { HexagonChart } from "@/components/HexagonChart";

export default function ActorProfileViewPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  const [movieRatings, setMovieRatings] = useState<MovieRatingWithMovie[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 인증 상태가 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 사용자가 없으면 로그인 페이지로
    if (!user) {
      router.push("/login");
      return;
    }

    // 사용자 프로필이 로딩되었을 때
    if (userProfile) {
      // 역할이 없으면 역할 선택 페이지로
      if (!userProfile.role) {
        router.push("/role-select");
        return;
      }
      // 역할이 actor가 아니면 역할 선택 페이지로
      if (userProfile.role !== "actor") {
        router.push("/role-select");
        return;
      }
      // 역할이 actor면 프로필 로드
      loadProfile();
      loadUnreadCount();
    }
  }, [user, userProfile, authLoading]);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await getUnreadRequestCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const actorData = await getActorByUserId(user.uid);
      if (!actorData) {
        // 프로필이 없으면 수정 페이지로 리다이렉트
        router.push("/actors/me/edit");
        return;
      }
      setActor(actorData);
      
      // 영화 평점 로드
      if (user) {
        loadMovieRatings(user.uid);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMovieRatings = async (userId: string) => {
    try {
      setRatingsLoading(true);
      const { ratings } = await getUserMovieRatings(userId, { limitCount: 10 });
      
      // movieTitle이 이미 포함되어 있음
      setMovieRatings(ratings);
    } catch (error) {
      console.error("Error loading movie ratings:", error);
    } finally {
      setRatingsLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            <p className="mt-4 text-gray-400">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!actor) {
    return null;
  }

  const demoVideoId = actor.demoUrl && actor.demoPlatform
    ? extractVideoId(actor.demoUrl, actor.demoPlatform)
    : null;
  const embedUrl =
    actor.demoPlatform === "youtube" && demoVideoId
      ? `https://www.youtube.com/embed/${demoVideoId}`
      : actor.demoPlatform === "vimeo" && demoVideoId
      ? `https://player.vimeo.com/video/${demoVideoId}`
      : null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 히어로 섹션 - 배경만 */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden border-b border-gray-200 bg-gradient-to-b from-indigo-50 via-violet-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        
        {/* 상단 네비게이션 */}
        <div className="absolute left-0 right-0 top-0 z-20">
          <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-6 gap-2">
            <Link
              href="/actors"
              className="rounded-full bg-white/90 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-900 backdrop-blur-sm transition-colors hover:bg-gray-50 border border-gray-200 shadow-sm font-semibold whitespace-nowrap"
            >
              ← 배우 목록
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/requests">
                <Button
                  variant="outline"
                  className="relative border-red-400 text-red-500 hover:bg-red-50 text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
                >
                  요청 확인
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-600 text-[10px] md:text-xs font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Button
                onClick={() => router.push("/actors/me/edit")}
                className="btn-primary-gradient text-white font-semibold text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 whitespace-nowrap"
              >
                프로필 수정
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="grid gap-6 md:gap-12 lg:grid-cols-3">
          {/* 좌측: 메인 정보 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 프로필 헤더 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 pb-6 md:pb-8 border-b border-gray-200">
              {/* 프로필 사진 */}
              <div className="flex-shrink-0 w-full md:w-auto">
                <div className="relative h-32 w-32 mx-auto md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-red-200 shadow-lg">
                  {actor.mainPhotoUrl ? (
                    <img
                      src={actor.mainPhotoUrl}
                      alt={actor.stageName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <span className="text-4xl md:text-5xl">🎭</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 기본 정보 */}
              <div className="flex-1">
                <h1 className="mb-4 text-4xl md:text-5xl font-bold film-gold">
                  {actor.stageName}
                </h1>
                <div className="flex flex-wrap gap-4 text-lg">
                  <span className="text-red-600 font-semibold">
                    {getAgeRangeLabel(actor.ageRange)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-700">{actor.location}</span>
                  {actor.heightCm && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-700">{actor.heightCm}cm</span>
                    </>
                  )}
                  {actor.bodyType && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-700">{actor.bodyType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* 자기소개 */}
            {actor.bio && (
              <section>
                <h2 className="mb-2 md:mb-3 lg:mb-4 border-b border-gray-200 pb-1.5 md:pb-2 text-lg md:text-xl lg:text-2xl font-bold film-gold tracking-tight">
                  PROFILE
                </h2>
                <p className="whitespace-pre-wrap text-sm md:text-base lg:text-lg leading-snug text-gray-700 tracking-tight">
                  {actor.bio}
                </p>
              </section>
            )}

            {/* 연락처 */}
            {(actor.email || actor.phone) && (
              <section>
                <h2 className="mb-2 md:mb-3 lg:mb-4 border-b border-gray-200 pb-1.5 md:pb-2 text-lg md:text-xl lg:text-2xl font-bold film-gold tracking-tight">
                  CONTACT
                </h2>
                <div className="space-y-3">
                  {actor.email && (
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-semibold min-w-[80px] tracking-tight">이메일</span>
                      <a
                        href={`mailto:${actor.email}`}
                        className="text-gray-700 hover:text-red-500 hover:underline tracking-tight"
                      >
                        {actor.email}
                      </a>
                    </div>
                  )}
                  {actor.phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-semibold min-w-[80px] tracking-tight">전화번호</span>
                      <a
                        href={`tel:${actor.phone}`}
                        className="text-gray-700 hover:text-red-500 hover:underline tracking-tight"
                      >
                        {actor.phone}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 데모 릴 */}
            {embedUrl && (
              <section>
                <h2 className="mb-2 md:mb-3 lg:mb-4 border-b border-gray-200 pb-1.5 md:pb-2 text-lg md:text-xl lg:text-2xl font-bold film-gold tracking-tight">
                  DEMO REEL
                </h2>
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 shadow-lg border border-gray-200">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

            {/* 경력 */}
            {actor.experience.length > 0 && (
              <section>
                <h2 className="mb-2 md:mb-3 lg:mb-4 border-b border-gray-200 pb-1.5 md:pb-2 text-lg md:text-xl lg:text-2xl font-bold film-gold tracking-tight">
                  EXPERIENCE
                </h2>
                <ul className="space-y-3">
                  {actor.experience.map((exp, index) => (
                    <li
                      key={index}
                      className="border-l-2 border-red-200 pl-4 text-gray-700 tracking-tight"
                    >
                      {exp}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 스킬 */}
            {actor.skills.length > 0 && (
              <section>
                <h2 className="mb-2 md:mb-3 lg:mb-4 border-b border-gray-200 pb-1.5 md:pb-2 text-lg md:text-xl lg:text-2xl font-bold film-gold tracking-tight">
                  SKILLS
                </h2>
                <div className="flex flex-wrap gap-2">
                  {actor.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-red-50 px-4 py-2 text-red-600 font-medium tracking-tight"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 갤러리 */}
            {actor.gallery && actor.gallery.length > 0 && (
              <section>
                <h2 className="mb-2 md:mb-3 lg:mb-4 border-b border-gray-200 pb-1.5 md:pb-2 text-lg md:text-xl lg:text-2xl font-bold film-gold tracking-tight">
                  GALLERY
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {actor.gallery.map((item, index) => (
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
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">
                  프로필 정보
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">나이대</span>
                    <span className="text-gray-900 font-medium tracking-tight">
                      {getAgeRangeLabel(actor.ageRange)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">지역</span>
                    <span className="text-gray-900 font-medium tracking-tight">{actor.location}</span>
                  </div>
                  {actor.heightCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">키</span>
                      <span className="text-gray-900 font-medium tracking-tight">{actor.heightCm}cm</span>
                    </div>
                  )}
                  {actor.bodyType && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">체형</span>
                      <span className="text-gray-900 font-medium tracking-tight">{actor.bodyType}</span>
                    </div>
                  )}
                  {actor.mbti && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">MBTI</span>
                      <span className="text-red-600 font-bold">{actor.mbti}</span>
                    </div>
                  )}
                  {actor.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">이메일</span>
                      <a
                        href={`mailto:${actor.email}`}
                        className="text-red-600 hover:text-red-500 hover:underline truncate max-w-[150px] font-medium"
                        title={actor.email}
                      >
                        {actor.email}
                      </a>
                    </div>
                  )}
                  {actor.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">전화번호</span>
                      <a
                        href={`tel:${actor.phone}`}
                        className="text-red-600 hover:text-red-500 hover:underline font-medium"
                      >
                        {actor.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">공개 상태</span>
                    <span className={actor.isPublic ? "text-green-400" : "text-gray-400"}>
                      {actor.isPublic ? "공개" : "비공개"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 특성 육각형 차트 */}
              {actor.traits && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-gray-400">
                    특성 분석
                  </h3>
                  <div className="flex justify-center overflow-hidden">
                    <HexagonChart traits={actor.traits} size={240} />
                  </div>
                </div>
              )}

              {/* 영화 평점 */}
              <div className="rounded-lg border border-yellow-200/50 bg-gradient-to-br from-yellow-50 via-red-50 to-pink-50 p-4 md:p-6 lg:p-8 shadow-lg">
                <h3 className="mb-4 text-base md:text-lg font-bold text-red-600 flex items-center gap-2">
                  <span className="text-xl">⭐</span> 내 영화 평점
                </h3>
                {ratingsLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
                  </div>
                ) : movieRatings.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🎬</div>
                    <p className="text-sm text-gray-600 font-medium">아직 평가한 영화가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movieRatings.map((rating) => (
                      <div
                        key={rating.id}
                        className="rounded-lg border border-violet-200/50 bg-white/80 p-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {rating.movieTitle || "영화 제목 없음"}
                            </h4>
                            {rating.review && (
                              <p className="mt-2 text-xs text-gray-700 line-clamp-2 bg-white/60 rounded px-2 py-1">
                                {rating.review}
                              </p>
                            )}
                            {rating.isFavorite && (
                              <span className="inline-block mt-2 text-xs text-violet-600 font-semibold">⭐ 인생영화</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm md:text-base transition-all ${
                                    i < rating.rating
                                      ? "text-violet-500 drop-shadow-sm"
                                      : "text-gray-300"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  href="/movies/ratings"
                  className="mt-4 block text-center bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  영화 평가하기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
