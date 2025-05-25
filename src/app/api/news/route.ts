// src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Article as FrontendArticle } from '@/types'; // Assuming you have this type for frontend

// Define a more specific type for the articles from NewsAPI if possible
// For now, we'll use a basic structure.
interface NewsApiArticle {
  source?: { id: string | null; name: string };
  author?: string | null;
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  content?: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
  code?: string; // For error responses
  message?: string; // For error responses
}


const NEWS_API_KEY = process.env.NEWS_API_KEY;
const DEFAULT_COUNTRY = 'us';
const DEFAULT_CATEGORY = 'general';
const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  if (!NEWS_API_KEY) {
    console.error('News API key not configured.');
    return NextResponse.json({ error: 'Server configuration error: API Key missing.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || DEFAULT_CATEGORY;
  const country = searchParams.get('country') || DEFAULT_COUNTRY;
  const q = searchParams.get('q');

  let newsApiUrl: string;

  if (q) {
    newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=relevancy&pageSize=${PAGE_SIZE}&apiKey=${NEWS_API_KEY}`;
  } else {
    newsApiUrl = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=${PAGE_SIZE}&apiKey=${NEWS_API_KEY}`;
  }

  // console.log(`Attempting to fetch from NewsAPI: ${newsApiUrl.replace(NEWS_API_KEY, "YOUR_API_KEY_HIDDEN")}`);

  try {
    const response = await fetch(newsApiUrl);
    const responseBodyText = await response.text();

    // console.log(`NewsAPI Raw Response Status: ${response.status}`);
    // console.log(`NewsAPI Raw Response Body Snippet: ${responseBodyText.substring(0, 500)}`);

    if (!response.ok) {
      let errorDetails: NewsApiResponse | string = responseBodyText; // Default to raw text
      try {
        errorDetails = JSON.parse(responseBodyText) as NewsApiResponse;
      } catch (_e) { // Error 'e' at 44:16 - fixed by prefixing with _
        // Keep errorDetails as responseBodyText if JSON.parse fails
      }
      console.error('NewsAPI Error - Full Details:', errorDetails);
      return NextResponse.json({ error: 'Failed to fetch news from NewsAPI. Check server logs.', api_status: response.status, api_details: errorDetails }, { status: response.status });
    }

    let data: NewsApiResponse; // Error at 62:17 - fixed by using NewsApiResponse type
    try {
      data = JSON.parse(responseBodyText) as NewsApiResponse;
    } catch (parseError: unknown) { // Use unknown for catch variable
      console.error('Failed to parse NewsAPI JSON response:', parseError instanceof Error ? parseError.message : parseError);
      console.error('Original non-JSON response body:', responseBodyText);
      return NextResponse.json({ error: 'Received malformed data from NewsAPI.' }, { status: 500 });
    }
    
    const filteredArticles = (data.articles || []).filter(
      (article: NewsApiArticle): article is FrontendArticle => // Error at 67:19 - fixed by using NewsApiArticle and type predicate
        !!(article.url && article.title && (article.description || article.content))
    ).map(article => ({ // Map to FrontendArticle type if necessary, ensure all fields match
        title: article.title || 'No Title',
        description: article.description,
        content: article.content,
        url: article.url || '',
        source: article.source,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
    }));


    return NextResponse.json(filteredArticles);

  } catch (error: unknown) { // Use unknown for catch variable
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Network or other unexpected error fetching news:', errorMessage, errorStack);
    return NextResponse.json({ error: 'An unexpected network or server error occurred.' }, { status: 500 });
  }
}