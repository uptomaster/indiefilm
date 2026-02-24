"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getPosts, Post, PostCategory } from "@/lib/posts";
import { getUserDisplayName } from "@/lib/users";
import { getComments } from "@/lib/posts";
import { PostCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { useToastContext } from "@/components/ToastProvider";

// 커뮤니티 카테고리 (필수: 자유, 작품리뷰, 촬영팁, 장비, Q&A + 오디션후기)
const COMMUNITY_CATEGORIES: { value: PostCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "free", label: "자유" },
  { value: "casting_review", label: "오디션후기" },
  { value: "review", label: "작품리뷰" },
  { value: "tech", label: "촬영팁" },
  { value: "equipment", label: "장비" },
  { value: "qna", label: "Q&A" },
];

// 기존 카테고리 매핑 (general → 자유 등, undefined → 자유로 간주)
const CATEGORY_FILTER_MAP: Record<string, (PostCategory | undefined)[]> = {
  all: [],
  free: ["free", "general", undefined],
  casting_review: ["casting_review", "casting"],
  review: ["review"],
  tech: ["tech"],
  equipment: ["equipment"],
  qna: ["qna"],
};

const CATEGORY_LABELS: Record<string, string> = {
  free: "자유",
  general: "자유",
  casting_review: "오디션후기",
  casting: "오디션후기",
  review: "작품리뷰",
  tech: "촬영팁",
  equipment: "장비",
  qna: "Q&A",
  seeking: "구직",
  collaboration: "협업",
};

const CATEGORY_CLASS: Record<string, string> = {
  free: "border-[#e8a020]/35 text-[#b8a898]",
  general: "border-[#e8a020]/35 text-[#b8a898]",
  casting_review: "border-[#e8a020]/50 text-[#e8a020]",
  casting: "border-[#e8a020]/50 text-[#e8a020]",
  review: "border-green-500/50 text-green-400",
  tech: "border-blue-500/50 text-blue-400",
  equipment: "border-orange-500/50 text-orange-400",
  qna: "border-purple-500/50 text-purple-400",
};

const POPULAR_TAGS = ["#단편드라마", "#오디션", "#로케이션", "#신인감독", "#무보수", "#촬영팁", "#카메라", "#편집", "#공모전", "#인디씬"];

type SortOption = "latest" | "popular" | "views" | "comments";

