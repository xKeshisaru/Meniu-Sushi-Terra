"use client";

import { Product } from "@/types";
import { X, Heart } from "lucide-react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, extractWeight } from "@/lib/utils";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { toggleFavorite, favorites } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!product) return null;

  const isFavorited = favorites.includes(product.name);
  const imagePath = product.image.startsWith("http")
    ? product.image
    : `/${product.image.split("?")[0]}`;

  const weight = extractWeight(product.desc);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
              {/* Image Header */}
              <div className="relative h-48 sm:h-64 md:h-80 w-full flex-shrink-0 bg-black/40">
                <Image
                  src={imagePath}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-zinc-50 mb-1">
                      {product.name}
                    </h2>
                    <span className="text-red-500 font-bold text-xl">
                      {product.price.toLowerCase().includes("lei")
                        ? product.price
                        : `${product.price} Lei`}
                    </span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavorite(product.name)}
                    className={cn(
                      "p-3 rounded-full transition-colors",
                      mounted && isFavorited
                        ? "bg-red-500/20 text-red-400"
                        : "bg-zinc-800 text-zinc-400",
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-6 h-6",
                        mounted && isFavorited && "fill-current",
                      )}
                    />
                  </motion.button>
                </div>

                <p className="text-zinc-300 leading-relaxed mb-6">
                  {product.desc}
                </p>

                {/* Details block */}
                <div className="bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-400 space-y-3">
                  {/* Gramaj */}
                  {(product.weight || weight) && (
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200 min-w-[70px]">
                        Gramaj:
                      </span>
                      {product.weight || weight}
                    </p>
                  )}

                  {/* Valori Nutriționale */}
                  {product.nutrition && (
                    <>
                      <div className="border-t border-white/10" />
                      <div>
                        <p className="font-semibold text-zinc-200 mb-1">
                          Valori nutriționale:
                        </p>
                        <p className="leading-relaxed whitespace-pre-line">
                          {product.nutrition}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-white/5 bg-zinc-900/50 mt-auto">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-center active:scale-[0.98] transition-transform"
                >
                  Închide
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
