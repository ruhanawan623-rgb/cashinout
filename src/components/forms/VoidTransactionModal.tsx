"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CashTransactionDTO } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface VoidTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: CashTransactionDTO | null;
}

export const VoidTransactionModal: React.FC<VoidTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}) => {
  const [voidReason, setVoidReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (voidReason.trim().length < 5) {
      setError("Please provide a meaningful void reason of at least 5 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voidReason: voidReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to void transaction");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Network error while voiding");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Transaction (Audit Action)"
      subtitle={`Txn ID: ${transaction.id.slice(-8)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Permanent Audit Notice:</strong> For regulatory compliance, transactions are never erased from the database. This action will flag the record as <strong>VOIDED</strong>, record your user identity and timestamp, and exclude this amount from all daily financial totals.
          </div>
        </div>

        {/* Transaction Summary Preview */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Direction:</span>
            <span className={`font-bold ${transaction.type === "CASH_IN" ? "text-emerald-700" : "text-rose-700"}`}>
              {transaction.type === "CASH_IN" ? "+ Cash In" : "- Cash Out"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount:</span>
            <span className="font-bold text-slate-800">{formatCurrency(transaction.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Category:</span>
            <span className="font-medium text-slate-700">{transaction.categoryName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-medium text-slate-700">{transaction.paymentMode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Created By:</span>
            <span className="font-medium text-slate-700">{transaction.createdByName}</span>
          </div>
        </div>

        {/* Mandatory Void Reason */}
        <div>
          <Input
            label="Reason for Voiding *"
            placeholder="e.g., Duplicate bill entered by counter 2, Customer returned medicine"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            helperText="Minimum 5 characters required for compliance audit log."
            required
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isLoading}
            leftIcon={<ShieldAlert className="w-4 h-4" />}
          >
            Confirm & Void
          </Button>
        </div>
      </form>
    </Modal>
  );
};
