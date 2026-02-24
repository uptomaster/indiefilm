"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getPostById,
  getPosts,
  getComments,
  createComment,
  deleteComment,
  deletePost,
  incrementPostViews,
  getMyPosts,
  Post,
  PostComment,
} from "@/lib/posts";
import { getPostViewCount } from "@/lib/postViews";
import {
  getPostLikeCount,
  checkPostLiked,
  togglePostLike,
} from "@/lib/postLikes";
import { checkBookmarked, toggleBookmark } from "@/lib/userBookmarks";
import { checkFollowing, toggleFollow, getFollowerCount } from "@/lib/follows";
import { getUserDisplayName } from "@/lib/users";
import { getMovieById } from "@/lib/movies";
import { getActorById } from "@/lib/actors";
import { Button } from "@/components/ui/button";

const ROLE_LABEL: Record<string, string> = {
  actor: "배우",
  filmmaker: "제작진",
  venue: "장소",
  viewer: "관객",
};

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  review: "border-green-500/50 text-green-400",
  free: "border-[#e8a020]/35 text-[#b8a898]",
  general: "border-[#e8a020]/35 text-[#b8a898]",
  casting_review: "border-[#e8a020]/50 text-[#e8a020]",
  casting: "border-[#e8a020]/50 text-[#e8a020]",
  tech: "border-blue-500/50 text-blue-400",
  equipment: "border-orange-500/50 text-orange-400",
  qna: "border-purple-500/50 text-purple-400",
};

const AVATAR_GRADIENTS = [
  "from-[#301020] to-[#180810]",
  "from-[#102030] to-[#081018]",
  "from-[#201a10] to-[#100c08]",
  "from-[#103020] to-[#081810]",
  "from-[#201030] to-[#100818]",
  "from-[#302010] to-[#181008]",
  "from-[#102028] to-[#081018]",
  "from-[#281828] to-[#181018]",
];

