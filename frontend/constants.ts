
import { WorkOrder, LeaderboardItem } from './types';

export const INITIAL_ATTRIBUTES = {
  resistance: 30,
  kpi: 0,
  involution: 0, // 初始 0
  slacking: 10
};

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'W1',
    title: '深夜复盘会',
    description: '周五晚上10点，关于为什么上周的KPI没达标的紧急对齐。',
    difficulty: '困难',
    rewardKpi: 45,
    rewardGold: 100,
    bossType: 'P9 卷宗专家'
  },
  {
    id: 'W2',
    title: '跨部门甩锅',
    description: '研发说是产品没写清，产品说是研发没理解。',
    difficulty: '中等',
    rewardKpi: 25,
    rewardGold: 40,
    bossType: '财务总监'
  },
  {
    id: 'W3',
    title: '茶水间摸鱼',
    description: '如何假装在讨论业务其实在聊八卦。',
    difficulty: '简单',
    rewardKpi: 10,
    rewardGold: 20,
    bossType: '摸鱼老板'
  }
];

export const BATTLE_PHRASES = [
  "我来同步一下这个项目的颗粒度。",
  "我们需要通过这个抓手，在垂直赛道打出组合拳。",
  "你的这个逻辑，没有形成闭环。",
  "这个底层逻辑我们还得再对齐一下。",
  "我们要给这个产品赋予更多的情绪价值。",
  "这不是在解决问题，这是在制造伪需求。",
  "我们的响应速度一定要做到毫秒级同步。",
  "这种降本增效的手段，我是持保留意见的。",
  "我们要给这个业务做一个深度的赋能。",
  "别跟我说过程，我只要看到最终的交付产出。",
  "这个问题的核心痛点，我们还没触达到。",
  "我们需要在认知层面进行一次深度的拉齐。",
  "这个方案的落地路径，目前还不够清晰。",
  "我们要打造一个全链路的生态闭环。"
];

export const BOSS_JUDGMENTS = [
  "不错，你的汇报很有穿透力，这个KPI我给你。对方回去反省。",
  "你们两个说的都是废话，全部留下来加班，直到颗粒度拉齐为止！",
  "你的逻辑出现了断层，而对方的甩锅技术显然更胜一筹。你输了。",
  "看到你们这么努力地卷，我感到非常欣慰。奖金减半，继续保持。"
];

export const MOCK_LEADERBOARD: LeaderboardItem[] = [
  { name: "卷王之王_阿强", rank: "P20 终极资本", kpi: 1999, avatar: "A1" },
  { name: "老油条_张哥", rank: "P18 PUA教头", kpi: 1850, avatar: "A2" },
  { name: "00后_整顿侠", rank: "P2 正式马骝", kpi: 120, avatar: "A3" },
  { name: "深夜咖啡机", rank: "P12 甩锅大师", kpi: 1280, avatar: "A4" },
  { name: "PPT大师_小李", rank: "P8 核心螺丝", kpi: 850, avatar: "A5" }
];

// Fix: Added missing EMOJI_ACTIONS constant.
export const EMOJI_ACTIONS = [
  { name: 'like', emoji: '👍' },
  { name: 'sweat', emoji: '😅' },
  { name: 'clap', emoji: '👏' },
  { name: 'muscle', emoji: '💪' },
  { name: 'fish', emoji: '🐟' }
];
