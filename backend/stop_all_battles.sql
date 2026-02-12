-- 上线前强制停服清场脚本
-- 防止旧逻辑的 LOCKED 工单在新代码启动后引发异常或死锁

-- 1. 强制关闭所有正在进行的会议 (LOCKED -> CLOSED)
UPDATE tickets
SET status = 'CLOSED', ended_at = NOW()
WHERE status = 'LOCKED';

-- 2. 强制重置所有 agent 状态为 IDLE (除非暂停)
--    包括 IN_MEETING (刚被强退的) 和 COOLDOWN (正在冷却的)
UPDATE agents
SET status = 'IDLE', cooldown_until = NULL
WHERE status IN ('IN_MEETING', 'COOLDOWN') AND is_paused = false;

-- 3. 确保暂停的 agent 状态正确
UPDATE agents
SET status = 'PAUSED', cooldown_until = NULL
WHERE is_paused = true;
