import { Category } from "@/types";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface CategoryNavProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({
  categories,
  activeId,
  onSelect,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLUListElement>(null);

  return (
    <nav className="sticky top-[60px] z-40 bg-black/80 backdrop-blur-md border-b border-white/5 py-2">
      <ul
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 no-scrollbar snap-x"
      >
        {categories.map((cat) => {
          // Dynamic Icon Component
          const IconComponent =
            (Icons as any)[
              cat.icon
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join("")
            ] || Icons.HelpCircle;

          const isActive = activeId === cat.id;

          return (
            <li key={cat.id} className="snap-start">
              <button
                onClick={() => {
                  onSelect(cat.id);
                  document
                    .getElementById(cat.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-105"
                    : "bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800",
                )}
              >
                <IconComponent className="h-4 w-4" />
                {cat.title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
