'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  if (images.length === 0) {
    return null;
  }

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-square border border-gray-200 rounded overflow-hidden bg-gray-100"
        >
          {!loadedImages.has(index) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={image}
            alt={`${alt} - รูปที่ ${index + 1}`}
            fill
            className="object-cover"
            onLoad={() => handleImageLoad(index)}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

