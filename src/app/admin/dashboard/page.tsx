"use client";

import { useState, useEffect, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { menuData, categoryIcons } from "@/lib/data";
import {
  collection,
  doc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import {
  LogOut,
  UploadCloud,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Package,
  HelpCircle,
  MoreVertical,
  Settings,
  ArrowRightLeft,
  Check,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { Product, Category } from "@/types";
import { AdminProductModal } from "@/components/admin/AdminProductModal";
import { AdminCategoryModal } from "@/components/admin/AdminCategoryModal";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Extended types for Admin
interface AdminCategory extends Category {
  items: AdminProduct[];
}

interface AdminProduct extends Product {
  id: string; // Firestore ID
  active?: boolean;
}

const MoveDropdown = ({
  item,
  categories,
  currentCatId,
  onMove,
  isMoving,
  onClose,
}: {
  item: AdminProduct;
  categories: Category[];
  currentCatId: string;
  onMove: (p: AdminProduct, from: string, to: string) => void;
  isMoving: boolean;
  onClose: () => void;
}) => {
  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 z-[100] overflow-hidden py-2 animate-in fade-in zoom-in duration-200 origin-top-right">
      <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-50 dark:border-zinc-800/50 mb-1 flex justify-between items-center">
        <span>Mută în categoria...</span>
        <button
          onClick={onClose}
          className="hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onMove(item, currentCatId, cat.id)}
            disabled={isMoving}
            className={cn(
              "w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between group/cat",
              currentCatId === cat.id &&
                "bg-red-50/30 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-medium cursor-default pointer-events-none",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="opacity-40 group-hover/cat:opacity-100 transition-opacity">
                {cat.icon}
              </span>
              <span>{cat.title}</span>
            </div>
            {currentCatId === cat.id && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<
    AdminProduct | undefined
  >(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(undefined);

  // Quick Move State
  const [movingProductId, setMovingProductId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // --- Real-time Data Fetching ---
  useEffect(() => {
    // Listen to Categories
    const unsubCats = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const catsData = snapshot.docs
          .map(
            (doc) =>
              ({ ...(doc.data() as Category), items: [] }) as AdminCategory,
          )
          .sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

        // If no active tab or active tab was deleted, set to first
        if (
          catsData.length > 0 &&
          (!activeTab || !catsData.find((c) => c.id === activeTab))
        ) {
          // Keep "all" if it was selected, otherwise select first
          if (activeTab !== "all") setActiveTab(catsData[0].id);
        }

        const unsubsProducts: (() => void)[] = [];

        catsData.forEach((cat) => {
          const q = query(collection(db, "categories", cat.id, "products"));
          const unsubProd = onSnapshot(q, (prodSnap) => {
            const products = prodSnap.docs.map(
              (doc) => ({ ...doc.data() }) as AdminProduct,
            );

            setCategories((prev) => {
              const newCats = [...prev];
              const foundIndex = newCats.findIndex((c) => c.id === cat.id);
              if (foundIndex >= 0) {
                newCats[foundIndex] = {
                  ...newCats[foundIndex],
                  items: products,
                };
              }
              return newCats;
            });
          });
          unsubsProducts.push(unsubProd);
        });

        setCategories(catsData);
        setLoadingData(false);

        return () => {
          unsubsProducts.forEach((u) => u());
        };
      },
      (error) => {
        console.error("Firestore error in categories listener:", error);
        setLoadingData(false);
        alert(
          "Eroare la încărcarea datelor. Verifică permisiunile sau consola.",
        );
      },
    );

    return () => unsubCats();
  }, []);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let products: AdminProduct[] = [];

    if (activeTab === "all") {
      categories.forEach((cat) => products.push(...cat.items));
    } else {
      const cat = categories.find((c) => c.id === activeTab);
      if (cat) {
        // Sort items by index explicitly in case of local cache race conditions
        products = [...cat.items].sort(
          (a, b) => (a.index ?? 999) - (b.index ?? 999),
        );
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q),
      );
    }

    return products;
  }, [categories, activeTab, searchQuery]);

  const findProductCategory = (prodId: string) => {
    const cat = categories.find((c) => c.items.some((p) => p.id === prodId));
    return cat ? cat.id : "";
  };

  const deleteProduct = async (catId: string, prodId: string) => {
    if (!confirm("Ștergi acest produs?")) return;
    try {
      await deleteDoc(doc(db, "categories", catId, "products", prodId));
    } catch (e) {
      alert("Eroare la ștergere");
    }
  };

  const handleMoveProduct = async (
    product: AdminProduct,
    fromCatId: string,
    toCatId: string,
  ) => {
    if (fromCatId === toCatId) {
      setMovingProductId(null);
      return;
    }

    setIsMoving(true);
    try {
      const batch = writeBatch(db);

      // Delete from old
      const oldRef = doc(db, "categories", fromCatId, "products", product.id);
      batch.delete(oldRef);

      // Add to new
      const newRef = doc(db, "categories", toCatId, "products", product.id);
      // We stripping out the 'items' if any, though AdminProduct shouldn't have it
      const { ...productData } = product;

      batch.set(newRef, {
        ...productData,
        index: Date.now(), // Put at the end
      });

      await batch.commit();
      setMovingProductId(null);
    } catch (error) {
      console.error("Error moving product:", error);
      alert("Eroare la mutarea produsului.");
    } finally {
      setIsMoving(false);
    }
  };

  const deleteCategory = async (catId: string) => {
    if (
      !confirm(
        "Ești sigur că vrei să ștergi această categorie și toate produsele ei?",
      )
    )
      return;
    try {
      // Delete all items first (best effort)
      // Ideally rely on cloud function for recursive delete, but client side for now:
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        const batch = writeBatch(db);
        cat.items.forEach((item) => {
          const itemRef = doc(db, "categories", catId, "products", item.id);
          batch.delete(itemRef);
        });
        await batch.commit();
      }
      await deleteDoc(doc(db, "categories", catId));
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Eroare la ștergerea categoriei.");
    }
  };

  const handleReorderCategory = async (
    catId: string,
    direction: "up" | "down",
  ) => {
    const currentIndex = categories.findIndex((c) => c.id === catId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCat = categories[currentIndex];
    const targetCat = categories[targetIndex];

    // Use position in array as fallback for index in Firestore
    const currentIdx = currentCat.index ?? currentIndex;
    const targetIdx = targetCat.index ?? targetIndex;

    try {
      const batch = writeBatch(db);
      const currentRef = doc(db, "categories", currentCat.id);
      const targetRef = doc(db, "categories", targetCat.id);

      // Swap indices
      batch.update(currentRef, { index: targetIdx });
      batch.update(targetRef, { index: currentIdx });

      await batch.commit();
    } catch (error) {
      console.error("Error reordering categories:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const handleMigration = async () => {
    if (
      !confirm(
        "ATENȚIE! Această acțiune va reseta toată baza de date la valorile inițiale din cod. Continuăm?",
      )
    ) {
      return;
    }

    setMigrating(true);
    setMigrationStatus("idle");

    try {
      const batch = writeBatch(db);

      for (const category of menuData) {
        const catRef = doc(db, "categories", category.id);
        batch.set(catRef, {
          id: category.id,
          title: category.title,
          icon: category.icon,
          index: category.index,
        });

        let itemIndex = 0;
        for (const item of category.items) {
          const itemId = item.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          const itemRef = doc(
            db,
            "categories",
            category.id,
            "products",
            itemId,
          );
          batch.set(itemRef, {
            ...item,
            id: itemId,
            price: item.price,
            index: itemIndex++,
            active: true,
          });
        }
      }

      await batch.commit();
      setMigrationStatus("success");
      setTimeout(() => setMigrationStatus("idle"), 3000);
    } catch (error) {
      console.error("Migration failed:", error);
      setMigrationStatus("error");
      alert("Eroare la migrare. Verifică consola.");
    } finally {
      setMigrating(false);
    }
  };

  const handleCleanData = async () => {
    if (
      !confirm(
        "Sigur vrei să optimizezi toate datele? (Extrage gramajele din descrieri)",
      )
    )
      return;

    setMigrating(true); // Reuse migrating state for loading spinner
    try {
      const batch = writeBatch(db);
      let count = 0;

      for (const cat of categories) {
        for (const item of cat.items) {
          // We need to re-read to be safe? Or use current state?
          // Current state is live from snapshots, so it's good.
          // However, for batch updates we need references.

          const itemRef = doc(db, "categories", cat.id, "products", item.id);

          // Check logic
          // 1. Extract weight if missing
          // 2. Clean desc

          // New utils import needed in this file? No, we can just regex here or import.
          // Let's use simple regex here to be self-contained or import.
          // Better import `extractWeight` if we can.
          // But `AdminDashboard` doesn't import it yet. Let's just reimplement simple logic or assume import.
          // I'll add import in another step or just use regex here. Regex is safer to not break imports.

          const weightMatch = item.desc.match(
            /(?:\(|^|\s)(\d+(?:\.\d+)?)\s*(g|gr|ml|l|kg|buc)(?:\)|$|\s)/i,
          );
          let newWeight = item.weight;
          let newDesc = item.desc;

          if (weightMatch && !newWeight) {
            newWeight = `${weightMatch[1]}${weightMatch[2].toLowerCase()}`;
            newDesc = newDesc
              .replace(
                /(?:\(|^|\s)(\d+(?:\.\d+)?)\s*(g|gr|ml|l|kg|buc)(?:\)|$|\s)/gi,
                " ",
              )
              .trim()
              .replace(/\s+/, " ");

            batch.update(itemRef, {
              weight: newWeight,
              desc: newDesc,
            });
            count++;
          } else if (weightMatch && newWeight) {
            // If weight already exists, just clean desc
            const cleanedDesc = newDesc
              .replace(
                /(?:\(|^|\s)(\d+(?:\.\d+)?)\s*(g|gr|ml|l|kg|buc)(?:\)|$|\s)/gi,
                " ",
              )
              .trim()
              .replace(/\s+/, " ");
            if (cleanedDesc !== newDesc) {
              batch.update(itemRef, { desc: cleanedDesc });
              count++;
            }
          }
        }
      }

      if (count > 0) {
        await batch.commit();
        alert(`Am actualizat ${count} produse!`);
      } else {
        alert("Toate produsele sunt deja optimizate.");
      }
    } catch (e) {
      console.error(e);
      alert("Eroare la optimizare.");
    } finally {
      setMigrating(false);
    }
  };

  // Modal Handlers
  const openEditModal = (product: AdminProduct) => {
    // Find category for this product if in "all" mode
    let catId = activeTab;
    if (activeTab === "all") {
      const foundCat = categories.find((c) =>
        c.items.some((p) => p.id === product.id),
      );
      if (foundCat) catId = foundCat.id;
    }

    setSelectedCategoryId(catId);
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    if (activeTab === "all") {
      alert(
        "Te rog selectează o categorie specifică pentru a adăuga un produs.",
      );
      return;
    }
    setSelectedCategoryId(activeTab);
    setSelectedProduct(undefined); // Empty for create
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(undefined);
  };

  // Category Modal Handlers
  const openCategoryCreate = () => {
    setSelectedCategory(undefined);
    setIsCategoryModalOpen(true);
  };
  const openCategoryEdit = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategory(cat);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black/95 transition-colors duration-300">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-red-400 to-red-600 rounded-lg p-2 shadow-lg shadow-red-500/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                Admin Dashboard
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Gestionează meniul digital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={handleMigration}
              disabled={migrating}
              className="flex items-center gap-2 px-3 py-2 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800"
            >
              <RefreshCw
                className={`w-4 h-4 ${migrating ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-medium">Resetează Meniu</span>
            </button>
            <button
              onClick={handleCleanData}
              title="Optimizează Date (Extrage Gramaje)"
              disabled={migrating}
              className="p-2 text-zinc-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg font-medium hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Ieșire</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl leading-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-sm"
              placeholder="Caută produse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggles & Add Button */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === "grid"
                    ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === "list"
                    ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={openCreateModal}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Produs Nou</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-2 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar flex flex-col">
              <nav className="space-y-1 flex-1">
                {categories.map((cat) => {
                  const IconComponent = categoryIcons[cat.icon] || HelpCircle;
                  return (
                    <div key={cat.id} className="relative group">
                      <button
                        onClick={() => setActiveTab(cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all border border-transparent pr-20", // Added pr-20 for menu space
                          activeTab === cat.id
                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl opacity-80 group-hover:scale-110 transition-transform">
                            <IconComponent className="w-5 h-5" />
                          </span>
                          <span
                            className="truncate max-w-[120px]"
                            title={cat.title}
                          >
                            {cat.title}
                          </span>
                        </div>
                        {cat.items.length > 0 && (
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-bold",
                              activeTab === cat.id
                                ? "bg-white/20 text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-white dark:group-hover:bg-zinc-700",
                            )}
                          >
                            {cat.items.length}
                          </span>
                        )}
                      </button>

                      {/* Category Actions - Visible on hover/active */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-lg p-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderCategory(cat.id, "up");
                          }}
                          disabled={categories.indexOf(cat) === 0}
                          className={cn(
                            "p-1 rounded-md hover:bg-white/50 text-zinc-500 hover:text-blue-500 disabled:opacity-20",
                            activeTab === cat.id ? "text-white/80" : "",
                          )}
                          title="Mută Sus"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderCategory(cat.id, "down");
                          }}
                          disabled={
                            categories.indexOf(cat) === categories.length - 1
                          }
                          className={cn(
                            "p-1 rounded-md hover:bg-white/50 text-zinc-500 hover:text-blue-500 disabled:opacity-20",
                            activeTab === cat.id ? "text-white/80" : "",
                          )}
                          title="Mută Jos"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3 bg-zinc-400/20 mx-0.5" />
                        <button
                          onClick={(e) => openCategoryEdit(cat, e)}
                          className={cn(
                            "p-1 rounded-md hover:bg-white/50 text-zinc-500 hover:text-blue-500",
                            activeTab === cat.id
                              ? "text-white/80 hover:text-white"
                              : "",
                          )}
                          title="Editează Categoria"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(cat.id);
                          }}
                          className={cn(
                            "p-1 rounded-md hover:bg-white/50 text-zinc-500 hover:text-red-500",
                            activeTab === cat.id
                              ? "text-white/80 hover:text-red-200"
                              : "",
                          )}
                          title="Șterge Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </nav>

              <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={openCategoryCreate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 hover:text-red-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Categorie Nouă
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <RefreshCw className="w-10 h-10 animate-spin text-zinc-400 mb-4" />
                <p className="text-zinc-500">Se încarcă produsele...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {(() => {
                        const currentCat = categories.find(
                          (c) => c.id === activeTab,
                        );
                        if (currentCat) {
                          const Icon =
                            categoryIcons[currentCat.icon] || HelpCircle;
                          return (
                            <>
                              <Icon className="w-8 h-8 text-red-500" />
                              {currentCat.title}
                            </>
                          );
                        }
                        return "Toate Produsele";
                      })()}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      {filteredProducts.length} produse găsite în această
                      categorie
                    </p>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      Nu am găsit produse
                    </h3>
                    <p className="text-zinc-500 mt-2 max-w-xs mx-auto">
                      Se pare că nu există produse care să corespundă
                      criteriilor tale.
                    </p>
                    {activeTab !== "all" && (
                      <button
                        onClick={openCreateModal}
                        className="mt-6 inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-bold hover:underline"
                      >
                        <Plus className="w-4 h-4" />
                        Adaugă primul produs
                      </button>
                    )}
                  </div>
                ) : activeTab === "bauturi" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(() => {
                      const groups: {
                        header: AdminProduct | null;
                        items: AdminProduct[];
                      }[] = [];
                      let currentGroup: {
                        header: AdminProduct | null;
                        items: AdminProduct[];
                      } | null = null;

                      filteredProducts.forEach((item) => {
                        if (item.isHeader) {
                          currentGroup = { header: item, items: [] };
                          groups.push(currentGroup);
                        } else {
                          if (!currentGroup) {
                            currentGroup = { header: null, items: [] };
                            groups.push(currentGroup);
                          }
                          currentGroup.items.push(item);
                        }
                      });

                      const hasNoHeaders = !filteredProducts.some(
                        (p) => p.isHeader,
                      );

                      if (hasNoHeaders && filteredProducts.length > 0) {
                        return (
                          <div className="col-span-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-8 text-center flex flex-col items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="max-w-md">
                              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Organizează băuturile pe secțiuni
                              </h3>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                În acest moment băuturile sunt listate toate la
                                un loc. Vrei să le ordonăm automat pe categorii
                                (Long Drinks, Cocktails, Vin etc.) la fel ca în
                                meniul principal?
                              </p>
                            </div>
                            <button
                              onClick={handleMigration}
                              disabled={migrating}
                              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                              <RefreshCw
                                className={cn(
                                  "w-4 h-4",
                                  migrating && "animate-spin",
                                )}
                              />
                              {migrating
                                ? "Se organizează..."
                                : "Sincronizează Categorii"}
                            </button>
                          </div>
                        );
                      }

                      return groups.map((group, groupIdx) => (
                        <div
                          key={groupIdx}
                          className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col"
                        >
                          <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between group">
                            <h3 className="text-sm font-black font-serif text-zinc-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-3">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></span>
                              {group.header
                                ? group.header.name
                                : "Alte Băuturi / Generale"}
                            </h3>
                            {group.header && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                                <button
                                  onClick={() =>
                                    setMovingProductId(
                                      movingProductId === group.header!.id
                                        ? null
                                        : group.header!.id,
                                    )
                                  }
                                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-200 text-xs font-medium flex items-center gap-1"
                                  title="Mută"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  Mută
                                </button>
                                <button
                                  onClick={() => openEditModal(group.header!)}
                                  className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-400 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100 text-xs font-medium flex items-center gap-1"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    deleteProduct("bauturi", group.header!.id)
                                  }
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 text-xs font-medium flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  St
                                </button>
                                {movingProductId === group.header!.id && (
                                  <MoveDropdown
                                    item={group.header!}
                                    categories={categories}
                                    currentCatId="bauturi"
                                    onMove={handleMoveProduct}
                                    isMoving={isMoving}
                                    onClose={() => setMovingProductId(null)}
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50 flex-1">
                            {group.items.length === 0 ? (
                              <div className="px-6 py-8 text-center text-zinc-400 text-sm italic">
                                Scțiune goală. Adaugă produse sub acest titlu.
                              </div>
                            ) : (
                              group.items.map((item) => {
                                if (item.isSubHeader) {
                                  return (
                                    <div
                                      key={item.id}
                                      className="bg-zinc-50/50 dark:bg-zinc-800/30 px-6 py-3 border-y border-zinc-100 dark:border-zinc-800 flex items-center justify-between group"
                                    >
                                      <h4 className="text-[10px] font-black font-serif text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
                                        {item.name}
                                      </h4>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                                        <button
                                          onClick={() =>
                                            setMovingProductId(
                                              movingProductId === item.id
                                                ? null
                                                : item.id,
                                            )
                                          }
                                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 rounded-md transition-colors border border-transparent hover:border-zinc-200"
                                          title="Mută"
                                        >
                                          <ArrowRightLeft className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => openEditModal(item)}
                                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 rounded-md transition-colors border border-transparent hover:border-blue-200"
                                          title="Editează"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteProduct("bauturi", item.id)
                                          }
                                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 rounded-md transition-colors border border-transparent hover:border-red-200"
                                          title="Șterge"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                        {movingProductId === item.id && (
                                          <MoveDropdown
                                            item={item}
                                            categories={categories}
                                            currentCatId="bauturi"
                                            onMove={handleMoveProduct}
                                            isMoving={isMoving}
                                            onClose={() =>
                                              setMovingProductId(null)
                                            }
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={item.id}
                                    className={cn(
                                      "flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group",
                                      item.active === false &&
                                        "opacity-50 grayscale-[0.5]",
                                    )}
                                  >
                                    <div className="flex-1 min-w-0 pr-4">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                          {item.name}
                                        </h4>
                                        {item.weight && (
                                          <span className="text-xs text-zinc-400 font-medium">
                                            ({item.weight})
                                          </span>
                                        )}
                                      </div>
                                      {item.desc && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                          {item.desc}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <span className="font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap text-sm">
                                        {item.price
                                          .toLowerCase()
                                          .includes("lei")
                                          ? item.price
                                          : `${item.price} Lei`}
                                      </span>

                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                                        <button
                                          onClick={() =>
                                            setMovingProductId(
                                              movingProductId === item.id
                                                ? null
                                                : item.id,
                                            )
                                          }
                                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
                                          title="Mută"
                                        >
                                          <ArrowRightLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => openEditModal(item)}
                                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-400 hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                          title="Editează"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteProduct("bauturi", item.id)
                                          }
                                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                          title="Șterge"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                        {movingProductId === item.id && (
                                          <MoveDropdown
                                            item={item}
                                            categories={categories}
                                            currentCatId="bauturi"
                                            onMove={handleMoveProduct}
                                            isMoving={isMoving}
                                            onClose={() =>
                                              setMovingProductId(null)
                                            }
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "grid gap-6",
                      viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                        : "grid-cols-1",
                    )}
                  >
                    {filteredProducts.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 group hover:border-red-400 dark:hover:border-red-600/50 transition-all hover:shadow-xl hover:shadow-red-500/5 flex flex-col",
                          viewMode === "list" &&
                            "flex-row items-center p-3 gap-4",
                          item.active === false &&
                            "opacity-60 bg-zinc-50 dark:bg-zinc-950 grayscale-[0.5]",
                        )}
                      >
                        {/* Image - Hidden for beverages */}
                        {(() => {
                          const currentCatId =
                            activeTab === "all"
                              ? categories.find((c) =>
                                  c.items.some((p) => p.id === item.id),
                                )?.id
                              : activeTab;

                          if (currentCatId === "bauturi") return null;

                          return (
                            <div
                              className={cn(
                                "relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0",
                                viewMode === "grid"
                                  ? "aspect-[4/3] w-full"
                                  : "w-20 h-20 rounded-xl",
                              )}
                            >
                              <Image
                                src={
                                  item.image.startsWith("http")
                                    ? item.image
                                    : `/${item.image.split("?")[0]}`
                                }
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {item.active === false && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                  <span className="bg-black/70 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border border-white/20">
                                    Inactiv
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Content */}
                        <div
                          className={cn(
                            "flex flex-col flex-1 min-w-0",
                            viewMode === "grid" ? "p-5" : "py-1 pr-4",
                          )}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h3
                              className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate w-full"
                              title={item.name}
                            >
                              {item.name}
                            </h3>
                          </div>

                          <p
                            className={cn(
                              "text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1",
                              viewMode === "list" && "hidden sm:block",
                            )}
                          >
                            {item.desc}
                          </p>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
                            <span className="font-mono text-lg font-bold text-red-600 dark:text-red-400">
                              {item.price.toLowerCase().includes("lei")
                                ? item.price
                                : `${item.price} Lei`}
                            </span>

                            <div className="flex gap-2 relative">
                              <button
                                onClick={() =>
                                  setMovingProductId(
                                    movingProductId === item.id
                                      ? null
                                      : item.id,
                                  )
                                }
                                className="p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200"
                                title="Mută"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-zinc-100 dark:border-zinc-700 hover:border-blue-200"
                                title="Editează"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  deleteProduct(
                                    activeTab === "all"
                                      ? findProductCategory(item.id)
                                      : activeTab,
                                    item.id,
                                  )
                                }
                                className="p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors border border-zinc-100 dark:border-zinc-700 hover:border-red-200"
                                title="Șterge"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {movingProductId === item.id && (
                                <MoveDropdown
                                  item={item}
                                  categories={categories}
                                  currentCatId={
                                    activeTab === "all"
                                      ? findProductCategory(item.id)
                                      : activeTab
                                  }
                                  onMove={handleMoveProduct}
                                  isMoving={isMoving}
                                  onClose={() => setMovingProductId(null)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <AdminProductModal
            isOpen={isModalOpen}
            onClose={closeModal}
            product={
              selectedProduct
                ? { ...selectedProduct, id: selectedProduct.id }
                : undefined
            }
            categoryId={selectedCategoryId}
            onSuccess={() => {}}
          />
        )}

        {isCategoryModalOpen && (
          <AdminCategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            category={selectedCategory}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
