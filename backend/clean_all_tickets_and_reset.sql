-- 直接删掉所有工单（停机后执行）
-- CASCADE 会连带删掉 ticket_participants、battle_logs

-- 1. 解除 feed_events 对工单的引用，否则删 tickets 会 FK 报错
UPDATE feed_events SET ref_ticket_id = NULL WHERE ref_ticket_id IS NOT NULL;

-- 2. 删掉所有工单
DELETE FROM tickets;

-- 3. 验证
SELECT count(*) AS tickets_remaining FROM tickets;
