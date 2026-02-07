import { QuizResult } from "../types";

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

export const generateAIAnalysisStream = async (
  result: QuizResult,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/api/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result }),
    });

    if (!response.ok) {
      throw new Error('AI 服务请求失败');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应');
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullText += parsed.content;
              onChunk(fullText);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    console.error('AI 生成失败:', error);
    onChunk('生成失败，请检查网络或刷新重试。');
  }
};
