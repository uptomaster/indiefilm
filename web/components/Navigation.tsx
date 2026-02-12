"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Film, Users, User, Plus, CreditCard, MessageSquare, Search, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { logout } from "@/lib/auth";

export default function Navigation() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  if (loading) {
    return null;
  }

  return (
    <nav className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-yellow-600/20 bg-black/95 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* 로고 */}
        <div className="border-b border-yellow-600/20 p-6">
          <Link href="/" className="block">
            <h1 className="text-2xl font-bold film-gold">IndieFilm Hub</h1>
            <p className="mt-1 text-xs text-gray-400">인디 영화 허브</p>
          </Link>
        </div>

        {/* 검색바 */}
        <div className="border-b border-yellow-600/20 p-4">
          <Link href="/search">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/search"
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
          </Link>

          {user && (
            <Link href="/requests">
              <Button
                variant="ghost"
                className={`w-full justify-start relative ${
                  pathname === "/requests"
                    ? "bg-yellow-600/20 text-yellow-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Bell className="mr-2 h-4 w-4" />
                알림
                {unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
        </div>

        {/* 메뉴 */}
        <div className="flex-1 space-y-2 p-4">
          <Link href="/">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/") && pathname !== "/actors" && pathname !== "/movies"
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Home className="mr-2 h-4 w-4" />
              홈
            </Button>
          </Link>

          <Link href="/actors">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/actors")
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Users className="mr-2 h-4 w-4" />
              배우 목록
            </Button>
          </Link>

          <Link href="/movies">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/movies")
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Film className="mr-2 h-4 w-4" />
              영화 목록
            </Button>
          </Link>

          <Link href="/posts">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/posts")
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              커뮤니티
            </Button>
          </Link>

          <Link href="/credits">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/credits")
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              제작진
            </Button>
          </Link>

          <Link href="/filmmakers">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isActive("/filmmakers")
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Film className="mr-2 h-4 w-4" />
              제작자 목록
            </Button>
          </Link>

          {user && (
            <>
              {userProfile?.role === "actor" && (
                <Link href="/actors/me">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive("/actors/me")
                        ? "bg-yellow-600/20 text-yellow-400"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    내 프로필
                  </Button>
                </Link>
              )}

              {userProfile?.role === "filmmaker" && (
                <>
                  <Link href="/filmmakers/me">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive("/filmmakers/me")
                          ? "bg-yellow-600/20 text-yellow-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <User className="mr-2 h-4 w-4" />
                      내 프로필
                    </Button>
                  </Link>
                  <Link href="/movies/new">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive("/movies/new")
                          ? "bg-yellow-600/20 text-yellow-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      영화 업로드
                    </Button>
                  </Link>
                </>
              )}

              {userProfile && !userProfile.role && (
                <Link href="/role-select">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive("/role-select")
                        ? "bg-yellow-600/20 text-yellow-400"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    역할 선택
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>

        {/* 사용자 정보 및 로그아웃 */}
        <div className="border-t border-yellow-600/20 p-4">
          {user ? (
            <div className="space-y-2">
              <div className="rounded-lg bg-gray-900/50 p-3">
                <p className="text-sm font-medium text-white">
                  {userProfile?.displayName || user.email}
                </p>
                {userProfile?.role && (
                  <p className="text-xs text-gray-400">
                    {userProfile.role === "actor"
                      ? "배우"
                      : userProfile.role === "filmmaker"
                      ? "제작자"
                      : "관객"}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login">
                <Button className="w-full bg-yellow-600 text-black hover:bg-yellow-500">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  variant="outline"
                  className="w-full border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                >
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
