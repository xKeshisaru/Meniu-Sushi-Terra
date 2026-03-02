"use client";

import { useState, useMemo, useEffect } from "react";
import { menuData as staticMenuData, featuredItems } from "@/lib/data";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StoriesSlider } from "@/components/menu/StoriesSlider";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { ProductCard } from "@/components/menu/ProductCard";
import { SimpleMenuItem } from "@/components/menu/SimpleMenuItem";
import { ProductModal } from "@/components/menu/ProductModal";
import { FavoritesDrawer } from "@/components/menu/FavoritesDrawer";
import { Product, Category } from "@/types";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function Home() {
  const [menuData, setMenuData] = useState<Category[]>(staticMenuData);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(
    staticMenuData[0]?.id || "",
  );

  // Real-time Firestore fetching
  useEffect(() => {
    setLoading(true);

    // Listen to Categories
    const unsubCats = onSnapshot(collection(db, "categories"), (snapshot) => {
      if (snapshot.empty) {
        setMenuData(staticMenuData);
        setLoading(false);
        return;
      }

      const catsData = snapshot.docs
        .map((doc) => ({
          ...(doc.data() as Category),
          id: doc.id,
          items: [],
        }))
        .sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

      setMenuData(catsData);
      setLoading(false);

      const prodUnsubs = catsData.map((cat) => {
        return onSnapshot(
          collection(db, "categories", cat.id, "products"),
          (prodSnapshot) => {
            const products = prodSnapshot.docs
              .map((d) => ({ ...(d.data() as Product), id: d.id }))
              .sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

            setMenuData((prev) =>
              prev.map((c) =>
                c.id === cat.id ? { ...c, items: products } : c,
              ),
            );
          },
        );
      });

      return () => prodUnsubs.forEach((u) => u());
    });

    return () => unsubCats();
  }, []);

  // Derive featured products
  const featuredProducts = useMemo(() => {
    const allProducts = menuData.flatMap((cat) => cat.items);
    return featuredItems
      .map((name) => allProducts.find((p) => p.name === name))
      .filter((p): p is Product => !!p);
  }, [menuData]);

  // Scroll Spy Logic
  useEffect(() => {
    if (loading || menuData.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );

    menuData.forEach((cat) => {
      const element = document.getElementById(cat.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [menuData, loading]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bună dimineața";
    if (hour < 18) return "Bună ziua";
    return "Bună seara";
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (loading && menuData === staticMenuData) {
    // Show static as skeleton or simple loader if needed
  }

  return (
    <main className="min-h-screen pb-20 bg-black">
      <Header />

      <div className="pt-24 px-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-black text-zinc-50">
            {greeting}, <br />
            <span className="text-red-500">Bine ați venit!</span>
          </h1>
          <p className="text-zinc-400 font-medium">
            Ce doriți să comandați astăzi?
          </p>
        </div>

        <StoriesSlider items={featuredProducts} />
      </div>

      <CategoryNav
        categories={menuData}
        activeId={activeCategory}
        onSelect={setActiveCategory}
      />

      <div className="px-4 space-y-12 py-8">
        {menuData.map((category) => {
          if (category.id === "bauturi") {
            // Group drinks by headers
            const groups: { header: any; items: any[] }[] = [];
            let currentGroup: { header: any; items: any[] } | null = null;

            category.items.forEach((item) => {
              if (item.isHeader) {
                currentGroup = { header: item, items: [] };
                groups.push(currentGroup);
              } else {
                if (!currentGroup) {
                  currentGroup = { header: { name: "Diverse" }, items: [] };
                  groups.push(currentGroup);
                }
                currentGroup.items.push(item);
              }
            });

            return (
              <section
                key={category.id}
                id={category.id}
                className="scroll-mt-36"
              >
                <h2 className="flex items-center gap-3 text-2xl font-bold font-serif mb-6 text-zinc-50 pl-2 border-l-4 border-red-500">
                  {category.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-900/40 rounded-2xl shadow-sm border border-white/5 overflow-hidden"
                    >
                      <div className="bg-zinc-800/40 px-4 py-3 border-b border-white/5">
                        <h3 className="text-[12px] font-black font-serif text-zinc-100 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                          {group.header.name}
                        </h3>
                      </div>
                      <div className="p-1 space-y-0">
                        {group.items.map((item, itemIdx) => {
                          if (item.isSubHeader) {
                            return (
                              <div
                                key={itemIdx}
                                className="px-4 py-3 bg-white/5 border-y border-white/5 flex items-center gap-3"
                              >
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
                                <h4 className="text-[10px] font-bold font-serif text-zinc-400 uppercase tracking-[0.3em] whitespace-nowrap">
                                  {item.name}
                                </h4>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
                              </div>
                            );
                          }
                          return (
                            <SimpleMenuItem key={itemIdx} product={item} />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-36"
            >
              <h2 className="flex items-center gap-3 text-2xl font-bold font-serif mb-6 text-zinc-50 pl-2 border-l-4 border-red-500">
                {category.title}
              </h2>
              <div
                className={cn(
                  "grid gap-4",
                  "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                )}
              >
                {category.items
                  .filter((item) => item.active !== false)
                  .map((item, index) => (
                    <ProductCard
                      key={index}
                      product={item}
                      category={category.title}
                      onOpen={() => setSelectedProduct(item)}
                    />
                  ))}
              </div>
            </section>
          );
        })}
      </div>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <FavoritesDrawer />

      <Footer />
    </main>
  );
}
