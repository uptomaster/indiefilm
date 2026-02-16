"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1a1418] via-[#251a20] to-[#1a1418] text-white">
      <header className="border-b border-red-900/30 bg-gradient-to-r from-[#1a1418] to-[#251a20]">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold film-gold">
            IndieFilm Hub
          </Link>
          <nav className="flex items-center gap-4 text-white">
            {user ? (
              <>
                <Link href="/movies" className="hover:text-red-400 transition-colors">영화</Link>
                <Link href="/actors" className="hover:text-red-400 transition-colors">배우</Link>
                <Link href="/posts" className="hover:text-red-400 transition-colors">커뮤니티</Link>
                {userProfile?.role === "filmmaker" && (
                  <Link href="/movies/new">
                    <Button size="sm" className="bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500">영화 업로드</Button>
                  </Link>
                )}
                {userProfile?.role === "viewer" && (
                  <Link href="/movies">
                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">영화 보기</Button>
                  </Link>
                )}
                {userProfile?.role === "actor" && (
                  <Link href="/actors/me">
                    <Button size="sm" className="bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500">내 프로필</Button>
                  </Link>
                )}
                {(userProfile?.role === "actor" || userProfile?.role === "filmmaker") && (
                  <Link href="/requests">
                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">요청</Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:bg-gray-900">로그인</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500">회원가입</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-[#1a1418] via-[#251a20] to-[#1a1418]">
          <div className="film-strip absolute inset-0 opacity-10" />
          <div className="container relative mx-auto px-4 py-24">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-6xl font-bold tracking-tight film-gold">
                INDIE FILM HUB
              </h1>
              <p className="mb-12 text-2xl text-gray-300">
                인디 영화 제작자와 배우를 연결하는 플랫폼
              </p>
              <p className="mb-12 text-lg text-gray-400">
                대학생 동아리·인디 영화 제작자들이 만든 작품을 전시하고,
                <br />
                배우 지망생들이 프로필을 만들어 오디션 기회를 찾을 수 있습니다.
              </p>

              {!user ? (
                <div className="flex justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 px-8 py-6 text-lg">
                      시작하기
                    </Button>
                  </Link>
                  <Link href="/movies">
                    <Button size="lg" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 px-8 py-6 text-lg">
                      영화 둘러보기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-8">
                  <p className="mb-6 text-xl text-gray-300">
                    환영합니다, <span className="film-gold font-semibold">{userProfile?.displayName || user.email}</span>님!
                  </p>
                  <div className="flex justify-center gap-4">
                    {userProfile?.role === "filmmaker" && (
                      <Link href="/movies/new">
                        <Button size="lg" className="bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 px-8 py-6 text-lg">
                          영화 업로드하기
                        </Button>
                      </Link>
                    )}
                    {userProfile?.role === "actor" && (
                      <Link href="/actors/me">
                        <Button size="lg" className="bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 px-8 py-6 text-lg">
                          프로필 만들기
                        </Button>
                      </Link>
                    )}
                    <Link href="/movies">
                      <Button size="lg" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 px-8 py-6 text-lg">
                        영화 둘러보기
                      </Button>
                    </Link>
                    <Link href="/actors">
                      <Button size="lg" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 px-8 py-6 text-lg">
                        배우 찾기
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 기능 소개 섹션 */}
        <div className="container mx-auto px-4 py-20">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 text-5xl">🎬</div>
              <h3 className="mb-3 text-xl font-bold film-gold">제작자를 위한</h3>
              <p className="text-gray-400">
                영화를 업로드하고 배우를 검색하여 캐스팅 제안을 보낼 수 있습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-5xl">🎭</div>
              <h3 className="mb-3 text-xl font-bold film-gold">배우를 위한</h3>
              <p className="text-gray-400">
                프로필을 만들고 제작자들에게 어필하여 오디션 기회를 얻을 수 있습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-5xl">👁️</div>
              <h3 className="mb-3 text-xl font-bold film-gold">관객을 위한</h3>
              <p className="text-gray-400">
                다양한 인디 영화를 감상하고 새로운 재능을 발견할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
