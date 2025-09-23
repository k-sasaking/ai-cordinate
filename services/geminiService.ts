
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Utility to convert Base64 string to a Part object for the API
const base64ToPart = (base64String: string) => {
  const match = base64String.match(/^data:(image\/.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid Base64 string format");
  }
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
};

// Extracts the first image from the response
const extractImageFromResponse = (response: GenerateContentResponse): string => {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const { mimeType, data } = part.inlineData;
      return `data:${mimeType};base64,${data}`;
    }
  }
  throw new Error("No image found in the Gemini API response.");
};

export const analyzeUserProfile = async (profileImageBase64: string): Promise<{ age: number; gender: string }> => {
  const profileImagePart = base64ToPart(profileImageBase64);
  const prompt = "Analyze the person in this image and estimate their age and gender. Provide the output in JSON format.";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        profileImagePart,
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          age: {
            type: Type.INTEGER,
            description: "Estimated age of the person.",
          },
          gender: {
            type: Type.STRING,
            description: "Estimated gender of the person (e.g., '男性', '女性', 'その他').",
          },
        },
        required: ["age", "gender"],
      },
    },
  });

  const jsonString = response.text.trim();
  const result = JSON.parse(jsonString);
  return result;
};


export const generateFullBodyImage = async (profileImageBase64: string): Promise<string> => {
  const profileImagePart = base64ToPart(profileImageBase64);
  const prompt = "Generate a realistic, high-quality, full-body photograph of the person in this image. They should be standing in a neutral pose, facing forward, against a plain light gray studio background. The entire body from head to feet should be visible.";
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        profileImagePart,
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return extractImageFromResponse(response);
};

export const generateTryOnImage = async (
  fullBodyImageBase64: string,
  clothingImageBase64: string,
  anglePrompt: string
): Promise<string> => {
  const fullBodyImagePart = base64ToPart(fullBodyImageBase64);
  const clothingImagePart = base64ToPart(clothingImageBase64);
  
  const prompt = `You are an expert virtual stylist. Take the person from the first image and realistically dress them in the clothing item from the second image. The final image should be a high-quality, photorealistic result. The person's pose and appearance should remain the same. The final pose should be viewed ${anglePrompt}. The background should be a consistent, plain light gray studio background.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        fullBodyImagePart,
        clothingImagePart,
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  return extractImageFromResponse(response);
};
