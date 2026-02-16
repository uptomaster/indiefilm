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
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <header className="hidden md:block border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold film-gold">
            IndieFilm Hub
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/movies" className="hover:text-red-500 transition-colors text-gray-700">영화</Link>
                <Link href="/actors" className="hover:text-red-500 transition-colors text-gray-700">배우</Link>
                <Link href="/posts" className="hover:text-red-500 transition-colors text-gray-700">커뮤니티</Link>
                {userProfile?.role === "filmmaker" && (
                  <Link href="/movies/new">
                    <Button size="sm" className="btn-primary-gradient text-white font-semibold">영화 업로드</Button>
                  </Link>
                )}
                {userProfile?.role === "viewer" && (
                  <Link href="/movies">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 font-medium">영화 보기</Button>
                  </Link>
                )}
                {userProfile?.role === "actor" && (
                  <Link href="/actors/me">
                    <Button size="sm" className="btn-primary-gradient text-white font-semibold">내 프로필</Button>
                  </Link>
                )}
                {(userProfile?.role === "actor" || userProfile?.role === "filmmaker") && (
                  <Link href="/requests">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 font-medium">요청</Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-300 text-gray-700 hover:bg-gray-100 font-medium">
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 font-medium">로그인</Button>
                </Link>
                <Link href="/signup">
                  <Button className="btn-primary-gradient text-white font-semibold">회원가입</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-pink-100 via-pink-50 to-white">
          <div className="film-strip absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(229, 9, 20, 0.1) 10px, rgba(229, 9, 20, 0.1) 12px)' }} />
          <div className="container relative mx-auto px-4 py-8 md:py-16 lg:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-3 md:mb-6 text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight film-gold px-2">
                INDIE FILM HUB
              </h1>
              <p className="mb-6 md:mb-12 text-lg md:text-xl lg:text-2xl text-gray-900 font-bold tracking-tight px-2">
                인디 영화 제작자와 배우를 연결하는 플랫폼
              </p>
              <p className="mb-6 md:mb-12 text-sm md:text-base lg:text-lg text-gray-800 leading-relaxed font-medium px-2">
                대학생 동아리·인디 영화 제작자들이 만든 작품을 전시하고,
                <br />
                배우 지망생들이 프로필을 만들어 오디션 기회를 찾을 수 있습니다.
              </p>

              {!user ? (
                <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto btn-primary-gradient text-white font-semibold px-6 md:px-8 py-5 md:py-6 text-base md:text-lg">
                      시작하기
                    </Button>
                  </Link>
                  <Link href="/movies" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-medium">
                      영화 둘러보기
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-6 md:mt-8 px-4">
                  <p className="mb-4 md:mb-6 text-lg md:text-xl text-gray-700">
                    환영합니다, <span className="film-gold font-bold">{userProfile?.displayName || user.email}</span>님!
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                    {userProfile?.role === "filmmaker" && (
                      <Link href="/movies/new" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto btn-primary-gradient text-white font-semibold px-6 md:px-8 py-5 md:py-6 text-base md:text-lg">
                          영화 업로드하기
                        </Button>
                      </Link>
                    )}
                    {userProfile?.role === "actor" && (
                      <Link href="/actors/me" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto btn-primary-gradient text-white font-semibold px-6 md:px-8 py-5 md:py-6 text-base md:text-lg">
                          프로필 만들기
                        </Button>
                      </Link>
                    )}
                    <Link href="/movies" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-medium">
                        영화 둘러보기
                      </Button>
                    </Link>
                    <Link href="/actors" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-medium">
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
          <div className="container mx-auto px-4 py-8 md:py-20">
          <div className="grid gap-6 md:gap-12 grid-cols-1 md:grid-cols-3">
            <div className="text-center px-2 md:px-4">
              <div className="mb-3 md:mb-4 text-3xl md:text-4xl lg:text-5xl">🎬</div>
              <h3 className="mb-2 md:mb-3 text-base md:text-lg lg:text-xl font-bold film-gold tracking-tight">제작자를 위한</h3>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 leading-snug px-2">
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
