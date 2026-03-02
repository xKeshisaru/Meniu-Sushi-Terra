"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";
import { Product } from "@/types";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;
  const productId = params.productId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Product & { active: boolean }>({
    name: "",
    desc: "",
    price: "",
    weight: "",
    image: "",
    active: true,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "categories", categoryId, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Product;
          setFormData({
            ...data,
            active: data.active ?? true, // Default to true if missing
          });
        } else {
          alert("Produsul nu a fost găsit!");
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Eroare la încărcarea produsului.");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId && productId) {
      fetchProduct();
    }
  }, [categoryId, productId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const docRef = doc(db, "categories", categoryId, "products", productId);
      await updateDoc(docRef, {
        name: formData.name,
        desc: formData.desc,
        price: formData.price,
        weight: formData.weight,
        image: formData.image,
        active: formData.active,
      });
      alert("Produs actualizat cu succes!");
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/dashboard"
            className="p-2 bg-white dark:bg-zinc-900 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-50">
            Editare Produs
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-6">
            {/* Status Switch */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
              <div>
                <span className="block font-bold text-zinc-900 dark:text-zinc-100">
                  Status Produs
                </span>
                <span className="text-sm text-zinc-500">
                  {formData.active ? "Vizibil în meniu" : "Ascuns din meniu"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                  formData.active
                    ? "bg-green-500"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                    formData.active ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Image Preview & URL */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Imagine
              </label>
              <div className="flex gap-4">
                <div className="relative w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                  {formData.image ? (
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
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="URL Imagine (ex: /assets/poza.jpg)"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-2"
                  />
                  <p className="text-xs text-zinc-500">
                    *Momentan poți edita doar URL-ul. Upload-ul va fi
                    implementat curând.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Nume Produs
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            >
              Anulează
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Salvează Modificările
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
