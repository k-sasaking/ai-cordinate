
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500 mb-6"></div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">処理中です</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
};

export default Loader;
