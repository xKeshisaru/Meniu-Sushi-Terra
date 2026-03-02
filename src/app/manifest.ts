import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sushi Terra - Meniu Digital",
    short_name: "Sushi Terra",
    description:
      "Comandă cele mai bune preparate asiatice direct de pe telefon.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/assets/logo.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/assets/logo.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
