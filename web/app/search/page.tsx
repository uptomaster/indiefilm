"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { searchAll, SearchResult } from "@/lib/search";
import { getGenreLabel } from "@/lib/movies";
import { getStatusLabel, getStatusColor } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Film, Users, User, MessageSquare } from "lucide-react";
import { useToastContext } from "@/components/ToastProvider";
import { MovieCardSkeleton, ActorCardSkeleton, PostCardSkeleton } from "@/components/SkeletonLoader";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { error: showError } = useToastContext();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult>({
    movies: [],
    actors: [],
    filmmakers: [],
    posts: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "actors" | "filmmakers" | "posts">("all");

  useEffect(() => {
    const searchQuery = searchParams.get("q");
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ movies: [], actors: [], filmmakers: [], posts: [] });
      return;
    }

    try {
      setLoading(true);
      const searchResults = await searchAll({
        query: searchQuery,
        limitCount: 10,
      });
      setResults(searchResults);
    } catch (err) {
      console.error("Error performing search:", err);
      showError("검색 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      performSearch(query.trim());
    }
  };

  const totalResults =
    results.movies.length +
    results.actors.length +
    results.filmmakers.length +
    results.posts.length;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-indigo-50 via-violet-50 to-white">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-6 md:py-12 lg:py-16">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-2 md:mb-4 text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight film-gold px-2">
              SEARCH
            </h1>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="영화, 배우, 제작자, 게시글 검색..."
                className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-violet-500"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600"
              >
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : query.trim() ? (
          <>
            {/* 탭 */}
            <div className="mb-6 flex gap-2 border-b border-violet-200">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "all"
                    ? "border-b-2 border-violet-500 text-violet-600"
                    : "text-gray-600 hover:text-violet-600"
                }`}
              >
                전체 ({totalResults})
              </button>
              <button
                onClick={() => setActiveTab("movies")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "movies"
                    ? "border-b-2 border-violet-500 text-violet-600"
                    : "text-gray-600 hover:text-violet-600"
                }`}
              >
                영화 ({results.movies.length})
              </button>
              <button
                onClick={() => setActiveTab("actors")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "actors"
                    ? "border-b-2 border-violet-500 text-violet-600"
                    : "text-gray-600 hover:text-violet-600"
                }`}
              >
                배우 ({results.actors.length})
              </button>
              <button
                onClick={() => setActiveTab("filmmakers")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "filmmakers"
                    ? "border-b-2 border-violet-500 text-violet-600"
                    : "text-gray-600 hover:text-violet-600"
                }`}
              >
                제작자 ({results.filmmakers.length})
              </button>
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "posts"
                    ? "border-b-2 border-violet-500 text-violet-600"
                    : "text-gray-600 hover:text-violet-600"
                }`}
              >
                커뮤니티 ({results.posts.length})
              </button>
            </div>

            {/* 결과 표시 */}
            {(activeTab === "all" || activeTab === "movies") && results.movies.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold film-gold">
                  <Film className="h-6 w-6" />
                  영화 ({results.movies.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.movies.map((movie) => (
                    <Link key={movie.id} href={`/movies/${movie.id}`}>
                      <Card className="border-gray-200 bg-white transition-all hover:border-violet-300 hover:shadow-lg cursor-pointer shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-gray-900 line-clamp-1">
                            {movie.title}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                            {movie.logline}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-600 font-semibold">
                              {getGenreLabel(movie.genre)}
                            </span>
                            <span className={`rounded-full border px-2 py-1 ${getStatusColor(movie.status || "production")}`}>
                              {getStatusLabel(movie.status || "production")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === "all" || activeTab === "actors") && results.actors.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold film-gold">
                  <Users className="h-6 w-6" />
                  배우 ({results.actors.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.actors.map((actor) => (
                    <Link key={actor.id} href={`/actors/${actor.id}`}>
                      <Card className="border-gray-200 bg-white transition-all hover:border-violet-300 hover:shadow-lg cursor-pointer shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-gray-900">
                            {actor.stageName}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                            {actor.bio}
                          </p>
                          {actor.location && (
                            <span className="text-xs text-gray-500">{actor.location}</span>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === "all" || activeTab === "filmmakers") && results.filmmakers.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold film-gold">
                  <User className="h-6 w-6" />
                  제작자 ({results.filmmakers.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.filmmakers.map((filmmaker) => (
                    <Link key={filmmaker.id} href={`/filmmakers/${filmmaker.id}`}>
                      <Card className="border-gray-200 bg-white transition-all hover:border-violet-300 hover:shadow-lg cursor-pointer shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-gray-900">
                            {filmmaker.name}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                            {filmmaker.bio}
                          </p>
                          {filmmaker.location && (
                            <span className="text-xs text-gray-500">{filmmaker.location}</span>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === "all" || activeTab === "posts") && results.posts.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold film-gold">
                  <MessageSquare className="h-6 w-6" />
                  커뮤니티 ({results.posts.length})
                </h2>
                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <Card className="border-gray-200 bg-white transition-all hover:border-violet-300 hover:shadow-lg cursor-pointer shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-gray-900 line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(post.createdAt?.toDate?.() || Date.now()).toLocaleDateString("ko-KR")}</span>
                            <span>•</span>
                            <span>조회 {post.views || 0}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {totalResults === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-gray-700 font-semibold">검색 결과가 없습니다.</p>
                <p className="mt-2 text-sm text-gray-600">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-xl text-gray-700 font-semibold">검색어를 입력하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Search className="mx-auto h-16 w-16 text-gray-400 mb-4 animate-pulse" />
          <p className="text-xl text-gray-700 font-semibold">로딩 중...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
