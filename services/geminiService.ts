
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizResult } from "../types";
import { AI_SYSTEM_INSTRUCTION } from "../constants";

export const generateAIAnalysisStream = async (
  result: QuizResult,
  onChunk: (text: string) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    核心输入参数：
    用户总压力值：${result.totalScore}
    压力等级：第 ${result.level.level} 级
    等级标签：${result.level.tag}
    外部环境压力维度分：${result.dimensionScores.EXTERNAL}
    个人抗压特质维度分：${result.dimensionScores.INTERNAL}
    应对策略防御维度分：${result.dimensionScores.DEFENSE}
    答题原始选项（前25题字母）：${result.answers.join(', ')}

    请根据上述参数，生成一份约3000字的深度分析报告。
    注意：请在每个模块之间使用明确的 [模块标题] 并保留段落。

    报告必须包含以下四个模块：
    1. [春节压力全景总览]
    2. [核心压力源深度拆解]
    3. [高危围攻场景全景预判]
    4. [专属反围攻深度生存指南]

    语言风格：同龄人吐槽式、接地气、梗系化。
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        temperature: 0.9,
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const part = chunk.text;
      if (part) {
        fullText += part;
        onChunk(fullText);
      }
    }
  } catch (error) {
    console.error("AI Generation failed:", error);
    onChunk("生成失败，请检查网络或刷新重试。");
  }
};
