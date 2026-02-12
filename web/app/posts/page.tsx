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
    <div className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-yellow-900/30 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-5xl font-bold tracking-tight film-gold">
              COMMUNITY
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              구인공고, 배우 구직, 협업 정보를 공유하세요
            </p>
            {user && (
              <Link href="/posts/new">
                <Button className="bg-yellow-600 text-black hover:bg-yellow-500">
                  글 작성하기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => setSelectedType(null)}
            className={
              selectedType === null
                ? "bg-yellow-600 text-black hover:bg-yellow-500"
                : "border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
            }
          >
            전체
          </Button>
          {postTypes.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              onClick={() => setSelectedType(type.value)}
              className={
                selectedType === type.value
                  ? "bg-yellow-600 text-black hover:bg-yellow-500"
                  : "border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
              }
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
              <div className="text-sm text-gray-400">
                총 {sortedPosts.length}개의 게시글
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-yellow-600/30">
                  <SelectItem value="latest" className="text-yellow-400 hover:bg-gray-800">최신순</SelectItem>
                  <SelectItem value="popular" className="text-yellow-400 hover:bg-gray-800">인기순</SelectItem>
                  <SelectItem value="views" className="text-yellow-400 hover:bg-gray-800">조회순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              {sortedPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="border-yellow-600/20 bg-gray-900/50 transition-all hover:border-yellow-600/40 hover:bg-gray-900/70 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-3">
                          <span className="rounded-full bg-yellow-600/20 px-3 py-1 text-xs font-semibold text-yellow-400">
                            {getPostTypeLabel(post.type)}
                          </span>
                          {post.category && (
                            <span className="rounded-full bg-gray-800/50 px-3 py-1 text-xs text-gray-300">
                              {getCategoryLabel(post.category)}
                            </span>
                          )}
                          {post.location && (
                            <span className="rounded-full bg-gray-800/50 px-3 py-1 text-xs text-gray-300">
                              {post.location}
                            </span>
                          )}
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-white line-clamp-1">
                          {post.title}
                        </h3>
                        <p className="mb-3 line-clamp-2 text-gray-400">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
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
