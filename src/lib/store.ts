import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
  favorites: string[]; // Store product names
  toggleFavorite: (
    productName: string,
    categoryId?: string,
    productId?: string,
  ) => void;
  isFavoritesOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavoritesDrawer: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavoritesOpen: false,
      openFavorites: () => set({ isFavoritesOpen: true }),
      closeFavorites: () => set({ isFavoritesOpen: false }),
      toggleFavoritesDrawer: () =>
        set((state) => ({ isFavoritesOpen: !state.isFavoritesOpen })),

      toggleFavorite: (
        productName: string,
        categoryId?: string,
        productId?: string,
      ) => {
        const isFav = get().favorites.includes(productName);

        // Update local state
        set((state) => ({
          favorites: isFav
            ? state.favorites.filter((n) => n !== productName)
            : [...state.favorites, productName],
        }));

        // Update Firestore likes counter atomically (fire and forget)
        if (categoryId && productId) {
          import("firebase/firestore").then(({ increment, updateDoc, doc }) => {
            import("@/lib/firebase").then(({ db }) => {
              const ref = doc(
                db,
                "categories",
                categoryId,
                "products",
                productId,
              );
              updateDoc(ref, {
                likes: increment(isFav ? -1 : 1),
              }).catch(() => {
                // Silently ignore — like count is best-effort
              });
            });
          });
        }
      },
    }),
    {
      name: "sushi-terra-storage",
    },
  ),
);
