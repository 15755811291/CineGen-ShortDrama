import { AiModelConfig, ScriptData, Shot, Character, Scene } from "../types";
import * as googleProvider from "./geminiService";

// 全局状态管理对象，确保引用的唯一性
const configState = {
  current: {
    provider: 'google' as 'google' | 'siliconflow' | 'custom',
    apiKey: '',
    textModel: 'gemini-2.5-flash',
    imageModel: 'gemini-2.5-flash-image',
    videoModel: 'veo-3.1-fast-generate-preview',
    baseUrl: ''
  } as AiModelConfig
};

export const updateAiConfig = (config: AiModelConfig) => {
  console.log("[aiService] Updating Config:", config);
  configState.current = { ...config };
  // 无论 provider 是什么，都尝试同步一下 key，防止底层服务误报 missing key
  googleProvider.setGlobalApiKey(config.apiKey);
};

// 通用文本生成接口
export const parseScriptToData = async (rawText: string, language: string = '中文'): Promise<ScriptData> => {
  const config = configState.current;
  console.log("[aiService] parseScriptToData using provider:", config.provider);
  
  if (config.provider === 'google') {
    return googleProvider.parseScriptToData(rawText, language, config.textModel);
  }
  
  const prompt = `
    Analyze the text and output a JSON object in the language: ${language}.
    
    IMPORTANT: Output ONLY the valid JSON object. Do not include any markdown tags (like \`\`\`json), explanations, or notes outside the JSON.

    Tasks:
    1. Extract or Infer title, genre, logline (in ${language}). If not explicitly mentioned in the text, please create creative and appropriate ones based on the story content.
    2. Extract characters (id, name, gender, age, personality).
    3. Extract scenes (id, location, time, atmosphere).
    4. Break down the story into paragraphs linked to scenes.
    
    Output Format (JSON only):
    {
      "title": "...",
      "genre": "...",
      "logline": "...",
      "characters": [{"id": "1", "name": "...", "gender": "...", "age": "...", "personality": "..."}],
      "scenes": [{"id": "1", "location": "...", "time": "...", "atmosphere": "..."}],
      "storyParagraphs": [{"id": 1, "text": "...", "sceneRefId": "1"}]
    }

    Input:
    "${rawText.slice(0, 20000)}"
  `;

  const responseText = await callOpenAiCompatibleChat(prompt);
  let parsed: any = {};
  try {
    parsed = JSON.parse(cleanJsonString(responseText));
  } catch (e) {
    console.error("Failed to parse script data JSON from provider:", e);
    throw new Error("AI 返回格式错误，请重试。");
  }

  // 后处理与 GeminiProvider 保持一致
  const characters = Array.isArray(parsed.characters) ? parsed.characters.map((c: any) => ({
    ...c, 
    id: String(c.id),
    variations: []
  })) : [];
  const scenes = Array.isArray(parsed.scenes) ? parsed.scenes.map((s: any) => ({...s, id: String(s.id)})) : [];
  const storyParagraphs = Array.isArray(parsed.storyParagraphs) ? parsed.storyParagraphs.map((p: any) => ({...p, sceneRefId: String(p.sceneRefId)})) : [];

  return {
    title: parsed.title || "未命名剧本",
    genre: (parsed.genre && parsed.genre.trim() !== "") ? parsed.genre : "通用",
    logline: (parsed.logline && parsed.logline.trim() !== "") ? parsed.logline : "暂无简介",
    language: language,
    characters,
    scenes,
    storyParagraphs
  };
};

