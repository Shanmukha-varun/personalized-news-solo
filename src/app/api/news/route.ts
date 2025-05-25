// src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Article as FrontendArticle } from '@/types'; // Assuming your types/index.ts is correct

// Define a more specific type for the articles from NewsAPI.
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
      let errorDetails: NewsApiResponse | string;
      try {
        errorDetails = JSON.parse(responseBodyText) as NewsApiResponse;
      } catch { // Omitted unused error variable for ESLint
        errorDetails = responseBodyText;
      }
      console.error('NewsAPI Error - Full Details:', errorDetails);
      return NextResponse.json({ error: 'Failed to fetch news from NewsAPI. Check server logs.', api_status: response.status, api_details: errorDetails }, { status: response.status });
    }

    let data: NewsApiResponse;
    try {
      data = JSON.parse(responseBodyText) as NewsApiResponse;
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error('Failed to parse NewsAPI JSON response:', errorMessage);
      console.error('Original non-JSON response body:', responseBodyText);
      return NextResponse.json({ error: 'Received malformed data from NewsAPI.' }, { status: 500 });
    }
    
    const filteredAndMappedArticles = (data.articles || [])
      .filter((article: NewsApiArticle): article is NewsApiArticle & { title: string; url: string } => // Ensure title and url are present
        !!(article.url && article.title && (article.description || article.content))
      )
      .map((article: NewsApiArticle & { title: string; url: string }): FrontendArticle => ({ // Map to FrontendArticle type
        title: article.title, // Now known to be a string
        description: article.description || null,
        content: article.content || null,
        url: article.url, // Now known to be a string
        source: article.source,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
      }));

    return NextResponse.json(filteredAndMappedArticles);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Network or other unexpected error fetching news:', errorMessage, errorStack);
    return NextResponse.json({ error: 'An unexpected network or server error occurred.' }, { status: 500 });
  }
}