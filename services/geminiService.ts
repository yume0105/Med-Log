
import { GoogleGenAI } from "@google/genai";
import { Medication } from "../types";

// Always use named parameter for apiKey and assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMedicationAdvice = async (meds: Medication[]) => {
  if (meds.length === 0) return "薬を登録して、AIのアドバイスを受けましょう。";

  // Fix: changed m.time to m.times.join(', ') to match Medication interface
  const prompt = `以下の薬のスケジュールについて、健康上の簡単なアドバイスを100文字以内で日本語で教えてください。
  スケジュール: ${meds.map(m => `${m.name} (${m.dosage}) ${m.times.join(', ')}`).join(', ')}`;

  try {
    // Correct usage of generateContent with model name and prompt
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "あなたは親切な薬剤師です。簡潔に、飲み忘れ防止や併用、タイミングについてのアドバイスを1つだけ提供してください。"
      }
    });
    // Use .text property to access content
    return response.text || "アドバイスを取得できませんでした。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "接続エラーが発生しました。";
  }
};
