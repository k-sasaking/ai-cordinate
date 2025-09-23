
import React from 'react';
import { SparklesIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <SparklesIcon className="w-8 h-8 text-indigo-500" />
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            AIコーデショップ
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
