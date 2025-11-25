import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Use process.env.API_KEY exclusively as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = 'gemini-2.5-flash';

export const generateJobDescription = async (crop: string, task: string, pay: string, ownerName: string): Promise<string> => {
  try {
    const prompt = `
      You are a professional agricultural job recruiter in Taiwan. 
      Write a short, attractive, and clear job posting (in Traditional Chinese) for a farm worker.
      Details: Crop: ${crop}, Task: ${task}, Pay: ${pay}, Recruiter: ${ownerName}.
      Tone: friendly. Keep under 100 words. Include emoji.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "無法生成描述，請稍後再試。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 服務目前不可用，請手動輸入描述。";
  }
};

export const getSafetyTips = async (task: string): Promise<string> => {
  try {
    const prompt = `
      Give me 3 brief, critical safety tips (in Traditional Chinese) for an agricultural worker performing: "${task}".
      Format as a bulleted list.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "無法取得安全建議。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "無法連線至 AI 安全顧問。";
  }
};

export const parseJobRequest = async (input: string): Promise<any> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Extract agricultural job details from input (Traditional Chinese).
      Context: Today is ${today}.
      Input: "${input}"
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            crop: { type: Type.STRING },
            task: { type: Type.STRING },
            locationDistrict: { type: Type.STRING },
            salaryType: { type: Type.STRING },
            salaryAmount: { type: Type.NUMBER },
            requiredWorkers: { type: Type.NUMBER },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            terrain: { type: Type.STRING, enum: ['flat', 'slope'] },
            notesSummary: { type: Type.STRING }
          },
          required: ["crop", "task", "locationDistrict", "salaryAmount"],
        },
      },
    });

    if (response.text) return JSON.parse(response.text);
    return null;
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
};
