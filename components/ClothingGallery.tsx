
import React, { useState } from 'react';
import { ClothingItem } from '../types';

interface ClothingGalleryProps {
  items: ClothingItem[];
  onSelect: (item: ClothingItem) => void;
}

const ClothingGallery: React.FC<ClothingGalleryProps> = ({ items, onSelect }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (item: ClothingItem) => {
    setSelectedId(item.id);
    onSelect(item);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelect(item)}
          className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all duration-200 bg-white shadow-md hover:shadow-xl ${
            selectedId === item.id ? 'border-indigo-500 scale-105' : 'border-transparent hover:border-indigo-300'
          }`}
        >
          <img src={item.imageUrl} alt={item.name} className="w-full h-auto object-cover aspect-[2/3]" />
          <div className="p-2 bg-gray-50 text-center">
            <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClothingGallery;
