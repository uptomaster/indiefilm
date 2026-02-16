"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getActorById, Actor, extractVideoId, getAgeRangeLabel } from "@/lib/actors";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserMovieRatings, MovieRatingWithMovie } from "@/lib/movieRatings";
import { getMoviesByActorId } from "@/lib/credits";
import { Movie, getGenreLabel } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HexagonChart } from "@/components/HexagonChart";

export default function ActorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [movieRatings, setMovieRatings] = useState<MovieRatingWithMovie[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [actorMovies, setActorMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadActor(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (actor && actor.userId) {
      loadMovieRatings(actor.userId);
    } else {
      setRatingsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor) {
      loadActorMovies(actor.id);
    }
  }, [actor]);

  const loadActor = async (actorId: string) => {
    try {
      setLoading(true);
      const actorData = await getActorById(actorId);
      setActor(actorData);
    } catch (error) {
      console.error("Error loading actor:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMovieRatings = async (userId: string) => {
    try {
      setRatingsLoading(true);
      const { ratings } = await getUserMovieRatings(userId, { limitCount: 10 });
      
      // 영화 정보는 이미 movieRatings에 포함되어 있음 (자유 영화 추가 방식)
      const ratingsWithMovies = ratings.map((rating) => ({
        ...rating,
        movieTitle: rating.movieTitle || "영화 제목 없음",
        movieThumbnail: rating.movieThumbnail,
      }));
      
      setMovieRatings(ratingsWithMovies);
    } catch (error) {
      console.error("Error loading movie ratings:", error);
    } finally {
      setRatingsLoading(false);
    }
  };

  const loadActorMovies = async (actorId: string) => {
    try {
      setMoviesLoading(true);
      const movies = await getMoviesByActorId(actorId);
      setActorMovies(movies);
    } catch (error) {
      console.error("Error loading actor movies:", error);
    } finally {
      setMoviesLoading(false);
    }
  };

  const handleCastingOffer = async () => {
    if (!user || !actor) return;

    if (!userProfile || userProfile.role !== "filmmaker") {
      alert("제작자 역할로 로그인해주세요.");
      router.push("/role-select");
      return;
    }

    try {
      setSendingRequest(true);
      await addDoc(collection(db, "requests"), {
        type: "actor_casting",
        fromUserId: user.uid,
        toUserId: actor.userId,
        actorId: actor.id,
        message: `${actor.stageName}님께 캐스팅 제안을 드립니다.`,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        read: false,
      });
      alert("캐스팅 제안이 전송되었습니다!");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("요청 전송에 실패했습니다.");
    } finally {
      setSendingRequest(false);
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

  if (!actor) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="mb-4 text-xl text-gray-800 font-semibold">
              배우 프로필을 찾을 수 없습니다.
            </p>
            <Link href="/actors">
              <Button className="border-red-300 bg-red-50 text-red-600 hover:bg-red-100 font-semibold">
                배우 목록으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const demoVideoId =
    actor.demoUrl && actor.demoPlatform
      ? extractVideoId(actor.demoUrl, actor.demoPlatform)
      : null;
  const embedUrl =
    actor.demoPlatform === "youtube" && demoVideoId
      ? `https://www.youtube.com/embed/${demoVideoId}`
      : actor.demoPlatform === "vimeo" && demoVideoId
      ? `https://player.vimeo.com/video/${demoVideoId}`
      : null;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* 히어로 섹션 - 배경만 */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden border-b border-gray-200 bg-gradient-to-b from-pink-50 via-white to-pink-50">
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
            {userProfile?.role === "filmmaker" && (
              <Button
                onClick={handleCastingOffer}
                disabled={sendingRequest}
                className="btn-primary-gradient text-white font-semibold text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 whitespace-nowrap"
              >
                {sendingRequest ? "전송 중..." : "캐스팅 제안하기"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 lg:py-12">
        <div className="grid gap-4 md:gap-8 lg:gap-12 lg:grid-cols-3">
          {/* 좌측: 메인 정보 */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8">
            {/* 프로필 헤더 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 lg:gap-6 pb-4 md:pb-6 lg:pb-8 border-b border-gray-200">
              {/* 프로필 사진 */}
              <div className="flex-shrink-0">
                <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-gray-200 shadow-2xl">
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
                <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4 text-xs md:text-sm lg:text-base">
                  <span className="text-red-600">
                    {getAgeRangeLabel(actor.ageRange)}
                  </span>
                  <span className="text-gray-800">•</span>
                  <span className="text-gray-800">{actor.location}</span>
                  {actor.heightCm && (
                    <>
                      <span className="text-gray-800">•</span>
                      <span className="text-gray-800">{actor.heightCm}cm</span>
                    </>
                  )}
                  {actor.bodyType && (
                    <>
                      <span className="text-gray-800">•</span>
                      <span className="text-gray-800">{actor.bodyType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* 자기소개 */}
            {actor.bio && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold">
                  PROFILE
                </h2>
                <p className="whitespace-pre-wrap text-sm md:text-base lg:text-lg leading-relaxed text-gray-800">
                  {actor.bio}
                </p>
              </section>
            )}

            {/* 연락처 */}
            {(actor.email || actor.phone) && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold">
                  CONTACT
                </h2>
                <div className="space-y-3">
                  {actor.email && (
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-semibold min-w-[80px]">이메일</span>
                      <a
                        href={`mailto:${actor.email}`}
                        className="text-gray-800 hover:text-red-600 hover:underline"
                      >
                        {actor.email}
                      </a>
                    </div>
                  )}
                  {actor.phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-semibold min-w-[80px]">전화번호</span>
                      <a
                        href={`tel:${actor.phone}`}
                        className="text-gray-800 hover:text-red-600 hover:underline"
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
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold">
                  DEMO REEL
                </h2>
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 cinematic-shadow">
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
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold">
                  EXPERIENCE
                </h2>
                <ul className="space-y-3">
                  {actor.experience.map((exp, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 border-l-2 border-gray-200 pl-4"
                    >
                      <span className="text-red-600">▸</span>
                      <span className="text-gray-800">{exp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 스킬 */}
            {actor.skills.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold">
                  SKILLS
                </h2>
                <div className="flex flex-wrap gap-2">
                  {actor.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-red-600/20 px-4 py-2 text-red-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 출연 영화 */}
            <section>
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold">
                출연 작품 ({actorMovies.length})
              </h2>
              {moviesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                </div>
              ) : actorMovies.length === 0 ? (
                <div className="rounded-lg border border-red-500/20 bg-gray-50 p-4 md:p-8 text-center">
                  <p className="text-gray-400">아직 출연한 영화가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                  {actorMovies.map((movie) => (
                    <Link key={movie.id} href={`/movies/${movie.id}`}>
                      <Card className="group h-full border-red-500/20 bg-gray-50 transition-all hover:scale-105 hover:bg-white/70 hover:border-red-500/40 hover:shadow-lg hover:shadow-yellow-600/20">
                        <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                          {movie.thumbnailUrl ? (
                            <img
                              src={movie.thumbnailUrl}
                              alt={movie.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                              <div className="text-center">
                                <span className="text-5xl opacity-50">🎬</span>
                                <p className="mt-2 text-xs text-gray-500 line-clamp-2 px-2">
                                  {movie.title}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="film-overlay absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </div>
                        <CardContent className="p-3">
                          <h3 className="text-center text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                            {movie.title}
                          </h3>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 갤러리 */}
            {actor.gallery && actor.gallery.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-bold film-gold">
                  GALLERY
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {actor.gallery.map((item, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-lg cinematic-shadow max-w-[200px] mx-auto"
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
            <div className="lg:sticky lg:top-4 md:top-8 space-y-3 md:space-y-4 lg:space-y-6">
              {/* 프로필 정보 */}
              <div className="rounded-lg border border-red-500/20 bg-gray-50 p-4 md:p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">
                  프로필 정보
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">나이대</span>
                    <span className="text-gray-900">
                      {getAgeRangeLabel(actor.ageRange)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">지역</span>
                    <span className="text-gray-900">{actor.location}</span>
                  </div>
                  {actor.heightCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">키</span>
                      <span className="text-gray-900">{actor.heightCm}cm</span>
                    </div>
                  )}
                  {actor.bodyType && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">체형</span>
                      <span className="text-gray-900">{actor.bodyType}</span>
                    </div>
                  )}
                  {actor.mbti && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">MBTI</span>
                      <span className="text-red-600 font-semibold">{actor.mbti}</span>
                    </div>
                  )}
                  {actor.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">이메일</span>
                      <a
                        href={`mailto:${actor.email}`}
                        className="text-red-600 hover:text-red-500 hover:underline truncate max-w-[150px]"
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
                        className="text-red-600 hover:text-red-500 hover:underline"
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
                <div className="rounded-lg border border-red-500/20 bg-gray-50 p-4 md:p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-sm font-semibold text-gray-400">
                    특성 분석
                  </h3>
                  <div className="flex justify-center overflow-hidden">
                    <HexagonChart traits={actor.traits} size={240} />
                  </div>
                </div>
              )}

              {/* 영화 평점 */}
              <div className="rounded-lg border border-red-500/20 bg-gray-50 p-4 md:p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">
                  좋아하는 영화
                </h3>
                {ratingsLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  </div>
                ) : movieRatings.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    아직 평가한 영화가 없습니다
                  </p>
                ) : (
                  <div className="space-y-3">
                    {movieRatings.map((rating) => (
                      <div
                        key={rating.id}
                        className="rounded border border-gray-700/50 bg-gray-800/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {rating.movieTitle || "영화 제목 없음"}
                            </h4>
                            {rating.review && (
                              <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                                {rating.review}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i < rating.rating
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            {rating.isFavorite && (
                              <span className="text-xs text-red-600">⭐ 인생영화</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 캐스팅 제안 버튼 */}
              {userProfile?.role === "filmmaker" && (
                <Button
                  onClick={handleCastingOffer}
                  disabled={sendingRequest}
                  className="w-full bg-red-600 text-black hover:bg-yellow-500"
                >
                  {sendingRequest ? "전송 중..." : "캐스팅 제안하기"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
