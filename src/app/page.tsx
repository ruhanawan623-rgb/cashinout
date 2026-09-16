"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserSessionPayload,
  CashSessionDTO,
  CashTransactionDTO,
  DailySummaryReport,
  TransactionType,
} from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ActiveSessionBanner } from "@/components/layout/ActiveSessionBanner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AddTransactionModal } from "@/components/forms/AddTransactionModal";
import { VoidTransactionModal } from "@/components/forms/VoidTransactionModal";
import { OpenSessionModal } from "@/components/forms/OpenSessionModal";
import { CloseSessionModal } from "@/components/forms/CloseSessionModal";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  ShieldAlert,
  ArrowRight,
  Plus,
  Minus,
  FileSpreadsheet,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [activeSession, setActiveSession] = useState<CashSessionDTO | null>(null);
  const [summary, setSummary] = useState<DailySummaryReport | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<CashTransactionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>("CASH_IN");
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<CashTransactionDTO | null>(null);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);

  // Load user session
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

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionRes, summaryRes, txRes] = await Promise.all([
        fetch("/api/sessions/active"),
        fetch("/api/reports/summary"),
        fetch("/api/transactions?take=15"),
      ]);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setActiveSession(sessionData.activeSession);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setRecentTransactions(txData.transactions.slice(0, 10));
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, [checkAuth, loadDashboardData]);

  const openAddModal = (type: TransactionType) => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const openVoidModal = (tx: CashTransactionDTO) => {
    setSelectedTxForVoid(tx);
    setIsVoidModalOpen(true);
  };

  const modeIcons = {
    CASH: <Banknote className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
    CARD: <CreditCard className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
    UPI: <QrCode className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
    BANK_TRANSFER: <Building2 className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Header */}
        <Header
          currentUser={currentUser}
          onToggleMobileSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRefresh={loadDashboardData}
        />

        {/* Dashboard Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Title & Primary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Cash Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pharmacy cash register inflows, disbursements, and drawer reconciliation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => openAddModal("CASH_IN")}
                variant="success"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Cash In
              </Button>
              <Button
                onClick={() => openAddModal("CASH_OUT")}
                variant="danger"
                size="sm"
                leftIcon={<Minus className="w-3.5 h-3.5" />}
              >
                Cash Out
              </Button>
            </div>
          </div>

          {/* Active Cash Register Banner */}
          <ActiveSessionBanner
            activeSession={activeSession}
            onOpenSession={() => setIsOpenSessionModalOpen(true)}
            onCloseSession={() => setIsCloseSessionModalOpen(true)}
            userRole={currentUser?.role}
          />

          {/* 4 Clean Enterprise Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Today's Cash In */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Today&apos;s Cash In
                </span>
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-emerald-600 whitespace-nowrap">
                  {formatCurrency(summary?.totalCashIn || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">
                    {summary?.activeTransactionsCount ?? summary?.transactionsCount ?? 0}
                  </span>{" "}
                  active sales & receipts
                </p>
              </div>
            </div>

            {/* 2. Today's Cash Out */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Today&apos;s Cash Out
                </span>
                <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-rose-600 whitespace-nowrap">
                  {formatCurrency(summary?.totalCashOut || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supplier COD & store expenses
                </p>
              </div>
            </div>

            {/* 3. Net Daily Balance */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Net Balance (In - Out)
                </span>
                <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div
                  className={`text-xl font-bold whitespace-nowrap ${
                    (summary?.netBalance || 0) >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {formatCurrency(summary?.netBalance || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Daily net revenue surplus
                </p>
              </div>
            </div>

            {/* 4. Physical Cash Drawer Balance */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Est. Drawer Cash
                </span>
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-emerald-700 whitespace-nowrap">
                  {formatCurrency(
                    activeSession
                      ? (activeSession.expectedClosingBalance ?? activeSession.openingBalance)
                      : (summary?.cashRegisterBalance || 0)
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {activeSession ? "Physical register in sync" : "Register closed"}
                </p>
              </div>
            </div>
          </div>

          {/* Minimal Clean Payment Mode Breakdown */}
          {summary && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-semibold text-slate-600">
                  Inflow by Payment Mode
                </h4>
                <Link
                  href="/reports"
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  Full Report <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-700 text-xs">
                    {formatCurrency(summary.modeBreakdown.cashIn.CASH)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Card</span>
                  </div>
                  <span className="font-mono font-semibold text-blue-700 text-xs">
                    {formatCurrency(summary.modeBreakdown.cashIn.CARD)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>UPI</span>
                  </div>
                  <span className="font-mono font-semibold text-indigo-700 text-xs">
                    {formatCurrency(summary.modeBreakdown.cashIn.UPI)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Bank</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 text-xs">
                    {formatCurrency(summary.modeBreakdown.cashIn.BANK_TRANSFER)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions Table */}
          <Card
            title="Recent Ledger Entries"
            subtitle="Latest 10 recorded transactions across all payment modes"
            headerAction={
              <Link href="/transactions">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />} className="text-xs">
                  View All
                </Button>
              </Link>
            }
          >
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No transactions recorded yet today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-left text-xs text-slate-600 min-w-[760px]">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-y border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-4 w-24 whitespace-nowrap">Time</th>
                      <th className="py-2.5 px-3 w-20 whitespace-nowrap">Type</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Category</th>
                      <th className="py-2.5 px-3 w-24 whitespace-nowrap">Mode</th>
                      <th className="py-2.5 px-4 w-32 whitespace-nowrap">Amount</th>
                      <th className="py-2.5 px-4">Reference / Notes</th>
                      <th className="py-2.5 px-4 w-32 whitespace-nowrap">Staff</th>
                      <th className="py-2.5 px-4 w-20 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          tx.isVoided ? "bg-slate-50/70" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant={tx.type === "CASH_IN" ? "emerald" : "rose"}>
                            {tx.type === "CASH_IN" ? "+ In" : "- Out"}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {tx.categoryName}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                          {modeIcons[tx.paymentMode]}
                          {tx.paymentMode}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-xs">
                          <span
                            className={
                              tx.isVoided
                                ? "line-through text-slate-400 font-normal"
                                : tx.type === "CASH_IN"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }
                          >
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {tx.referenceNo && (
                              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0">
                                #{tx.referenceNo}
                              </span>
                            )}
                            <span className="truncate max-w-sm">{tx.note || "—"}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                          {tx.createdByName}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {tx.isVoided ? (
                            <Badge variant="amber" title={`Void reason: ${tx.voidReason}`}>
                              Voided
                            </Badge>
                          ) : (
                            (currentUser?.role === "ADMIN" ||
                              currentUser?.role === "ACCOUNTANT") && (
                              <button
                                onClick={() => openVoidModal(tx)}
                                className="text-slate-400 hover:text-rose-600 text-xs font-semibold hover:underline inline-flex items-center gap-1 transition-colors"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Void
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>

      {/* Interactive Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadDashboardData}
        defaultType={addModalType}
      />

      <VoidTransactionModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        onSuccess={loadDashboardData}
        transaction={selectedTxForVoid}
      />

      <OpenSessionModal
        isOpen={isOpenSessionModalOpen}
        onClose={() => setIsOpenSessionModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      <CloseSessionModal
        isOpen={isCloseSessionModalOpen}
        onClose={() => setIsCloseSessionModalOpen(false)}
        onSuccess={loadDashboardData}
        activeSession={activeSession}
      />
    </div>
  );
}
