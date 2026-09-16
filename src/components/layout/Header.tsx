"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserSessionPayload } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Menu, LogOut, RefreshCw } from "lucide-react";

interface HeaderProps {
  currentUser: UserSessionPayload | null;
  onToggleMobileSidebar: () => void;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onToggleMobileSidebar,
  onRefresh,
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Main Pharmacy Branch</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">Counter POS #1</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            title="Refresh Ledger"
            className="text-slate-500 hover:text-slate-800 p-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}

        {currentUser && (
          <Badge variant="slate" size="sm" className="font-medium text-slate-600">
            {currentUser.role}
          </Badge>
        )}

        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          leftIcon={<LogOut className="w-3 h-3 text-slate-500" />}
          className="text-xs h-8 px-2.5"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
};
