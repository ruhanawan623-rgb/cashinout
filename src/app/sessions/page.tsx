"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserSessionPayload, CashSessionDTO } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OpenSessionModal } from "@/components/forms/OpenSessionModal";
import { CloseSessionModal } from "@/components/forms/CloseSessionModal";
import {
  LockOpen,
  Lock,
  Clock,
  User,
  CheckCircle2,
  History,
  Wallet,
} from "lucide-react";

export default function SessionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [sessions, setSessions] = useState<CashSessionDTO[]>([]);
  const [activeSession, setActiveSession] = useState<CashSessionDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const loadSessionsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeRes, res] = await Promise.all([
        fetch("/api/sessions/active"),
        fetch("/api/sessions"),
      ]);

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveSession(activeData.activeSession);
      }

      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load sessions data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadSessionsData();
  }, [checkAuth, loadSessionsData]);

  const isCashierOrAdmin = currentUser?.role === "CASHIER" || currentUser?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
      <Sidebar
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header
          currentUser={currentUser}
          onToggleMobileSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRefresh={loadSessionsData}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Register Sessions & Shift Handover
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Drawer float opening, closing count, and cash variance logs.
              </p>
            </div>

            {isCashierOrAdmin && !activeSession && (
              <Button
                onClick={() => setIsOpenModalOpen(true)}
                variant="primary"
                size="sm"
                leftIcon={<LockOpen className="w-3.5 h-3.5" />}
              >
                Open Register Session
              </Button>
            )}

            {isCashierOrAdmin && activeSession && (
              <Button
                onClick={() => setIsCloseModalOpen(true)}
                variant="outline"
                size="sm"
                leftIcon={<Lock className="w-3.5 h-3.5 text-slate-500" />}
              >
                Close & Reconcile Shift
              </Button>
            )}
          </div>

          {/* Current Active Session Card */}
          {activeSession ? (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="text-sm font-bold text-slate-900">
                        Active Shift #{activeSession.id.slice(-6).toUpperCase()}
                      </h3>
                      <Badge variant="emerald" size="sm">Open</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Cashier: <strong className="text-slate-700">{activeSession.userName}</strong>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setIsCloseModalOpen(true)}
                  variant="outline"
                  size="sm"
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                >
                  Close Session
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Opening Cash Float</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {formatCurrency(activeSession.openingBalance)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Cash In (Cash Mode)</span>
                  <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                    +{formatCurrency((activeSession as any).cashDrawerOnlyIn ?? 0)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Cash Out (Cash Mode)</span>
                  <span className="text-base font-bold text-rose-700 font-mono mt-0.5 block">
                    -{formatCurrency((activeSession as any).cashDrawerOnlyOut ?? 0)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium block">Est. Expected Cash</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {formatCurrency(
                      activeSession.expectedClosingBalance ?? activeSession.openingBalance
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">
                    No Register Session Active
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Start a shift by opening a session with counted float cash.
                  </p>
                </div>
              </div>

              {isCashierOrAdmin && (
                <Button
                  onClick={() => setIsOpenModalOpen(true)}
                  variant="primary"
                  size="sm"
                  leftIcon={<LockOpen className="w-3.5 h-3.5" />}
                >
                  Start Shift
                </Button>
              )}
            </div>
          )}

          {/* Past Sessions History Table */}
          <Card
            title="Shift History"
            subtitle="Previous register sessions and reconciliation variance"
          >
            {sessions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No previous sessions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-y border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-5">Session</th>
                      <th className="py-2.5 px-3">Cashier</th>
                      <th className="py-2.5 px-3">Opened</th>
                      <th className="py-2.5 px-3">Closed</th>
                      <th className="py-2.5 px-3">Opening Float</th>
                      <th className="py-2.5 px-3">Expected Cash</th>
                      <th className="py-2.5 px-3">Actual Count</th>
                      <th className="py-2.5 px-3">Variance</th>
                      <th className="py-2.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((s) => {
                      const diff = s.difference ?? 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-5 font-mono font-medium text-slate-800">
                            #{s.id.slice(-6).toUpperCase()}
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-800">
                            {s.userName}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                            {new Date(s.openedAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                            {s.closedAt
                              ? new Date(s.closedAt).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-700">
                            {formatCurrency(s.openingBalance)}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                            {s.expectedClosingBalance !== null && s.expectedClosingBalance !== undefined
                              ? formatCurrency(s.expectedClosingBalance)
                              : "—"}
                          </td>

                          <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                            {s.actualClosingBalance !== null && s.actualClosingBalance !== undefined
                              ? formatCurrency(s.actualClosingBalance)
                              : "—"}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {s.status === "CLOSED" ? (
                              Math.abs(diff) < 0.01 ? (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Balanced
                                </span>
                              ) : diff > 0 ? (
                                <span className="font-semibold text-blue-700 font-mono">
                                  +{formatCurrency(diff)} (Overage)
                                </span>
                              ) : (
                                <span className="font-semibold text-rose-700 font-mono">
                                  {formatCurrency(diff)} (Shortage)
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 italic">Open</span>
                            )}
                          </td>

                          <td className="py-3 px-5 text-right whitespace-nowrap">
                            <Badge variant={s.status === "OPEN" ? "emerald" : "slate"}>
                              {s.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>

      <OpenSessionModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onSuccess={loadSessionsData}
      />

      <CloseSessionModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSuccess={loadSessionsData}
        activeSession={activeSession}
      />
    </div>
  );
}
