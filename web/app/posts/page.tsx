"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getPosts, Post, PostType, PostCategory } from "@/lib/posts";
import { getUserDisplayName } from "@/lib/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { useToastContext } from "@/components/ToastProvider";

const postTypes: { value: PostType; label: string }[] = [
  { value: "casting_call", label: "구인공고" },
  { value: "actor_seeking", label: "배우 구직" },
  { value: "general", label: "일반" },
];

const categories: { value: PostCategory; label: string }[] = [
  { value: "casting", label: "캐스팅" },
  { value: "seeking", label: "구직" },
  { value: "collaboration", label: "협업" },
  { value: "general", label: "일반" },
];

type SortOption = "latest" | "popular" | "views";

export default function PostsPage() {
  const { user } = useAuth();
  const { error: showError } = useToastContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPosts();
  }, [selectedType, selectedCategory]);

  useEffect(() => {
    loadUserNames();
  }, [posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsData = await getPosts({
        type: selectedType || undefined,
        category: selectedCategory || undefined,
      });
      setPosts(postsData);
    } catch (error) {
      console.error("Error loading posts:", error);
      showError("게시글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    switch (sortBy) {
      case "latest":
        return sorted.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
      case "popular":
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "views":
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      default:
        return sorted;
    }
  }, [posts, sortBy]);

  const loadUserNames = async () => {
    const uniqueUserIds = [...new Set(posts.map((p) => p.authorId))];
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
  };

  const getPostTypeLabel = (type: PostType): string => {
    const typeMap: Record<PostType, string> = {
      casting_call: "구인공고",
      actor_seeking: "배우 구직",
      general: "일반",
    };
    return typeMap[type] || type;
  };

  const getCategoryLabel = (category?: PostCategory): string => {
    if (!category) return "";
    const categoryMap: Record<PostCategory, string> = {
      casting: "캐스팅",
      seeking: "구직",
      collaboration: "협업",
      general: "일반",
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-pink-100 via-pink-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-6 md:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-2 md:mb-4 text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight film-gold px-2">
              COMMUNITY
            </h1>
            <p className="mb-4 md:mb-8 text-base md:text-lg lg:text-xl text-gray-700 font-medium tracking-tight px-2">
              구인공고, 배우 구직, 협업 정보를 공유하세요
            </p>
            {user && (
            <Link href="/posts/new">
              <Button className="btn-primary-gradient text-white font-semibold px-3 md:px-4 lg:px-6 py-1.5 md:py-2 lg:py-3 text-xs md:text-sm lg:text-base w-full sm:w-auto">
                글 작성하기
              </Button>
            </Link>
            )}
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="container mx-auto px-4 py-4 md:py-6 lg:py-8">
        <div className="mb-4 md:mb-6 flex flex-wrap gap-1.5 md:gap-2">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => setSelectedType(null)}
            className={`text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 ${
              selectedType === null
                ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md hover:shadow-lg"
                : "border-red-300 text-red-600 hover:bg-red-50"
            }`}
          >
            전체
          </Button>
          {postTypes.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              onClick={() => setSelectedType(type.value)}
              className={`text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 ${
                selectedType === type.value
                  ? "bg-yellow-600 text-black hover:bg-yellow-500"
                  : "border-red-300 text-red-600 hover:bg-red-50"
              }`}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* 게시글 목록 */}
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedPosts.length === 0 ? (
          <EmptyState type="posts" />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 tracking-tight">
                총 {sortedPosts.length}개의 게시글
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="latest" className="text-gray-700 hover:bg-red-50">최신순</SelectItem>
                  <SelectItem value="popular" className="text-gray-700 hover:bg-red-50">인기순</SelectItem>
                  <SelectItem value="views" className="text-gray-700 hover:bg-red-50">조회순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              {sortedPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="border-gray-200 bg-white transition-all hover:border-red-300 hover:shadow-lg cursor-pointer shadow-sm">
                  <CardContent className="p-3 md:p-4 lg:p-6">
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-2 md:gap-3 flex-wrap">
                          <span className="rounded-full bg-red-50 px-2 md:px-3 py-0.5 md:py-1 text-xs font-semibold text-red-600 tracking-tight">
                            {getPostTypeLabel(post.type)}
                          </span>
                          {post.category && (
                            <span className="rounded-full bg-gray-100 px-2 md:px-3 py-0.5 md:py-1 text-xs text-gray-700 tracking-tight">
                              {getCategoryLabel(post.category)}
                            </span>
                          )}
                          {post.location && (
                            <span className="rounded-full bg-gray-100 px-2 md:px-3 py-0.5 md:py-1 text-xs text-gray-700 tracking-tight">
                              {post.location}
                            </span>
                          )}
                        </div>
                        <h3 className="mb-2 text-base md:text-lg lg:text-xl font-bold text-gray-900 line-clamp-1 tracking-tight">
                          {post.title}
                        </h3>
                        <p className="mb-3 line-clamp-2 text-xs md:text-sm lg:text-base text-gray-600 leading-snug tracking-tight">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 tracking-tight">
                          <span>{userNames[post.authorId] || "작성자"}</span>
                          <span>•</span>
                          <span>
                            {post.createdAt?.toDate
                              ? new Date(post.createdAt.toDate()).toLocaleDateString("ko-KR")
                              : "날짜 없음"}
                          </span>
                          <span>•</span>
                          <span>조회 {post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
