
import { GoogleGenAI, Type } from "@google/genai";
import { NewsField, NewsRegion, NewsItem } from "../types";

/**
 * News Fetching Service
 */
export const fetchAggregatedNews = async (field: NewsField, region: NewsRegion, location?: string): Promise<NewsItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let targetContext = region.toString();
  if (region === NewsRegion.STATE && location) {
    targetContext = `the state of ${location}, India`;
  } else if (region === NewsRegion.NATIONAL && location) {
    targetContext = `the country of ${location}`;
  }

  const prompt = `Act as a professional news researcher.
  
  Objective: Find the 10 most important and recent news stories from the last 24 hours.
  
  Context:
  - Topic: ${field}
  - Location: ${targetContext}
  
  Required JSON Structure:
  - title: A clear and engaging headline.
  - description: 2-3 sentences explaining the news story clearly.
  - imageUrl: A link to a high-quality relevant image.
  - tag: Choose one [CRITICAL | LATEST | GROWTH | POLICY | TREND].
  
  Return only a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 1024 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              tag: { type: Type.STRING }
            },
            required: ["title", "description", "imageUrl", "tag"],
          },
        },
      },
    });

    const jsonStr = response.text.trim();
    const data = JSON.parse(jsonStr);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));
    
    return data.map((item: any, index: number) => ({
      ...item,
      id: `news-${index}-${Date.now()}`,
      field,
      region,
      stateName: location,
      reporterId: 'InfoSphere News Bot',
      postedDate: new Date().toISOString(),
      source: 'external',
      sources: webSources.length > 0 ? webSources : []
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

/**
 * Identity Verification Service
 */
export const verifyIdProof = async (base64Data: string, mimeType: string): Promise<{ isValid: boolean; reason: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Act as an identity verification assistant.
  
  Task: Check the provided image to see if it is a valid government identity document from India (like an Aadhar Card, PAN Card, Voter ID, Passport, or Driver's License).
  
  Rules:
  - It must be a real Indian ID.
  - Reject blurry or unrelated images.
  - Reject images that are clearly not government documents.

  Return results in JSON:
  - isValid: boolean
  - reason: A short explanation (e.g., "Valid Aadhar Card found", "Image is too blurry to read").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isValid", "reason"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Verification error:", error);
    return { isValid: false, reason: "Unable to verify document at this time." };
  }
};