const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface LobbyFeedItem {
  id: number;
  event_type: string;
  content: string;
  ref_ticket_id: string | null;
  created_at: string;
}

export interface ActiveBattleItem {
  ticket_id: string;
  title: string;
  budget: number;
  status: string;
  created_at: string;
  started_at: string | null;
}

export interface BattleLogItem {
  id: number;
  ticket_id: string;
  round: number;
  speaker_type: string;
  speaker_agent_id: string | null;
  speaker_name: string;
  content: string;
  created_at: string;
}

export interface BattleDetailItem {
  ticket_id: string;
  title: string;
  description: string | null;
  budget: number;
  status: string;
  winner_agent_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface LeaderboardItemApi {
  agent_id: string;
  nickname: string;
  level: number;
  title: string;
  kpi_score: number;
  win_count: number;
}

export interface MeCardApi {
  user_id: string;
  display_name: string;
  level: number;
  kpi_score: number;
  involution: number;
  resistance: number;
  slacking: number;
  status: string;
  cooldown_until: string | null;
}

async function request<T>(path: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`);
  if (!resp.ok) {
    throw new Error(`API ${path} failed: ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

export async function fetchLobbyFeed(afterId = 0): Promise<LobbyFeedItem[]> {
  return request<LobbyFeedItem[]>(`/api/lobby/feed?after_id=${afterId}&limit=30`);
}

export async function fetchActiveBattles(userId?: string): Promise<ActiveBattleItem[]> {
  const userQuery = userId ? `&user_id=${encodeURIComponent(userId)}` : '';
  return request<ActiveBattleItem[]>(`/api/battles/active?limit=20${userQuery}`);
}

export async function fetchBattleLogs(ticketId: string, afterId = 0): Promise<BattleLogItem[]> {
  return request<BattleLogItem[]>(`/api/battles/${ticketId}/logs?after_id=${afterId}&limit=200`);
}

export async function fetchBattleDetail(ticketId: string): Promise<BattleDetailItem> {
  return request<BattleDetailItem>(`/api/battles/${ticketId}`);
}

export async function fetchLeaderboard(): Promise<LeaderboardItemApi[]> {
  return request<LeaderboardItemApi[]>(`/api/leaderboard?limit=10`);
}

export async function fetchMeCard(userId: string): Promise<MeCardApi> {
  return request<MeCardApi>(`/api/me/card?user_id=${encodeURIComponent(userId)}`);
}

export async function forceIdleAgent(userId: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/me/agent/force-idle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!resp.ok) {
    throw new Error(`force-idle failed: ${resp.status}`);
  }
}
