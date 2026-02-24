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
import { IndiePageWrapper } from "@/components/IndiePageWrapper";

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
      pending: "bg-[#e8a020]/20 text-[#e8a020]",
      accepted: "bg-green-600/20 text-green-400",
      rejected: "bg-[#e8a020]/25 text-[#b8a898]",
    };
    return colors[status];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
            <p className="mt-4 text-[#b8a898]">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const requests = activeTab === "received" ? receivedRequests : sentRequests;

  return (
    <IndiePageWrapper title="요청" subtitle="캐스팅 제안과 출연 희망 요청을 확인하세요" sectionNum="">
      <div className="mb-6 flex gap-4 border-b border-[#e8a020]/30">
        <button
          onClick={() => setActiveTab("received")}
          className={`pb-4 px-4 font-semibold transition-colors ${
            activeTab === "received"
              ? "border-b-2 border-[#e8a020] text-[#e8a020]"
              : "text-[#b8a898] hover:text-[#e8a020]"
          }`}
        >
          받은 요청 ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`pb-4 px-4 font-semibold transition-colors ${
            activeTab === "sent"
              ? "border-b-2 border-[#e8a020] text-[#e8a020]"
              : "text-[#b8a898] hover:text-[#e8a020]"
          }`}
        >
          보낸 요청 ({sentRequests.length})
        </button>
      </div>

      {/* 요청 목록 */}
      {requests.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-[#b8a898]">
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
    </IndiePageWrapper>
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
      pending: "bg-[#e8a020]/20 text-[#e8a020]",
      accepted: "bg-green-600/20 text-green-400",
      rejected: "bg-[#e8a020]/25 text-[#b8a898]",
    };
    return colors[status];
  };

  if (loading) {
    return (
      <Card className="border-[#e8a020]/30 bg-[#100e0a]">
        <CardContent className="p-6">
          <div className="h-20 animate-pulse bg-[#0d0b08] rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/requests/${request.id}`}>
      <Card className="border-[#e8a020]/30 bg-[#100e0a] transition-all hover:border-[#e8a020]/50 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full bg-[#e8a020]/20 px-3 py-1 text-xs font-semibold text-[#e8a020]">
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
              <h3 className="mb-2 text-lg font-bold text-[#faf6f0]">
                {request.type === "movie_application"
                  ? movieTitle || "영화 정보 없음"
                  : actorName || "배우 정보 없음"}
              </h3>
              <p className="mb-3 text-sm text-[#b8a898]">
                {isReceived
                  ? `${fromUserName}님이 요청을 보냈습니다`
                  : `${toUserName}님에게 요청을 보냈습니다`}
              </p>
              <p className="text-sm text-[#f0e8d8]">{request.message}</p>
              <p className="mt-3 text-xs text-[#b8a898]">
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
