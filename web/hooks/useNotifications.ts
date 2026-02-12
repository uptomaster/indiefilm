"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  type: "request" | "message" | "comment" | "rating";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 실제로는 Firestore에 notifications 컬렉션이 필요하지만,
    // 현재 구조에서는 requests를 기반으로 알림을 생성
    const requestsQuery = query(
      collection(db, "requests"),
      where("toUserId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notifs.push({
            id: doc.id,
            type: "request",
            title: "새로운 요청",
            message: `${data.movieTitle || "영화"}에 대한 ${data.type === "casting" ? "캐스팅" : "출연"} 요청이 있습니다.`,
            link: `/requests/${doc.id}`,
            read: data.read || false,
            createdAt: data.createdAt || Timestamp.now(),
          });
        });

        // 시간순 정렬
        notifs.sort((a, b) => {
          const aTime = a.createdAt.toMillis();
          const bTime = b.createdAt.toMillis();
          return bTime - aTime;
        });

        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { notifications, unreadCount };
}