export default function CommunityListPage() {
  const { user } = useAuth();
  const { error: showError } = useToastContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      loadUserNames();
      loadCommentCounts();
    }
  }, [posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsData = await getPosts({ limitCount: 200 });
      setPosts(postsData);
    } catch (error) {
      console.error("Error loading posts:", error);
      showError("게시글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadUserNames = async () => {
    const uniqueUserIds = [...new Set(posts.map((p) => p.authorId))];
    const names: Record<string, string> = {};
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const displayName = await getUserDisplayName(userId);
          names[userId] = displayName;
        } catch {
          names[userId] = userId.slice(0, 8);
        }
      })
    );
    setUserNames(names);
  };

  const loadCommentCounts = async () => {
    const counts: Record<string, number> = {};
    await Promise.all(
      posts.slice(0, 20).map(async (post) => {
        try {
          const comments = await getComments(post.id);
          counts[post.id] = comments.length;
        } catch {
          counts[post.id] = 0;
        }
      })
    );
    setCommentCounts(counts);
  };

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = [...posts];

    if (selectedCategory !== "all") {
      const allowed = CATEGORY_FILTER_MAP[selectedCategory] || [selectedCategory];
      filtered = filtered.filter((p) => allowed.includes(p.category));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.content || "").toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "latest":
        return filtered.sort((a, b) => {
          const at = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const bt = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return bt - at;
        });
      case "popular":
      case "views":
        return filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "comments":
        return filtered.sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0));
      default:
        return filtered;
    }
  }, [posts, selectedCategory, searchQuery, sortBy, commentCounts]);

  const hotPosts = useMemo(() => {
    return [...filteredAndSortedPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  }, [filteredAndSortedPosts]);

  const formatTimeAgo = (createdAt: any) => {
    if (!createdAt) return "—";
    const t = createdAt.toMillis ? createdAt.toMillis() : (createdAt.seconds || 0) * 1000;
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 60) return `${m}분 전`;
    if (h < 24) return `${h}시간 전`;
    if (d < 7) return `${d}일 전`;
    return new Date(t).toLocaleDateString("ko-KR");
  };

  const getCategoryLabel = (cat?: PostCategory) =>
    cat ? (CATEGORY_LABELS[cat] || cat) : "";
  const getCategoryClass = (cat?: PostCategory) =>
    cat ? (CATEGORY_CLASS[cat] || "border-[#e8a020]/35 text-[#b8a898]") : "border-[#e8a020]/35 text-[#b8a898]";

  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredAndSortedPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredAndSortedPosts, currentPage]);

  const isNew = (createdAt: any) => {
    const t = createdAt?.toMillis?.() || (createdAt?.seconds || 0) * 1000;
    return Date.now() - t < 24 * 60 * 60 * 1000;
  };

  const isHot = (views: number) => (views || 0) >= 50;

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
      {/* Hero */}
      <div className="pt-[61px] px-5 md:px-10 py-12 md:py-14 bg-[#100e0a] border-b border-[#e8a020]/20 relative overflow-hidden">
        <div className="absolute top-[-60px] right-0 bottom-[-60px] w-[500px] bg-[radial-gradient(ellipse_at_70%_50%,rgba(232,160,32,0.04),transparent_70%)] pointer-events-none" />
        <div className="relative max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2.5 mb-3 text-[10px] tracking-[0.25em] uppercase text-[#e8a020]">
            <span className="w-6 h-px bg-[#e8a020]" />
            인디필름 커뮤니티
          </div>
          <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#faf6f0] mb-2">
            인디씬의 이야기가 흐르는 곳
          </h1>
          <p className="text-[13px] text-[#b8a898] leading-relaxed max-w-[500px] mb-8">
            배우, 제작진, 관객, 장소대여자가 함께 만드는 공간입니다. 경험을 나누고, 질문하고, 연결되세요.
          </p>
          <div className="flex gap-0">
            {[
              { num: filteredAndSortedPosts.length, label: "전체 게시글" },
              { num: filteredAndSortedPosts.filter((p) => isNew(p.createdAt)).length, label: "오늘 게시글" },
              { num: [...new Set(posts.map((p) => p.authorId))].length, label: "활동 회원" },
            ].map((s, i) => (
              <div
                key={i}
                className="py-4 px-6 md:px-7 border border-[#e8a020]/25 border-r-0 last:border-r first:rounded-l last:rounded-r hover:bg-[#e8a020]/5 transition-colors"
              >
                <div className="font-display text-xl md:text-2xl text-[#e8a020] leading-none">
                  {s.num.toLocaleString()}
                </div>
                <div className="text-[10px] tracking-wider text-[#b8a898] mt-1 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_280px] min-h-[calc(100vh-220px)]">
        {/* Left Sidebar */}
        <aside className="hidden lg:block border-r border-[#e8a020]/20 py-8 sticky top-[61px] self-start max-h-[calc(100vh-61px)] overflow-y-auto">
          <div className="mb-2">
            <span className="block text-[9px] tracking-[0.2em] uppercase text-[#b8a898] py-2 px-6">게시판</span>
            <ul>
              <li>
                <Link
                  href="#"
                  onClick={(e) => { e.preventDefault(); setSelectedCategory("all"); }}
                  className={`flex items-center justify-between py-2.5 px-6 text-[13px] transition-all border-l-2 border-transparent ${
                    selectedCategory === "all"
                      ? "text-[#e8a020] bg-[#e8a020]/10 border-[#e8a020] font-medium"
                      : "text-[#b8a898] hover:text-[#f0e8d8] hover:bg-[#e8a020]/5 hover:border-[#e8a020]/30"
                  }`}
                >
                  <span>📋 전체 글</span>
                  <span className="font-display text-sm bg-[#e8a020]/20 text-[#b8a898] px-1.5 py-0.5 rounded min-w-[24px] text-center">
                    {posts.length}
                  </span>
                </Link>
              </li>
              {COMMUNITY_CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <li key={c.value}>
                  <Link
                    href="#"
                    onClick={(e) => { e.preventDefault(); setSelectedCategory(c.value as PostCategory); }}
                    className={`flex items-center justify-between py-2.5 px-6 text-[13px] transition-all border-l-2 border-transparent ${
                      selectedCategory === c.value
                        ? "text-[#e8a020] bg-[#e8a020]/10 border-[#e8a020] font-medium"
                        : "text-[#b8a898] hover:text-[#f0e8d8] hover:bg-[#e8a020]/5 hover:border-[#e8a020]/30"
                    }`}
                  >
                    <span>📋 {c.label}</span>
                    <span className="font-display text-sm bg-[#e8a020]/20 text-[#b8a898] px-1.5 py-0.5 rounded min-w-[24px] text-center">
                      {posts.filter((p) => {
                        const allowed = CATEGORY_FILTER_MAP[c.value];
                        if (!allowed?.length) return false;
                        return allowed.includes(p.category);
                      }).length}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="h-px bg-[#e8a020]/20 mx-6 my-3" />
          <div className="mb-2">
            <span className="block text-[9px] tracking-[0.2em] uppercase text-[#b8a898] py-2 px-6">내 활동</span>
            <ul>
              {[
                { href: "/posts?mine=1", label: "내가 쓴 글" },
                { href: "#", label: "내가 쓴 댓글" },
                { href: "#", label: "좋아요한 글" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="flex items-center py-2.5 px-6 text-[13px] text-[#b8a898] hover:text-[#e8a020] hover:bg-[#e8a020]/5 transition-all border-l-2 border-transparent hover:border-[#e8a020]/30">
                    📝 {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="h-px bg-[#e8a020]/20 mx-6 my-3" />
          <div className="px-6">
            <span className="block text-[9px] tracking-[0.2em] uppercase text-[#b8a898] py-2">인기 태그</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag.replace("#", ""))}
                  className="text-[10px] py-1 px-2.5 bg-[#e8a020]/10 text-[#b8a898] hover:text-[#e8a020] hover:border-[#e8a020]/30 border border-transparent transition-all rounded"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 md:p-5 border-b border-[#e8a020]/20 bg-[#100e0a] sticky top-[61px] z-50">
            <div className="flex gap-0 flex-1 flex-wrap">
              {COMMUNITY_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedCategory(c.value as PostCategory)}
                  className={`py-1.5 px-4 text-[11px] tracking-wider border border-[#e8a020]/35 border-r-0 last:border-r transition-all ${
                    selectedCategory === c.value
                      ? "bg-[#e8a020]/10 text-[#e8a020] border-[#e8a020]/40"
                      : "text-[#b8a898] hover:text-[#f0e8d8]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#0d0b08] border border-[#e8a020]/35 text-[#b8a898] py-1.5 px-3 text-[11px] outline-none focus:border-[#e8a020]"
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="comments">댓글많은순</option>
              <option value="views">조회수순</option>
            </select>
            <div className="flex gap-0 ml-auto">
              <input
                type="text"
                placeholder="커뮤니티 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0d0b08] border border-[#e8a020]/35 border-r-0 py-1.5 px-3.5 text-[12px] text-[#f0e8d8] placeholder:text-[#b8a898] w-[160px] md:w-[180px] outline-none focus:border-[#e8a020]"
              />
              <button className="bg-[#0d0b08] border border-[#e8a020]/35 text-[#b8a898] py-1.5 px-3.5 text-[12px] hover:text-[#e8a020]">
                🔍
              </button>
            </div>
          </div>

          {/* Pinned Post (공지) */}
          <Link
            href="/posts"
            className="block mx-4 md:mx-8 mt-5 p-5 bg-[#e8a020]/5 border border-[#e8a020]/25 hover:bg-[#e8a020]/10 transition-colors"
          >
            <div className="flex gap-5">
              <span className="text-base text-[#e8a020]">📌</span>
              <div>
                <div className="text-[9px] tracking-wider uppercase text-[#e8a020] mb-1">공지사항</div>
                <div className="text-sm font-medium text-[#faf6f0]">
                  제8회 인디필름 어워즈 출품작 접수 시작 (3/1 ~ 4/30) — 단편·장편 모두 가능, 참가비 무료
                </div>
                <div className="text-[11px] text-[#b8a898] mt-1">운영자 · 2025.02.20</div>
              </div>
            </div>
          </Link>

          {/* Post List */}
          <div className="p-4 md:p-8 pb-10">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            ) : paginatedPosts.length === 0 ? (
              <EmptyState type="posts" />
            ) : (
              <div className="space-y-0.5">
                {paginatedPosts.map((post, idx) => {
                  const isFirst = idx === 0 && currentPage === 1;
                  return (
                    <Link key={post.id} href={`/posts/${post.id}`} className="block">
                      {isFirst ? (
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] bg-[#100e0a] hover:bg-[#0d0b08] border-l-[3px] border-transparent hover:border-[#e8a020] transition-all">
                          <div className="p-6 md:p-7">
                            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                              <span className={`text-[9px] tracking-wider uppercase px-2.5 py-1 border rounded ${getCategoryClass(post.category)}`}>
                                {getCategoryLabel(post.category) || "자유"}
                              </span>
                              <span className="text-xs text-[#b8a898]">{userNames[post.authorId] || "작성자"}</span>
                              {isHot(post.views) && <span className="text-[9px] px-2 py-0.5 bg-[#c03020]/15 text-[#c03020] border border-[#c03020]/30">🔥 HOT</span>}
                            </div>
                            <h2 className="font-serif text-lg md:text-xl text-[#faf6f0] mb-2 line-clamp-1">{post.title}</h2>
                            <p className="text-[13px] text-[#b8a898] line-clamp-2 mb-4">{post.content}</p>
                            <div className="flex items-center gap-4 text-[11px] text-[#b8a898]">
                              <span>{formatTimeAgo(post.createdAt)}</span>
                              <div className="flex gap-3">
                                <span>♥ —</span>
                                <span>💬 {commentCounts[post.id] ?? "—"}</span>
                                <span>👁 {post.views || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="hidden md:block bg-gradient-to-br from-[#1a1510] to-[#0f0d0a]" />
                        </div>
                      ) : (
                        <div className="flex bg-[#100e0a] hover:bg-[#0d0b08] border-l-[3px] border-transparent hover:border-[#e8a020]/50 transition-all">
                          <div className="w-12 flex items-center justify-center font-display text-base text-[#b8a898]/60 border-r border-[#e8a020]/10 shrink-0">
                            {(currentPage - 1) * POSTS_PER_PAGE + idx + 1}
                          </div>
                          <div className="flex-1 py-4 px-5 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`text-[9px] tracking-wider uppercase px-2 py-0.5 border rounded ${getCategoryClass(post.category)}`}>
                                {getCategoryLabel(post.category) || "자유"}
                              </span>
                              <span className="text-sm text-[#f0e8d8] truncate">{post.title}</span>
                              {isNew(post.createdAt) && <span className="w-1.5 h-1.5 bg-[#e8a020] rounded-full shrink-0" />}
                              {isHot(post.views) && <span className="text-[9px] px-2 py-0.5 bg-[#c03020]/15 text-[#c03020] border border-[#c03020]/30 shrink-0">🔥 HOT</span>}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[#b8a898]">
                              <span>{userNames[post.authorId] || "작성자"}</span>
                              <span>{formatTimeAgo(post.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-center gap-2 py-4 px-5 shrink-0 min-w-[100px]">
                            <div className="flex gap-3 text-[11px] text-[#b8a898]">
                              <span>♥ —</span>
                              <span>💬 {commentCounts[post.id] ?? "—"}</span>
                            </div>
                            <span className="text-[10px]">👁 {post.views || 0}</span>
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 py-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 text-[11px] border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020]"
                >
                  ← 이전
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-9 h-9 flex items-center justify-center text-xs border ${
                        currentPage === p
                          ? "bg-[#e8a020] border-[#e8a020] text-[#0a0805] font-medium"
                          : "border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 text-[11px] border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020]"
                >
                  다음 →
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block border-l border-[#e8a020]/20 py-8">
          <div className="px-6 pb-5 border-b border-[#e8a020]/15 mb-5">
            <Link
              href="/posts/new"
              className="block w-full bg-[#e8a020] text-[#0a0805] text-center py-3 text-[11px] tracking-wider uppercase font-medium hover:bg-[#f0b030] transition-colors"
            >
              ✏ 새 글 작성
            </Link>
          </div>
          <div className="px-6 pb-7 mb-2 border-b border-[#e8a020]/15">
            <div className="text-[9px] tracking-wider uppercase text-[#e8a020] mb-4">🔥 지금 인기 글</div>
            <div className="flex flex-col gap-0">
              {hotPosts.slice(0, 5).map((post, i) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="flex gap-3 py-3 border-b border-[#e8a020]/10 last:border-0 hover:pl-1.5 transition-all">
                  <span className={`font-display text-xl text-[#b8a898]/60 shrink-0 ${i < 3 ? "text-[#a06c10]" : ""}`}>{i + 1}</span>
                  <div>
                    <div className="text-xs text-[#f0e8d8] line-clamp-2 mb-1 hover:text-[#e8a020]">{post.title}</div>
                    <div className="text-[10px] text-[#b8a898]">♥ {post.views || 0} · 💬 {commentCounts[post.id] ?? 0}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="px-6 pb-7 mb-2 border-b border-[#e8a020]/15">
            <div className="text-[9px] tracking-wider uppercase text-[#e8a020] mb-4">🟢 지금 활동 중</div>
            <div className="flex flex-col gap-2.5">
              {[...new Set(posts.slice(0, 5).map((p) => p.authorId))].slice(0, 5).map((id) => (
                <div key={id} className="flex gap-2.5 items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1510] to-[#0a0805] flex items-center justify-center text-sm">🎭</div>
                  <div>
                    <div className="text-xs text-[#f0e8d8]">{userNames[id] || "—"}</div>
                    <div className="text-[10px] text-[#b8a898]">게시글 열람 중</div>
                  </div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-auto" />
                </div>
              ))}
            </div>
          </div>
          <div className="px-6">
            <div className="text-[9px] tracking-wider uppercase text-[#e8a020] mb-4">📣 공지사항</div>
            <div className="flex flex-col gap-2">
              {[
                { text: "인디필름 어워즈 출품 접수 중", date: "2025.03.01 ~ 04.30" },
                { text: "장소 예약 시스템 업데이트", date: "2025.02.18" },
                { text: "배우 프로필 영상 기능 추가", date: "2025.02.10" },
              ].map((n, i) => (
                <div key={i} className="flex gap-2">
                  <span className="w-1 h-1 mt-1.5 bg-[#e8a020] rounded-full shrink-0" />
                  <div>
                    <div className="text-[11px] text-[#b8a898] leading-relaxed">{n.text}</div>
                    <div className="text-[9px] text-[#b8a898] mt-0.5 tracking-wider">{n.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
