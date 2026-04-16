"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Dumbbell, Trophy, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/cours", label: "Cours", icon: BookOpen },
  { href: "/entrainement", label: "S'entraîner", icon: Dumbbell },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md
                 shadow-nav pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5
                          min-h-[44px] min-w-[52px] px-1 rounded-xl
                          transition-all duration-150
                          ${isActive ? "text-bepc-vert" : "text-gray-400 hover:text-bepc-vert"}`}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-1 inset-x-2 h-0.5 rounded-full bg-bepc-vert" />
              )}

              <Icon
                size={21}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className={`text-[10px] font-semibold leading-tight ${
                isActive ? "text-bepc-vert" : "text-gray-400"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
