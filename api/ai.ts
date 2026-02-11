import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const AI_SYSTEM_INSTRUCTION = `
你是「测测春节你被围攻的压力值」专属AI深度分析引擎，服务18-35岁春节返乡年轻群体，仅输出纯文本、无格式、无符号、无互动、无海报、无语音的定制化分析报告，单份报告总字数严格控制在2900-3100字。全程采用同龄人吐槽式、接地气、梗系化、生活化语言。
`;

// 简单的内存缓存（生产环境建议用 Redis）
const taskCache: Map<string, { content: string; finished: boolean; error?: string }> = new Map();

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function buildPrompt(data: any): string {
  return `
核心输入参数：
用户总压力值：${data.totalScore}
压力等级：第 ${data.level} 级
等级标签：${data.levelTag}
外部环境压力维度分：${data.dimensionScores?.EXTERNAL || 0}
个人抗压特质维度分：${data.dimensionScores?.INTERNAL || 0}
应对策略防御维度分：${data.dimensionScores?.DEFENSE || 0}
答题原始选项（前25题字母）：${(data.answers || []).join(', ')}

请根据上述参数，生成一份约3000字的深度分析报告。
注意：请在每个模块之间使用明确的 [模块标题] 并保留段落。

报告必须包含以下四个模块：
1. [春节压力全景总览]
2. [核心压力源深度拆解]
3. [高危围攻场景全景预判]
4. [专属反围攻深度生存指南]

语言风格：同龄人吐槽式、接地气、梗系化。
`;
}

// 异步生成 AI 内容（流式接收并缓存）
async function generateAIContent(taskId: string, prompt: string) {
  try {
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
      taskCache.set(taskId, { content: '', finished: true, error: 'AI 服务请求失败' });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      taskCache.set(taskId, { content: '', finished: true, error: '无法读取 AI 响应' });
      return;
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              // 更新缓存
              taskCache.set(taskId, { content: fullContent, finished: false });
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    // 标记完成
    taskCache.set(taskId, { content: fullContent, finished: true });

    // 5分钟后清理缓存
    setTimeout(() => {
      taskCache.delete(taskId);
    }, 5 * 60 * 1000);

  } catch (error: any) {
    console.error('AI 生成错误:', error);
    taskCache.set(taskId, { content: '', finished: true, error: error.message || '生成失败' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'AI 服务未配置' });
  }

  const { action } = req.query;

  try {
    // 初始化 AI 任务（小程序长轮询方案）
    if (action === 'init' && req.method === 'POST') {
      const data = req.body;

      if (!data || !data.totalScore) {
        return res.status(400).json({ error: '缺少测评结果数据' });
      }

      const taskId = generateTaskId();
      const prompt = buildPrompt(data);

      // 初始化缓存
      taskCache.set(taskId, { content: '', finished: false });

      // 异步开始生成（不等待完成）
      generateAIContent(taskId, prompt);

      return res.status(200).json({ success: true, data: { taskId } });
    }

    // 轮询获取 AI 内容
    if (action === 'poll' && req.method === 'GET') {
      const { taskId } = req.query;

      if (!taskId || typeof taskId !== 'string') {
        return res.status(400).json({ error: '缺少任务ID' });
      }

      const task = taskCache.get(taskId);

      if (!task) {
        return res.status(404).json({ error: '任务不存在或已过期' });
      }

      if (task.error) {
        return res.status(500).json({ error: task.error });
      }

      return res.status(200).json({
        success: true,
        data: {
          content: task.content,
          finished: task.finished,
        }
      });
    }

    // 非流式接口（兼容旧版，一次性返回完整结果）
    if (action === 'analyze' && req.method === 'POST') {
      const data = req.body;

      if (!data || !data.totalScore) {
        return res.status(400).json({ error: '缺少测评结果数据' });
      }

      const prompt = buildPrompt(data);

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
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API 错误:', errorText);
        return res.status(500).json({ error: 'AI 服务请求失败' });
      }

      const result = await response.json();
      const report = result.choices?.[0]?.message?.content || '';

      return res.status(200).json({ success: true, data: { report } });
    }

    // 流式接口（H5 用）- 默认行为
    if (req.method === 'POST') {
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
      return;
    }

    return res.status(400).json({ error: '无效的请求' });

  } catch (error: any) {
    console.error('AI API 错误:', error);
    return res.status(500).json({ error: error.message || '服务器错误' });
  }
}
