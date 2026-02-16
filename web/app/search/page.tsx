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
    <div className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-yellow-900/30 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-5xl font-bold tracking-tight film-gold">
              SEARCH
            </h1>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="영화, 배우, 제작자, 게시글 검색..."
                className="flex-1 bg-gray-900/50 border-yellow-600/30 text-white placeholder:text-gray-500 focus:border-yellow-600"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-yellow-600 text-black hover:bg-yellow-500"
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
            <div className="mb-6 flex gap-2 border-b border-yellow-600/30">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "all"
                    ? "border-b-2 border-yellow-600 text-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
                }`}
              >
                전체 ({totalResults})
              </button>
              <button
                onClick={() => setActiveTab("movies")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "movies"
                    ? "border-b-2 border-yellow-600 text-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
                }`}
              >
                영화 ({results.movies.length})
              </button>
              <button
                onClick={() => setActiveTab("actors")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "actors"
                    ? "border-b-2 border-yellow-600 text-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
                }`}
              >
                배우 ({results.actors.length})
              </button>
              <button
                onClick={() => setActiveTab("filmmakers")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "filmmakers"
                    ? "border-b-2 border-yellow-600 text-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
                }`}
              >
                제작자 ({results.filmmakers.length})
              </button>
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-4 px-4 font-semibold transition-colors ${
                  activeTab === "posts"
                    ? "border-b-2 border-yellow-600 text-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
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
                      <Card className="border-yellow-600/20 bg-gray-900/50 transition-all hover:border-yellow-600/40 hover:bg-gray-900/70 cursor-pointer">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-white line-clamp-1">
                            {movie.title}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-400">
                            {movie.logline}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-yellow-600/20 px-2 py-1 text-yellow-400">
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
                      <Card className="border-yellow-600/20 bg-gray-900/50 transition-all hover:border-yellow-600/40 hover:bg-gray-900/70 cursor-pointer">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-white">
                            {actor.stageName}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-400">
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
                      <Card className="border-yellow-600/20 bg-gray-900/50 transition-all hover:border-yellow-600/40 hover:bg-gray-900/70 cursor-pointer">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-white">
                            {filmmaker.name}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-400">
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
                      <Card className="border-yellow-600/20 bg-gray-900/50 transition-all hover:border-yellow-600/40 hover:bg-gray-900/70 cursor-pointer">
                        <CardContent className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-white line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="mb-2 line-clamp-2 text-sm text-gray-400">
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
                <p className="text-xl text-gray-400">검색 결과가 없습니다.</p>
                <p className="mt-2 text-sm text-gray-500">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Search className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <p className="text-xl text-gray-400">검색어를 입력하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Search className="mx-auto h-16 w-16 text-gray-600 mb-4 animate-pulse" />
          <p className="text-xl text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
