"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CashSessionDTO } from "@/types";
import { formatCurrency, calculateSessionDifference } from "@/lib/calculations";
import { Lock, Calculator, CheckCircle2, AlertCircle } from "lucide-react";

interface CloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeSession: CashSessionDTO | null;
}

export const CloseSessionModal: React.FC<CloseSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activeSession,
}) => {
  const [actualClosingBalance, setActualClosingBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeSession) {
      // Pre-fill with expected closing balance for smooth cashier verification
      const expected = activeSession.expectedClosingBalance ?? activeSession.openingBalance;
      setActualClosingBalance(expected.toFixed(2));
      setNotes("");
      setError(null);
    }
  }, [isOpen, activeSession]);

  if (!activeSession) return null;

  const openingFloat = activeSession.openingBalance;
  const expectedClosing = activeSession.expectedClosingBalance ?? openingFloat;
  const numActual = parseFloat(actualClosingBalance);
  const isValidNumber = !isNaN(numActual) && numActual >= 0;

  const diffResult = isValidNumber
    ? calculateSessionDifference(numActual, expectedClosing)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidNumber) {
      setError("Please enter a valid non-negative actual counted closing balance.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/sessions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          actualClosingBalance: numActual,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to close session");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Network error while closing session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Close Register Shift & Reconcile"
      subtitle={`Session #${activeSession.id.slice(-6).toUpperCase()} • Cashier: ${activeSession.userName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Live System Mathematical Reconciliation Breakdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-2 border-b border-slate-200/80 pb-2">
            <Calculator className="w-4 h-4 text-teal-600" />
            Drawer Calculation Formula
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Opening Cash Float:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(openingFloat)}
            </span>
          </div>

          <div className="flex justify-between items-center text-emerald-700">
            <span>(+) Total Cash In (Cash Mode Only):</span>
            <span className="font-mono font-semibold">
              +{formatCurrency((activeSession as any).cashDrawerOnlyIn ?? 0)}
            </span>
          </div>

          <div className="flex justify-between items-center text-rose-700">
            <span>(-) Total Cash Out (Cash Mode Only):</span>
            <span className="font-mono font-semibold">
              -{formatCurrency((activeSession as any).cashDrawerOnlyOut ?? 0)}
            </span>
          </div>

          <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-slate-900 font-bold text-sm">
            <span>(=) Expected Drawer Cash:</span>
            <span className="font-mono text-teal-800 text-base">
              {formatCurrency(expectedClosing)}
            </span>
          </div>
        </div>

        {/* Physical Cash Count Input */}
        <div>
          <Input
            label="Actual Counted Cash in Drawer (Rs.) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={actualClosingBalance}
            onChange={(e) => setActualClosingBalance(e.target.value)}
            leftAddon="Rs."
            className="text-lg font-bold"
            helperText="Count physical currency notes and coins physically inside the register drawer."
            required
            autoFocus
          />
        </div>

        {/* Real-time Variance Badge & Alert */}
        {diffResult && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              diffResult.status === "BALANCED"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : diffResult.status === "OVERAGE"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {diffResult.status === "BALANCED" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {diffResult.status === "BALANCED" && "Drawer Perfectly Balanced!"}
                  {diffResult.status === "OVERAGE" && "Drawer Overage Detected (+Surplus)"}
                  {diffResult.status === "SHORTAGE" && "Drawer Shortage Detected (-Deficit)"}
                </div>
                <div className="text-xs mt-0.5 opacity-90">
                  {diffResult.formattedText}
                </div>
              </div>
            </div>

            <Badge
              variant={
                diffResult.status === "BALANCED"
                  ? "emerald"
                  : diffResult.status === "OVERAGE"
                  ? "blue"
                  : "rose"
              }
              size="md"
            >
              Diff: {formatCurrency(diffResult.difference)}
            </Badge>
          </div>
        )}

        {/* End of shift notes */}
        <div>
          <Input
            label="Closing Notes / Explanation"
            placeholder="e.g., Handed over to Evening Cashier, all notes accounted for"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Lock className="w-4 h-4" />}
          >
            Confirm & Finalize Closing
          </Button>
        </div>
      </form>
    </Modal>
  );
};
