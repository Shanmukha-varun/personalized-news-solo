// src/types/index.ts
export interface Article {
  title: string;
  description: string | null;
  content: string | null; // NewsAPI 'content' can be partial. We might need to rely on description or fetch full page.
  url: string;
  source?: { id: string | null; name: string };
  publishedAt?: string;
  urlToImage?: string | null;
  // Add any other fields you expect from NewsAPI and might want to use
}