"use client";

import ImageUploadGallery from "@/components/banners/ImageUploadGallery";
import { getPosterDocs, createPoster, deletePoster } from "@/lib/api";

export default function SplashBannerPage() {
  return (
    <ImageUploadGallery
      pageTitle="Splash Banner"
      crumbLabel="Splash"
      description="Upload splash / poster images shown when the app launches."
      emptyText="No splash banners uploaded yet"
      fetchItems={getPosterDocs}
      uploadItem={(p) => createPoster(p)}
      deleteItem={deletePoster}
    />
  );
}
