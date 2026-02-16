"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Film, Users, User, Plus, CreditCard, MessageSquare, Search, Bell, Menu, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { logout } from "@/lib/auth";

export default function Navigation() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    // 모바일 메뉴가 열려있을 때 body 스크롤 방지
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // 경로 변경 시 모바일 메뉴 자동 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return null;
  }

  const menuContent = (
    <div className="flex h-full flex-col">
      {/* 로고 */}
      <div className="border-b border-gray-200 p-4 md:p-6">
        <Link href="/" className="block" onClick={() => setIsMobileMenuOpen(false)}>
          <h1 className="text-xl md:text-2xl font-bold film-gold tracking-tight">IndieFilm Hub</h1>
          <p className="mt-1 text-xs text-gray-700 font-semibold tracking-tight">인디 영화 허브</p>
        </Link>
      </div>

      {/* 검색바 */}
      <div className="border-b border-gray-200 p-3 md:p-4">
        <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              pathname === "/search"
                ? "bg-violet-50 text-violet-600 font-bold"
                : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
            }`}
          >
            <Search className="mr-2 h-4 w-4" />
            검색
          </Button>
        </Link>

        {user && (
          <Link href="/requests" onClick={() => setIsMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className={`w-full justify-start relative mt-2 ${
                pathname === "/requests"
                  ? "bg-violet-50 text-violet-600 font-bold"
                  : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
              }`}
            >
              <Bell className="mr-2 h-4 w-4" />
              알림
              {unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-violet-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        )}
      </div>

      {/* 메뉴 */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3 md:p-4">
        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              isActive("/") && pathname !== "/actors" && pathname !== "/movies"
                ? "bg-violet-50 text-violet-600 font-bold"
                : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
            }`}
          >
            <Home className="mr-2 h-4 w-4" />
            홈
          </Button>
        </Link>

        <Link href="/actors" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              isActive("/actors")
                ? "bg-violet-50 text-violet-600 font-bold"
                : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
            }`}
          >
            <Users className="mr-2 h-4 w-4" />
            배우 목록
          </Button>
        </Link>

        <Link href="/movies" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              isActive("/movies")
                ? "bg-violet-50 text-violet-600 font-bold"
                : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
            }`}
          >
            <Film className="mr-2 h-4 w-4" />
            영화 목록
          </Button>
        </Link>

        <Link href="/posts" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              isActive("/posts")
                ? "bg-violet-50 text-violet-600 font-bold"
                : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
            }`}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            커뮤니티
          </Button>
        </Link>

        <Link href="/credits" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              isActive("/credits")
                ? "bg-violet-50 text-violet-600 font-bold"
                : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
            }`}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            제작진
          </Button>
        </Link>

        <Link href="/filmmakers" onClick={() => setIsMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              isActive("/filmmakers")
                ? "bg-violet-50 text-violet-600 font-bold"
                : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
            }`}
          >
            <Film className="mr-2 h-4 w-4" />
            제작자 목록
          </Button>
        </Link>

        {user && (
          <>
            {userProfile?.role === "actor" && (
              <Link href="/actors/me" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/actors/me")
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <User className="mr-2 h-4 w-4" />
                  내 프로필
                </Button>
              </Link>
            )}

            {userProfile?.role === "filmmaker" && (
              <>
                <Link href="/filmmakers/me" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive("/filmmakers/me")
                        ? "bg-violet-50 text-violet-600 font-bold"
                        : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                    }`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    내 프로필
                  </Button>
                </Link>
                <Link href="/movies/new" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive("/movies/new")
                        ? "bg-violet-50 text-violet-600 font-bold"
                        : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                    }`}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    영화 업로드
                  </Button>
                </Link>
              </>
            )}

            {userProfile && !userProfile.role && (
              <Link href="/role-select" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/role-select")
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
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
      <div className="border-t border-gray-200 p-3 md:p-4">
        {user ? (
          <div className="space-y-2">
            <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
              <p className="text-sm font-bold text-gray-900 tracking-tight">
                {userProfile?.displayName || user.email}
              </p>
              {userProfile?.role && (
                <p className="text-xs text-gray-800 font-semibold tracking-tight">
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
              className="w-full text-gray-900 hover:bg-gray-100 font-semibold"
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full btn-primary-gradient text-white font-semibold">
                로그인
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="outline"
                className="w-full border-violet-400 text-violet-500 hover:bg-violet-50 font-medium"
              >
                회원가입
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일 헤더 */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-lg font-bold film-gold tracking-tight">IndieFilm Hub</h1>
          </Link>
          
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/requests" className="relative">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Bell className="h-5 w-5 text-gray-900" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="메뉴 열기"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-900" />
              ) : (
                <Menu className="h-5 w-5 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white max-h-[calc(100vh-60px)] overflow-y-auto">
            <div className="px-2 py-2 space-y-1">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/") && pathname !== "/actors" && pathname !== "/movies"
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <Home className="mr-2 h-4 w-4" />
                  홈
                </Button>
              </Link>

              <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    pathname === "/search"
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <Search className="mr-2 h-4 w-4" />
                  검색
                </Button>
              </Link>

              <Link href="/actors" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/actors")
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  배우 목록
                </Button>
              </Link>

              <Link href="/movies" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/movies")
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <Film className="mr-2 h-4 w-4" />
                  영화 목록
                </Button>
              </Link>

              <Link href="/posts" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/posts")
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  커뮤니티
                </Button>
              </Link>

              <Link href="/credits" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/credits")
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  제작진
                </Button>
              </Link>

              <Link href="/filmmakers" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive("/filmmakers")
                      ? "bg-violet-50 text-violet-600 font-bold"
                      : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                  }`}
                >
                  <Film className="mr-2 h-4 w-4" />
                  제작자 목록
                </Button>
              </Link>

              {user && (
                <>
                  {userProfile?.role === "actor" && (
                    <Link href="/actors/me" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${
                          isActive("/actors/me")
                            ? "bg-violet-50 text-violet-600 font-bold"
                            : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                        }`}
                      >
                        <User className="mr-2 h-4 w-4" />
                        내 프로필
                      </Button>
                    </Link>
                  )}

                  {userProfile?.role === "filmmaker" && (
                    <>
                      <Link href="/filmmakers/me" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${
                            isActive("/filmmakers/me")
                              ? "bg-violet-50 text-violet-600 font-bold"
                              : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                          }`}
                        >
                          <User className="mr-2 h-4 w-4" />
                          내 프로필
                        </Button>
                      </Link>
                      <Link href="/movies/new" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${
                            isActive("/movies/new")
                              ? "bg-violet-50 text-violet-600 font-bold"
                              : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                          }`}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          영화 업로드
                        </Button>
                      </Link>
                    </>
                  )}

                  {userProfile && !userProfile.role && (
                    <Link href="/role-select" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${
                          isActive("/role-select")
                            ? "bg-violet-50 text-violet-600 font-bold"
                            : "text-gray-900 hover:bg-indigo-50 hover:text-violet-600 font-semibold"
                        }`}
                      >
                        <User className="mr-2 h-4 w-4" />
                        역할 선택
                      </Button>
                    </Link>
                  )}
                </>
              )}

              <div className="border-t border-gray-200 pt-2 mt-2">
                {user ? (
                  <div className="space-y-2 px-2">
                    <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                      <p className="text-xs font-bold text-gray-900 tracking-tight">
                        {userProfile?.displayName || user.email}
                      </p>
                      {userProfile?.role && (
                        <p className="text-xs text-gray-800 font-semibold tracking-tight">
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
                      className="w-full text-gray-900 hover:bg-gray-100 font-semibold text-sm"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      로그아웃
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 px-2">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full btn-primary-gradient text-white font-semibold text-sm">
                        로그인
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-violet-400 text-violet-500 hover:bg-violet-50 font-medium text-sm"
                      >
                        회원가입
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 데스크톱 사이드바 */}
      <nav className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white shadow-lg">
        {menuContent}
      </nav>
    </>
  );
}
