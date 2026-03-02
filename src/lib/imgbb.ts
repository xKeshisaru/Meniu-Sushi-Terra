export async function uploadToImgBB(file: File): Promise<string> {
  const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!API_KEY) {
    throw new Error(
      "ImgBB API Key is missing. Please add NEXT_PUBLIC_IMGBB_API_KEY to your environment variables.",
    );
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${API_KEY}`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to upload image to ImgBB",
      );
    }

    const data = await response.json();
    return data.data.url;
  } catch (error) {
    console.error("ImgBB Upload Error:", error);
    throw error;
  }
}
