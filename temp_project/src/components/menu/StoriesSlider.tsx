import { Product } from "@/types";
import Image from "next/image";

interface StoriesProps {
  items: Product[]; // Featured items
}

export function StoriesSlider({ items }: StoriesProps) {
  return (
    <section className="py-6 overflow-x-auto no-scrollbar snap-x px-4 flex gap-4">
      {items.map((item, i) => {
        const imagePath = item.image.startsWith("http")
          ? item.image
          : `/${item.image.split("?")[0]}`;
        return (
          <div
            key={i}
            className="relative flex-none w-[160px] aspect-[9/16] rounded-2xl overflow-hidden snap-center shadow-md bg-zinc-900 border border-white/5"
          >
            <Image
              src={imagePath}
              alt={item.name}
              fill
              className="object-cover"
              sizes="160px"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
            <div className="absolute bottom-4 left-3 right-3 text-white">
              <div className="inline-block px-2 py-0.5 rounded-full bg-red-500 text-[9px] font-bold uppercase tracking-wider text-black mb-2">
                Popular
              </div>
              <p className="font-serif text-sm font-bold leading-tight line-clamp-2">
                {item.name}
              </p>
              <p className="mt-1 text-xs font-medium text-white/80">
                {item.price}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
