-- 牛马模拟器: 脏状态清理脚本
-- 运行一次即可修复当前卡死的 agent 状态

-- 1. 把所有没有关联 LOCKED ticket 但仍然 IN_MEETING 的 agent 清回 IDLE
UPDATE agents SET status = 'IDLE', cooldown_until = NULL
WHERE status = 'IN_MEETING'
  AND id NOT IN (
    SELECT tp.agent_id FROM ticket_participants tp
    JOIN tickets t ON t.id = tp.ticket_id
    WHERE t.status = 'LOCKED'
  );

-- 2. 把所有 COOLDOWN 但 cooldown_until 已过期的 agent 清回 IDLE
UPDATE agents SET status = 'IDLE', cooldown_until = NULL
WHERE status = 'COOLDOWN'
  AND (cooldown_until IS NULL OR cooldown_until <= NOW());

-- 3. 验证清理结果
SELECT id, nickname, status, is_paused, cooldown_until FROM agents ORDER BY nickname;
