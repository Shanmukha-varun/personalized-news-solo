// src/components/ArticleCard.tsx
"use client";
import { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  onSummarize: (article: Article) => void;
  isSummarizingThis: boolean;
  hasContentForSummary: boolean;
}

export default function ArticleCard({ article, onSummarize, isSummarizingThis, hasContentForSummary }: ArticleCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-sky-500/70 hover:transform hover:-translate-y-1 group">
      {article.urlToImage && (
        <div className="w-full h-48 overflow-hidden"> {/* Constrain image height */}
          <img
            src={article.urlToImage}
            alt={article.title || 'Article image'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" // Image zoom on hover
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow"> {/* Added flex-grow to push button down */}
        <h2 className="text-lg font-semibold mb-2 text-sky-400 group-hover:text-sky-300 line-clamp-3 leading-tight" title={article.title}>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {article.title}
          </a>
        </h2>
        <p className="text-gray-400 text-xs mb-3 line-clamp-3 flex-grow leading-relaxed"> {/* Added flex-grow for description */}
          {article.description || article.content || 'No description available.'}
        </p>
        <button
          onClick={() => onSummarize(article)}
          disabled={isSummarizingThis || !hasContentForSummary}
          className="w-full mt-auto bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-3 rounded-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
        >
          {isSummarizingThis ? 'AI is working...' : 'Get AI Summary'}
        </button>
      </div>
    </div>
  );
}