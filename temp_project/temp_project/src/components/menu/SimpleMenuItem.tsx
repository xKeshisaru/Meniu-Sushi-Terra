"use client";

import { Product } from "@/types";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn, extractWeight } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

interface SimpleMenuItemProps {
  product: Product;
}

export function SimpleMenuItem({ product }: SimpleMenuItemProps) {
  const { toggleFavorite, favorites } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFavorited = favorites.includes(product.name);
  const weight = extractWeight(product.desc);

  if (product.isHeader) {
    return (
      <div className="col-span-full pt-8 pb-4">
        <h3 className="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-50 border-b-2 border-red-500/20 pb-2 flex items-center gap-3 uppercase tracking-wider">
          {product.name}
        </h3>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2.5 group transition-colors border-b border-white/5 last:border-0 px-2 hover:bg-white/[0.02]">
      <h4 className="font-sans font-medium text-zinc-100 text-[15px] leading-tight flex-1 pr-4">
        {product.name}
      </h4>
      <div className="flex items-center gap-3">
        <span className="font-sans font-black text-red-500 text-[11px] uppercase tracking-wider whitespace-nowrap">
          {product.price}
        </span>
      </div>
    </div>
  );
}
