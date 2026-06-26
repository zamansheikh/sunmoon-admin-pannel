"use client";

import ImageUploadGallery from "@/components/banners/ImageUploadGallery";
import { getBannerDocs, createBanner, deleteBanner } from "@/lib/api";

export default function SliderBannerPage() {
  return (
    <ImageUploadGallery
      pageTitle="Slider Banner"
      crumbLabel="Slider"
      description="Upload images that appear in the in-app slider banner carousel."
      emptyText="No slider banners uploaded yet"
      fetchItems={getBannerDocs}
      uploadItem={(p) => createBanner(p)}
      deleteItem={deleteBanner}
    />
  );
}
