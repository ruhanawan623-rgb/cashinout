"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserSessionPayload, CategoryDTO, TransactionType } from "@/types";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Plus, ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function CategoriesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New Category Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<TransactionType>("CASH_IN");
  const [newDescription, setNewDescription] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, [checkAuth, loadCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newName.trim()) {
      setModalError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          type: newType,
          description: newDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to create category");
      } else {
        setIsAddModalOpen(false);
        setNewName("");
        setNewDescription("");
        loadCategories();
      }
    } catch (err: any) {
      setModalError(err.message || "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategoryStatus = async (cat: CategoryDTO) => {
    try {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat.id,
          isActive: !cat.isActive,
        }),
      });
      loadCategories();
    } catch (e) {
      console.error("Failed to toggle category status", e);
    }
  };

  const cashInCategories = categories.filter((c) => c.type === "CASH_IN");
  const cashOutCategories = categories.filter((c) => c.type === "CASH_OUT");

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
          onRefresh={loadCategories}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Category Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Classify cash receipts and expenditures for financial reporting.
              </p>
            </div>

            <Button
              onClick={() => {
                setModalError(null);
                setIsAddModalOpen(true);
              }}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Cash In Categories */}
            <Card
              title="Cash In Categories"
              subtitle={`${cashInCategories.length} categories`}
              headerAction={<Badge variant="emerald">Inflow</Badge>}
            >
              <div className="space-y-1.5">
                {cashInCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                      cat.isActive
                        ? "bg-white border-slate-200/80"
                        : "bg-slate-50 border-slate-200/60 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">{cat.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description || "No description"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCategoryStatus(cat)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
                        cat.isActive
                          ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cash Out Categories */}
            <Card
              title="Cash Out Categories"
              subtitle={`${cashOutCategories.length} categories`}
              headerAction={<Badge variant="rose">Outflow</Badge>}
            >
              <div className="space-y-1.5">
                {cashOutCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                      cat.isActive
                        ? "bg-white border-slate-200/80"
                        : "bg-slate-50 border-slate-200/60 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">{cat.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description || "No description"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCategoryStatus(cat)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
                        cat.isActive
                          ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Category"
        subtitle="Create an inflow or outflow category"
        maxWidth="md"
      >
        <form onSubmit={handleAddCategory} className="space-y-3.5">
          {modalError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {modalError}
            </div>
          )}

          <div>
            <Select
              label="Transaction Direction *"
              value={newType}
              onChange={(e) => setNewType(e.target.value as TransactionType)}
              required
            >
              <option value="CASH_IN">Cash In (Inflow)</option>
              <option value="CASH_OUT">Cash Out (Outflow)</option>
            </Select>
          </div>

          <div>
            <Input
              label="Category Name *"
              placeholder="e.g., Surgical Supplies, Diagnostic Lab Test"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Input
              label="Description (Optional)"
              placeholder="Short description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
