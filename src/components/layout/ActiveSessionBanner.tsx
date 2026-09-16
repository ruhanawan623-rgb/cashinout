"use client";

import React from "react";
import { CashSessionDTO } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { Button } from "@/components/ui/Button";
import { LockOpen, Lock, User, Clock, Wallet } from "lucide-react";

interface ActiveSessionBannerProps {
  activeSession: CashSessionDTO | null;
  onOpenSession: () => void;
  onCloseSession: () => void;
  onAddCashIn?: () => void;
  onAddCashOut?: () => void;
  userRole?: string;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({
  activeSession,
  onOpenSession,
  onCloseSession,
  userRole,
}) => {
  const isCashierOrAdmin = userRole === "CASHIER" || userRole === "ADMIN";

  if (!activeSession) {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <h3 className="text-sm font-semibold text-slate-800">
                Register Drawer is Closed
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Open a register session and input opening float cash to begin tracking shift cash flow.
            </p>
          </div>
        </div>

        {isCashierOrAdmin && (
          <Button
            onClick={onOpenSession}
            variant="primary"
            size="sm"
            leftIcon={<LockOpen className="w-3.5 h-3.5" />}
          >
            Open Register Shift
          </Button>
        )}
      </div>
    );
  }

  const expectedCash = activeSession.expectedClosingBalance ?? activeSession.openingBalance;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-900">
              Active Shift Session #{activeSession.id.slice(-6).toUpperCase()}
            </h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              <User className="w-3 h-3 inline mr-1 text-slate-400" />
              {activeSession.userName}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              Opened {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Opening Float: <strong className="text-slate-800 font-semibold">{formatCurrency(activeSession.openingBalance)}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Est. Drawer Cash:{" "}
              <strong className="text-emerald-700 font-semibold">
                {formatCurrency(expectedCash)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {isCashierOrAdmin && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={onCloseSession}
            variant="outline"
            size="sm"
            leftIcon={<Lock className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs text-slate-700 hover:bg-slate-50"
          >
            Close & Reconcile Shift
          </Button>
        </div>
      )}
    </div>
  );
};