export const generateShotList = async (scriptData: ScriptData): Promise<Shot[]> => {
  const config = configState.current;
  if (config.provider === 'google') {
    return googleProvider.generateShotList(scriptData, config.textModel);
  }

  const lang = scriptData.language || '中文';
  const allShots: Shot[] = [];

  // 循环处理每个场景
  for (let i = 0; i < scriptData.scenes.length; i++) {
    const scene = scriptData.scenes[i];
    const paragraphs = scriptData.storyParagraphs
      .filter(p => String(p.sceneRefId) === String(scene.id))
      .map(p => p.text)
      .join('\n');

    if (!paragraphs.trim()) continue;

    const prompt = `
      Act as a professional cinematographer. Generate a detailed shot list for Scene ${i + 1} as a JSON array.
      Language: ${lang}.
      
      Scene: ${scene.location} (${scene.time}, ${scene.atmosphere})
      Action: "${paragraphs.slice(0, 4000)}"
      Genre: ${scriptData.genre}
      Characters: ${JSON.stringify(scriptData.characters.map(c => ({ id: c.id, name: c.name })))}

      JSON Format:
      [
        {
          "sceneId": "${scene.id}",
          "actionSummary": "...",
          "dialogue": "...",
          "cameraMovement": "...",
          "shotSize": "...",
          "characters": ["char_id"],
          "keyframes": [
            {"id": "kf1", "type": "start", "visualPrompt": "Detailed English visual description for image generation"}
          ]
        }
      ]
    `;

    try {
      const responseText = await callOpenAiCompatibleChat(prompt);
      const shots = JSON.parse(cleanJsonString(responseText));
      if (Array.isArray(shots)) {
        allShots.push(...shots.map(s => ({ ...s, sceneId: String(scene.id) })));
      }
    } catch (e) {
      console.error(`Failed for scene ${scene.id}`, e);
    }
  }

  return allShots.map((s, idx) => ({
    ...s,
    id: `shot-${idx + 1}`,
    keyframes: Array.isArray(s.keyframes) ? s.keyframes.map(k => ({ 
      ...k, 
      id: `kf-${idx + 1}-${k.type}`,
      status: 'pending' 
    })) : [],
    interval: {
      id: `interval-${idx + 1}`,
      startKeyframeId: `kf-${idx + 1}-start`,
      endKeyframeId: `kf-${idx + 1}-end`,
      duration: 5,
      motionStrength: 5,
      status: 'pending'
    }
  }));
};

export const generateVisualPrompts = async (type: 'character' | 'scene', data: Character | Scene, genre: string): Promise<string> => {
  const config = configState.current;
  if (config.provider === 'google') {
    return googleProvider.generateVisualPrompts(type, data, genre, config.textModel);
  }
  
  const prompt = `Generate a high-fidelity visual prompt for a ${type} in a ${genre} movie. 
  Data: ${JSON.stringify(data)}. 
  Output only the prompt in English, comma-separated, focused on visual details (lighting, texture, appearance).`;

  try {
    return await callOpenAiCompatibleChat(prompt);
  } catch (e) {
    return "";
  }
};

// 辅助方法：调用 OpenAI 兼容接口（Chat）
async function callOpenAiCompatibleChat(prompt: string): Promise<string> {
  const config = configState.current;
  let url = '';
  if (config.provider === 'siliconflow') {
    url = 'https://api.siliconflow.cn/v1/chat/completions';
  } else {
    const base = config.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
    url = base.includes('/chat/completions') ? base : `${base}/chat/completions`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.textModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// 辅助方法：清理 JSON 字符串
const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  
  // 1. 尝试从 Markdown 代码块中提取内容
  const codeBlockMatch = str.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  let content = codeBlockMatch ? codeBlockMatch[1] : str;

  // 2. 寻找最外层的 [ 或 { 结构，过滤掉前后的废话（如“注：...”)
  const jsonMatch = content.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) {
    content = jsonMatch[1];
  }

  return content.trim();
};

// 通用图片生成接口
export const generateImage = async (prompt: string, referenceImages: string[] = []): Promise<string> => {
  const config = configState.current;
  if (config.provider === 'google') {
    return googleProvider.generateImage(prompt, referenceImages, config.imageModel);
  }
  
  if (config.provider === 'siliconflow' || config.provider === 'custom') {
    return callOpenAiCompatibleImage(prompt, referenceImages);
  }
  
  throw new Error(`Provider ${config.provider} not supported for image generation.`);
};

