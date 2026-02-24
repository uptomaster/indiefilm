"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createPost, PostType, PostCategory } from "@/lib/posts";
import { getMovies } from "@/lib/movies";
import { getActors } from "@/lib/actors";
import { Movie } from "@/lib/movies";
import { Actor } from "@/lib/actors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { IndiePageWrapper } from "@/components/IndiePageWrapper";

const postSchema = z.object({
  type: z.enum(["casting_call", "actor_seeking", "staff_recruitment", "general"], {
    message: "게시글 유형을 선택해주세요",
  }),
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이하로 입력해주세요"),
  content: z.string().min(10, "내용을 최소 10자 이상 입력해주세요"),
  category: z.enum(["casting", "seeking", "collaboration", "general"]).optional(),
  location: z.string().optional(),
  requirements: z.string().optional(),
  movieId: z.string().optional(),
  actorId: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type PostForm = z.infer<typeof postSchema>;

export default function NewPostPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [formData, setFormData] = useState<PostForm>({
    type: "general",
    title: "",
    content: "",
    category: undefined,
    location: "",
    requirements: "",
    movieId: undefined,
    actorId: undefined,
    isPublic: true,
  });

  useEffect(() => {
    // 인증 로딩이 완료된 후에만 체크
    if (authLoading) {
      return;
    }
    
    if (!user) {
      router.push("/login");
      return;
    }

    // 역할별 기본 게시글 유형
    if (userProfile?.role === "filmmaker") {
      setFormData((prev) => ({ ...prev, type: "casting_call" }));
    } else if (userProfile?.role === "actor") {
      setFormData((prev) => ({ ...prev, type: "actor_seeking" }));
    } else if (userProfile?.role === "venue") {
      setFormData((prev) => ({ ...prev, type: "general" }));
    }

    loadRelatedData();
  }, [user, userProfile]);

  const loadRelatedData = async () => {
    try {
      if (userProfile?.role === "filmmaker") {
        const { movies: myMovies } = await getMovies({ limitCount: 50 });
        setMovies(myMovies.filter((m) => m.filmmakerId === user?.uid));
      } else if (userProfile?.role === "actor") {
        const { actors: allActors } = await getActors({ limitCount: 50 });
        setActors(allActors.filter((a) => a.userId === user?.uid));
      }
    } catch (error) {
      console.error("Error loading related data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    try {
      setLoading(true);
      setError(null);

      // 유효성 검사
      const validatedData = postSchema.parse(formData);

      // requirements를 배열로 변환
      const requirements = validatedData.requirements
        ? validatedData.requirements.split(",").map((r) => r.trim()).filter((r) => r)
        : undefined;

      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      console.log("게시글 작성 시작:", {
        userId: user.uid,
        userRole: userProfile?.role || "viewer",
        validatedData,
      });

      const postId = await createPost(user.uid, userProfile?.role || "viewer", {
        type: validatedData.type,
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category,
        location: validatedData.location || undefined,
        requirements,
        movieId: validatedData.movieId || undefined,
        actorId: validatedData.actorId || undefined,
        isPublic: validatedData.isPublic,
      });

      router.push(`/posts/${postId}`);
    } catch (err: any) {
      console.error("Error creating post:", err);
      if (err.errors) {
        setError(err.errors.map((e: any) => e.message).join(", "));
      } else {
        setError(err.message || "게시글 작성에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <IndiePageWrapper title="글 작성하기" subtitle="커뮤니티에 글을 작성하세요" sectionNum="">
      <Link href="/posts" className="mb-6 inline-block text-[#e8a020] hover:text-[#e8a020]/80">
        ← 커뮤니티로
      </Link>
      <div className="mx-auto max-w-3xl">
        <Card className="border-[#5a5248]/30 bg-[#100e0a]">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-[#e8a020]/20 border border-[#e8a020]/50 p-4 text-[#e8a020]">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-[#f0e8d8]">
                    게시글 유형 *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value as PostType }))
                    }
                  >
                    <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#100e0a] border-[#5a5248]/30">
                      <SelectItem value="casting_call" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        오디션 공고
                      </SelectItem>
                      <SelectItem value="staff_recruitment" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        스태프 구인
                      </SelectItem>
                      <SelectItem value="actor_seeking" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        배우 구직
                      </SelectItem>
                      <SelectItem value="general" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        일반
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[#f0e8d8]">
                    제목 *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="게시글 제목을 입력하세요"
                    className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-[#f0e8d8]">
                    내용 *
                  </Label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="게시글 내용을 입력하세요"
                    rows={10}
                    className="w-full rounded-md border border-[#5a5248] bg-[#181410] px-3 py-2 text-[#faf6f0] placeholder:text-[#5a5248] focus:border-[#e8a020] focus:outline-none focus:ring-1 focus:ring-[#e8a020]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[#f0e8d8]">
                    카테고리
                  </Label>
                  <Select
                    value={formData.category || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: value === "none" ? undefined : (value as PostCategory),
                      }))
                    }
                  >
                    <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]">
                      <SelectValue placeholder="선택 안 함" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#100e0a] border-[#5a5248]/30">
                      <SelectItem value="none" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        선택 안 함
                      </SelectItem>
                      <SelectItem value="casting" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        캐스팅
                      </SelectItem>
                      <SelectItem value="seeking" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        구직
                      </SelectItem>
                      <SelectItem value="collaboration" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        협업
                      </SelectItem>
                      <SelectItem value="general" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                        일반
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-[#f0e8d8]">
                    지역
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="예: 서울, 부산"
                    className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                  />
                </div>

                {/* 요구사항 (오디션/스태프 구인인 경우) */}
                {(formData.type === "casting_call" || formData.type === "staff_recruitment") && (
                  <div className="space-y-2">
                    <Label htmlFor="requirements" className="text-[#f0e8d8]">
                      요구사항 (쉼표로 구분)
                    </Label>
                    <Input
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, requirements: e.target.value }))
                      }
                      placeholder="예: 나이대 20대, 키 170cm 이상"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                    />
                  </div>
                )}

                {/* 관련 영화 (제작자인 경우) */}
                {userProfile?.role === "filmmaker" && movies.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="movieId" className="text-[#f0e8d8]">
                      관련 영화 (선택)
                    </Label>
                    <Select
                      value={formData.movieId || "none"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          movieId: value === "none" ? undefined : value,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]">
                        <SelectValue placeholder="선택 안 함" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#100e0a] border-[#5a5248]/30">
                        <SelectItem value="none" className="text-[#faf6f0] hover:bg-[#e8a020]/10">
                          선택 안 함
                        </SelectItem>
                        {movies.map((movie) => (
                          <SelectItem
                            key={movie.id}
                            value={movie.id}
                            className="text-[#faf6f0] hover:bg-[#e8a020]/10"
                          >
                            {movie.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 공개 설정 */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                    }
                    className="h-5 w-5 rounded border-[#5a5248] bg-[#181410] text-[#e8a020] focus:ring-[#e8a020] cursor-pointer"
                  />
                  <Label htmlFor="isPublic" className="text-[#f0e8d8] cursor-pointer">
                    공개
                  </Label>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/posts")}
                    className="flex-1 border-[#5a5248] text-[#f0e8d8] hover:bg-[#181410]"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary-gradient"
                  >
                    {loading ? "작성 중..." : "작성하기"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
    </IndiePageWrapper>
  );
}
