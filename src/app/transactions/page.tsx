"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserSessionPayload,
  CashTransactionDTO,
  CategoryDTO,
  TransactionType,
} from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AddTransactionModal } from "@/components/forms/AddTransactionModal";
import { VoidTransactionModal } from "@/components/forms/VoidTransactionModal";
import {
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Banknote,
  CreditCard,
  QrCode,
  Building2,
} from "lucide-react";

export default function TransactionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [transactions, setTransactions] = useState<CashTransactionDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<string>("");
  const [filterMode, setFilterMode] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>("CASH_IN");
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<CashTransactionDTO | null>(null);

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

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (filterMode) params.append("paymentMode", filterMode);
      if (filterCategory) params.append("categoryId", filterCategory);
      if (filterSearch) params.append("search", filterSearch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterMode, filterCategory, filterSearch, startDate, endDate]);

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, [checkAuth]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const openAddModal = (type: TransactionType) => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const openVoidModal = (tx: CashTransactionDTO) => {
    setSelectedTxForVoid(tx);
    setIsVoidModalOpen(true);
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = [
      "Date",
      "Time",
      "Type",
      "Category",
      "Payment Mode",
      "Amount",
      "Reference #",
      "Notes",
      "Created By",
      "Status",
      "Void Reason",
      "Voided By",
    ];

    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString(),
      new Date(t.createdAt).toLocaleTimeString(),
      t.type,
      `"${t.categoryName || ""}"`,
      t.paymentMode,
      t.amount,
      `"${t.referenceNo || ""}"`,
      `"${t.note || ""}"`,
      `"${t.createdByName || ""}"`,
      t.isVoided ? "VOIDED" : "ACTIVE",
      `"${t.voidReason || ""}"`,
      `"${t.voidedByName || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medicash_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modeIcons = {
    CASH: <Banknote className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
    CARD: <CreditCard className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
    UPI: <QrCode className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
    BANK_TRANSFER: <Building2 className="w-3.5 h-3.5 text-slate-500 inline mr-1" />,
  };

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
          onRefresh={loadTransactions}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Transactions Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit records of store cash receipts, vendor payouts, and digital payments.
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
                variant="outline"
                size="sm"
                leftIcon={<Minus className="w-3.5 h-3.5 text-rose-600" />}
                className="hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
              >
                Cash Out
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <Select
                  label="Type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="CASH_IN">Cash In</option>
                  <option value="CASH_OUT">Cash Out</option>
                </Select>
              </div>

              <div>
                <Select
                  label="Payment Mode"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <option value="">All Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </Select>
              </div>

              <div>
                <Select
                  label="Category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Search"
                  placeholder="Ref #, notes"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  leftAddon={<Search className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <Card
            title={`Ledger Entries (${transactions.length})`}
            subtitle="Chronological audit records"
          >
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No transactions match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-left text-xs text-slate-600 min-w-[800px]">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-y border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-4 w-28 whitespace-nowrap">Timestamp</th>
                      <th className="py-2.5 px-3 w-20 whitespace-nowrap">Type</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Category</th>
                      <th className="py-2.5 px-3 w-24 whitespace-nowrap">Mode</th>
                      <th className="py-2.5 px-4 w-32 whitespace-nowrap">Amount</th>
                      <th className="py-2.5 px-4">Reference / Notes</th>
                      <th className="py-2.5 px-4 w-32 whitespace-nowrap">Staff</th>
                      <th className="py-2.5 px-3 w-24 whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-4 w-20 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          tx.isVoided ? "bg-slate-50/70" : ""
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                          <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
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

                        <td className="py-3 px-3 whitespace-nowrap">
                          {tx.isVoided ? (
                            <div>
                              <Badge variant="rose">Voided</Badge>
                              <div
                                className="text-[10px] text-rose-600 truncate max-w-[120px] mt-0.5"
                                title={tx.voidReason || ""}
                              >
                                {tx.voidReason}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="emerald">Active</Badge>
                          )}
                        </td>

                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          {!tx.isVoided &&
                            (currentUser?.role === "ADMIN" ||
                              currentUser?.role === "ACCOUNTANT") && (
                              <button
                                onClick={() => openVoidModal(tx)}
                                className="text-slate-400 hover:text-rose-600 text-xs font-medium hover:underline inline-flex items-center gap-1 transition-colors"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                Void
                              </button>
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

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadTransactions}
        defaultType={addModalType}
      />

      <VoidTransactionModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        onSuccess={loadTransactions}
        transaction={selectedTxForVoid}
      />
    </div>
  );
}
