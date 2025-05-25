# AI News Brief - Your Intelligent News Summarizer

This is a Next.js project that serves as an intelligent news aggregator. It fetches the latest news articles from various categories, allows users to get AI-powered summaries and relevant keywords for each article using the Google Gemini API, and offers a simple way to find related content based on those keywords.

Built for a hackathon, demonstrating integration of external news APIs, AI for content processing, and a responsive frontend.

**Deployed Link:** [https://personalized-news-solo.vercel.app/] 

---

## Features

* **Categorized News:** Browse news articles from categories like General, Business, Technology, Entertainment, Health, Science, and Sports.
* **AI-Powered Summarization:** Get concise summaries for articles using Google's Gemini AI.
* **Keyword Extraction:** AI also extracts relevant keywords from articles.
* **"More Like This":** Discover related articles based on keywords from a summarized article.
* **Responsive Design:** Built with Tailwind CSS for a clean user interface.

---

## Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
* **Backend (API Routes):** Next.js API Routes
* **News Source:** [NewsAPI.org](https://newsapi.org/)
* **AI Summarization & Keywords:** [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview)
* **Deployment:** Vercel

---

## Getting Started Locally

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Shanmukha-varun/personalized-news-solo.git](https://github.com/Shanmukha-varun/personalized-news-solo.git)
    cd personalized-news-solo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    # or
    # bun install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env.local` in the root of your project and add the following environment variables with your actual API keys:
    ```env
    NEWS_API_KEY=your_newsapi_org_api_key
    GEMINI_API_KEY=your_google_gemini_api_key
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```
    * You can get a NewsAPI key from [NewsAPI.org](https://newsapi.org/).
    * You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/).

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    # or
    # bun dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

---

## Learn More (Next.js Information)

To learn more about Next.js, take a look at the following resources:

* [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
* [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.