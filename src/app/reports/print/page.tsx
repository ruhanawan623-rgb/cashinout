"use client";

import React, { useState, useEffect } from "react";
import { DailySummaryReport } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrintReportPage() {
  const [summary, setSummary] = useState<DailySummaryReport | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }));

    fetch("/api/reports/summary")
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((e) => console.error("Error loading print data", e));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      {/* Control Bar (Hidden when printing) */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Reports
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Daily Cash Sheet
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              MEDICASH PHARMACY STORE
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Daily Cash Register Reconciliation & Shift Audit Sheet
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-slate-800">Date: {currentDate}</p>
            <p className="text-slate-500 mt-0.5">Branch: Counter POS #1</p>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Cash Inflow
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
              {formatCurrency(summary?.totalCashIn || 0)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Cash Outflow
            </span>
            <span className="text-xl font-black text-rose-700 font-mono mt-1 block">
              {formatCurrency(summary?.totalCashOut || 0)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Net Period Balance
            </span>
            <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
              {formatCurrency(summary?.netBalance || 0)}
            </span>
          </div>
        </div>

        {/* Mode Breakdown Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
            1. Payment Mode Settlement
          </h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2">Payment Mode</th>
                <th className="py-2 text-right">Cash In (Inflow)</th>
                <th className="py-2 text-right">Cash Out (Outflow)</th>
                <th className="py-2 text-right">Net Mode Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2 font-sans font-medium">Physical Cash (Drawer)</td>
                <td className="py-2 text-right text-emerald-700">
                  {formatCurrency(summary?.modeBreakdown.cashIn.CASH || 0)}
                </td>
                <td className="py-2 text-right text-rose-700">
                  {formatCurrency(summary?.modeBreakdown.cashOut.CASH || 0)}
                </td>
                <td className="py-2 text-right font-bold text-slate-900">
                  {formatCurrency(
                    (summary?.modeBreakdown.cashIn.CASH || 0) -
                      (summary?.modeBreakdown.cashOut.CASH || 0)
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-sans font-medium">POS Card Terminal</td>
                <td className="py-2 text-right text-emerald-700">
                  {formatCurrency(summary?.modeBreakdown.cashIn.CARD || 0)}
                </td>
                <td className="py-2 text-right text-rose-700">
                  {formatCurrency(summary?.modeBreakdown.cashOut.CARD || 0)}
                </td>
                <td className="py-2 text-right font-bold text-slate-900">
                  {formatCurrency(
                    (summary?.modeBreakdown.cashIn.CARD || 0) -
                      (summary?.modeBreakdown.cashOut.CARD || 0)
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-sans font-medium">UPI / QR Digital Scan</td>
                <td className="py-2 text-right text-emerald-700">
                  {formatCurrency(summary?.modeBreakdown.cashIn.UPI || 0)}
                </td>
                <td className="py-2 text-right text-rose-700">
                  {formatCurrency(summary?.modeBreakdown.cashOut.UPI || 0)}
                </td>
                <td className="py-2 text-right font-bold text-slate-900">
                  {formatCurrency(
                    (summary?.modeBreakdown.cashIn.UPI || 0) -
                      (summary?.modeBreakdown.cashOut.UPI || 0)
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-sans font-medium">Direct Bank Transfer</td>
                <td className="py-2 text-right text-emerald-700">
                  {formatCurrency(summary?.modeBreakdown.cashIn.BANK_TRANSFER || 0)}
                </td>
                <td className="py-2 text-right text-rose-700">
                  {formatCurrency(summary?.modeBreakdown.cashOut.BANK_TRANSFER || 0)}
                </td>
                <td className="py-2 text-right font-bold text-slate-900">
                  {formatCurrency(
                    (summary?.modeBreakdown.cashIn.BANK_TRANSFER || 0) -
                      (summary?.modeBreakdown.cashOut.BANK_TRANSFER || 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Category Breakdown Table */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
              2. Cash In Categories
            </h3>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-100">
                {summary?.categoryBreakdown.cashIn.map((c, i) => (
                  <tr key={i}>
                    <td className="py-1.5">{c.category}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(c.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
              3. Cash Out Categories
            </h3>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-100">
                {summary?.categoryBreakdown.cashOut.map((c, i) => (
                  <tr key={i}>
                    <td className="py-1.5">{c.category}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(c.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Physical Drawer Handover Signatures */}
        <div className="border-t-2 border-slate-900 pt-8 mt-12 grid grid-cols-2 gap-12 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8 mb-2"></div>
            <p className="font-bold text-slate-900">Counter Cashier Signature</p>
            <p className="text-slate-500 text-[10px]">I certify that the cash drawer count accurately represents physical funds.</p>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-8 mb-2"></div>
            <p className="font-bold text-slate-900">Store Manager / Accountant Signature</p>
            <p className="text-slate-500 text-[10px]">Verified against register session ledger and authorized for safe deposit.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
