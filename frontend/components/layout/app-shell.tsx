"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { getChats } from "@/services/chat";
import { getMe } from "@/services/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: mounted,
  });

  const { data: chatsData } = useQuery({
    queryKey: ["chats"],
    queryFn: getChats,
    enabled: mounted,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        chats={chatsData?.chats || []}
        onNewChat={() => router.push("/chat")}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-6 glass">
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{user?.full_name || "..."}</span>
          </p>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </header>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
