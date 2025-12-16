import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { type AnalysisResult } from "../types";

// Read API key from Vite env (define VITE_GEMINI_API_KEY in a .env file)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Lazily create the client so the whole app doesn’t crash on load
const getClient = () => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file."
    );
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcription: {
      type: Type.STRING,
      description: "The full word-for-word transcription of the user's video response.",
    },
    sentiment: {
      type: Type.STRING,
      description: "The overall sentiment of the candidate (e.g., Confident, Nervous, Enthusiastic).",
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-5 key professional skills or experiences mentioned.",
    },
    score: {
      type: Type.INTEGER,
      description: "A score from 1-100 rating the quality of the answer based on clarity and relevance.",
    },
  },
  required: ["transcription", "sentiment", "keyPoints", "score"],
};

/**
 * Converts a Blob to a Base64 string.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:video/webm;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Analyzes a video interview response.
 */
export const analyzeVideoResponse = async (
  videoBlob: Blob,
  questionText: string
): Promise<AnalysisResult> => {
  try {
    const ai = getClient();

    const base64Video = await blobToBase64(videoBlob);
    
    // Determine mime type (defaulting to standard webm if not specific)
    const mimeType = videoBlob.type || 'video/webm';

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `You are an expert HR interviewer. Analyze this video response to the question: "${questionText}". Provide a transcription, assess the sentiment/confidence, list key points, and give a relevance score (0-100).`
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Video
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(resultText) as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing video with Gemini:", error);
    console.log(`key is: ${GEMINI_API_KEY}`)
    // Return a fallback error object if analysis fails to avoid crashing the flow
    return {
      transcription: "Error analyzing video.",
      sentiment: "Unknown",
      keyPoints: ["Analysis failed"],
      score: 0
    };
  }
};