"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getMovieById, Movie, extractVideoId, getGenreLabel, getStatusLabel, getStatusColor } from "@/lib/movies";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getUserMovieRating,
  getUserMovieRatingByTitle,
  createOrUpdateMovieRating,
  getMovieRatings,
  getMovieAverageRating,
  MovieRating,
} from "@/lib/movieRatings";
import { getUserDisplayName } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [userRating, setUserRating] = useState<MovieRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [allRatings, setAllRatings] = useState<MovieRating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.id) {
      loadMovie(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (movie && user) {
      loadUserRating();
    } else {
      setRatingLoading(false);
    }
  }, [movie, user]);

  useEffect(() => {
    if (movie) {
      loadAllRatings();
    }
  }, [movie]);

  const loadMovie = async (movieId: string) => {
    try {
      setLoading(true);
      const movieData = await getMovieById(movieId);
      setMovie(movieData);
    } catch (error) {
      console.error("Error loading movie:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRating = async () => {
    if (!movie || !user) return;

    try {
      setRatingLoading(true);
      // 먼저 movieId로 검색, 없으면 제목으로 검색
      let ratingData = await getUserMovieRating(user.uid, movie.id);
      if (!ratingData) {
        ratingData = await getUserMovieRatingByTitle(user.uid, movie.title);
      }
      if (ratingData) {
        setUserRating(ratingData);
        setRating(ratingData.rating);
        setReview(ratingData.review || "");
        setIsFavorite(ratingData.isFavorite || false);
      }
    } catch (error) {
      console.error("Error loading rating:", error);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleSaveRating = async () => {
    if (!user || !movie) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setSavingRating(true);
      console.log("평점 저장 시작:", { movieId: movie.id, movieTitle: movie.title, rating, review, isFavorite });
      
      // 사이트 영화의 경우 movieTitle도 함께 저장
      await createOrUpdateMovieRating(user.uid, {
        movieId: movie.id,
        movieTitle: movie.title,
        movieThumbnail: movie.thumbnailUrl || undefined,
        movieYear: movie.year || undefined,
        rating,
        review: review.trim() || undefined,
        isFavorite: isFavorite || false,
      });
      
      console.log("평점 저장 완료!");
      await loadUserRating();
      await loadAllRatings(); // 전체 리뷰 목록도 새로고침
      alert("평점이 저장되었습니다!");
    } catch (error: any) {
      console.error("평점 저장 에러:", error);
      console.error("에러 상세:", error.message, error.code);
      alert(`평점 저장에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setSavingRating(false);
    }
  };

  const loadAllRatings = async () => {
    if (!movie) return;

    try {
      setRatingsLoading(true);
      const ratings = await getMovieRatings(movie.id);
      setAllRatings(ratings);
      
      // 평균 평점 계산
      const avg = await getMovieAverageRating(movie.id);
      setAverageRating(avg);
      
      // 사용자 이름 가져오기
      const uniqueUserIds = [...new Set(ratings.map(r => r.userId))];
      const names: Record<string, string> = {};
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const displayName = await getUserDisplayName(userId);
            names[userId] = displayName;
          } catch (error) {
            console.error(`Error loading user name for ${userId}:`, error);
            names[userId] = userId.slice(0, 8);
          }
        })
      );
      
      setUserNames(names);
    } catch (error) {
      console.error("Error loading all ratings:", error);
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleApplyForRole = async () => {
    if (!user || !movie) return;

    if (!userProfile || userProfile.role !== "actor") {
      alert("배우 역할로 로그인해주세요.");
      router.push("/role-select");
      return;
    }

    try {
      setSendingRequest(true);
      await addDoc(collection(db, "requests"), {
        type: "movie_application",
        fromUserId: user.uid,
        toUserId: movie.filmmakerId,
        movieId: movie.id,
        message: `${movie.title}에 출연하고 싶습니다.`,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        read: false,
      });
      alert("출연 희망 요청이 전송되었습니다!");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("요청 전송에 실패했습니다.");
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent" />
            <p className="mt-4 text-gray-400">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="mb-4 text-xl text-gray-400">영화를 찾을 수 없습니다.</p>
            <Link href="/movies">
              <Button className="border-yellow-600/50 bg-yellow-600/10 text-yellow-400 hover:bg-yellow-600/20">
                영화 목록으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const videoId = extractVideoId(movie.videoUrl, movie.videoPlatform);
  const embedUrl =
    movie.videoPlatform === "youtube"
      ? `https://www.youtube.com/embed/${videoId}`
      : `https://player.vimeo.com/video/${videoId}`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 - 배경만 */}
      <div className="relative h-[30vh] min-h-[200px] overflow-hidden border-b border-yellow-900/30 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="film-strip absolute inset-0 opacity-10" />
        
        {/* 상단 네비게이션 */}
        <div className="absolute left-0 right-0 top-0 z-20">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <Link
              href="/movies"
              className="rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              ← 영화 목록
            </Link>
            {userProfile?.role === "actor" && movie.status !== "completed" && (
              <Button
                onClick={handleApplyForRole}
                disabled={sendingRequest}
                className="bg-yellow-600 text-black hover:bg-yellow-500"
              >
                {sendingRequest ? "전송 중..." : "출연 희망하기"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* 좌측: 메인 정보 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 영화 헤더 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-yellow-600/30">
              {/* 썸네일 */}
              <div className="flex-shrink-0">
                <div className="relative h-48 w-36 md:h-56 md:w-40 rounded-lg overflow-hidden border-4 border-yellow-600/30 shadow-2xl">
                  {movie.thumbnailUrl ? (
                    <img
                      src={movie.thumbnailUrl}
                      alt={movie.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <span className="text-4xl md:text-5xl">🎬</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 기본 정보 */}
              <div className="flex-1">
                <h1 className="mb-4 text-4xl md:text-5xl font-bold film-gold">
                  {movie.title}
                </h1>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusColor(movie.status || "production")}`}>
                    {getStatusLabel(movie.status || "production")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-lg">
                  <span className="text-yellow-400">
                    {getGenreLabel(movie.genre)}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">{movie.runtimeMinutes}분</span>
                  {movie.year && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-300">{movie.year}년</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* 영상 */}
            {videoId && (
              <section>
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black cinematic-shadow">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

            {/* 한 줄 요약 */}
            {movie.logline && (
              <section>
                <h2 className="mb-4 border-b border-yellow-600/30 pb-2 text-2xl font-bold film-gold">
                  SYNOPSIS
                </h2>
                <p className="text-lg leading-relaxed text-gray-300">
                  {movie.logline}
                </p>
              </section>
            )}

            {/* 상세 설명 */}
            {movie.description && (
              <section>
                <h2 className="mb-4 border-b border-yellow-600/30 pb-2 text-2xl font-bold film-gold">
                  DESCRIPTION
                </h2>
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-300">
                  {movie.description}
                </p>
              </section>
            )}

            {/* 제작진 */}
            {movie.credits && movie.credits.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-yellow-600/30 pb-2 text-2xl font-bold film-gold">
                  CREDITS
                </h2>
                <div className="space-y-3">
                  {movie.credits.map((credit, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 border-l-2 border-yellow-600/30 pl-4"
                    >
                      <span className="font-semibold text-yellow-400 min-w-[80px]">
                        {credit.role}
                      </span>
                      <span className="text-gray-300">{credit.name}</span>
                      {credit.actorId ? (
                        <Link
                          href={`/actors/${credit.actorId}`}
                          className="ml-auto text-yellow-400 hover:text-yellow-300 hover:underline"
                        >
                          배우 프로필 →
                        </Link>
                      ) : credit.profileLink ? (
                        <a
                          href={credit.profileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-yellow-400 hover:text-yellow-300 hover:underline"
                        >
                          프로필 →
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 전체 리뷰 섹션 */}
            <section>
              <div className="mb-4 flex items-center justify-between border-b border-yellow-600/30 pb-2">
                <h2 className="text-2xl font-bold film-gold">
                  리뷰 ({allRatings.length})
                </h2>
                {averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-yellow-400">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xl ${
                            i < Math.round(averageRating)
                              ? "text-yellow-400"
                              : "text-gray-600"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {ratingsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent" />
                </div>
              ) : allRatings.length === 0 ? (
                <div className="rounded-lg border border-yellow-600/20 bg-gray-900/30 p-8 text-center">
                  <p className="text-gray-400">아직 리뷰가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allRatings.map((rating) => (
                    <Card
                      key={rating.id}
                      className="border-yellow-600/20 bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 flex items-center justify-center text-black font-bold text-lg">
                              {rating.userId.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">
                                  {rating.userId === user?.uid 
                                    ? "나" 
                                    : userNames[rating.userId] || `사용자 ${rating.userId.slice(0, 8)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {rating.createdAt?.toDate
                                    ? new Date(rating.createdAt.toDate()).toLocaleDateString("ko-KR")
                                    : "날짜 없음"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {rating.isFavorite && (
                                  <span className="text-yellow-400">⭐</span>
                                )}
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-lg ${
                                        i < rating.rating
                                          ? "text-yellow-400"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {rating.review && (
                              <p className="mt-2 whitespace-pre-wrap text-gray-300 leading-relaxed">
                                {rating.review}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* 영화 평점 */}
            {user && (
              <section>
                <h2 className="mb-4 border-b border-yellow-600/30 pb-2 text-2xl font-bold film-gold">
                  내 평점
                </h2>
                <Card className="border-yellow-600/20 bg-gray-900/50">
                  <CardContent className="p-6">
                    {ratingLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 별점 */}
                        <div>
                          <Label className="text-yellow-400 font-semibold mb-2 block">
                            별점
                          </Label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`text-3xl transition-transform hover:scale-110 ${
                                  star <= rating
                                    ? "text-yellow-400"
                                    : "text-gray-600"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                            <span className="ml-2 text-yellow-400 font-semibold">
                              {rating}점
                            </span>
                          </div>
                        </div>

                        {/* 리뷰 */}
                        <div>
                          <Label htmlFor="review" className="text-yellow-400 font-semibold mb-2 block">
                            리뷰 (선택)
                          </Label>
                          <textarea
                            id="review"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="이 영화에 대한 생각을 남겨주세요..."
                            className="w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-white placeholder:text-gray-500 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600"
                          />
                        </div>

                        {/* 인생영화 체크박스 */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isFavorite"
                            checked={isFavorite}
                            onChange={(e) => setIsFavorite(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-yellow-600 focus:ring-yellow-600 cursor-pointer"
                          />
                          <Label htmlFor="isFavorite" className="text-gray-300 cursor-pointer">
                            ⭐ 인생영화로 등록
                          </Label>
                        </div>

                        {/* 저장 버튼 */}
                        <Button
                          onClick={handleSaveRating}
                          disabled={savingRating}
                          className="w-full bg-yellow-600 text-black hover:bg-yellow-500"
                        >
                          {savingRating ? "저장 중..." : userRating ? "평점 수정" : "평점 저장"}
                        </Button>

                        {userRating && (
                          <p className="text-xs text-gray-500 text-center">
                            마지막 수정: {new Date(userRating.updatedAt?.toDate?.() || Date.now()).toLocaleDateString("ko-KR")}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          {/* 우측: 사이드바 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6 rounded-lg border border-yellow-600/20 bg-gray-900/50 p-6 backdrop-blur-sm">
              {userProfile?.role === "actor" && movie.status !== "completed" ? (
                <Button
                  onClick={handleApplyForRole}
                  disabled={sendingRequest}
                  className="w-full bg-yellow-600 text-black hover:bg-yellow-500"
                >
                  {sendingRequest ? "전송 중..." : "출연 희망하기"}
                </Button>
              ) : movie.status === "completed" ? (
                <div className="rounded-lg border border-green-600/30 bg-green-600/10 p-4 text-center">
                  <p className="text-sm font-semibold text-green-400">제작완료</p>
                  <p className="mt-1 text-xs text-gray-400">이 영화는 완성된 포트폴리오입니다</p>
                </div>
              ) : !user ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    출연 희망 기능을 사용하려면 배우로 로그인해주세요.
                  </p>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                    >
                      로그인
                    </Button>
                  </Link>
                </div>
              ) : null}

              <div className="space-y-4 border-t border-yellow-600/20 pt-6">
                {/* 평균 평점 */}
                {averageRating > 0 && (
                  <div className="rounded-lg bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 p-4 border border-yellow-600/30">
                    <h3 className="mb-2 text-sm font-semibold text-gray-400">
                      평균 평점
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-yellow-400">
                        {averageRating.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xl ${
                              i < Math.round(averageRating)
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      총 {allRatings.length}명의 평가
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-400">
                    영화 정보
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">장르</span>
                      <span className="text-white">
                        {getGenreLabel(movie.genre)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">러닝타임</span>
                      <span className="text-white">{movie.runtimeMinutes}분</span>
                    </div>
                    {movie.year && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">제작 연도</span>
                        <span className="text-white">{movie.year}년</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