function getCategoryLabel(cat?: string) {
  const m: Record<string, string> = {
    free: "자유", review: "작품리뷰", tech: "촬영팁", equipment: "장비", qna: "Q&A",
    casting_review: "오디션후기", casting: "캐스팅", seeking: "구직", collaboration: "협업", general: "자유",
  };
  return cat ? m[cat] || cat : "";
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [actorName, setActorName] = useState("");
  const [commentUserNames, setCommentUserNames] = useState<Record<string, string>>({});
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [authorPostCount, setAuthorPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const viewsIncremented = useRef(false);

  useEffect(() => {
    if (params.id) loadPost();
  }, [params.id]);

  useEffect(() => {
    if (!post) return;
    loadComments();
    loadAuthorName();
    loadRelatedInfo();
    if (!viewsIncremented.current) {
      viewsIncremented.current = true;
      incrementPostViews(post.id);
    }
    loadLikeState();
    loadBookmarkState();
    loadFollowState();
    loadAuthorStats();
    loadViewCount();
  }, [post, user]);

  const loadViewCount = async () => {
    if (!post) return;
    try {
      const vc = await getPostViewCount(post.id);
      setViewCount((post.views || 0) + vc);
    } catch (e) {
      setViewCount(post.views || 0);
    }
  };

  useEffect(() => {
    loadAllPostsForNav();
  }, [post?.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    loadCommentUserNames();
  }, [comments]);

  const loadPost = async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      const data = await getPostById(params.id as string);
      if (!data) {
        router.push("/posts");
        return;
      }
      setPost(data);
    } catch (e) {
      console.error(e);
      router.push("/posts");
    } finally {
      setLoading(false);
    }
  };

  const loadAllPostsForNav = async () => {
    if (!post) return;
    try {
      const posts = await getPosts({ limitCount: 200 });
      setAllPosts(posts);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuthorName = async () => {
    if (!post) return;
    try {
      setAuthorName(await getUserDisplayName(post.authorId));
    } catch {
      setAuthorName(post.authorId.slice(0, 8));
    }
  };

  const loadRelatedInfo = async () => {
    if (!post) return;
    try {
      if (post.movieId) {
        const m = await getMovieById(post.movieId);
        if (m) setMovieTitle(m.title);
      }
      if (post.actorId) {
        const a = await getActorById(post.actorId);
        if (a) setActorName(a.stageName);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadComments = async () => {
    if (!post) return;
    try {
      setComments(await getComments(post.id));
    } catch (e) {
      console.error(e);
    }
  };

  const loadLikeState = async () => {
    if (!post) return;
    try {
      const [count, isLiked] = await Promise.all([
        getPostLikeCount(post.id),
        user ? checkPostLiked(post.id, user.uid) : Promise.resolve(false),
      ]);
      setLikeCount(count);
      setLiked(isLiked);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBookmarkState = async () => {
    if (!post || !user) return;
    try {
      setBookmarked(await checkBookmarked(user.uid, post.id));
    } catch (e) {
      console.error(e);
    }
  };

  const loadFollowState = async () => {
    if (!post || !user || user.uid === post.authorId) return;
    try {
      setFollowing(await checkFollowing(user.uid, post.authorId));
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuthorStats = async () => {
    if (!post) return;
    try {
      const [posts, followers] = await Promise.all([
        getMyPosts(post.authorId),
        getFollowerCount(post.authorId),
      ]);
      setAuthorPostCount(posts.length);
      setFollowerCount(followers);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLike = async () => {
    if (!user || !post) return;
    try {
      const newLiked = await togglePostLike(post.id, user.uid);
      setLiked(newLiked);
      setLikeCount((c) => (newLiked ? c + 1 : c - 1));
    } catch (e) {
      console.error(e);
      alert("좋아요 처리에 실패했습니다.");
    }
  };

  const handleToggleBookmark = async () => {
    if (!user || !post) return;
    try {
      const newBookmarked = await toggleBookmark(user.uid, post.id);
      setBookmarked(newBookmarked);
    } catch (e) {
      console.error(e);
      alert("저장 처리에 실패했습니다.");
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !post || user.uid === post.authorId) return;
    try {
      const newFollowing = await toggleFollow(user.uid, post.authorId);
      setFollowing(newFollowing);
      setFollowerCount((c) => (newFollowing ? c + 1 : c - 1));
    } catch (e) {
      console.error(e);
      alert("팔로우 처리에 실패했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post || post.authorId !== user.uid) return;
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    try {
      await deletePost(post.id, user.uid);
      router.push("/posts");
    } catch (e: any) {
      alert(e.message || "삭제에 실패했습니다.");
    }
  };

  const loadCommentUserNames = async () => {
    const ids = [...new Set(comments.map((c) => c.userId))];
    const names: Record<string, string> = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          names[id] = await getUserDisplayName(id);
        } catch {
          names[id] = id.slice(0, 8);
        }
      })
    );
    setCommentUserNames(names);
  };

  const handleSendComment = async () => {
    if (!user || !post || !comment.trim()) return;
    try {
      setSending(true);
      await createComment(post.id, user.uid, comment);
      setComment("");
      await loadComments();
    } catch (e) {
      console.error(e);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !post || !confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteComment(post.id, commentId, user.uid);
      await loadComments();
    } catch (e: any) {
      alert(e.message || "삭제 실패");
    }
  };

  const formatDate = (d: any) => {
    if (!d) return "—";
    const dt = d.toDate ? d.toDate() : new Date(d?.seconds * 1000);
    return dt.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (d: any) => {
    if (!d) return "—";
    const t = d.toMillis ? d.toMillis() : (d?.seconds || 0) * 1000;
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d0 = Math.floor(diff / 86400000);
    if (m < 60) return `${m}분 전`;
    if (h < 24) return `${h}시간 전`;
    if (d0 < 7) return `${d0}일 전`;
    return formatDate(d);
  };

  const idx = post ? allPosts.findIndex((p) => p.id === post.id) : -1;
  const prevPost = idx >= 0 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
  const nextPost = idx > 0 ? allPosts[idx - 1] : null;

  const relatedPosts = post
    ? allPosts
        .filter((p) => p.id !== post.id && (p.category === post.category || !p.category))
        .slice(0, 4)
    : [];

  const avatarGradient = (i: number) => AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0805] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0805] flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-[#b8a898]">게시글을 찾을 수 없습니다.</p>
        <Link href="/posts" className="px-6 py-3 border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] text-sm tracking-wider uppercase">
          목록으로
        </Link>
      </div>
    );
  }

  const isHot = viewCount >= 50;
  const catClass = post.category ? (CATEGORY_BADGE_CLASS[post.category] || "border-[#e8a020]/35 text-[#b8a898]") : "border-[#e8a020]/35 text-[#b8a898]";

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0 items-start">
        {/* Article */}
        <article className="pr-0 lg:pr-[60px] border-r-0 lg:border-r border-[#e8a020]/20 animate-in fade-in duration-500">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-[#b8a898] tracking-wider mt-5 mb-6">
            <Link href="/" className="hover:text-[#e8a020] transition-colors">홈</Link>
            <span>›</span>
            <Link href="/posts" className="hover:text-[#e8a020] transition-colors">커뮤니티</Link>
            <span>›</span>
            <span className={post.category === "review" ? "text-green-400" : ""}>
              {getCategoryLabel(post.category) || "자유"}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2.5 mb-5 flex-wrap">
            <span className={`text-[9px] tracking-wider uppercase px-3 py-1 border rounded ${catClass}`}>
              {getCategoryLabel(post.category) || "자유"}
            </span>
            {isHot && (
              <span className="text-[9px] px-2 py-0.5 bg-[#c03020]/15 text-[#c03020] border border-[#c03020]/30">
                🔥 HOT
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl md:text-3xl lg:text-[34px] font-normal text-[#faf6f0] leading-snug mb-6">
            {post.title}
          </h1>

          {/* Author bar */}
          <div className="flex items-center gap-4 py-5 border-y border-[#e8a020]/20 mb-9">
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient(0)} flex items-center justify-center text-lg shrink-0`}>
              🎭
            </div>
            <div>
              <div className="text-sm font-medium text-[#f0e8d8] mb-0.5">{authorName || "작성자"}</div>
              <div className="text-[11px] text-[#b8a898] flex items-center gap-2">
                <span>{ROLE_LABEL[post.authorRole] || "관객"}</span>
                <span>·</span>
                <span>조회 {viewCount}</span>
              </div>
            </div>
            <div className="text-[11px] text-[#b8a898] tracking-wider ml-auto shrink-0">
              {formatDate(post.createdAt)}
            </div>
            {user && user.uid !== post.authorId && (
              <div className="hidden sm:flex gap-2 ml-4">
                <button
                  onClick={handleToggleFollow}
                  className={`text-[11px] px-4 py-1.5 border transition-colors ${
                    following ? "bg-[#e8a020]/10 border-[#e8a020] text-[#e8a020]" : "border-[#e8a020]/40 text-[#e8a020] hover:bg-[#e8a020]/10"
                  }`}
                >
                  {following ? "팔로잉" : "+ 팔로우"}
                </button>
                <button className="text-[11px] px-4 py-1.5 border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] transition-colors">
                  💬 메시지
                </button>
              </div>
            )}
          </div>

          {/* Article body */}
          <div className="font-serif text-base md:text-[17px] font-light leading-[2.1] text-[#f0e8d8] mb-10">
            <div className="whitespace-pre-wrap [&>p]:mb-6 [&>p:last-child]:mb-0">
              {post.content}
            </div>
            {post.requirements && post.requirements.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#e8a020]/20">
                <h3 className="text-[#e8a020] font-sans font-semibold mb-3">요구사항</h3>
                <ul className="space-y-2">
                  {post.requirements.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#e8a020]">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(post.movieId || post.actorId) && (
              <div className="mt-6 pt-6 border-t border-[#e8a020]/20">
                <h3 className="text-[#e8a020] font-sans font-semibold mb-3">관련 정보</h3>
                <div className="space-y-2">
                  {post.movieId && (
                    <p>
                      <span className="text-[#b8a898]">관련 영화: </span>
                      <Link href={`/movies/${post.movieId}`} className="text-[#e8a020] hover:underline">
                        {movieTitle || "—"}
                      </Link>
                    </p>
                  )}
                  {post.actorId && (
                    <p>
                      <span className="text-[#b8a898]">관련 배우: </span>
                      <Link href={`/actors/${post.actorId}`} className="text-[#e8a020] hover:underline">
                        {actorName || "—"}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-xs py-1.5 px-4 bg-[#e8a020]/5 border border-[#e8a020]/20 text-[#a06c10] hover:bg-[#e8a020]/15 hover:text-[#e8a020] cursor-pointer transition-colors">
              #{getCategoryLabel(post.category) || "자유"}
            </span>
            {post.location && (
              <span className="text-xs py-1.5 px-4 bg-[#e8a020]/5 border border-[#e8a020]/20 text-[#a06c10] hover:bg-[#e8a020]/15 hover:text-[#e8a020] cursor-pointer transition-colors">
                #{post.location}
              </span>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 py-5 border-y border-[#e8a020]/20 mb-10 flex-wrap">
            <button
              onClick={handleToggleLike}
              disabled={!user}
              className={`flex items-center gap-2 px-5 py-2 border text-sm transition-all ${
                liked ? "bg-[#e8a020]/10 border-[#e8a020] text-[#e8a020]" : "border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020]"
              } ${!user ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span>♥</span>
              <span>{likeCount}</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2 border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] transition-all text-sm">
              <span>💬</span>
              <span>댓글 {comments.length}</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2 border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] transition-all text-sm ml-auto">
              <span>↗</span>
              <span>공유</span>
            </button>
            {user && (
              <button
                onClick={handleToggleBookmark}
                className={`flex items-center gap-2 px-5 py-2 border text-sm transition-all ${
                  bookmarked ? "bg-[#e8a020]/10 border-[#e8a020] text-[#e8a020]" : "border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020]"
                }`}
              >
                <span>🔖</span>
                <span>{bookmarked ? "저장됨" : "저장"}</span>
              </button>
            )}
            {user?.uid === post.authorId && (
              <>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="flex items-center gap-2 px-5 py-2 border border-[#e8a020]/25 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] transition-all text-sm"
                >
                  <span>✏</span>
                  <span>수정</span>
                </Link>
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-2 px-5 py-2 border border-[#c03020]/20 text-[#c03020]/80 hover:border-[#c03020] hover:text-[#c03020] transition-all text-sm"
                >
                  <span>🗑</span>
                  <span>삭제</span>
                </button>
              </>
            )}
          </div>

          {/* Comments */}
          <section className="mb-12">
            <div className="flex items-baseline gap-3 mb-7">
              <h3 className="font-serif text-xl font-light text-[#faf6f0]">댓글</h3>
              <span className="font-display text-2xl text-[#e8a020]">{comments.length}</span>
            </div>

            {/* Comment input */}
            {user ? (
              <div className="bg-[#100e0a] border border-[#e8a020]/25 p-5 mb-7">
                <div className="flex gap-4 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(0)} flex items-center justify-center text-base shrink-0`}>
                    🎭
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="감상이나 의견을 남겨주세요. 서로를 존중하는 댓글 문화를 만들어요 :)"
                    className="flex-1 min-h-[80px] bg-[#0d0b08] border border-[#e8a020]/35 text-[#f0e8d8] px-4 py-3 text-[13px] placeholder:text-[#b8a898] focus:border-[#e8a020] focus:outline-none resize-none"
                    disabled={sending}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#b8a898]">Shift+Enter로 줄 바꿈</span>
                  <Button
                    onClick={handleSendComment}
                    disabled={sending || !comment.trim()}
                    className="bg-[#e8a020] text-[#0a0805] hover:bg-[#f0b030] px-6 py-2 text-[11px] tracking-wider uppercase font-medium"
                  >
                    댓글 등록
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-[#100e0a] border border-[#e8a020]/25 p-6 mb-7 text-center">
                <p className="text-sm text-[#b8a898] mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link href="/login">
                  <Button variant="outline" className="border-[#e8a020]/35 text-[#e8a020] hover:bg-[#e8a020]/10">
                    로그인
                  </Button>
                </Link>
              </div>
            )}

            {/* Comment list */}
            <div className="space-y-0">
              {comments.length === 0 ? (
                <div className="py-12 text-center text-[#b8a898]">아직 댓글이 없습니다.</div>
              ) : (
                comments.map((c, i) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    userName={commentUserNames[c.userId] || "사용자"}
                    avatarClass={avatarGradient(i)}
                    isOwn={c.userId === user?.uid}
                    onDelete={() => handleDeleteComment(c.id)}
                    formatTime={formatTimeAgo}
                  />
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
          </section>

          {/* Post nav */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 mb-10">
            {prevPost ? (
              <Link
                href={`/posts/${prevPost.id}`}
                className="bg-[#100e0a] p-5 border border-transparent hover:bg-[#0d0b08] hover:border-[#e8a020]/25 transition-all group"
              >
                <div className="text-[10px] tracking-wider text-[#b8a898] uppercase mb-1">← 이전 글</div>
                <div className="text-[13px] text-[#f0e8d8] line-clamp-2 group-hover:text-[#e8a020] transition-colors">
                  {prevPost.title}
                </div>
              </Link>
            ) : (
              <div className="bg-[#100e0a] p-5 opacity-50" />
            )}
            {nextPost ? (
              <Link
                href={`/posts/${nextPost.id}`}
                className="bg-[#100e0a] p-5 border border-transparent hover:bg-[#0d0b08] hover:border-[#e8a020]/25 transition-all group text-right"
              >
                <div className="text-[10px] tracking-wider text-[#b8a898] uppercase mb-1">다음 글 →</div>
                <div className="text-[13px] text-[#f0e8d8] line-clamp-2 group-hover:text-[#e8a020] transition-colors">
                  {nextPost.title}
                </div>
              </Link>
            ) : (
              <div className="bg-[#100e0a] p-5 opacity-50" />
            )}
          </div>

          <div className="text-center">
            <Link
              href="/posts"
              className="inline-block text-[11px] tracking-wider uppercase text-[#b8a898] border border-[#e8a020]/35 px-6 py-2.5 hover:border-[#e8a020] hover:text-[#e8a020] transition-all"
            >
              ← 목록으로 돌아가기
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="hidden lg:block pl-9 pt-0 sticky top-20">
          <div className="bg-[#100e0a] p-6 mb-4">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[#e8a020] mb-4">작성자 프로필</div>
            <div className="flex gap-4 items-center mb-4">
              <div className={`w-[52px] h-[52px] rounded-full bg-gradient-to-br ${avatarGradient(0)} flex items-center justify-center text-2xl`}>
                🎭
              </div>
              <div>
                <div className="font-serif text-[17px] text-[#faf6f0]">{authorName || "작성자"}</div>
                <div className="text-[11px] text-[#e8a020] tracking-wider">
                  {ROLE_LABEL[post.authorRole] || "관객"}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="text-center">
                <div className="font-display text-2xl text-[#e8a020]">{authorPostCount}</div>
                <div className="text-[9px] text-[#b8a898] tracking-wider">게시글</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl text-[#e8a020]">{followerCount}</div>
                <div className="text-[9px] text-[#b8a898] tracking-wider">팔로워</div>
              </div>
            </div>
            <p className="text-xs text-[#b8a898] leading-relaxed mb-4">
              인디필름 커뮤니티에 함께하는 회원입니다.
            </p>
            {user && user.uid !== post.authorId && (
              <button
                onClick={handleToggleFollow}
                className={`w-full py-2.5 border text-[11px] tracking-wider uppercase transition-colors ${
                  following ? "bg-[#e8a020]/10 border-[#e8a020] text-[#e8a020]" : "border-[#e8a020]/40 text-[#e8a020] hover:bg-[#e8a020]/10"
                }`}
              >
                {following ? "팔로잉" : "+ 팔로우"}
              </button>
            )}
          </div>

          <div className="bg-[#100e0a] p-6">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[#e8a020] mb-4">관련 글</div>
            <div className="space-y-0">
              {relatedPosts.length === 0 ? (
                <p className="text-xs text-[#b8a898]">관련 글이 없습니다.</p>
              ) : (
                relatedPosts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/posts/${p.id}`}
                    className="block py-3 border-b border-[#e8a020]/15 last:border-0 hover:pl-1.5 transition-all group"
                  >
                    <div className="text-[9px] tracking-wider text-[#b8a898] uppercase mb-1">
                      {getCategoryLabel(p.category) || "자유"}
                    </div>
                    <div className="text-xs text-[#f0e8d8] line-clamp-2 group-hover:text-[#e8a020] transition-colors">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-[#b8a898] mt-1">
                      조회 {p.views || 0}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  userName,
  avatarClass,
  isOwn,
  onDelete,
  formatTime,
}: {
  comment: PostComment;
  userName: string;
  avatarClass: string;
  isOwn: boolean;
  onDelete: () => void;
  formatTime: (d: any) => string;
}) {
  return (
    <div className="py-5 border-b border-[#e8a020]/15 last:border-0">
      <div className="flex gap-4 items-start">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarClass} flex items-center justify-center text-base shrink-0`}>
          🎭
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[13px] font-medium text-[#f0e8d8]">{userName}</span>
            {isOwn && (
              <span className="text-[9px] px-2 py-0.5 border border-[#e8a020]/40 text-[#c8a050]">작성자</span>
            )}
            <span className="text-[10px] text-[#b8a898] tracking-wider ml-auto">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm leading-relaxed text-[#b8a898] whitespace-pre-wrap">{comment.content}</p>
          <div className="flex gap-4 mt-2">
            <button className="text-[11px] text-[#b8a898] hover:text-[#e8a020] transition-colors">
              ♥ 0
            </button>
            {isOwn && (
              <button onClick={onDelete} className="text-[11px] text-[#b8a898] hover:text-[#c03020] transition-colors">
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
