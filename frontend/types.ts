
export enum Personality {
  OLD_SLICK = '老油条',
  GEN_Z = '00后',
  INV_KING = '卷王',
  SLACKER = '摸鱼侠',
  BOSS_WIFE = '老板娘'
}

export enum AgentStatus {
  IDLE = '待命中',
  IN_MEETING = '开会中',
  COOLDOWN = '精疲力竭',
  PAUSED = '已暂停'
}

export interface UserAttributes {
  resistance: number;
  kpi: number;
  involution: number;
  slacking: number;
}

export interface LogicUpgrade {
  id: string;
  timestamp: number;
  title: string;
  detail: string;
}

export interface PromptLayer {
  logic: string;
  strategy: string;
  attitude: string;
}

export interface UserProfile {
  name: string;
  idNumber: string;
  company: string;
  level: number;
  xp: number;
  gold: number;
  attributes: UserAttributes;
  personality: Personality;
  logicHistory: LogicUpgrade[];
  promptLayer: PromptLayer;
  status: AgentStatus;
  rank: number;
  cooldownUntil: number;
  workOrdersCompleted: number;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  difficulty: '简单' | '中等' | '困难';
  rewardKpi: number;
  rewardGold: number;
  bossType: string;
}

export interface ChatMessage {
  role: 'agent_a' | 'agent_b' | 'boss' | 'system' | 'user';
  senderName: string;
  content: string;
  timestamp: number;
}

export interface BattleState {
  isActive: boolean;
  workOrder: WorkOrder | null;
  messages: ChatMessage[];
  turnCount: number;
  isEvaluating: boolean;
  result: {
    winner: string;
    summary: string;
    kpiGained: number;
    involutionGained: number;
    // Optional fields for ChatRoom specific rewards
    xpGained?: number;
    goldGained?: number;
    penalty?: number;
  } | null;
}

export interface GlobalLog {
  id: string;
  message: string;
  timestamp: number;
  type?: 'drama' | 'system' | 'market';
  author?: string;
}

export interface LeaderboardItem {
  name: string;
  rank: string;
  kpi: number;
  avatar: string;
}
