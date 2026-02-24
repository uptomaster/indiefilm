"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getPostById, updatePost, PostCategory } from "@/lib/posts";
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
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이하로 입력해주세요"),
  content: z.string().min(10, "내용을 최소 10자 이상 입력해주세요"),
  category: z.enum(["free", "review", "tech", "equipment", "qna", "casting_review", "casting", "seeking", "collaboration", "general"]).optional(),
  location: z.string().optional(),
  requirements: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type PostForm = z.infer<typeof postSchema>;

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PostForm>({
    title: "",
    content: "",
    category: undefined,
    location: "",
    requirements: "",
    isPublic: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadPost();
  }, [params.id, user, authLoading]);

  const loadPost = async () => {
    const id = params.id as string;
    if (!id) return;
    try {
      setFetching(true);
      const post = await getPostById(id);
      if (!post) {
        router.push("/posts");
        return;
      }
      if (post.authorId !== user?.uid) {
        alert("수정 권한이 없습니다.");
        router.push(`/posts/${id}`);
        return;
      }
      setFormData({
        title: post.title,
        content: post.content,
        category: post.category,
        location: post.location || "",
        requirements: post.requirements?.join(", ") || "",
        isPublic: post.isPublic !== false,
      });
    } catch (e) {
      console.error(e);
      router.push("/posts");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !params.id) return;

    try {
      setLoading(true);
      setError(null);
      const validatedData = postSchema.parse(formData);
      const requirements = validatedData.requirements
        ? validatedData.requirements.split(",").map((r) => r.trim()).filter((r) => r)
        : undefined;

      await updatePost(params.id as string, user.uid, {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category,
        location: validatedData.location || undefined,
        requirements,
        isPublic: validatedData.isPublic,
      });

      router.push(`/posts/${params.id}`);
    } catch (err: any) {
      console.error(err);
      if (err.errors) {
        setError(err.errors.map((e: any) => e.message).join(", "));
      } else {
        setError(err.message || "수정에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-[#0a0805] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <IndiePageWrapper title="글 수정하기" subtitle="게시글을 수정하세요" sectionNum="">
      <Link href={`/posts/${params.id}`} className="mb-6 inline-block text-[#e8a020] hover:text-[#e8a020]/80">
        ← 게시글로
      </Link>
      <div className="mx-auto max-w-3xl">
        <Card className="border-[#e8a020]/30 bg-[#100e0a]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-[#e8a020]/20 border border-[#e8a020]/50 p-4 text-[#e8a020]">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#f0e8d8]">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="게시글 제목을 입력하세요"
                  className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] placeholder:text-[#b8a898] focus:border-[#e8a020] focus:ring-[#e8a020]/20"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-[#f0e8d8]">내용 *</Label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="게시글 내용을 입력하세요"
                  rows={10}
                  className="w-full rounded-md border border-[#e8a020]/35 bg-[#0d0b08] px-3 py-2 text-[#faf6f0] placeholder:text-[#b8a898] focus:border-[#e8a020] focus:outline-none focus:ring-1 focus:ring-[#e8a020]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-[#f0e8d8]">카테고리</Label>
                <Select
                  value={formData.category || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value === "none" ? undefined : (value as PostCategory),
                    }))
                  }
                >
                  <SelectTrigger className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] focus:border-[#e8a020] focus:ring-[#e8a020]/20">
                    <SelectValue placeholder="선택 안 함" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0b08] border-[#e8a020]/35">
                    <SelectItem value="none" className="text-[#faf6f0] hover:bg-[#e8a020]/10">선택 안 함</SelectItem>
                    <SelectItem value="free" className="text-[#faf6f0] hover:bg-[#e8a020]/10">자유</SelectItem>
                    <SelectItem value="review" className="text-[#faf6f0] hover:bg-[#e8a020]/10">작품리뷰</SelectItem>
                    <SelectItem value="tech" className="text-[#faf6f0] hover:bg-[#e8a020]/10">촬영팁</SelectItem>
                    <SelectItem value="equipment" className="text-[#faf6f0] hover:bg-[#e8a020]/10">장비</SelectItem>
                    <SelectItem value="qna" className="text-[#faf6f0] hover:bg-[#e8a020]/10">Q&A</SelectItem>
                    <SelectItem value="casting_review" className="text-[#faf6f0] hover:bg-[#e8a020]/10">오디션후기</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-[#f0e8d8]">지역</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="예: 서울, 부산"
                  className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] placeholder:text-[#b8a898] focus:border-[#e8a020] focus:ring-[#e8a020]/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-[#f0e8d8]">요구사항 (쉼표로 구분)</Label>
                <Input
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                  placeholder="예: 나이대 20대, 키 170cm 이상"
                  className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] placeholder:text-[#b8a898] focus:border-[#e8a020] focus:ring-[#e8a020]/20"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-5 w-5 rounded border-[#e8a020]/35 bg-[#0d0b08] text-[#e8a020] focus:ring-[#e8a020] cursor-pointer"
                />
                <Label htmlFor="isPublic" className="text-[#f0e8d8] cursor-pointer">공개</Label>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/posts/${params.id}`)}
                  className="flex-1 border-[#e8a020]/35 text-[#f0e8d8] hover:bg-[#0d0b08]"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary-gradient"
                >
                  {loading ? "저장 중..." : "저장하기"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </IndiePageWrapper>
  );
}
