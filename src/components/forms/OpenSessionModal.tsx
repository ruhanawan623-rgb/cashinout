"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LockOpen } from "lucide-react";

interface OpenSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OpenSessionModal: React.FC<OpenSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [openingBalance, setOpeningBalance] = useState("5000.00");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      setError("Please enter a valid non-negative opening float cash balance.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingBalance: balance,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to open register session");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Network error while opening session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Register Session"
      subtitle="Enter the physical opening cash drawer float to begin shift"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <Input
            label="Opening Float Cash (Rs.) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            leftAddon="Rs."
            className="text-lg font-bold"
            helperText="Physical banknotes and change present in the counter drawer at start of shift."
            required
            autoFocus
          />
        </div>

        <div>
          <Input
            label="Shift Notes / Register ID"
            placeholder="e.g., Morning Shift #1, Cashier Bilal"
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
            leftIcon={<LockOpen className="w-4 h-4" />}
          >
            Start Register Shift
          </Button>
        </div>
      </form>
    </Modal>
  );
};
