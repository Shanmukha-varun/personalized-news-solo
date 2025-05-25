// src/components/CategorySelector.tsx
"use client";

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
  disabled: boolean; // To disable while articles or summary is loading
}

export default function CategorySelector({ selectedCategory, onSelectCategory, categories, disabled }: CategorySelectorProps) {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2 sm:gap-3 items-center">
      <span className="text-sm text-gray-400 mr-2 hidden sm:inline">Categories:</span>
      {categories.map(category => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          disabled={disabled}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors
            ${selectedCategory === category
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
}