"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Category } from "@/types";
import { categoryIcons } from "@/lib/data";
import { cn } from "@/lib/utils";

interface RestoreCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuData: Category[];
  liveCategories: Category[];
  onRestore: (categoryId: string) => Promise<void>;
  isRestoring: string | null; // ID of category being restored
}

export const RestoreCategoriesModal: React.FC<RestoreCategoriesModalProps> = ({
  isOpen,
  onClose,
  menuData,
  liveCategories,
  onRestore,
  isRestoring,
}) => {
  if (!isOpen) return null;

  const liveIds = new Set(liveCategories.map((c) => c.id));
  const missingCategories = menuData.filter((c) => !liveIds.has(c.id));
  const activeCategories = menuData.filter((c) => liveIds.has(c.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
            <div>
              <h3 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                Centru de Restaurare
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Recuperează categorii șterse din backup-ul sistemului
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {missingCategories.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  Categorii Care Lipsesc ({missingCategories.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {missingCategories.map((cat) => {
                    const Icon = categoryIcons[cat.icon] || RefreshCw;
                    const isBeingRestored = isRestoring === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="group relative p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-red-400 dark:hover:border-red-600/50 transition-all hover:shadow-xl hover:shadow-red-500/5"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                            <Icon className="w-6 h-6 text-zinc-500 group-hover:text-red-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                              {cat.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">
                              {cat.items.length} produse
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onRestore(cat.id)}
                          disabled={!!isRestoring}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                            isBeingRestored
                              ? "bg-zinc-100 text-zinc-400"
                              : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                          )}
                        >
                          {isBeingRestored ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          {isBeingRestored ? "Se restaurează..." : "Restaurează"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Totul este în ordine
                </h4>
                <p className="text-zinc-500 mt-2 max-w-xs">
                  Toate categoriile din backup sunt prezente în baza de date live.
                </p>
              </div>
            )}

            {activeCategories.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm uppercase tracking-wider mb-6">
                  <CheckCircle2 className="w-4 h-4" />
                  Categorii Active ({activeCategories.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeCategories.map((cat) => (
                    <span
                      key={cat.id}
                      className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-full text-xs font-medium text-zinc-500 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {cat.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400">
              Restaurarea va aduce produsele la starea inițială din backup
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
