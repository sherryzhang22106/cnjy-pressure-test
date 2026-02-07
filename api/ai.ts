import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const AI_SYSTEM_INSTRUCTION = `
你是「测测春节你被围攻的压力值」专属AI深度分析引擎，服务18-35岁春节返乡年轻群体，仅输出纯文本、无格式、无符号、无互动、无海报、无语音的定制化分析报告，单份报告总字数严格控制在2900-3100字。全程采用同龄人吐槽式、接地气、梗系化、生活化语言。
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'AI 服务未配置' });
  }

  try {
    const { result } = req.body;

    if (!result || !result.totalScore) {
      return res.status(400).json({ error: '缺少测评结果数据' });
    }

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

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: AI_SYSTEM_INSTRUCTION },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API 错误:', errorText);
      return res.status(500).json({ error: 'AI 服务请求失败' });
    }

    // 流式转发响应
    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: '无法读取 AI 响应' });
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    res.end();

  } catch (error: any) {
    console.error('AI API 错误:', error);
    return res.status(500).json({ error: error.message || '服务器错误' });
  }
}
