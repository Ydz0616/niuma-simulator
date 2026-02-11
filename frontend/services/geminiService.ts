
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkOrder, ChatMessage } from "../types";

// Helper for exponential backoff retry logic
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes('429') || error?.status === 429;
      
      if (isRateLimit && retries < maxRetries - 1) {
        const delay = Math.pow(2, retries) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit hit (429). Retrying in ${Math.round(delay)}ms... Attempt ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // Handle "Requested entity was not found" by throwing it so caller can reset key if needed
        if (errorMsg.includes("Requested entity was not found")) {
          console.error("API Key error: Requested entity not found. Possible project/billing issue.");
        }
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded for AI request.');
}

// Factory to get fresh AI instance (ensures latest API key)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simulate an Agent's turn in a meeting based on their prompt layer
export const generateAgentTurn = async (
  agentProfile: UserProfile,
  opponentName: string,
  workOrder: WorkOrder,
  chatHistory: ChatMessage[]
) => {
  return withRetry(async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const systemInstruction = `
      你正在扮演一个职场AI代理（牛马）。
      当前场景：${workOrder.description}
      // Fix: Changed agentProfile.rank to P${agentProfile.level} as UserProfile uses level.
      你的身份：${agentProfile.name} (P${agentProfile.level})
      你的性格：${agentProfile.personality}
      你的逻辑：${agentProfile.promptLayer.logic}
      你的策略：${agentProfile.promptLayer.strategy}
      你的态度：${agentProfile.promptLayer.attitude}

      这是两个牛马在老板面前的博弈。你需要为了自己的KPI，在不激怒老板的前提下，优雅地反击对手(${opponentName})。
      保持短句，带一点职场黑话，内容要有攻击性 but 表面客气。
    `;

    const historyStr = chatHistory.slice(-5).map(m => `${m.senderName}: ${m.content}`).join('\n');
    const prompt = `
      对话背景：
      ${historyStr}
      
      轮到你了。请给出你的反应：
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction, temperature: 0.8 }
    });

    return response.text?.trim() || "（正在检查汇报PPT中的错别字...）";
  });
};

// Boss evaluates the meeting outcome for automated simulation
export const evaluateMeeting = async (
  workOrder: WorkOrder,
  chatHistory: ChatMessage[]
) => {
  return withRetry(async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const systemInstruction = `你是一个名为“${workOrder.bossType}”的职场判官。根据这段两个牛马的争辩历史，选出一个胜者。`;
    
    const historyStr = chatHistory.map(m => `${m.senderName}: ${m.content}`).join('\n');

    const response = await ai.models.generateContent({
      model,
      contents: `
        判定胜负。谁表现得更专业（或者更会甩锅）？
        对话历史：
        ${historyStr}

        请给出JSON格式判定。
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winnerName: { type: Type.STRING },
            summary: { type: Type.STRING },
            performanceScore: { type: Type.NUMBER, description: "0 to 1" },
          },
          required: ["winnerName", "summary", "performanceScore"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { winnerName: 'System', summary: '双方平庸，全部加班。', performanceScore: 0.5 };
    }
  });
};

// Boss response for interactive mode (ChatRoom)
export const getBossResponse = async (
  profile: UserProfile,
  workOrder: WorkOrder,
  chatHistory: ChatMessage[],
  userInput: string
) => {
  return withRetry(async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const systemInstruction = `你是一个名为“${workOrder.bossType}”的职场老板。正在处理工单：${workOrder.title}。
    你要以老板的身份，对员工${profile.name}的反击或回复做出回应。
    保持威严、PUA风格，或者根据bossType来设定语气。内容要简短、有力。`;

    const historyStr = chatHistory.slice(-5).map(m => `${m.senderName}: ${m.content}`).join('\n');
    const prompt = `对话历史：\n${historyStr}\n员工最新回复：${userInput}\n请给出你的老板回应：`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction, temperature: 0.9 }
    });

    return response.text?.trim() || "知道了，继续工作。";
  });
};

// Evaluation for interactive mode (ChatRoom)
export const evaluateBattle = async (
  profile: UserProfile,
  workOrder: WorkOrder,
  chatHistory: ChatMessage[]
) => {
  return withRetry(async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const systemInstruction = `你是一个职场判官。根据这段员工与老板的博弈，判定结果。`;

    const historyStr = chatHistory.map(m => `${m.senderName}: ${m.content}`).join('\n');

    const response = await ai.models.generateContent({
      model,
      contents: `判定胜负。员工是否成功防御了PUA或完成了任务？
      对话历史：
      ${historyStr}
      请输出JSON结果。`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING, description: "'user' or 'boss'" },
            summary: { type: Type.STRING },
            xpBonus: { type: Type.NUMBER, description: "Multiplier 0.5 to 1.5" },
            goldBonus: { type: Type.NUMBER, description: "Multiplier 0.5 to 1.5" },
          },
          required: ["winner", "summary", "xpBonus", "goldBonus"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { winner: 'boss', summary: '表现平平，被老板无情镇压。', xpBonus: 0.5, goldBonus: 0.5 };
    }
  });
};
