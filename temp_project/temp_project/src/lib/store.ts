import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

interface StoreState {
  favorites: string[]; // Store product names or IDs
  toggleFavorite: (productName: string) => void;
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
      toggleFavorite: (productName: string) =>
        set((state) => {
          const isFav = state.favorites.includes(productName);
          return {
            favorites: isFav
              ? state.favorites.filter((n) => n !== productName)
              : [...state.favorites, productName],
          };
        }),
      isFavorite: (productName: string) =>
        get().favorites.includes(productName),
    }),
    {
      name: "sushi-terra-storage",
    },
  ),
);
