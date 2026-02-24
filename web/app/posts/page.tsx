"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getPosts, Post, PostType, PostCategory } from "@/lib/posts";
import { getUserDisplayName } from "@/lib/users";
import { IndiePageWrapper } from "@/components/IndiePageWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { useToastContext } from "@/components/ToastProvider";

const postTypes: { value: PostType; label: string }[] = [
  { value: "casting_call", label: "오디션 공고" },
  { value: "staff_recruitment", label: "스태프 구인" },
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
      casting_call: "오디션 공고",
      staff_recruitment: "스태프 구인",
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
    <IndiePageWrapper title="커뮤니티" subtitle="구인공고, 배우 구직, 협업 정보를 공유하세요" sectionNum="05">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-3 py-1.5 text-xs tracking-wider ${
              selectedType === null ? "bg-[#e8a020] text-[#0a0805]" : "border border-[#5a5248] text-[#8a807a] hover:border-[#e8a020] hover:text-[#e8a020]"
            }`}
          >
            전체
          </button>
          {postTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1.5 text-xs tracking-wider ${
                selectedType === t.value ? "bg-[#e8a020] text-[#0a0805]" : "border border-[#5a5248] text-[#8a807a] hover:border-[#e8a020] hover:text-[#e8a020]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {user && (
          <Link href="/posts/new" className="px-4 py-2 bg-[#e8a020] text-[#0a0805] text-xs tracking-wider font-medium hover:bg-[#f0b030]">
            글 작성하기
          </Link>
        )}
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
              <div className="text-sm text-[#8a807a]">총 {sortedPosts.length}개의 게시글</div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px] bg-[#141210] border-[#e8a020]/25 text-[#faf6f0] h-9 text-sm focus:border-[#e8a020] focus:ring-[#e8a020]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141210] border-[#e8a020]/25">
                  <SelectItem value="latest" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">최신순</SelectItem>
                  <SelectItem value="popular" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">인기순</SelectItem>
                  <SelectItem value="views" className="text-[#f0e8d8] hover:bg-[#e8a020]/10 cursor-pointer">조회순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              {sortedPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="block">
                  <div className="border border-[#5a5248]/30 bg-[#181410] p-4 md:p-6 transition-all hover:border-[#e8a020]/40">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="rounded px-2 py-0.5 bg-[#e8a020]/20 text-[#e8a020] text-xs">{getPostTypeLabel(post.type)}</span>
                      {post.category && <span className="rounded px-2 py-0.5 bg-[#5a5248]/50 text-[#8a807a] text-xs">{getCategoryLabel(post.category)}</span>}
                      {post.location && <span className="rounded px-2 py-0.5 bg-[#5a5248]/50 text-[#8a807a] text-xs">{post.location}</span>}
                    </div>
                    <h3 className="mb-2 text-base md:text-lg font-bold text-[#faf6f0] line-clamp-1">{post.title}</h3>
                    <p className="mb-3 line-clamp-2 text-sm text-[#8a807a]">{post.content}</p>
                    <div className="flex items-center gap-2 text-xs text-[#5a5248]">
                      <span>{userNames[post.authorId] || "작성자"}</span>
                      <span>·</span>
                      <span>{post.createdAt?.toDate?.() ? post.createdAt.toDate().toLocaleDateString("ko-KR") : "—"}</span>
                      <span>·</span>
                      <span>조회 {post.views || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
    </IndiePageWrapper>
  );
}
