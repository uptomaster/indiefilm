"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getReceivedRequests,
  getSentRequests,
  Request,
  RequestType,
  RequestStatus,
} from "@/lib/requests";
import { getUserDisplayName } from "@/lib/users";
import { getMovieById } from "@/lib/movies";
import { getActorById } from "@/lib/actors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState<Request[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  useEffect(() => {
    // 인증 로딩이 완료된 후에만 체크
    if (authLoading) {
      return;
    }
    
    if (user) {
      loadRequests();
    } else {
      router.push("/login");
    }
  }, [user, authLoading]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [received, sent] = await Promise.all([
        getReceivedRequests(user.uid),
        getSentRequests(user.uid),
      ]);
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRequestTypeLabel = (type: RequestType): string => {
    return type === "movie_application" ? "출연 희망" : "캐스팅 제안";
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
      pending: "bg-violet-600/20 text-violet-400",
      accepted: "bg-green-600/20 text-green-400",
      rejected: "bg-violet-600/20 text-violet-400",
    };
    return colors[status];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            <p className="mt-4 text-gray-400">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const requests = activeTab === "received" ? receivedRequests : sentRequests;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-violet-900/30 bg-gradient-to-b from-indigo-50 via-violet-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight film-gold">
              REQUESTS
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              캐스팅 제안과 출연 희망 요청을 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex gap-4 border-b border-violet-600/30">
          <button
            onClick={() => setActiveTab("received")}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === "received"
                ? "border-b-2 border-violet-600 text-violet-400"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            받은 요청 ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === "sent"
                ? "border-b-2 border-violet-600 text-violet-400"
                : "text-gray-400 hover:text-violet-400"
            }`}
          >
            보낸 요청 ({sentRequests.length})
          </button>
        </div>

        {/* 요청 목록 */}
        {requests.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400">
              {activeTab === "received"
                ? "받은 요청이 없습니다."
                : "보낸 요청이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isReceived={activeTab === "received"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  isReceived,
}: {
  request: Request;
  isReceived: boolean;
}) {
  const [fromUserName, setFromUserName] = useState<string>("");
  const [toUserName, setToUserName] = useState<string>("");
  const [movieTitle, setMovieTitle] = useState<string>("");
  const [actorName, setActorName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequestDetails();
  }, [request]);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      const [fromName, toName] = await Promise.all([
        getUserDisplayName(request.fromUserId),
        getUserDisplayName(request.toUserId),
      ]);
      setFromUserName(fromName);
      setToUserName(toName);

      if (request.movieId) {
        const movie = await getMovieById(request.movieId);
        if (movie) {
          setMovieTitle(movie.title);
        }
      }

      if (request.actorId) {
        const actor = await getActorById(request.actorId);
        if (actor) {
          setActorName(actor.stageName);
        }
      }
    } catch (error) {
      console.error("Error loading request details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRequestTypeLabel = (type: RequestType): string => {
    return type === "movie_application" ? "출연 희망" : "캐스팅 제안";
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
      pending: "bg-violet-600/20 text-violet-400",
      accepted: "bg-green-600/20 text-green-400",
      rejected: "bg-violet-600/20 text-violet-400",
    };
    return colors[status];
  };

  if (loading) {
    return (
      <Card className="border-violet-600/20 bg-gray-900/50">
        <CardContent className="p-6">
          <div className="h-20 animate-pulse bg-gray-800 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/requests/${request.id}`}>
      <Card className="border-violet-600/20 bg-gray-900/50 transition-all hover:border-violet-600/40 hover:bg-gray-900/70 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-semibold text-violet-400">
                  {getRequestTypeLabel(request.type)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                    request.status
                  )}`}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">
                {request.type === "movie_application"
                  ? movieTitle || "영화 정보 없음"
                  : actorName || "배우 정보 없음"}
              </h3>
              <p className="mb-3 text-sm text-gray-400">
                {isReceived
                  ? `${fromUserName}님이 요청을 보냈습니다`
                  : `${toUserName}님에게 요청을 보냈습니다`}
              </p>
              <p className="text-sm text-gray-300">{request.message}</p>
              <p className="mt-3 text-xs text-gray-500">
                {request.createdAt?.toDate
                  ? new Date(request.createdAt.toDate()).toLocaleDateString(
                      "ko-KR"
                    )
                  : "날짜 없음"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
