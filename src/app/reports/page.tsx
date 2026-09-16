"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserSessionPayload, DailySummaryReport } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Calendar,
  Printer,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [summary, setSummary] = useState<DailySummaryReport | null>(null);
  const [userReport, setUserReport] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user);
      if (data.user.role === "CASHIER") {
        router.push("/");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const [summaryRes, userRes] = await Promise.all([
        fetch(`/api/reports/summary?${params.toString()}`),
        fetch(`/api/reports/user-wise?${params.toString()}`),
      ]);

      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserReport(userData.userReport || []);
      }
    } catch (e) {
      console.error("Failed to load reports", e);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

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
          onRefresh={loadReportData}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Financial Reports & Audit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary of cash flows, payment mode settlements, and staff activity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/reports/print" target="_blank">
                <Button variant="outline" size="sm" leftIcon={<Printer className="w-3.5 h-3.5 text-slate-500" />}>
                  Print Cash Sheet
                </Button>
              </Link>
            </div>
          </div>

          {/* Date Filter Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:w-44">
                <Input
                  label="From Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-44">
                <Input
                  label="To Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={loadReportData}
                leftIcon={<Calendar className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto h-9"
              >
                Apply Filter
              </Button>

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-xs h-9"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Clean Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Total Cash Inflow
                </span>
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-2">
                {formatCurrency(summary?.totalCashIn || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.activeTransactionsCount ?? summary?.transactionsCount ?? 0} valid entries
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Total Cash Outflow
                </span>
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-2">
                {formatCurrency(summary?.totalCashOut || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Disbursements & vendor payments
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Net Period Surplus
                </span>
                <Coins className="w-4 h-4 text-slate-500" />
              </div>
              <div
                className={`text-xl font-bold font-mono mt-2 ${
                  (summary?.netBalance || 0) >= 0 ? "text-slate-900" : "text-rose-700"
                }`}
              >
                {formatCurrency(summary?.netBalance || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Voided excluded: {summary?.voidedCount || 0}
              </p>
            </div>
          </div>

          {/* Category-Wise Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Cash In by Category */}
            <Card
              title="Cash In by Category"
              subtitle="Distribution of incoming funds"
            >
              {summary?.categoryBreakdown.cashIn.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No cash in categories recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {summary?.categoryBreakdown.cashIn.map((item, idx) => {
                    const pct = summary.totalCashIn > 0 ? (item.amount / summary.totalCashIn) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="font-medium">{item.category}</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {formatCurrency(item.amount)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Cash Out by Category */}
            <Card
              title="Cash Out by Category"
              subtitle="Distribution of outgoing expenses"
            >
              {summary?.categoryBreakdown.cashOut.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No cash out categories recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {summary?.categoryBreakdown.cashOut.map((item, idx) => {
                    const pct = summary.totalCashOut > 0 ? (item.amount / summary.totalCashOut) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="font-medium">{item.category}</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {formatCurrency(item.amount)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* User-Wise / Staff Audit Report */}
          <Card
            title="Staff Performance & Shift Activity"
            subtitle="Transactions and cash collections grouped by staff member"
          >
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[11px] border-y border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-5">Staff Member</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Transactions</th>
                    <th className="py-2.5 px-3">Total In</th>
                    <th className="py-2.5 px-3">Total Out</th>
                    <th className="py-2.5 px-3">Net</th>
                    <th className="py-2.5 px-3">Void Actions</th>
                    <th className="py-2.5 px-5 text-right">Shifts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userReport.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-5 font-medium text-slate-800">
                        <div>{u.userName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant="slate" size="sm">
                          {u.role}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700">
                        {u.totalTransactions}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-emerald-700">
                        {formatCurrency(u.totalCashIn)}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-rose-700">
                        {formatCurrency(u.totalCashOut)}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                        {formatCurrency(u.netContribution)}
                      </td>

                      <td className="py-3 px-3">
                        {u.voidedCount > 0 ? (
                          <Badge variant="rose" size="sm">{u.voidedCount}</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-5 text-right font-mono text-slate-600">
                        {u.sessionsOperated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
