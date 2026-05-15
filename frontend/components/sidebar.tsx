"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  chats?: { id: number; title: string }[];
  onNewChat?: () => void;
}

export function Sidebar({ chats = [], onNewChat }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r glass">
      <div className="flex items-center gap-2 border-b px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">RAG Assistant</p>
          <p className="text-xs text-muted-foreground">Research AI</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {pathname.startsWith("/chat") && (
          <div className="mt-4">
            <Button variant="outline" className="w-full" size="sm" onClick={onNewChat}>
              + New Chat
            </Button>
            <p className="mb-2 mt-4 px-3 text-xs font-medium text-muted-foreground">Recent</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {chats.slice(0, 8).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat?id=${chat.id}`}
                  className="block truncate rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
                >
                  {chat.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="flex items-center justify-between border-t p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          v1.0
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
