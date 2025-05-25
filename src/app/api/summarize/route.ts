// src/app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.error('Gemini API key not found in environment variables.');
}

// Basic safety settings for Gemini - adjust as needed
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function POST(request: NextRequest) {
  if (!genAI) {
    return NextResponse.json({ error: 'Server configuration error: Gemini API Key is missing or invalid.' }, { status: 500 });
  }

  try {
    const { articleTitle, articleContent } = await request.json();

    if (!articleTitle || !articleContent) {
      return NextResponse.json({ error: 'Article title and content are required.' }, { status: 400 });
    }

    const MAX_CONTENT_LENGTH = 12000; // Similar truncation
    const truncatedContent = articleContent.length > MAX_CONTENT_LENGTH
      ? articleContent.substring(0, MAX_CONTENT_LENGTH) + "..."
      : articleContent;

    console.log(`Summarizing with Gemini: "${articleTitle}", content length: ${truncatedContent.length}`);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", // Or "gemini-1.5-flash-latest" if you prefer speed
      safetySettings,
      generationConfig: {
        // responseMimeType: "application/json", // Use this if the model version supports it well
        temperature: 0.5,
        maxOutputTokens: 250,
      }
    });

        const prompt = `
          Please perform two tasks based on the following article:
          1. Summarize the news article concisely in 2-4 sentences.
          2. Provide 3-5 relevant keywords for this article.

          Format your entire response strictly as a single JSON object with two keys: "summary" (a string) and "keywords" (an array of strings).

          Here is the article:
          ---
          Title: "${articleTitle}"
          Content: "${truncatedContent}"
          ---

          JSON Output:
        `;
        
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    if (!responseText) {
      console.error('Gemini response content is empty. Block reason:', response.promptFeedback?.blockReason);
      return NextResponse.json({ error: 'Failed to get a valid response from AI. Response was empty or blocked.', blockReason: response.promptFeedback?.blockReason }, { status: 500 });
    }

    console.log("Gemini Raw Response:", responseText);

    let parsedResponse;
    try {
      // Gemini might sometimes wrap its JSON in ```json ... ``` if not using explicit JSON mode.
      const cleanedResponseText = responseText.replace(/^```json\s*|```\s*$/g, '');
      parsedResponse = JSON.parse(cleanedResponseText);
    } catch (parseError: any) {
      console.error("Gemini response was not valid JSON:", responseText, parseError.message);
      return NextResponse.json({ error: 'AI response was not in the expected JSON format.', details: responseText }, { status: 500 });
    }

    if (!parsedResponse.summary || !Array.isArray(parsedResponse.keywords)) {
       console.error("Gemini JSON response missing 'summary' or 'keywords', or 'keywords' is not an array:", parsedResponse);
       return NextResponse.json({ error: "AI response JSON structure was incorrect. Missing 'summary' or 'keywords'.", details: parsedResponse }, { status: 500 });
    }

    return NextResponse.json({ summary: parsedResponse.summary, keywords: parsedResponse.keywords });

  } catch (error: any) {
    console.error('Error summarizing article with Gemini:', error.message);
    // Gemini errors might not have the same structure as OpenAI's, handle generically
    return NextResponse.json({ error: `Gemini API Error: ${error.message}` }, { status: 500 });
  }
}