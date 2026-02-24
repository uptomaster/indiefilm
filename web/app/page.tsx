"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getMovies } from "@/lib/movies";
import { getActors } from "@/lib/actors";
import { getPosts } from "@/lib/posts";
import { getVenues } from "@/lib/venues";
import { Movie } from "@/lib/movies";
import { Actor } from "@/lib/actors";
import { Post } from "@/lib/posts";
import { Venue } from "@/lib/venues";
import { getUserDisplayName } from "@/lib/users";
import { useToastContext } from "@/components/ToastProvider";

const GENRE_LABEL: Record<string, string> = {
  drama: "드라마",
  comedy: "코미디",
  horror: "공포",
  romance: "로맨스",
  etc: "기타",
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { error: showError } = useToastContext();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 목록 페이지와 동일한 API로 데이터 로드 (일부 실패해도 나머지는 표시)
      const [moviesRes, actorsRes, castingRes, feedRes, venuesRes] = await Promise.allSettled([
        getMovies({ limitCount: 5 }),
        getActors({ limitCount: 6 }),
        getPosts({ type: "casting_call", limitCount: 5 }),
        getPosts({ limitCount: 5 }),
        getVenues({ limitCount: 5 }),
      ]);

      if (moviesRes.status === "fulfilled") {
        setMovies((moviesRes.value.movies || []).slice(0, 5));
      } else {
        console.error("영화 로드 실패:", moviesRes.reason);
      }
      if (actorsRes.status === "fulfilled") {
        setActors((actorsRes.value.actors || []).slice(0, 6));
      } else {
        console.error("배우 로드 실패:", actorsRes.reason);
      }
      if (castingRes.status === "fulfilled") {
        setPosts(Array.isArray(castingRes.value) ? castingRes.value : []);
      } else {
        console.error("캐스팅 공고 로드 실패:", castingRes.reason);
      }
      if (feedRes.status === "fulfilled") {
        const feedPosts = Array.isArray(feedRes.value) ? feedRes.value : [];
        setCommunityPosts(feedPosts);
        // 커뮤니티 글 작성자 이름 로드
        const names: Record<string, string> = {};
        await Promise.all(
          feedPosts.map(async (p) => {
            try {
              names[p.authorId] = await getUserDisplayName(p.authorId);
            } catch {
              names[p.authorId] = p.authorId?.slice?.(0, 8) || "—";
            }
          })
        );
        setAuthorNames(names);
      } else {
        console.error("커뮤니티 로드 실패:", feedRes.reason);
      }
      if (venuesRes.status === "fulfilled") {
        setVenues(Array.isArray(venuesRes.value) ? venuesRes.value : []);
      } else {
        console.error("장소 로드 실패:", venuesRes.reason);
      }

      const failed = [moviesRes, actorsRes, castingRes, feedRes, venuesRes].filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        setLoadError("일부 데이터를 불러오는데 실패했습니다. 새로고침해 주세요.");
        showError?.("일부 데이터를 불러오는데 실패했습니다.");
      }
    } catch (e) {
      console.error("메인 페이지 데이터 로드 오류:", e);
      setLoadError("데이터를 불러오는데 실패했습니다.");
      showError?.("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scrollTo = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0805]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8a020] border-t-transparent" />
      </div>
    );
  }

  const sortedMovies = [...movies].sort((a, b) => {
    const at = a.createdAt?.toMillis?.() || 0;
    const bt = b.createdAt?.toMillis?.() || 0;
    return bt - at;
  });

  return (
    <div className="bg-[#0a0805] text-[#f0e8d8] overflow-x-hidden">
      {/* HERO */}
      <section className="min-h-screen flex items-end relative pt-24 pb-20 md:pb-24 px-5 md:px-10 -mt-16">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse at 70% 40%, rgba(80,50,10,0.3) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 80%, rgba(30,20,10,0.5) 0%, transparent 50%),
              linear-gradient(135deg, #0a0805 0%, #1a1208 50%, #0a0805 100%)
            `,
          }}
        />
        <div className="absolute top-0 right-20 w-[60px] h-full hidden lg:flex flex-col opacity-[0.15] pointer-events-none" aria-hidden>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center gap-0">
              <div className="w-4 h-3 bg-[#0a0805] border border-[#5a5248] rounded-sm my-1.5" />
              <div className="flex-1 min-h-[80px] border-t border-b border-[#5a5248] flex items-center justify-center text-[#5a5248] text-[8px] tracking-wider">
                {String(i).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-[700px]">
          <div className="flex items-center gap-3 mb-5 text-sm font-semibold tracking-[0.25em] uppercase text-[#e8a020]">
            <span className="w-[30px] h-px bg-[#e8a020]" />
            독립영화 플랫폼
          </div>
          <h1 className="font-serif text-[clamp(42px,6vw,80px)] font-light leading-[1.1] tracking-tight mb-6 text-[#faf6f0]">
            당신의 이야기를
            <br />
            <em className="not-italic text-[#e8a020]">스크린에 올리세요</em>
          </h1>
          <p className="text-[15px] leading-[1.8] text-[#8a807a] max-w-[480px] mb-10">
            배우, 제작진, 관객, 그리고 장소가 만나는 곳. 인디필름은 독립영화 씬의 모든 연결을 하나의 공간에 담습니다.
          </p>
          <div className="flex gap-4 flex-wrap mb-10">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-[#e8a020] text-[#0a0805] text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#f0b030] hover:-translate-y-px transition-all"
            >
              지금 시작하기
            </Link>
            <button
              onClick={scrollTo("films")}
              className="px-8 py-3.5 border border-[rgba(240,232,216,0.3)] text-[#f0e8d8] text-sm tracking-[0.15em] uppercase hover:border-[#f0e8d8] transition-all bg-transparent cursor-pointer"
            >
              작품 보기
            </button>
          </div>
          <div className="flex gap-0 max-w-[700px]">
            <select className="flex-[0_0_120px] bg-[#141210] border border-[#e8a020]/25 border-r-0 text-[#faf6f0] px-4 py-3 text-sm outline-none focus:border-[#e8a020]">
              <option>전체</option>
              <option>배우 찾기</option>
              <option>구인 공고</option>
              <option>장소 대여</option>
              <option>작품 보기</option>
            </select>
            <input
              type="text"
              placeholder="찾고 있는 게 있으신가요?"
              className="flex-1 bg-[#141210] border border-[#e8a020]/25 border-r-0 px-5 py-3 text-sm text-[#faf6f0] placeholder:text-[#8a807a] outline-none focus:border-[#e8a020]"
            />
            <Link
              href="/search"
              className="px-7 py-3 bg-[#e8a020] text-[#0a0805] text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#f0b030] transition-colors"
            >
              검색
            </Link>
          </div>
        </div>

        <div className="absolute right-[140px] bottom-20 hidden xl:flex flex-col gap-6 text-right z-10">
          <div>
            <div className="font-display text-[36px] text-[#e8a020] leading-none">{actors.length > 0 ? actors.length * 200 : 1240}</div>
            <div className="text-sm font-semibold tracking-[0.15em] uppercase text-[#5a5248]">등록 배우</div>
          </div>
          <div>
            <div className="font-display text-[36px] text-[#e8a020] leading-none">{movies.length > 0 ? movies.length * 76 : 380}</div>
            <div className="text-sm font-semibold tracking-[0.15em] uppercase text-[#5a5248]">상영 작품</div>
          </div>
          <div>
            <div className="font-display text-[36px] text-[#e8a020] leading-none">{venues.length > 0 ? venues.length * 104 : 520}</div>
            <div className="text-sm font-semibold tracking-[0.15em] uppercase text-[#5a5248]">대여 장소</div>
          </div>
        </div>
      </section>

      {/* JOIN TYPE */}
      <section id="join-type" className="py-24 md:py-28 px-5 md:px-10 bg-[#100e0a] relative">
        <div className="flex items-baseline gap-5 mb-14">
          <div className="font-display text-[80px] leading-none text-[#1a1510] [-webkit-text-stroke:1px_var(--indie-gray)]">01</div>
          <div>
            <div className="font-serif text-[28px] font-light text-[#faf6f0]">나는 누구인가요?</div>
            <div className="text-sm font-medium tracking-[0.15em] text-[#5a5248] uppercase mt-1">가입 후 맞춤 경험이 제공됩니다</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#5a5248]">
          {[
            { icon: "🎭", name: "배우", desc: "프로필을 만들고 오디션 공고에 지원하세요. 제작진이 당신을 먼저 찾아올 수 있습니다.", href: "/signup" },
            { icon: "🎬", name: "제작진", desc: "작품을 전시하고 배우와 스태프를 모집하세요. 로케이션 헌팅도 한 곳에서.", href: "/signup" },
            { icon: "🎥", name: "관객", desc: "다양한 인디영화를 발견하고 좋아하는 감독과 배우를 팔로우하세요.", href: "/signup" },
            { icon: "🏢", name: "장소 대여자", desc: "당신의 공간을 인디영화 촬영 장소로 등록하세요. 예약 관리까지 한번에.", href: "/signup" },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="bg-[#100e0a] p-8 md:p-10 lg:p-12 relative overflow-hidden group hover:bg-[#181410] transition-colors border-b-2 border-transparent group-hover:border-[#e8a020]"
            >
              <span className="text-[36px] block mb-5">{item.icon}</span>
              <div className="font-serif text-xl font-normal text-[#faf6f0] mb-3">{item.name}</div>
              <div className="text-[13px] leading-[1.7] text-[#8a807a]">{item.desc}</div>
              <span className="absolute bottom-8 right-8 text-[#e8a020] text-xl opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FILMS */}
      <section id="films" className="py-24 md:py-28 px-5 md:px-10">
        <div className="flex items-baseline gap-5 mb-14">
          <div className="font-display text-[80px] leading-none text-[#1a1510] [-webkit-text-stroke:1px_var(--indie-gray)]">02</div>
          <div>
            <div className="font-serif text-[28px] font-light text-[#faf6f0]">최근 상영작</div>
            <div className="text-sm font-medium tracking-[0.15em] text-[#5a5248] uppercase mt-1">인디씬의 새로운 목소리들</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 mt-14 [grid-template-rows:auto_auto]">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8a020] border-t-transparent" />
            </div>
          ) : sortedMovies.length > 0 ? (
            <>
              <Link
                href={`/movies/${sortedMovies[0].id}`}
                className="md:col-span-2 md:row-span-2 group relative overflow-hidden bg-[#181410]"
              >
                <div className="w-full min-h-[280px] md:min-h-[500px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a3040] via-[#0a1820] to-[#2a1810] group-hover:scale-105 transition-transform duration-[600ms]" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full border border-white/40 flex items-center justify-center">
                      <span className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/85 to-transparent translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="text-sm tracking-[0.15em] uppercase text-[#e8a020]">{GENRE_LABEL[sortedMovies[0].genre] || sortedMovies[0].genre} · 2024</div>
                    <div className="font-serif text-[18px] md:text-[22px] text-[#faf6f0] mt-2">{sortedMovies[0].title}</div>
                    <div className="text-sm text-[#8a807a] mt-1">상영시간 {sortedMovies[0].runtimeMinutes || "—"}분</div>
                  </div>
                  <div className="absolute bottom-5 left-6">
                    <div className="text-sm tracking-[0.15em] uppercase text-[#e8a020]">{GENRE_LABEL[sortedMovies[0].genre] || sortedMovies[0].genre} · 2024</div>
                    <div className="font-serif text-base md:text-[18px] text-[#faf6f0] mt-1 group-hover:opacity-0 transition-opacity">{sortedMovies[0].title}</div>
                  </div>
                </div>
              </Link>
              {sortedMovies.slice(1, 5).map((movie, i) => (
                <Link key={movie.id} href={`/movies/${movie.id}`} className="group relative overflow-hidden bg-[#181410]">
                  <div className="w-full pt-[65%] relative overflow-hidden">
                    <div
                      className="absolute inset-0 group-hover:scale-105 transition-transform duration-[600ms]"
                      style={{
                        background: `linear-gradient(135deg, ${["#201530", "#302010", "#103020", "#302530"][i % 4]} 0%, #100820 100%)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full border border-white/40 flex items-center justify-center">
                        <span className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/85 to-transparent translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="text-sm tracking-[0.15em] uppercase text-[#e8a020]">{GENRE_LABEL[movie.genre] || movie.genre} · 2024</div>
                      <div className="font-serif text-base text-[#faf6f0] mt-1">{movie.title}</div>
                      <div className="text-sm text-[#5a5248] mt-2">상영시간 {movie.runtimeMinutes || "—"}분</div>
                    </div>
                    <div className="absolute bottom-5 left-6">
                      <div className="text-sm tracking-[0.15em] uppercase text-[#e8a020]">{GENRE_LABEL[movie.genre] || movie.genre}</div>
                      <div className="font-serif text-base text-[#faf6f0] mt-1 group-hover:opacity-0 transition-opacity">{movie.title}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          ) : loadError ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-[#8a807a] mb-4">{loadError}</p>
              <button
                onClick={loadData}
                className="px-6 py-2.5 border border-[#e8a020] text-[#e8a020] text-sm tracking-[0.15em] uppercase hover:bg-[#e8a020]/10 transition-colors"
              >
                새로고침
              </button>
            </div>
          ) : (
            <div className="col-span-full py-20 text-center text-[#8a807a]">등록된 작품이 없습니다.</div>
          )}
        </div>
        <div className="mt-10">
          <Link href="/movies" className="inline-block px-6 py-2.5 border border-[rgba(240,232,216,0.3)] text-sm tracking-[0.15em] uppercase hover:border-[#f0e8d8] transition-colors">
            전체 작품 보기 →
          </Link>
        </div>
      </section>

      {/* CASTING + ACTORS */}
      <section id="casting" className="py-24 md:py-28 px-5 md:px-10 bg-[#100e0a]">
        <div className="flex items-baseline gap-5 mb-14">
          <div className="font-display text-[80px] leading-none text-[#1a1510] [-webkit-text-stroke:1px_var(--indie-gray)]">03</div>
          <div>
            <div className="font-serif text-[28px] font-light text-[#faf6f0]">캐스팅 & 배우</div>
            <div className="text-sm font-medium tracking-[0.15em] text-[#5a5248] uppercase mt-1">오디션 공고와 프로필 배우들</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 mt-14">
          <div>
            <h3 className="font-serif font-light text-base text-[#8a807a] tracking-[0.15em] uppercase mb-6">구인 공고</h3>
            <div className="flex flex-col">
              {loading ? (
                <div className="py-10">로딩 중...</div>
              ) : posts.length > 0 ? (
                posts.slice(0, 5).map((post, i) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="grid grid-cols-[auto_1fr_auto] gap-5 items-center py-5 border-b border-[#5a5248]/20 hover:pl-3 transition-all group"
                  >
                    <span className="font-display text-sm text-[#5a5248] w-6">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="font-serif text-base font-normal text-[#faf6f0] group-hover:text-[#e8a020] transition-colors mb-1">{post.title}</div>
                      <div className="text-sm text-[#8a807a] tracking-wider">{post.location || "—"} · {post.requirements?.join(", ") || "—"}</div>
                    </div>
                    <span className="text-sm tracking-wider px-2.5 py-1 border border-[#5a5248] text-[#8a807a] uppercase">모집중</span>
                  </Link>
                ))
              ) : (
                <div className="py-10 text-[#8a807a]">등록된 공고가 없습니다.</div>
              )}
            </div>
            <Link href="/posts?type=casting_call" className="inline-block mt-7 px-6 py-2.5 border border-[rgba(240,232,216,0.3)] text-sm tracking-[0.15em] uppercase hover:border-[#f0e8d8] transition-colors">
              전체 공고 보기 →
            </Link>
          </div>
          <div>
            <h3 className="font-serif font-light text-base text-[#8a807a] tracking-[0.15em] uppercase mb-6">추천 배우</h3>
            <div className="grid grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-3 py-10">로딩 중...</div>
              ) : actors.length > 0 ? (
                actors.slice(0, 6).map((actor, i) => (
                  <Link key={actor.id} href={`/actors/${actor.id}`} className="group relative overflow-hidden">
                    <div className="w-full pt-[130%] relative overflow-hidden">
                      <div
                        className="absolute inset-0 group-hover:scale-[1.08] transition-transform duration-500"
                        style={{
                          background: `linear-gradient(180deg, ${["#2a2020", "#202830", "#202820", "#281828", "#282018", "#182028"][i % 6]} 0%, #0a0808 100%)`,
                        }}
                      />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[85%] bg-white/[0.04]" style={{ clipPath: "polygon(30% 0%, 70% 0%, 85% 20%, 85% 60%, 70% 100%, 30% 100%, 15% 60%, 15% 20%)" }} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="font-serif text-[13px] text-[#faf6f0]">{actor.stageName}</div>
                      <div className="text-sm text-[#8a807a] tracking-wider">{actor.ageRange || "—"} · {actor.location || "—"}</div>
                    </div>
                    {i % 2 === 0 && <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#40c060]" />}
                  </Link>
                ))
              ) : (
                <div className="col-span-3 py-10 text-[#8a807a]">등록된 배우가 없습니다.</div>
              )}
            </div>
            <div className="mt-5 text-right">
              <Link href="/actors" className="inline-block px-6 py-2.5 border border-[rgba(240,232,216,0.3)] text-sm tracking-[0.15em] uppercase hover:border-[#f0e8d8] transition-colors">
                배우 전체 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section id="locations" className="py-24 md:py-28 px-5 md:px-10">
        <div className="flex items-baseline gap-5 mb-14">
          <div className="font-display text-[80px] leading-none text-[#1a1510] [-webkit-text-stroke:1px_var(--indie-gray)]">04</div>
          <div>
            <div className="font-serif text-[28px] font-light text-[#faf6f0]">촬영 장소 대여</div>
            <div className="text-sm font-medium tracking-[0.15em] text-[#5a5248] uppercase mt-1">당신의 작품에 어울리는 공간을 찾으세요</div>
          </div>
        </div>
        <div className="flex gap-5 mt-14 overflow-x-auto pb-5 scrollbar-thin">
          {loading ? (
            <div className="flex-1 py-20 text-center text-[#8a807a]">로딩 중...</div>
          ) : venues.length > 0 ? (
            venues.map((venue, i) => (
              <Link
                key={venue.id}
                href="/venues"
                className="flex-[0_0_320px] group"
              >
                <div
                  className="h-[200px] relative overflow-hidden mb-4 group-hover:scale-[1.02] transition-transform duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${["#1a1010", "#101520", "#151510", "#101818", "#181010"][i % 5]} 0%, #201010 100%)`,
                  }}
                >
                  <div className="absolute top-3 left-3 bg-[#0a0805]/80 border border-[#5a5248] px-2.5 py-1 text-sm tracking-wider text-[#8a807a] uppercase">
                    {venue.location}
                  </div>
                  <div className="absolute bottom-3 right-3 text-[#e8a020] font-display text-[18px] tracking-wider">
                    {venue.pricePerHour ? `₩${venue.pricePerHour.toLocaleString()}/hr` : "문의"}
                  </div>
                </div>
                <div className="font-serif text-base font-normal text-[#faf6f0] mb-1.5 group-hover:text-[#e8a020] transition-colors">{venue.name}</div>
                <div className="text-sm text-[#8a807a] flex gap-4">
                  {venue.area && <span>{venue.area}㎡</span>}
                  {venue.hasParking && <span>주차 가능</span>}
                  {venue.availableHours && <span>{venue.availableHours}</span>}
                </div>
              </Link>
            ))
          ) : (
            <div className="flex-1 py-20 text-center text-[#8a807a]">등록된 장소가 없습니다.</div>
          )}
        </div>
      </section>

      {/* COMMUNITY */}
      <section id="community" className="py-24 md:py-28 px-5 md:px-10 bg-[#100e0a]">
        <div className="flex items-baseline gap-5 mb-14">
          <div className="font-display text-[80px] leading-none text-[#1a1510] [-webkit-text-stroke:1px_var(--indie-gray)]">05</div>
          <div>
            <div className="font-serif text-[28px] font-light text-[#faf6f0]">커뮤니티</div>
            <div className="text-sm font-medium tracking-[0.15em] text-[#5a5248] uppercase mt-1">인디씬의 이야기가 흐르는 곳</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-14">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-0">
              {communityPosts.length > 0 ? (
                communityPosts.map((post, i) => {
                  const badgeLabel = post.authorRole === "actor" ? "배우" : post.authorRole === "filmmaker" ? "제작진" : post.authorRole === "venue" ? "장소" : "회원";
                  const badgeClass = post.authorRole === "actor" ? "bg-red-900/20 text-red-300 border-red-800/30" : post.authorRole === "filmmaker" ? "bg-blue-900/20 text-blue-300 border-blue-800/30" : post.authorRole === "venue" ? "bg-green-900/20 text-green-300 border-green-800/30" : "bg-[#e8a020]/20 text-[#e8a020] border-[#e8a020]/30";
                  const icon = post.authorRole === "actor" ? "🎭" : post.authorRole === "filmmaker" ? "🎬" : post.authorRole === "venue" ? "🏢" : "👤";
                  const timeStr = post.createdAt?.toDate?.() ? (() => {
                    const d = post.createdAt.toDate();
                    const diff = Date.now() - d.getTime();
                    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
                    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
                    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
                    return d.toLocaleDateString("ko-KR");
                  })() : "";
                  return (
                    <Link key={post.id} href={`/posts/${post.id}`} className="grid grid-cols-[auto_1fr_auto] gap-5 py-6 border-b border-[#5a5248]/15 hover:pl-3 transition-all group">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-lg bg-gradient-to-br flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${["#301020", "#102030", "#302010", "#201030", "#103020"][i % 5]} 0%, ${["#180810", "#081018", "#181008", "#100818", "#081810"][i % 5]} 100%)` }}
                      >
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#f0e8d8] mb-1 flex items-center gap-2 flex-wrap">
                          {authorNames[post.authorId] || "—"}
                          <span className={`text-[9px] px-1.5 py-0.5 tracking-wider uppercase border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <div className="text-[13px] text-[#8a807a] leading-relaxed line-clamp-2 group-hover:text-[#b0a898]">{post.title ? `[${post.title}] ` : ""}{post.content}</div>
                        <div className="text-sm font-medium text-[#5a5248] tracking-wider mt-1">{timeStr}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-medium text-[#5a5248]">조회 {post.views || 0}</span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-12 text-center text-[#8a807a]">아직 커뮤니티 글이 없습니다.</div>
              )}
            </div>
            <Link href="/posts" className="inline-block mt-6 px-6 py-2.5 border border-[rgba(240,232,216,0.3)] text-sm tracking-[0.15em] uppercase hover:border-[#f0e8d8] transition-colors">
              커뮤니티 전체 보기 →
            </Link>
          </div>
          <div className="flex flex-col gap-8">
            <div className="bg-[#181410] p-7 border-l-2 border-[#e8a020]">
              <div className="font-display text-[18px] tracking-[0.15em] text-[#e8a020] mb-5">인기 태그</div>
              <div className="flex flex-wrap gap-2">
                {["#단편드라마", "#오디션", "#로케이션", "#신인감독", "#다큐멘터리", "#스릴러", "#인디씬"].map((tag) => (
                  <Link key={tag} href={`/search?q=${tag}`} className="text-sm px-3 py-1.5 bg-[#e8a020]/10 border border-[#e8a020]/20 text-[#a06c10] hover:bg-[#e8a020]/20 hover:text-[#e8a020] transition-all tracking-wider">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-[#181410] p-7 border-l-2 border-[#e8a020]">
              <div className="font-display text-[18px] tracking-[0.15em] text-[#e8a020] mb-5">공지사항</div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 cursor-pointer group">
                  <div className="w-1 h-1 rounded-full bg-[#e8a020] mt-1.5 flex-shrink-0" />
                  <div className="text-sm text-[#8a807a] leading-relaxed group-hover:text-[#f0e8d8]">제8회 인디필름 어워즈 출품작 접수가 시작됩니다.</div>
                </div>
                <div className="flex gap-3 cursor-pointer group">
                  <div className="w-1 h-1 rounded-full bg-[#e8a020] mt-1.5 flex-shrink-0" />
                  <div className="text-sm text-[#8a807a] leading-relaxed group-hover:text-[#f0e8d8]">장소 대여 예약 시스템이 새롭게 업데이트 되었습니다.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0805] border-t border-[#5a5248]/20 py-16 px-5 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div>
            <Link href="/" className="font-display text-2xl tracking-[0.15em] text-[#e8a020] no-underline inline-block mb-4">
              INDIE<span className="text-[#faf6f0]">FILM</span>
            </Link>
            <p className="text-sm font-medium leading-[1.8] text-[#5a5248] max-w-[280px]">
              독립영화의 배우, 제작진, 관객, 장소가 한 곳에서 만나는 플랫폼. 인디씬의 모든 연결을 지원합니다.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.25em] uppercase text-[#e8a020] mb-5">플랫폼</div>
            <ul className="flex flex-col gap-2.5 list-none">
              {["작품 보기", "캐스팅 공고", "배우 검색", "장소 대여", "커뮤니티"].map((label, i) => (
                <li key={i}>
                  <Link href={["/movies", "/posts", "/actors", "/venues", "/posts"][i]} className="text-sm font-medium text-[#5a5248] no-underline hover:text-[#f0e8d8] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.25em] uppercase text-[#e8a020] mb-5">정보</div>
            <ul className="flex flex-col gap-2.5 list-none">
              <li><Link href="#" className="text-sm text-[#5a5248] no-underline hover:text-[#f0e8d8]">소개</Link></li>
              <li><Link href="#" className="text-sm text-[#5a5248] no-underline hover:text-[#f0e8d8]">공지사항</Link></li>
              <li><Link href="#" className="text-sm text-[#5a5248] no-underline hover:text-[#f0e8d8]">이용약관</Link></li>
              <li><Link href="#" className="text-sm text-[#5a5248] no-underline hover:text-[#f0e8d8]">문의하기</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.25em] uppercase text-[#e8a020] mb-5">리소스</div>
            <ul className="flex flex-col gap-2.5 list-none">
              <li><Link href="#" className="text-sm text-[#5a5248] no-underline hover:text-[#f0e8d8]">인디영화 가이드</Link></li>
              <li><Link href="#" className="text-sm text-[#5a5248] no-underline hover:text-[#f0e8d8]">오디션 준비법</Link></li>
              <li><Link href="#" className="text-sm text-[#5a5248] no-underline hover:text-[#f0e8d8]">촬영 체크리스트</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-[#5a5248]/15">
          <div className="text-sm text-[#5a5248] tracking-wider">© 2025 인디필름. All rights reserved.</div>
          <div className="flex gap-5">
            <Link href="#" className="text-sm font-medium tracking-wider text-[#5a5248] no-underline uppercase hover:text-[#e8a020] transition-colors">Instagram</Link>
            <Link href="#" className="text-sm font-medium tracking-wider text-[#5a5248] no-underline uppercase hover:text-[#e8a020] transition-colors">Youtube</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
