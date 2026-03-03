"use client";

import Image from "next/image";
import { Product } from "@/types";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, extractWeight } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

interface ProductCardProps {
  product: Product;
  category: string;
  categoryId: string;
  onOpen: () => void;
}

export function ProductCard({
  product,
  category,
  categoryId,
  onOpen,
}: ProductCardProps) {
  const imagePath = product.image.startsWith("http")
    ? product.image
    : `/${product.image.split("?")[0]}`;

  const isDrink = category === "Băuturi";
  const weight = extractWeight(product.desc);

  const { toggleFavorite, favorites } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFavorited = favorites.includes(product.name);
  const likesCount = product.likes ?? 0;

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col rounded-[2rem] bg-zinc-900/40 p-3 shadow-xl transition-all duration-500 active:scale-[0.98] cursor-pointer border border-white/5"
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-2xl mb-3",
          isDrink ? "bg-white p-4" : "bg-zinc-900/60",
        )}
      >
        <Image
          src={imagePath}
          alt={product.name}
          fill
          className={cn(
            "object-cover transition-transform duration-1000 group-hover:scale-110",
            isDrink && "object-contain",
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Like Count Badge — bottom left */}
        <AnimatePresence>
          {mounted && likesCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-white"
            >
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
              <span className="text-[11px] font-bold leading-none">
                {likesCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Favorite Button Overlay — top right */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.name, categoryId, product.id);
          }}
          className={cn(
            "absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-colors",
            mounted && isFavorited
              ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
              : "bg-white/20 text-white hover:bg-white/40",
          )}
        >
          <Heart
            className={cn("h-4 w-4", mounted && isFavorited && "fill-current")}
          />
        </motion.button>
      </div>

      <div className="flex flex-grow flex-col justify-between px-1">
        <div className="mb-2">
          <h3 className="line-clamp-2 font-serif text-[15px] font-bold leading-tight text-zinc-100 group-hover:text-red-500 transition-colors">
            {product.name}
          </h3>
          {(product.weight || weight) && (
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {product.weight || weight}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="font-sans text-[15px] font-black text-red-500">
            {product.price.toLowerCase().includes("lei")
              ? product.price
              : `${product.price} Lei`}
          </span>
        </div>
      </div>
    </div>
  );
}
