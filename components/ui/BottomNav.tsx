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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-2 rounded-xl transition-colors ${
                isActive
                  ? "text-bepc-vert"
                  : "text-bepc-gris hover:text-bepc-vert"
              }`}
            >
              <Icon
                size={20}
                className={isActive ? "stroke-2" : "stroke-[1.5]"}
              />
              <span className="text-[10px] font-medium leading-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