// 通用视频生成接口
export const generateVideo = async (prompt: string, startImageBase64?: string, endImageBase64?: string): Promise<string> => {
  const config = configState.current;
  if (config.provider === 'google') {
    return googleProvider.generateVideo(prompt, startImageBase64, endImageBase64, config.videoModel);
  }
  
  if (config.provider === 'siliconflow' || config.provider === 'custom') {
    return callOpenAiCompatibleVideo(prompt, startImageBase64);
  }

  throw new Error(`Provider ${config.provider} not supported for video generation.`);
};

// 辅助方法：调用 OpenAI 兼容接口（图片）
async function callOpenAiCompatibleImage(prompt: string, refs: string[]): Promise<string> {
  const config = configState.current;
  let url = '';
  if (config.provider === 'siliconflow') {
    url = 'https://api.siliconflow.cn/v1/images/generations';
  } else {
    const base = config.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
    url = base.includes('/images/generations') ? base : `${base}/images/generations`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.imageModel,
      prompt: prompt,
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.images?.[0]?.url || data.data?.[0]?.url;
}

// 辅助方法：调用 OpenAI 兼容接口（视频）
async function callOpenAiCompatibleVideo(prompt: string, startImg?: string): Promise<string> {
  const config = configState.current;
  
  // 硅基流动 (SiliconFlow) 专用异步提交逻辑
  if (config.provider === 'siliconflow') {
    const submitUrl = 'https://api.siliconflow.cn/v1/video/submit';
    
    // 构造符合 Wan-AI 规范的请求体
    const submitBody: any = {
      model: config.videoModel || "Wan-AI/Wan2.2-I2V-A14B",
      prompt: prompt,
      image_size: "1280x720"
    };

    // 如果是图生视频 (I2V)
    if (startImg) {
      submitBody.image = startImg;
    }

    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitBody)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `SiliconFlow Submit Error: ${response.status}`);
    }

    const submitData = await response.json();
    const requestId = submitData.requestId || submitData.id;
    if (!requestId) throw new Error("无法获取任务 ID，请检查 API 状态。");

    // 开始轮询任务结果
    const resultUrl = 'https://api.siliconflow.cn/v1/video/status';
    let attempts = 0;
    const maxAttempts = 60; // 最多等待 10 分钟
    
    while (attempts < maxAttempts) {
      // 每次查询前等待 10 秒
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const resultRes = await fetch(resultUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requestId })
        });

        if (resultRes.ok) {
          const resultData = await resultRes.json();
          const status = resultData.status;
          
          if (status === 'Succeed' || status === 'Success' || status === 'SUCCEED') {
            // 提取视频地址 (根据最新文档: results.videos[0].url)
            const videoUrl = resultData.results?.videos?.[0]?.url || resultData.data?.results?.[0]?.video?.url || resultData.video_url;
            if (videoUrl) return videoUrl;
          } else if (status === 'Failed' || status === 'Fail' || status === 'FAILED') {
            throw new Error(`视频生成失败: ${resultData.reason || resultData.data?.reason || '未知错误'}`);
          }
          // 否则继续轮询 (InProgress/InQueue)
          console.log(`[SiliconFlow] Video generation status: ${status}, attempt: ${attempts + 1}`);
        }
      } catch (pollErr: any) {
        console.warn("Polling error:", pollErr);
        if (pollErr.message?.includes("视频生成失败")) throw pollErr;
      }
      
      attempts++;
    }
    
    throw new Error("视频生成超时，请稍后在硅基流动控制台查看。");
  }

  // 其他通用或自定义 Provider 逻辑 (同步接口)
  const base = config.baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const url = base.includes('/video/generations') ? base : `${base}/video/generations`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.videoModel,
      prompt: prompt,
      image: startImg
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.video_url || data.data?.[0]?.url || data.url;
}
