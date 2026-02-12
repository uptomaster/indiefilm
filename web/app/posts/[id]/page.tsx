"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getPostById,
  getComments,
  createComment,
  deleteComment,
  incrementPostViews,
  Post,
  PostComment,
} from "@/lib/posts";
import { getUserDisplayName } from "@/lib/users";
import { getMovieById } from "@/lib/movies";
import { getActorById } from "@/lib/actors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState<string>("");
  const [movieTitle, setMovieTitle] = useState<string>("");
  const [actorName, setActorName] = useState<string>("");
  const [commentUserNames, setCommentUserNames] = useState<Record<string, string>>({});
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  useEffect(() => {
    if (post) {
      loadComments();
      loadAuthorName();
      loadRelatedInfo();
      // 조회수 증가 (한 번만)
      incrementPostViews(post.id);
    }
  }, [post]);

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
      const postData = await getPostById(params.id as string);
      if (!postData) {
        alert("게시글을 찾을 수 없습니다.");
        router.push("/posts");
        return;
      }
      setPost(postData);
    } catch (error) {
      console.error("Error loading post:", error);
      alert("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorName = async () => {
    if (!post) return;
    try {
      const name = await getUserDisplayName(post.authorId);
      setAuthorName(name);
    } catch (error) {
      console.error("Error loading author name:", error);
    }
  };

  const loadRelatedInfo = async () => {
    if (!post) return;

    try {
      if (post.movieId) {
        const movie = await getMovieById(post.movieId);
        if (movie) {
          setMovieTitle(movie.title);
        }
      }

      if (post.actorId) {
        const actor = await getActorById(post.actorId);
        if (actor) {
          setActorName(actor.stageName);
        }
      }
    } catch (error) {
      console.error("Error loading related info:", error);
    }
  };

  const loadComments = async () => {
    if (!post) return;

    try {
      const commentsData = await getComments(post.id);
      setComments(commentsData);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const loadCommentUserNames = async () => {
    const uniqueUserIds = [...new Set(comments.map((c) => c.userId))];
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

    setCommentUserNames(names);
  };

  const handleSendComment = async () => {
    if (!user || !post || !comment.trim()) return;

    try {
      setSending(true);
      await createComment(post.id, user.uid, comment);
      setComment("");
      await loadComments();
    } catch (error) {
      console.error("Error sending comment:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !post) return;

    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(post.id, commentId, user.uid);
      await loadComments();
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      alert(error.message || "댓글 삭제에 실패했습니다.");
    }
  };

  const getPostTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      casting_call: "구인공고",
      actor_seeking: "배우 구직",
      general: "일반",
    };
    return typeMap[type] || type;
  };

  const getCategoryLabel = (category?: string): string => {
    if (!category) return "";
    const categoryMap: Record<string, string> = {
      casting: "캐스팅",
      seeking: "구직",
      collaboration: "협업",
      general: "일반",
    };
    return categoryMap[category] || category;
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

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="mb-4 text-xl text-gray-400">게시글을 찾을 수 없습니다.</p>
            <Link href="/posts">
              <Button className="border-yellow-600/50 bg-yellow-600/10 text-yellow-400 hover:bg-yellow-600/20">
                게시판으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-yellow-900/30 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <Link href="/posts" className="mb-4 inline-block text-yellow-400 hover:text-yellow-300">
              ← 커뮤니티로
            </Link>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-yellow-600/20 px-3 py-1 text-sm font-semibold text-yellow-400">
                {getPostTypeLabel(post.type)}
              </span>
              {post.category && (
                <span className="rounded-full bg-gray-800/50 px-3 py-1 text-sm text-gray-300">
                  {getCategoryLabel(post.category)}
                </span>
              )}
              {post.location && (
                <span className="rounded-full bg-gray-800/50 px-3 py-1 text-sm text-gray-300">
                  {post.location}
                </span>
              )}
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight film-gold">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{authorName || "작성자"}</span>
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
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* 좌측: 게시글 내용 */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-yellow-600/20 bg-gray-900/50">
                <CardContent className="p-6">
                  <div className="whitespace-pre-wrap text-lg leading-relaxed text-gray-300">
                    {post.content}
                  </div>

                  {/* 요구사항 */}
                  {post.requirements && post.requirements.length > 0 && (
                    <div className="mt-6 border-t border-yellow-600/30 pt-6">
                      <h3 className="mb-3 text-lg font-bold text-yellow-400">요구사항</h3>
                      <ul className="space-y-2">
                        {post.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-300">
                            <span className="text-yellow-400">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 관련 정보 */}
                  {(post.movieId || post.actorId) && (
                    <div className="mt-6 border-t border-yellow-600/30 pt-6">
                      <h3 className="mb-3 text-lg font-bold text-yellow-400">관련 정보</h3>
                      <div className="space-y-2">
                        {post.movieId && (
                          <div>
                            <span className="text-gray-400">관련 영화: </span>
                            <Link
                              href={`/movies/${post.movieId}`}
                              className="text-yellow-400 hover:text-yellow-300 hover:underline"
                            >
                              {movieTitle || "영화 정보 없음"}
                            </Link>
                          </div>
                        )}
                        {post.actorId && (
                          <div>
                            <span className="text-gray-400">관련 배우: </span>
                            <Link
                              href={`/actors/${post.actorId}`}
                              className="text-yellow-400 hover:text-yellow-300 hover:underline"
                            >
                              {actorName || "배우 정보 없음"}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 댓글 섹션 */}
              <Card className="border-yellow-600/20 bg-gray-900/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 border-b border-yellow-600/30 pb-2 text-lg font-bold film-gold">
                    댓글 ({comments.length})
                  </h3>

                  {/* 댓글 목록 */}
                  <div className="mb-6 space-y-4">
                    {comments.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        아직 댓글이 없습니다.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          userName={commentUserNames[comment.userId] || "사용자"}
                          isOwn={comment.userId === user?.uid}
                          onDelete={() => handleDeleteComment(comment.id)}
                        />
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* 댓글 입력 */}
                  {user ? (
                    <div className="flex gap-2">
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment();
                          }
                        }}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 border-gray-700 bg-gray-800/50 text-white placeholder:text-gray-500 focus:border-yellow-600"
                        disabled={sending}
                      />
                      <Button
                        onClick={handleSendComment}
                        disabled={sending || !comment.trim()}
                        className="bg-yellow-600 text-black hover:bg-yellow-500"
                      >
                        전송
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-yellow-600/20 bg-gray-800/30 p-4 text-center">
                      <p className="mb-3 text-sm text-gray-400">댓글을 작성하려면 로그인이 필요합니다.</p>
                      <Link href="/login">
                        <Button
                          variant="outline"
                          className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                        >
                          로그인
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 우측: 사이드바 */}
            <div className="lg:col-span-1">
              <Card className="border-yellow-600/20 bg-gray-900/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-sm font-semibold text-gray-400">게시글 정보</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">작성자</span>
                      <span className="text-white">{authorName || "작성자"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">유형</span>
                      <span className="text-white">{getPostTypeLabel(post.type)}</span>
                    </div>
                    {post.category && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">카테고리</span>
                        <span className="text-white">{getCategoryLabel(post.category)}</span>
                      </div>
                    )}
                    {post.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">지역</span>
                        <span className="text-white">{post.location}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">조회수</span>
                      <span className="text-white">{post.views || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">작성일</span>
                      <span className="text-white">
                        {post.createdAt?.toDate
                          ? new Date(post.createdAt.toDate()).toLocaleDateString("ko-KR")
                          : "날짜 없음"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  userName,
  isOwn,
  onDelete,
}: {
  comment: PostComment;
  userName: string;
  isOwn: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-800/50 pb-4 last:border-0">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 flex items-center justify-center text-black font-bold">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-semibold text-white">{userName}</span>
          {isOwn && (
            <span className="text-xs text-gray-500">(나)</span>
          )}
          <span className="text-xs text-gray-500">
            {comment.createdAt?.toDate
              ? new Date(comment.createdAt.toDate()).toLocaleDateString("ko-KR")
              : ""}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-gray-300">{comment.content}</p>
        {isOwn && (
          <button
            onClick={onDelete}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
