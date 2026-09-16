"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CategoryDTO, PaymentMode, TransactionType } from "@/types";
import { ArrowDownCircle, ArrowUpCircle, Banknote, CreditCard, QrCode, Building2 } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: TransactionType;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = "CASH_IN",
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setAmount("");
      setReferenceNo("");
      setNote("");
      setError(null);
      fetchCategories();
    }
  }, [isOpen, defaultType]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories.filter((c: CategoryDTO) => c.isActive));
        const matching = data.categories.find((c: CategoryDTO) => c.type === defaultType && c.isActive);
        if (matching) setCategoryId(matching.id);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  // Filter categories by selected transaction type
  const filteredCategories = categories.filter((c) => c.type === type);

  // When type changes, auto-select first matching category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstMatch = categories.find((c) => c.type === newType);
    setCategoryId(firstMatch ? firstMatch.id : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    if (!categoryId) {
      setError("Please select a valid category.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: numAmount,
          categoryId,
          paymentMode,
          referenceNo: referenceNo.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record transaction");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Network error submitting transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const paymentModes: { mode: PaymentMode; label: string; icon: React.ReactNode }[] = [
    { mode: "CASH", label: "Cash (Drawer)", icon: <Banknote className="w-4 h-4" /> },
    { mode: "CARD", label: "POS Card", icon: <CreditCard className="w-4 h-4" /> },
    { mode: "UPI", label: "UPI / QR", icon: <QrCode className="w-4 h-4" /> },
    { mode: "BANK_TRANSFER", label: "Bank Transfer", icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "CASH_IN" ? "Record Cash In" : "Record Cash Out"}
      subtitle="Enter transaction details for immediate ledger posting"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Transaction Type Segmented Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Transaction Direction
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeChange("CASH_IN")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all ${
                type === "CASH_IN"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Cash In (Inflow)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("CASH_OUT")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all ${
                type === "CASH_OUT"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Cash Out (Outflow)
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label="Amount (Rs.) *"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftAddon="Rs."
            className="text-lg font-bold"
            required
            autoFocus
          />
        </div>

        {/* Category Selection */}
        <div>
          <Select
            label="Category *"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">-- Select Category --</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Payment Mode Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Mode *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {paymentModes.map((pm) => (
              <button
                key={pm.mode}
                type="button"
                onClick={() => setPaymentMode(pm.mode)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === pm.mode
                    ? "border-teal-600 bg-teal-50/80 text-teal-800 shadow-xs ring-1 ring-teal-500"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="mb-1">{pm.icon}</span>
                {pm.label}
              </button>
            ))}
          </div>
          {paymentMode === "CASH" && (
            <p className="text-[11px] text-teal-700 mt-1 font-medium">
              💡 Cash mode automatically updates physical cash drawer calculations.
            </p>
          )}
        </div>

        {/* Reference Number */}
        <div>
          <Input
            label="Reference Number (Optional)"
            placeholder="Bill / Invoice #, UPI Txn ID, Slip #"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
          />
        </div>

        {/* Note / Memo */}
        <div>
          <Input
            label="Note / Purpose (Optional)"
            placeholder="e.g., Amoxicillin 500mg Batch #209 COD payout"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={type === "CASH_IN" ? "success" : "danger"}
            isLoading={isLoading}
          >
            Record {type === "CASH_IN" ? "Cash In" : "Cash Out"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
