"use client";

import { memo } from "react";

export const MovieCardSkeleton = memo(function MovieCardSkeleton() {
  return (
    <div className="border-yellow-600/20 bg-gray-900/50 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-2/3" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-800 rounded-full w-16" />
          <div className="h-6 bg-gray-800 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
});

export const ActorCardSkeleton = memo(function ActorCardSkeleton() {
  return (
    <div className="border-yellow-600/20 bg-gray-900/50 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-800" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-gray-800 rounded w-2/3" />
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-3/4" />
      </div>
    </div>
  );
});

export const PostCardSkeleton = memo(function PostCardSkeleton() {
  return (
    <div className="border-yellow-600/20 bg-gray-900/50 rounded-lg p-6 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="h-6 bg-gray-800 rounded-full w-20" />
        <div className="h-6 bg-gray-800 rounded-full w-16" />
      </div>
      <div className="h-6 bg-gray-800 rounded w-3/4 mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 bg-gray-800 rounded w-24" />
        <div className="h-4 bg-gray-800 rounded w-16" />
      </div>
    </div>
  );
});

export const ListSkeleton = memo(function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-yellow-600/20 bg-gray-900/50 rounded-lg p-6 animate-pulse"
        >
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
});
