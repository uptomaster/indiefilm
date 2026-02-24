"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { logout } from "@/lib/auth";
import { Bell, Menu, X, Search } from "lucide-react";

const navLinks = [
  { href: "/movies", label: "작품" },
  { href: "/posts?type=casting_call", label: "캐스팅" },
  { href: "/actors", label: "배우" },
  { href: "/venues", label: "장소" },
  { href: "/posts", label: "커뮤니티" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navBg, setNavBg] = useState("transparent");

  useEffect(() => {
    const handleScroll = () => {
      setNavBg(window.scrollY > 80 ? "rgba(10,8,5,0.97)" : "linear-gradient(to bottom, rgba(10,8,5,0.95), transparent)");
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/posts")) return pathname.startsWith("/posts");
    return pathname.startsWith(href);
  };

  if (loading) return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-5 md:px-10 py-5 transition-colors duration-300"
      style={{ background: navBg }}
    >
      <Link
        href="/"
        className="font-display text-[26px] md:text-[28px] tracking-[0.15em] text-[#e8a020] no-underline relative"
      >
        INDIE<span className="text-[#faf6f0]">FILM</span>
        <span
          className="absolute bottom-[-3px] left-0 w-full h-px bg-[#e8a020] opacity-40"
          aria-hidden
        />
      </Link>

      <ul className="hidden md:flex gap-9 list-none">
        {navLinks.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={`text-sm md:text-base font-semibold tracking-[0.12em] uppercase no-underline transition-colors duration-300 ${
                isActive(href) ? "text-[#e8a020]" : "text-[#b8a898] hover:text-[#e8a020]"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Link
          href="/search"
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-[#b8a898] hover:text-[#e8a020] transition-colors"
          aria-label="검색"
        >
          <Search className="w-4 h-4" />
        </Link>
        {user && (
          <Link
            href="/requests"
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-[#b8a898] hover:text-[#e8a020] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] rounded-full bg-[#e8a020] flex items-center justify-center text-xs font-bold text-[#0a0805]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#f0e8d8] hover:bg-white/5"
          aria-label="메뉴"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        {!isMobileMenuOpen && (
          <div className="hidden md:flex gap-3">
            {user ? (
              <>
                <Link
                  href={userProfile?.role === "actor" ? "/actors/me" : userProfile?.role === "filmmaker" ? "/filmmakers/me" : userProfile?.role === "venue" ? "/venues/me" : "/"}
                  className="text-sm font-semibold tracking-[0.12em] uppercase px-5 py-2 border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] transition-all"
                >
                  내 공간
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold tracking-[0.12em] uppercase px-5 py-2 border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] transition-all bg-transparent cursor-pointer"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold tracking-[0.12em] uppercase px-5 py-2 border border-[#e8a020]/35 text-[#b8a898] hover:border-[#e8a020] hover:text-[#e8a020] transition-all"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold tracking-[0.12em] uppercase px-5 py-2 bg-[#e8a020] text-[#0a0805] hover:bg-[#f0b030] transition-all"
                >
                  가입하기
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[60px] z-50 bg-[#0a0805] border-t border-[#e8a020]/35/30 md:hidden overflow-y-auto">
          <div className="px-5 py-6 flex flex-col gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 text-base font-semibold tracking-wider uppercase ${
                  isActive(href) ? "text-[#e8a020]" : "text-[#b8a898]"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link href="/search" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-base font-semibold tracking-wider text-[#b8a898] flex items-center gap-2">
              <Search className="w-4 h-4" /> 검색
            </Link>
            <hr className="border-[#e8a020]/35/30 my-2" />
            {user ? (
              <>
                <Link href="/requests" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-base font-semibold text-[#b8a898] flex items-center gap-2">
                  <Bell className="w-4 h-4" /> 알림 {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <Link href={userProfile?.role === "actor" ? "/actors/me" : userProfile?.role === "filmmaker" ? "/filmmakers/me" : userProfile?.role === "venue" ? "/venues/me" : "/"} onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-base font-semibold text-[#b8a898]">
                  내 공간
                </Link>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="py-3 text-base font-semibold text-[#b8a898] text-left w-full">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-base font-semibold text-[#b8a898]">
                  로그인
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-base font-semibold text-[#e8a020]">
                  가입하기
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
