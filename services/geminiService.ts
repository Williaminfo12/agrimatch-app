import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = 'gemini-2.5-flash';

export const generateJobDescription = async (crop: string, task: string, pay: string, ownerName: string): Promise<string> => {
  try {
    const prompt = `
      You are a professional agricultural job recruiter in Taiwan. 
      Write a short, attractive, and clear job posting (in Traditional Chinese) for a farm worker.
      
      Details:
      - Crop: ${crop}
      - Task: ${task}
      - Pay: ${pay}
      - Recruiter Name: ${ownerName}
      
      The tone should be friendly and encouraging. 
      Use the recruiter's name in the text (e.g., "${ownerName} 誠徵", or "歡迎加入 ${ownerName} 的團隊").
      Keep it under 100 words.
      Include an emoji relevant to the crop.
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
      Give me 3 brief, critical safety tips (in Traditional Chinese) for an agricultural worker performing this task: "${task}".
      Format as a simple bulleted list. Focus on physical safety and heatstroke prevention.
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

// New function to parse unstructured voice/text input into structured data
export const parseJobRequest = async (input: string): Promise<any> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const prompt = `
      Extract agricultural job details from the user's input (Traditional Chinese).
      
      Context:
      - Current Date: ${today}
      - If the user says "Tomorrow" or "Next Monday", calculate the date based on the Current Date.
      - Identify Terrain: If user mentions "山坡", "陡", "山", set terrain to 'slope'. If "平地", "好走", set to 'flat'. Default to 'flat' if unknown.
      
      User Input: "${input}"
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            crop: { type: Type.STRING, description: "Crop name (e.g., 葡萄, 高接梨)" },
            task: { type: Type.STRING, description: "Task name (e.g., 套袋, 採收)" },
            locationDistrict: { type: Type.STRING, description: "District only (e.g., 后里區, 東勢區)" },
            salaryType: { type: Type.STRING, description: "Payment type (e.g., 日薪, 時薪)" },
            salaryAmount: { type: Type.NUMBER, description: "Amount in NTD" },
            requiredWorkers: { type: Type.NUMBER, description: "Number of people needed" },
            date: { type: Type.STRING, description: "Work date in YYYY-MM-DD format" },
            time: { type: Type.STRING, description: "Work time range (e.g., 08:00-17:00, 上午, 全天)" },
            terrain: { type: Type.STRING, enum: ['flat', 'slope'], description: "flat or slope" },
            notesSummary: { type: Type.STRING, description: "Other requirements (e.g., lunch provided)" }
          },
          required: ["crop", "task", "locationDistrict", "salaryAmount"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
};