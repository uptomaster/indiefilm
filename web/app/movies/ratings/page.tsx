"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserMovieRatings,
  createOrUpdateMovieRating,
  MovieRating,
} from "@/lib/movieRatings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MovieRatingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ratings, setRatings] = useState<MovieRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRating, setEditingRating] = useState<MovieRating | null>(null);
  
  // 폼 상태
  const [movieTitle, setMovieTitle] = useState("");
  const [movieThumbnail, setMovieThumbnail] = useState("");
  const [movieYear, setMovieYear] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 인증 로딩이 완료된 후에만 체크
    if (authLoading) {
      return;
    }
    
    if (user) {
      loadRatings();
    } else {
      router.push("/login");
    }
  }, [user, authLoading]);

  const loadRatings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { ratings: userRatings } = await getUserMovieRatings(user.uid);
      setRatings(userRatings);
    } catch (error) {
      console.error("Error loading ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMovieTitle("");
    setMovieThumbnail("");
    setMovieYear("");
    setRating(5);
    setReview("");
    setIsFavorite(false);
    setEditingRating(null);
    setShowAddForm(false);
  };

  const handleEdit = (rating: MovieRating) => {
    setEditingRating(rating);
    setMovieTitle(rating.movieTitle);
    setMovieThumbnail(rating.movieThumbnail || "");
    setMovieYear(rating.movieYear?.toString() || "");
    setRating(rating.rating);
    setReview(rating.review || "");
    setIsFavorite(rating.isFavorite || false);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !movieTitle.trim()) {
      alert("영화 제목을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      await createOrUpdateMovieRating(user.uid, {
        movieTitle: movieTitle.trim(),
        movieThumbnail: movieThumbnail.trim() || undefined,
        movieYear: movieYear ? parseInt(movieYear) : undefined,
        rating,
        review: review.trim() || undefined,
        isFavorite,
      });

      alert(editingRating ? "평점이 수정되었습니다!" : "평점이 추가되었습니다!");
      resetForm();
      loadRatings();
    } catch (error) {
      console.error("Error saving rating:", error);
      alert("평점 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
            <p className="mt-4 text-[#b8a898]">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold film-gold">내 영화 평점</h1>
            <p className="mt-2 text-[#b8a898]">
              좋아하는 영화를 평가하고 인생영화로 등록하세요
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary-gradient"
          >
            {showAddForm ? "취소" : "+ 영화 추가"}
          </Button>
        </div>

        {/* 추가/수정 폼 */}
        {showAddForm && (
          <Card className="mb-8 border-[#e8a020]/20 bg-white">
            <CardHeader>
              <CardTitle className="text-[#e8a020]">
                {editingRating ? "평점 수정" : "새 영화 추가"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="movieTitle" className="text-[#e8a020]">
                    영화 제목 *
                  </Label>
                  <Input
                    id="movieTitle"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    placeholder="예: 인셉션"
                    required
                    className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="movieYear" className="text-[#e8a020]">
                      제작 연도 (선택)
                    </Label>
                    <Input
                      id="movieYear"
                      type="number"
                      value={movieYear}
                      onChange={(e) => setMovieYear(e.target.value)}
                      placeholder="예: 2010"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="movieThumbnail" className="text-[#e8a020]">
                      포스터 URL (선택)
                    </Label>
                    <Input
                      id="movieThumbnail"
                      type="url"
                      value={movieThumbnail}
                      onChange={(e) => setMovieThumbnail(e.target.value)}
                      placeholder="https://..."
                      className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0]"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#e8a020] mb-2 block">별점</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-3xl transition-transform hover:scale-110 ${
                          star <= rating ? "text-[#e8a020]" : "text-[#b8a898]"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-[#e8a020] font-semibold">
                      {rating}점
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="review" className="text-[#e8a020]">
                    리뷰 (선택)
                  </Label>
                  <textarea
                    id="review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="이 영화에 대한 생각을 남겨주세요..."
                    className="w-full min-h-[100px] rounded-md border border-[#e8a020]/35 bg-[#0d0b08]/80 px-3 py-2 text-white placeholder:text-[#b8a898] focus:border-[#e8a020] focus:outline-none focus:ring-1 focus:ring-[#e8a020]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isFavorite"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="h-5 w-5 rounded border-[#e8a020]/35 bg-[#0d0b08] text-[#e8a020] focus:ring-[#e8a020] cursor-pointer"
                  />
                  <Label htmlFor="isFavorite" className="text-[#f0e8d8] cursor-pointer">
                    ⭐ 인생영화로 등록
                  </Label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary-gradient"
                  >
                    {saving ? "저장 중..." : editingRating ? "수정" : "추가"}
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="border-[#e8a020]/35 text-[#f0e8d8] hover:bg-[#0d0b08]"
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 평점 목록 */}
        {ratings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#b8a898] mb-4">
              아직 평가한 영화가 없습니다
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="btn-primary-gradient"
            >
              첫 영화 추가하기
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ratings.map((rating) => (
              <Card
                key={rating.id}
                className="border-[#e8a020]/30 bg-[#100e0a] hover:border-[#e8a020]/50 transition-colors"
              >
                <CardContent className="p-6">
                  {rating.movieThumbnail && (
                    <img
                      src={rating.movieThumbnail}
                      alt={rating.movieTitle}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-bold text-[#faf6f0] mb-2">
                    {rating.movieTitle}
                  </h3>
                  {rating.movieYear && (
                    <p className="text-sm text-[#b8a898] mb-3">
                      {rating.movieYear}년
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < rating.rating ? "text-[#e8a020]" : "text-[#b8a898]"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    {rating.isFavorite && (
                      <span className="ml-auto text-[#e8a020]">⭐</span>
                    )}
                  </div>
                  {rating.review && (
                    <p className="text-sm text-[#f0e8d8] mb-4 line-clamp-3">
                      {rating.review}
                    </p>
                  )}
                  <Button
                    onClick={() => handleEdit(rating)}
                    variant="outline"
                    className="w-full border-[#e8a020]/35 text-[#e8a020] hover:bg-[#e8a020]/10"
                  >
                    수정
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
