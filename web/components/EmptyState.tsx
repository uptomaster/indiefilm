"use client";

import { Film, Users, MessageSquare, Search } from "lucide-react";

interface EmptyStateProps {
  type?: "movies" | "actors" | "posts" | "general";
  title?: string;
  description?: string;
}

export function EmptyState({ type = "general", title, description }: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case "movies":
        return <Film className="h-16 w-16 text-[#8a807a]" />;
      case "actors":
        return <Users className="h-16 w-16 text-[#8a807a]" />;
      case "posts":
        return <MessageSquare className="h-16 w-16 text-[#8a807a]" />;
      default:
        return <Search className="h-16 w-16 text-[#8a807a]" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case "movies":
        return "등록된 영화가 없습니다";
      case "actors":
        return "등록된 배우가 없습니다";
      case "posts":
        return "게시글이 없습니다";
      default:
        return "내용이 없습니다";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "movies":
        return "첫 번째 영화를 등록해보세요";
      case "actors":
        return "배우 프로필을 만들어보세요";
      case "posts":
        return "첫 번째 게시글을 작성해보세요";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {getIcon()}
      <h3 className="mt-4 text-xl font-semibold text-[#8a807a]">
        {title || getDefaultTitle()}
      </h3>
      {(description || getDefaultDescription()) && (
        <p className="mt-2 text-sm text-[#5a5248]">{description || getDefaultDescription()}</p>
      )}
    </div>
  );
}
