"use client";

import { useStore } from "@/lib/store";
import { menuData } from "@/lib/data";
import { X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Product } from "@/types";

export function FavoritesDrawer() {
  const { isFavoritesOpen, closeFavorites, favorites, toggleFavorite } =
    useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration fix
  if (!mounted) return null;

  // Find full product details based on stored names
  // Using useMemo to avoid recalc on every render if favorites don't change
  const favoriteProducts = Array.from(new Set(favorites))
    .map((name) => {
      for (const category of menuData) {
        const product = category.items.find((item) => item.name === name);
        if (product) return product;
      }
      return null;
    })
    .filter((p): p is Product => p !== null);

  const totalPrice = favoriteProducts.reduce((sum, product) => {
    const price = parseInt(product.price.replace(/\D/g, "")) || 0;
    return sum + price;
  }, 0);

  return (
    <AnimatePresence>
      {isFavoritesOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFavorites}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-white dark:bg-zinc-950 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-white/10">
              <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-50">
                Favoritele Mele ({favoriteProducts.length})
              </h2>
              <button
                onClick={closeFavorites}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {favoriteProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 space-y-4">
                  <HeartBroken className="w-16 h-16 opacity-20" />
                  <p>Nu ai salvat nimic încă.</p>
                  <button
                    onClick={closeFavorites}
                    className="text-red-500 font-bold hover:underline"
                  >
                    Vezi Meniul
                  </button>
                </div>
              ) : (
                favoriteProducts.map((product) => (
                  <div
                    key={product.name}
                    className="flex gap-3 items-start p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      <Image
                        src={
                          product.image.startsWith("http")
                            ? product.image
                            : `/${product.image.split("?")[0]}`
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-red-500 font-bold text-sm mt-1">
                        {product.price}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(product.name)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {favoriteProducts.length > 0 && (
              <div className="p-4 border-t border-zinc-100 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex justify-between items-center text-zinc-900 dark:text-zinc-50 font-bold text-lg">
                  <span>Total estimat:</span>
                  <span>{totalPrice} lei</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function HeartBroken({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M12 5l-2.4 2.4" />
      <path d="M12 5l2.4 2.4" />
      <path d="M12 5v14" />
    </svg>
  );
}
