-- 删除容器内所有 NPC 相关数据（users.secondme_user_id 以 'npc_' 开头）
-- 执行前会先解除 tickets / battle_logs 中对 NPC agent 的引用，再按依赖顺序删除

-- 1. 解除 tickets 中对 NPC 的 winner 引用
UPDATE tickets
SET winner_agent_id = NULL
WHERE winner_agent_id IN (
  SELECT a.id FROM agents a
  JOIN users u ON u.id = a.user_id
  WHERE u.secondme_user_id LIKE 'npc_%'
);

-- 2. 解除 battle_logs 中对 NPC 的 speaker 引用
UPDATE battle_logs
SET speaker_agent_id = NULL
WHERE speaker_agent_id IN (
  SELECT a.id FROM agents a
  JOIN users u ON u.id = a.user_id
  WHERE u.secondme_user_id LIKE 'npc_%'
);

-- 3. 删除 NPC 的 prompt layers（agent_prompt_layers）
DELETE FROM agent_prompt_layers
WHERE agent_id IN (
  SELECT a.id FROM agents a
  JOIN users u ON u.id = a.user_id
  WHERE u.secondme_user_id LIKE 'npc_%'
);

-- 4. 删除 NPC 的参会记录（ticket_participants）
DELETE FROM ticket_participants
WHERE agent_id IN (
  SELECT a.id FROM agents a
  JOIN users u ON u.id = a.user_id
  WHERE u.secondme_user_id LIKE 'npc_%'
);

-- 5. 删除 NPC agents
DELETE FROM agents
WHERE user_id IN (
  SELECT id FROM users WHERE secondme_user_id LIKE 'npc_%'
);

-- 6. 删除 NPC users
DELETE FROM users
WHERE secondme_user_id LIKE 'npc_%';

-- 7. 确认已无 NPC
SELECT 'users (npc)' AS tbl, count(*) AS cnt FROM users WHERE secondme_user_id LIKE 'npc_%'
UNION ALL
SELECT 'agents (npc)', count(*) FROM agents a JOIN users u ON u.id = a.user_id WHERE u.secondme_user_id LIKE 'npc_%';
