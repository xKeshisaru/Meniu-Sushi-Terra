"use client";

import { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToImgBB } from "@/lib/imgbb";
import { Product, Category } from "@/types";
import {
  X,
  Save,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product & { id: string };
  categoryId: string; // Current or Initial Category
  onSuccess: () => void;
  initialType?: "product" | "header" | "subheader";
}

import { cn, extractWeight, parseWeight } from "@/lib/utils";

const WEIGHT_UNITS = ["g", "ml", "L", "kg", "buc"];

export function AdminProductModal({
  isOpen,
  onClose,
  product,
  categoryId,
  onSuccess,
  initialType = "product",
}: AdminProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form State
  const [formData, setFormData] = useState<
    Product & { active: boolean; index: number; categoryId: string }
  >({
    name: "",
    desc: "",
    price: "",
    weight: "",
    nutrition: "",
    image: "",
    active: true,
    isHeader: false,
    index: 0,
    categoryId: categoryId,
  });

  // Fetch Categories for Dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      const q = query(collection(db, "categories"), orderBy("id"));
      const snapshot = await getDocs(q);
      const cats = snapshot.docs.map((doc) => doc.data() as Category);
      setCategories(cats);
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        const rawWeight = product.weight || extractWeight(product.desc) || "";

        setFormData({
          name: product.name,
          desc: product.desc,
          price: product.price.replace(/\s*lei\s*/i, "").trim(),
          weight: rawWeight,
          nutrition: product.nutrition ?? "",
          image: product.image,
          active: product.active ?? true,
          isHeader: product.isHeader ?? false,
          isSubHeader: product.isSubHeader ?? false,
          index: product.index ?? 0,
          categoryId: categoryId,
        });
      } else {
        // New Product Default State
        setFormData({
          name: "",
          desc: "",
          price: "",
          weight: "",
          nutrition: "",
          image: "",
          active: true,
          isHeader: initialType === "header",
          isSubHeader: initialType === "subheader",
          index: Date.now(),
          categoryId: categoryId,
        });
      }
    }
  }, [isOpen, product, categoryId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleToggleHeader = () => {
    setFormData((prev) => ({
      ...prev,
      isHeader: !prev.isHeader,
      isSubHeader: false, // Cannot be both
    }));
  };

  const handleToggleSubHeader = () => {
    setFormData((prev) => ({
      ...prev,
      isSubHeader: !prev.isSubHeader,
      isHeader: false, // Cannot be both
    }));
  };

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
      const targetCategoryId = formData.categoryId;
      const isMove = product && targetCategoryId !== categoryId;

      const productId = product
        ? product.id
        : formData.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

      // 1. If Moving: Delete from old category first
      if (isMove) {
        const oldDocRef = doc(
          db,
          "categories",
          categoryId,
          "products",
          productId,
        );
        await deleteDoc(oldDocRef);
      }

      // 2. Save/Create in Target Category
      const docRef = doc(
        db,
        "categories",
        targetCategoryId,
        "products",
        productId,
      );

      const productData = {
        name: formData.name,
        desc: formData.desc
          .replace(
            /(?:\(|^|\s)(\d+(?:\.\d+)?)\s*(g|gr|ml|l|kg|buc)(?:\)|$|\s)/gi,
            " ",
          )
          .trim()
          .replace(/\s+/, " "),
        price: formData.price,
        weight: formData.weight,
        nutrition: formData.nutrition || "",
        image: formData.image,
        active: formData.active,
        isHeader: formData.isHeader || false,
        isSubHeader: formData.isSubHeader || false,
        index: formData.index,
        id: productId,
      };

      if (product && !isMove) {
        await updateDoc(docRef, productData);
      } else {
        await setDoc(docRef, productData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
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
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-zinc-100 dark:border-zinc-800"
      >
        {/* Modal Header */}
        <div
          className={cn(
            "px-6 py-4 border-b flex justify-between items-center transition-colors duration-300",
            formData.isHeader
              ? "bg-red-500/10 border-red-500/20"
              : formData.isSubHeader
                ? "bg-zinc-800 border-zinc-700"
                : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                formData.isHeader
                  ? "bg-red-500 shadow-red-500/60"
                  : formData.isSubHeader
                    ? "bg-zinc-400 shadow-zinc-400/60"
                    : "bg-green-500 shadow-green-500/60",
              )}
            />
            <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-zinc-50">
              {product
                ? "Editare"
                : formData.isHeader
                  ? "Titlu Nou"
                  : formData.isSubHeader
                    ? "Sub-titlu Nou"
                    : "Produs Nou"}{" "}
              {formData.isHeader || formData.isSubHeader
                ? "Secțiune"
                : `(${product ? "Produs" : "Nou"})`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Category Selector */}
              <div className="flex-1 space-y-1">
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  Categorie
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Header Toggles */}
              <div className="flex-1 flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="px-2">
                  <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Titlu Principal
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formData.isHeader ? "DA" : "NU"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHeader}
                  className={`relative w-12 h-7 rounded-full transition-colors mr-2 ${
                    formData.isHeader
                      ? "bg-red-500"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${
                      formData.isHeader ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="px-2">
                  <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Sub-titlu
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formData.isSubHeader ? "DA" : "NU"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSubHeader}
                  className={`relative w-12 h-7 rounded-full transition-colors mr-2 ${
                    formData.isSubHeader
                      ? "bg-zinc-600"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${
                      formData.isSubHeader ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="px-2">
                  <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Statusul Vizibilității
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formData.active ? "Activ în meniu" : "Ascuns acum"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`relative w-12 h-7 rounded-full transition-colors mr-2 ${
                    formData.active
                      ? "bg-green-500"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow transition-transform ${
                      formData.active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {(formData.isHeader || formData.isSubHeader) && (
              <div
                className={cn(
                  "p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300",
                  formData.isHeader
                    ? "bg-red-500/5 border-red-500/10"
                    : "bg-zinc-800/20 border-zinc-700",
                )}
              >
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Save className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50">
                      Creezi un {formData.isHeader ? "TITLU" : "SUB-TITLU"} de
                      secțiune
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      Acesta va apărea ca un separator elegant între produsele
                      din meniu. Perfect pentru a grupa băuturile (ex: Vinuri,
                      Beri) sau felurile de mâncare.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Fields: only for non-headers */}
            {!formData.isHeader && !formData.isSubHeader && (
              <>
                <div className="space-y-1 text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 mr-2">
                      Sfat:
                    </span>
                    Nu este nevoie să adaugi gramajul în descriere, folosește
                    câmpul special de mai jos.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    Imagine Produs
                  </label>
                  <div className="flex gap-4 items-start">
                    <div className="relative w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0 group">
                      {formData.image ? (
                        <>
                          <Image
                            src={
                              formData.image.startsWith("http")
                                ? formData.image
                                : `/${formData.image.split("?")[0]}`
                            }
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({ ...p, image: "" }))
                            }
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs">Fără poză</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                          ) : (
                            <UploadCloud className="w-5 h-5 text-zinc-500" />
                          )}
                          <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                            {uploading
                              ? "Se încarcă..."
                              : "Încarcă o poză nouă"}
                          </span>
                        </label>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500 font-medium">
                          SAU introdu un link direct:
                        </p>
                        <input
                          type="text"
                          name="image"
                          value={formData.image}
                          onChange={handleChange}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12 space-y-1">
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {formData.isHeader || formData.isSubHeader
                    ? "Nume Titlu / Secțiune"
                    : "Nume Produs"}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {!formData.isHeader && !formData.isSubHeader && (
                <>
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Preț
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="price"
                        required
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <span className="absolute right-3 top-2 text-zinc-400 font-bold text-sm">
                        LEI
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-1">
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Gramaj / Detalii (40ml, 750ml etc.)
                    </label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="md:col-span-12 space-y-1">
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Descriere (opțional)
                    </label>
                    <textarea
                      name="desc"
                      rows={2}
                      value={formData.desc}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>

                  <div className="md:col-span-12 space-y-1">
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Valori nutriționale (opțional)
                    </label>
                    <p className="text-xs text-zinc-500 mb-1">
                      Format liber, ex: Calorii: 320 kcal · Proteine: 18g ·
                      Alergeni: GLUTEN, OUĂ
                    </p>
                    <textarea
                      name="nutrition"
                      rows={3}
                      value={formData.nutrition}
                      onChange={handleChange}
                      placeholder="Valoare energetică: 206 Kcal / 859 Kj, Grăsimi: 4,62g..."
                      className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
          >
            Anulează
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading || uploading}
            className="px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {product ? "Salvează" : "Creează"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
