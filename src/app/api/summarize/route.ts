// src/app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'; // Import APIError if available or use a general check

let genAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.error('Gemini API key not found in environment variables.');
}

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

    const MAX_CONTENT_LENGTH = 12000;
    const truncatedContent = articleContent.length > MAX_CONTENT_LENGTH
      ? articleContent.substring(0, MAX_CONTENT_LENGTH) + "..."
      : articleContent;

    // console.log(`Summarizing with Gemini: "${articleTitle}", content length: ${truncatedContent.length}`);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", // Using the known working model
      safetySettings,
      generationConfig: {
        responseMimeType: "application/json", // Keep this if gemini-1.5-flash supports it well
        temperature: 0.5,
        maxOutputTokens: 250,
      }
    });

    const prompt = `
      You are a helpful assistant. First, summarize the news article concisely in 2-4 sentences.
      Second, provide 3-5 relevant keywords for this article.
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

    // console.log("Gemini Raw Response:", responseText);

    let parsedResponse: { summary: string; keywords: string[] };
    try {
      const cleanedResponseText = responseText.replace(/^```json\s*|```\s*$/g, '');
      parsedResponse = JSON.parse(cleanedResponseText);
    } catch (parseError: unknown) { // Error at 81:26 - fixed with unknown
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error("Gemini response was not valid JSON:", responseText, errorMessage);
      return NextResponse.json({ error: 'AI response was not in the expected JSON format.', details: responseText }, { status: 500 });
    }

    if (!parsedResponse.summary || !Array.isArray(parsedResponse.keywords)) {
       console.error("Gemini JSON response missing 'summary' or 'keywords', or 'keywords' is not an array:", parsedResponse);
       return NextResponse.json({ error: "AI response JSON structure was incorrect. Missing 'summary' or 'keywords'.", details: parsedResponse }, { status: 500 });
    }

    return NextResponse.json({ summary: parsedResponse.summary, keywords: parsedResponse.keywords });

  } catch (error: unknown) { // Error at 93:19 - fixed with unknown
    const errorMessage = error instanceof Error ? error.message : 'An unknown Gemini API error occurred';
    console.error('Error summarizing article with Gemini:', errorMessage, error);
    // Check if it's a Google APIError for more details if the SDK exports such a type explicitly
    // For now, a general message is fine.
    return NextResponse.json({ error: `Gemini API Error: ${errorMessage}` }, { status: 500 });
  }
}