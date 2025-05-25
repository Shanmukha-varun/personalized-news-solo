// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from '@/components/ArticleCard';
import CategorySelector from '@/components/CategorySelector';
import { Article } from '@/types';

const NEWS_CATEGORIES = ["general", "business", "technology", "entertainment", "health", "science", "sports"];
const DEFAULT_CATEGORY = NEWS_CATEGORIES[0];

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORY);

  const [currentSummary, setCurrentSummary] = useState<{ title: string; summaryText: string; keywords: string[] } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizingArticleUrl, setSummarizingArticleUrl] = useState<string | null>(null);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);

  const fetchArticles = useCallback(async (category: string, keywordsToSearch: string[] = []) => {
    setIsLoadingArticles(true);
    setGlobalError(null);
    let url = `/api/news?category=${category}`;
    if (keywordsToSearch.length > 0) {
      url = `/api/news?q=${encodeURIComponent(keywordsToSearch.join(' OR '))}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch articles (Status: ${response.status})`);
      }
      const data: Article[] = await response.json();
      setArticles(data);
    } catch (err: unknown) { // Error at 41:19 - fixed with unknown
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching articles.";
      setGlobalError(errorMessage);
      console.error("Fetch articles error:", err);
      setArticles([]);
    } finally {
      setIsLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(selectedCategory, searchKeywords);
  }, [selectedCategory, searchKeywords, fetchArticles]);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setSearchKeywords([]);
    setCurrentSummary(null);
  };

  const handleSummarizeArticle = async (article: Article) => {
    const contentToSummarize = article.content || article.description;
    if (!contentToSummarize) {
      setGlobalError("This article doesn't have enough content to summarize.");
      console.warn("[FE] Attempted to summarize article with no content:", article.title);
      return;
    }
    
    setIsSummarizing(true);
    setSummarizingArticleUrl(article.url);
    setCurrentSummary(null);
    setGlobalError(null);
    // console.log(`[FE] Attempting to summarize: ${article.title}`);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleTitle: article.title, articleContent: contentToSummarize }),
      });

      // console.log("[FE] Raw response object from /api/summarize fetch:", response);

      if (!response.ok) {
        let errorData = { error: `Server error: ${response.status}`, details: 'Could not retrieve error details.' };
        try {
          const errorJson = await response.json(); 
          // console.error("[FE] Error response JSON from /api/summarize:", errorJson);
          errorData = { 
            error: errorJson.error || `Server error: ${response.status}`, 
            details: errorJson.details || JSON.stringify(errorJson) 
          };
        } catch (_e) { // Error at 94:18 - fixed by prefixing with _
          const textError = await response.text(); 
          // console.error("[FE] Error response text from /api/summarize:", textError);
          errorData.details = textError;
        }
        throw new Error(errorData.error + (errorData.details ? ` - ${errorData.details}` : ''));
      }

      const data: { summary: string; keywords: string[] } = await response.json();
      // console.log("[FE] Successfully parsed data from /api/summarize:", data);

      if (data && typeof data.summary === 'string' && Array.isArray(data.keywords)) {
        const newSummary = { title: article.title, summaryText: data.summary, keywords: data.keywords };
        setCurrentSummary(newSummary); 
        // console.log("[FE] currentSummary state HAS BEEN SET with:", newSummary); 
        
        if (data.keywords.length > 0) {
          localStorage.setItem('lastKeywords', JSON.stringify(data.keywords));
          // console.log("[FE] Keywords stored in localStorage:", data.keywords);
        }
      } else {
        // console.error("[FE] Received data from /api/summarize is not in the expected format or incomplete:", data);
        setGlobalError("The AI returned an unexpected summary format. Please try again.");
        setCurrentSummary(null); 
      }

    } catch (err: unknown) { // Error at 120:19 - fixed with unknown
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while summarizing.";
      // console.error("[FE] Error in handleSummarizeArticle catch block:", errorMessage, err);
      setGlobalError(errorMessage);
      setCurrentSummary(null); 
    } finally {
      setIsSummarizing(false);
      setSummarizingArticleUrl(null);
      // console.log("[FE] Summarization process finished for:", article.title);
    }
  };

  const handleSeeMoreLikeThis = () => {
    const storedKeywords = localStorage.getItem('lastKeywords');
    if (storedKeywords) {
      const keywords: string[] = JSON.parse(storedKeywords);
      if (keywords.length > 0) {
        setSearchKeywords(keywords);
        setSelectedCategory('');
        setCurrentSummary(null);
      }
    } else {
      setGlobalError("No keywords found from a previous summary to search for related articles.");
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-screen bg-gray-900 text-white font-sans">
      <header className="text-center my-6 md:my-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
          AI News Brief
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">Your intelligent news summarizer.</p>
      </header>

      <CategorySelector
        categories={NEWS_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        disabled={isLoadingArticles || isSummarizing}
      />

      {searchKeywords.length > 0 && !isLoadingArticles && (
        <div className="text-center mb-4 p-2 bg-gray-800 rounded-md">
            {/* Errors at 163:110 and 163:140 - fixed by using template literal for the whole expression */}
            <p className="text-sky-300 text-sm">Showing articles related to: <span className="font-semibold">{`"${searchKeywords.join('", "')}"`}</span></p>
            <button 
                onClick={() => { setSearchKeywords([]); setSelectedCategory(DEFAULT_CATEGORY); }}
                className="text-xs text-gray-400 hover:text-sky-400 mt-1 underline"
            >
                (Clear Search & Show General News)
            </button>
        </div>
      )}

      {globalError && (
        <div role="alert" className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-md relative my-4 text-sm shadow-lg">
          <strong className="font-bold">Oops! </strong>
          <span className="block sm:inline">{globalError}</span>
        </div>
      )}

      {isLoadingArticles ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-400 mx-auto"></div>
          <p className="mt-4 text-lg text-sky-300">Fetching fresh news...</p>
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.url}
              article={article}
              onSummarize={handleSummarizeArticle}
              isSummarizingThis={summarizingArticleUrl === article.url}
              hasContentForSummary={!!(article.content || article.description)}
            />
          ))}
        </div>
      ) : (
         <p className="text-center text-gray-500 py-20 text-lg">No articles found for this selection. Try another category or check back later!</p>
      )}

      {/* Summary Modal */}
      {currentSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fadeIn">
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-xl w-full border border-gray-700 max-h-[90vh] flex flex-col">
            <div className="mb-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-sky-300 line-clamp-2 break-words" title={currentSummary.title}>
                AI Summary: <span className="font-bold">{currentSummary.title}</span>
              </h3>
            </div>

            <div className="text-gray-300 mb-4 whitespace-pre-line text-sm leading-relaxed overflow-y-auto pr-2 custom-scrollbar flex-grow">
                {currentSummary.summaryText}
            </div>

            {currentSummary.keywords && currentSummary.keywords.length > 0 && (
              <div className="mb-5 pt-3 border-t border-gray-700">
                <p className="text-xs text-sky-400 mb-1.5 font-medium">Keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {currentSummary.keywords.map((kw, i) => (
                    <span key={i} className="bg-gray-700 hover:bg-gray-600 text-sky-300 px-3 py-1 rounded-full text-xs shadow-sm cursor-default">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-auto pt-4 border-t border-gray-700">
                <button
                    onClick={handleSeeMoreLikeThis}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75"
                    disabled={!(currentSummary.keywords && currentSummary.keywords.length > 0) || isLoadingArticles || isSummarizing}
                >
                    More like this
                </button>
                <button
                    onClick={() => setCurrentSummary(null)}
                    className="bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}
      {/* End of Summary Modal */}
    </div>
  );
}