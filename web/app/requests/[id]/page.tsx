"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getRequestById,
  updateRequestStatus,
  markRequestAsRead,
  sendChatMessage,
  subscribeToChatMessages,
  Request,
  ChatMessage,
  RequestStatus,
} from "@/lib/requests";
import { getUserDisplayName } from "@/lib/users";
import { getMovieById } from "@/lib/movies";
import { getActorById } from "@/lib/actors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fromUserName, setFromUserName] = useState<string>("");
  const [toUserName, setToUserName] = useState<string>("");
  const [movieTitle, setMovieTitle] = useState<string>("");
  const [actorName, setActorName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 인증 로딩이 완료된 후에만 체크
    if (authLoading) {
      return;
    }
    
    if (params.id && user) {
      loadRequest();
    } else if (!user) {
      router.push("/login");
    }
  }, [params.id, user, authLoading]);

  useEffect(() => {
    if (request) {
      // 채팅 메시지 실시간 구독
      const unsubscribe = subscribeToChatMessages(request.id, (newMessages) => {
        setMessages(newMessages);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      });

      return () => unsubscribe();
    }
  }, [request]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRequest = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const requestData = await getRequestById(params.id as string);
      if (!requestData) {
        alert("요청을 찾을 수 없습니다.");
        router.push("/requests");
        return;
      }

      setRequest(requestData);

      // 요청을 읽음 처리
      if (
        requestData.toUserId === user?.uid &&
        !requestData.read
      ) {
        await markRequestAsRead(requestData.id);
      }

      // 사용자 이름 및 관련 정보 로드
      const [fromName, toName] = await Promise.all([
        getUserDisplayName(requestData.fromUserId),
        getUserDisplayName(requestData.toUserId),
      ]);
      setFromUserName(fromName);
      setToUserName(toName);

      if (requestData.movieId) {
        const movie = await getMovieById(requestData.movieId);
        if (movie) {
          setMovieTitle(movie.title);
        }
      }

      if (requestData.actorId) {
        const actor = await getActorById(requestData.actorId);
        if (actor) {
          setActorName(actor.stageName);
        }
      }
    } catch (error) {
      console.error("Error loading request:", error);
      alert("요청을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!request || !user || !message.trim()) return;

    try {
      setSending(true);
      await sendChatMessage(request.id, user.uid, message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: RequestStatus) => {
    if (!request || !user) return;

    if (request.toUserId !== user.uid) {
      alert("요청을 받은 사람만 상태를 변경할 수 있습니다.");
      return;
    }

    try {
      await updateRequestStatus(request.id, status);
      await loadRequest();
      alert(
        status === "accepted"
          ? "요청을 수락했습니다."
          : "요청을 거절했습니다."
      );
    } catch (error) {
      console.error("Error updating request status:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  if (authLoading || loading) {
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

  if (!request) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="mb-4 text-xl text-gray-400">요청을 찾을 수 없습니다.</p>
            <Link href="/requests">
              <Button className="border-yellow-600/50 bg-yellow-600/10 text-yellow-400 hover:bg-yellow-600/20">
                요청 목록으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isReceiver = request.toUserId === user?.uid;
  const getRequestTypeLabel = () => {
    return request.type === "movie_application" ? "출연 희망" : "캐스팅 제안";
  };

  const getStatusLabel = (status: RequestStatus): string => {
    const labels: Record<RequestStatus, string> = {
      pending: "대기 중",
      accepted: "수락됨",
      rejected: "거절됨",
    };
    return labels[status];
  };

  const getStatusColor = (status: RequestStatus): string => {
    const colors: Record<RequestStatus, string> = {
      pending: "bg-yellow-600/20 text-yellow-400",
      accepted: "bg-green-600/20 text-green-400",
      rejected: "bg-red-600/20 text-red-400",
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-yellow-900/30 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/requests"
              className="mb-4 inline-block text-yellow-400 hover:text-yellow-300"
            >
              ← 요청 목록으로
            </Link>
            <h1 className="mb-4 text-4xl font-bold tracking-tight film-gold">
              {getRequestTypeLabel()}
            </h1>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-yellow-600/20 px-3 py-1 text-sm font-semibold text-yellow-400">
                {getRequestTypeLabel()}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                  request.status
                )}`}
              >
                {getStatusLabel(request.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* 좌측: 요청 정보 */}
            <div className="lg:col-span-1">
              <Card className="border-yellow-600/20 bg-gray-900/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 border-b border-yellow-600/30 pb-2 text-lg font-bold film-gold">
                    요청 정보
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-gray-400">요청자</p>
                      <p className="text-white">{fromUserName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">받는 사람</p>
                      <p className="text-white">{toUserName}</p>
                    </div>
                    {request.movieId && (
                      <div>
                        <p className="text-gray-400">영화</p>
                        <Link
                          href={`/movies/${request.movieId}`}
                          className="text-yellow-400 hover:text-yellow-300 hover:underline"
                        >
                          {movieTitle || "영화 정보 없음"}
                        </Link>
                      </div>
                    )}
                    {request.actorId && (
                      <div>
                        <p className="text-gray-400">배우</p>
                        <Link
                          href={`/actors/${request.actorId}`}
                          className="text-yellow-400 hover:text-yellow-300 hover:underline"
                        >
                          {actorName || "배우 정보 없음"}
                        </Link>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400">메시지</p>
                      <p className="mt-1 text-white">{request.message}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">요청 날짜</p>
                      <p className="text-white">
                        {request.createdAt?.toDate
                          ? new Date(
                              request.createdAt.toDate()
                            ).toLocaleDateString("ko-KR")
                          : "날짜 없음"}
                      </p>
                    </div>
                    {/* 상태 변경 버튼 (받은 사람만) */}
                    {isReceiver && request.status === "pending" && (
                      <div className="mt-6 flex gap-2">
                        <Button
                          onClick={() => handleUpdateStatus("accepted")}
                          className="flex-1 bg-green-600 text-white hover:bg-green-500"
                        >
                          수락
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus("rejected")}
                          className="flex-1 bg-red-600 text-white hover:bg-red-500"
                        >
                          거절
                        </Button>
                      </div>
                    )}
                    {/* 수락된 경우 프로젝트 정보 강조 */}
                    {request.status === "accepted" && (
                      <div className="mt-6 rounded-lg border-2 border-green-600/50 bg-green-600/10 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-2xl">✅</span>
                          <h4 className="font-bold text-green-400">협업 프로젝트</h4>
                        </div>
                        <p className="text-sm text-gray-300">
                          요청이 수락되어 프로젝트가 시작되었습니다.
                        </p>
                        {request.movieId && movieTitle && (
                          <div className="mt-3 rounded-lg bg-gray-900/50 p-3">
                            <p className="text-xs text-gray-400 mb-1">프로젝트 영화</p>
                            <Link
                              href={`/movies/${request.movieId}`}
                              className="text-base font-semibold text-yellow-400 hover:text-yellow-300 hover:underline"
                            >
                              {movieTitle}
                            </Link>
                          </div>
                        )}
                        {request.actorId && actorName && (
                          <div className="mt-3 rounded-lg bg-gray-900/50 p-3">
                            <p className="text-xs text-gray-400 mb-1">협업 배우</p>
                            <Link
                              href={`/actors/${request.actorId}`}
                              className="text-base font-semibold text-yellow-400 hover:text-yellow-300 hover:underline"
                            >
                              {actorName}
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 우측: 채팅 */}
            <div className="lg:col-span-2">
              <Card className="border-yellow-600/20 bg-gray-900/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 border-b border-yellow-600/30 pb-2 text-lg font-bold film-gold">
                    채팅
                  </h3>
                  {/* 메시지 목록 */}
                  <div className="mb-4 max-h-[500px] space-y-4 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        아직 메시지가 없습니다.
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isOwn={msg.userId === user?.uid}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* 메시지 입력 */}
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 border-gray-700 bg-gray-800/50 text-white placeholder:text-gray-500 focus:border-yellow-600"
                      disabled={sending || request.status === "rejected"}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !message.trim() || request.status === "rejected"}
                      className="bg-yellow-600 text-black hover:bg-yellow-500"
                    >
                      전송
                    </Button>
                  </div>
                  {request.status === "accepted" && (
                    <div className="mt-4 rounded-lg border border-green-600/30 bg-green-600/10 p-4">
                      <p className="text-sm font-semibold text-green-400 mb-2">
                        ✅ 협업이 시작되었습니다!
                      </p>
                      <p className="text-xs text-gray-400">
                        프로젝트 진행에 대한 소통은 이 채팅방을 통해 계속하실 수 있습니다.
                      </p>
                    </div>
                  )}
                  {request.status === "rejected" && (
                    <div className="mt-4 rounded-lg border border-red-600/30 bg-red-600/10 p-4">
                      <p className="text-sm font-semibold text-red-400 mb-2">
                        요청이 거절되었습니다.
                      </p>
                      <p className="text-xs text-gray-400">
                        요청이 거절되어 채팅이 종료되었습니다.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    getUserDisplayName(message.userId).then(setUserName);
  }, [message.userId]);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwn
            ? "bg-yellow-600/20 text-white"
            : "bg-gray-800/50 text-gray-300"
        }`}
      >
        {!isOwn && (
          <p className="mb-1 text-xs font-semibold text-yellow-400">
            {userName}
          </p>
        )}
        <p className="whitespace-pre-wrap">{message.message}</p>
        <p className="mt-1 text-xs text-gray-500">
          {message.createdAt?.toDate
            ? new Date(message.createdAt.toDate()).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </p>
      </div>
    </div>
  );
}
