import React, { useState, useEffect, useCallback } from "react";
import { ClothingItem, UserProfile } from "../types";
import { searchRakutenClothingImages } from "../services/rakutenService";
import Loader from "./Loader";
import { ArrowPathIcon } from "./Icons";

interface ClothingGalleryProps {
  userProfile: UserProfile | null;
  onSelect: (item: ClothingItem) => void;
}

const ClothingGallery: React.FC<ClothingGalleryProps> = ({
  userProfile,
  onSelect,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchItems = useCallback(
    async (currentPage: number) => {
      if (!userProfile) return;

      setIsLoading(true);
      try {
        const newItems = await searchRakutenClothingImages(
          userProfile.gender,
          userProfile.age,
          currentPage
        );
        // Filter out potential duplicates before adding
        setItems((prevItems) => {
          const existingIds = new Set(prevItems.map((i) => i.itemUrl));
          const uniqueNewItems = newItems.filter(
            (i) => !existingIds.has(i.itemUrl)
          );
          return currentPage === 1
            ? newItems
            : [...prevItems, ...uniqueNewItems];
        });
      } catch (error) {
        console.error("Failed to fetch clothing items:", error);
        // Optionally, show an error message to the user
      } finally {
        setIsLoading(false);
      }
    },
    [userProfile]
  );

  useEffect(() => {
    // Fetch initial items when the component mounts or userProfile changes
    setItems([]); // Reset items when profile changes
    setPage(1);
    fetchItems(1);
  }, [fetchItems]);

  const handleSelect = (item: ClothingItem) => {
    setSelectedId(item.itemUrl);
    onSelect(item);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage);
  };

  if (isLoading && items.length === 0) {
    return <Loader message="あなたへのおすすめ商品を読み込み中..." />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.itemUrl}
            onClick={() => handleSelect(item)}
            className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all duration-200 bg-white shadow-md hover:shadow-xl ${
              selectedId === item.itemUrl
                ? "border-indigo-500 scale-105"
                : "border-transparent hover:border-indigo-300"
            }`}
          >
            <img
              id={item.itemUrl}
              src={item.imageUrl}
              alt={item.itemUrl}
              className="w-full h-auto object-cover aspect-[2/3] bg-gray-200"
            />
            {/* <div className="p-2 bg-gray-50 text-center">
              <p className="text-sm font-medium text-gray-700 truncate">
                {item.name}
              </p>
            </div>*/}
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
          className="bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          {isLoading ? (
            <Loader message="あなたに合う服を検索中です。" />
          ) : (
            <>
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              他の商品を見る
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ClothingGallery;
