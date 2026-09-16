"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSessionPayload } from "@/types";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calculator,
  Tags,
  BarChart3,
  Printer,
  Shield,
  Activity,
} from "lucide-react";

interface SidebarProps {
  currentUser: UserSessionPayload | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, isOpen, onClose }) => {
  const pathname = usePathname();
  const role = currentUser?.role || "CASHIER";

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["ADMIN", "CASHIER", "ACCOUNTANT"],
    },
    {
      name: "Cash In / Out",
      href: "/transactions",
      icon: ArrowLeftRight,
      roles: ["ADMIN", "CASHIER", "ACCOUNTANT"],
    },
    {
      name: "Register Sessions",
      href: "/sessions",
      icon: Calculator,
      roles: ["ADMIN", "CASHIER", "ACCOUNTANT"],
    },
    {
      name: "Categories",
      href: "/categories",
      icon: Tags,
      roles: ["ADMIN", "ACCOUNTANT"],
    },
    {
      name: "Reports & Analytics",
      href: "/reports",
      icon: BarChart3,
      roles: ["ADMIN", "ACCOUNTANT"],
    },
    {
      name: "Daily Cash Sheet",
      href: "/reports/print",
      icon: Printer,
      roles: ["ADMIN", "ACCOUNTANT"],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col justify-between select-none`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 tracking-tight text-sm">
                MEDICASH
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Medical Store POS
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="p-3 space-y-1">
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Menu
            </p>
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-slate-900" : "text-slate-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 p-1.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0">
              {currentUser?.name ? currentUser.name[0] : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {currentUser?.name || "Staff Member"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {currentUser?.role || "USER"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
