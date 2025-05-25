// src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';

// const NEWS_API_KEY = process.env.NEWS_API_KEY; // REMEMBER TO UNCOMMENT THIS AND DELETE THE LINE BELOW
const NEWS_API_KEY = process.env.NEWS_API_KEY; // FOR LOCAL TESTING ONLY - REMOVE BEFORE COMMIT/DEPLOY

const DEFAULT_COUNTRY = 'us'; // You can change this to 'in' for India or your preferred default
const DEFAULT_CATEGORY = 'general';
const PAGE_SIZE = 12; // Number of articles to fetch

export async function GET(request: NextRequest) {
  if (!NEWS_API_KEY) {
    console.error('News API key not configured (or hardcoded key is empty).');
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

  console.log(`Attempting to fetch from NewsAPI: ${newsApiUrl.replace(NEWS_API_KEY, "YOUR_API_KEY_HIDDEN")}`); // Log URL but hide most of the key

  try {
    const response = await fetch(newsApiUrl);
    const responseBodyText = await response.text(); // Get raw response body for debugging

    console.log(`NewsAPI Raw Response Status: ${response.status}`);
    // Log only a snippet of the body if it's too long, especially if successful
    console.log(`NewsAPI Raw Response Body Snippet: ${responseBodyText.substring(0, 500)}`);

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseBodyText); // Try to parse if it's a JSON error from NewsAPI
      } catch (e) {
        errorDetails = responseBodyText; // Otherwise, use the raw text
      }
      console.error('NewsAPI Error - Full Details:', errorDetails);
      return NextResponse.json({ error: 'Failed to fetch news from NewsAPI. Check server logs.', api_status: response.status, api_details: errorDetails }, { status: response.status });
    }

    // If response is OK, try to parse the full body as JSON
    let data;
    try {
      data = JSON.parse(responseBodyText);
    } catch (e) {
      console.error('Failed to parse NewsAPI JSON response:', e);
      console.error('Original non-JSON response body:', responseBodyText);
      return NextResponse.json({ error: 'Received malformed data from NewsAPI.' }, { status: 500 });
    }
    
    const filteredArticles = (data.articles || []).filter(
      (article: any) => article.url && article.title && (article.description || article.content)
    );

    return NextResponse.json(filteredArticles);

  } catch (error: any) {
    console.error('Network or other unexpected error fetching news:', error.message, error.stack);
    return NextResponse.json({ error: 'An unexpected network or server error occurred.' }, { status: 500 });
  }
}