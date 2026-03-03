import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Share2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { favorites, toggleFavoritesDrawer } = useStore();
  const favoritesCount = favorites.length;

  const handleShare = async () => {
    const url = window.location.href;
    const title = "Meniu Sushi Terra";
    const text = "Vezi meniul nostru digital 🍱";

    if (navigator.share) {
      // Native share sheet on mobile
      try {
        await navigator.share({ title, text, url });
      } catch (_) {
        // User dismissed - do nothing
      }
    } else {
      // Desktop fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      } catch (_) {
        // Clipboard not available either
      }
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-black/90 backdrop-blur-md border-white/5 py-2"
          : "bg-transparent border-transparent py-4",
      )}
    >
      <div className="px-4 flex justify-between items-center max-w-md mx-auto md:max-w-7xl">
        <div className="flex items-center gap-2">
          <div className="relative h-12 w-32">
            <Image
              src="/assets/logo.webp"
              alt="Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleFavoritesDrawer}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative"
          >
            <Heart className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
            {favoritesCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative"
            title={shareFeedback ? "Link copiat!" : "Distribuie meniul"}
          >
            <Share2
              className={cn(
                "w-5 h-5 transition-colors",
                shareFeedback
                  ? "text-green-500"
                  : "text-zinc-700 dark:text-zinc-200",
              )}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
