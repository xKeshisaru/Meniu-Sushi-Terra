import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  X,
  UploadCloud,
  Save,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import { uploadToImgBB } from "@/lib/imgbb";
import Image from "next/image";
import { Category } from "@/types";
import { motion } from "framer-motion";

interface AdminCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category; // If present, we are editing
  onSuccess: () => void;
}

// ... imports
import { categoryIcons } from "@/lib/data";
import { HelpCircle } from "lucide-react";

interface AdminCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category; // If present, we are editing
  onSuccess: () => void;
}

// Get available icons from our mapping
const AVAILABLE_ICONS = Object.keys(categoryIcons);

export function AdminCategoryModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: AdminCategoryModalProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    title: "",
    icon: "utensils",
    image: "",
    id: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        title: "",
        icon: "utensils",
        image: "",
        id: "",
      });
    }
  }, [category, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Imaginea este prea mare (max 5MB).");
      return;
    }

    setUploading(true);
    try {
      const downloadURL = await uploadToImgBB(file);
      setFormData((prev) => ({ ...prev, image: downloadURL }));
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(error.message || "Eroare la încărcarea imaginii.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate ID if not present (create mode)
      let catId = formData.id;
      if (!catId) {
        catId = formData.title
          ?.toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      if (!catId) throw new Error("ID invalid");

      const categoryRef = doc(db, "categories", catId);
      await setDoc(categoryRef, {
        id: catId,
        title: formData.title,
        icon: formData.icon,
        image: formData.image || "",
        index: category?.index || Date.now(), // Use existing index or new timestamp
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Eroare la salvare.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800"
      >
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {category ? "Editează Categorie" : "Categorie Nouă"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Titlu Categorie
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Ex: Supe, Startere..."
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Imagine Categorie (Header)
            </label>
            <div className="flex gap-4 items-start">
              <div className="relative w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0 group">
                {formData.image ? (
                  <>
                    <Image
                      src={formData.image}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, image: "" }))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px]">Fără poză</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="cat-image-upload"
                  />
                  <label
                    htmlFor="cat-image-upload"
                    className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {uploading ? "Se încarcă..." : "Încarcă poză"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Iconiță
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border border-zinc-200 dark:border-zinc-700 rounded-xl custom-scrollbar">
              {AVAILABLE_ICONS.map((icon) => {
                const IconComponent = categoryIcons[icon] || HelpCircle;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all aspect-square gap-1 ${
                      formData.icon === icon
                        ? "bg-red-500 text-white shadow-md ring-2 ring-red-300 scale-105"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                    title={icon}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-400 mt-2 flex items-center gap-2">
              <span>
                Selectat:{" "}
                <span className="font-mono text-red-500">{formData.icon}</span>
              </span>
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-70"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvează
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
