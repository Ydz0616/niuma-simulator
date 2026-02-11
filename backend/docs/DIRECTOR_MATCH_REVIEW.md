# Director 匹配逻辑彻底审查（35 人、max 5 局仍接不到单）

## 1. 流程概览

- **tick 入口**（约 111–158 行）：拿 advisory lock → 打点 director_tick_stats → `_recover_stuck_locked` → `_repair_orphaned_agents` → `_release_cooldowns` → 算 `slots = director_max_active_battles - active_locked` → 循环 `slots` 次：`_pick_participants` → `_generate_ticket_spec` → `_create_locked_ticket` → 若某步不足 2 人或创建失败则 `break` → commit → unlock → 对本次生成的每个 (ticket_id, participants, spec) 起 `_run_battle` 异步任务。
- **开单条件**：只有 `_pick_participants` 返回至少 2 个 Participant 时才会开一单；返回空或 1 人则本 tick 该 slot 及后续 slot 都不再开（`if len(participants) < 2: break`）。

因此「所有人一直接不到单」等价于：**在多数 tick 里，`_pick_participants` 都返回了不足 2 人**（要么 `[]`，要么 1 人）。

---

## 2. `_pick_participants` 逻辑（约 240–339 行）

1. **idle_agents**  
   - 查询：`Agent.status == "IDLE"`、`is_paused == False`、`Agent.id` 不在「任意 LOCKED 工单的 participant」里。  
   - `order_by(func.random()).limit(32)`：最多取 32 个，随机序。  
   - 35 人、5 局（10 人在 LOCKED）时，应有 25 个 IDLE，全部会进 `idle_agents`（25 < 32）。

2. **user_by_id**  
   - 对每个 idle_agent 用 `agent.user_id` 取 User，`user_by_id[agent.id] = user`。  
   - 若某 agent 的 user 被删或查不到，该 agent 不会进后续「真人」池。

3. **real_agents**  
   - 从 idle_agents 中筛：`user.secondme_user_id` 不以 `npc_` 开头（且 user 存在）。  
   - 35 个真人时这里应仍是 25 人（或 32 上限）。

4. **real_agents_with_token**（关键）  
   - 对每个 real_agent：用 `user.id` 查 `OAuthToken`（provider=`secondme`），按 `updated_at desc` 取一条；  
   - `has_token = bool(token_row and token_row.access_token)`；  
   - 为 True 才加入 `real_agents_with_token`。  
   - **若这里绝大多数人被判为没有 token，就会只剩 0 或 1 人，导致永远不开单。**

5. **开单**  
   - `len(real_agents_with_token) >= 2` 时 `random.sample(..., 2)` 抽 2 人，再组 Participant 列表（含 token、layers 等）；否则返回 `[]`。

结论：在「35 人、max 5 局、池子/并发都够」的设定下，唯一能导致**持续**接不到单的代码路径是：**多数时候 `real_agents_with_token` 不足 2 人**。要么 DB 里大部分人没有/无效的 secondme token，要么**查 token 的方式有误**（见下）。

---

## 3. 可疑点：OAuthToken 的取法（283–289、321–325 行）

两处都是：

```python
token_row = db.scalar(
    select(OAuthToken)
    .where(OAuthToken.user_id == user.id, OAuthToken.provider == "secondme")
    .order_by(OAuthToken.updated_at.desc())
)
has_token = bool(token_row and token_row.access_token)
```

- **语义**：`session.scalar(select(OAuthToken)...)` 在 SQLAlchemy 2 里是「第一行第一列」：对 `select(OAuthToken)` 这种选整表实体的语句，第一列就是 ORM 实体本身，所以 `token_row` 理应是 `OAuthToken` 实例，`token_row.access_token` 可用。
- **风险**：若你用的 SQLAlchemy 版本/写法里，`scalar()` 对这类 select 返回的是主键（如 `id`）而不是实体，则 `token_row` 会是 UUID，没有 `.access_token`，会抛 `AttributeError`，整段 `_pick_participants` 会异常，tick 会打「Director tick failed」之类日志；若没有异常但 `token_row` 实际不是 token 对象，则 `has_token` 可能恒为 False，导致 `real_agents_with_token` 始终为空或只有极少数人。
- **建议**：在本地加一行临时 print 或 log，确认 `type(token_row)` 以及是否有 `access_token` 属性；或改为显式用 `db.execute(select(OAuthToken)...).scalars().first()` 取一行实体，避免对「第一列」的歧义。

---

## 4. 其他已核对的点

- **in_locked 子查询**（244、247 行）：排除「已在任意 LOCKED 工单中的 agent_id」，逻辑正确；不会误把整池清空。
- **limit(32)**：35 人时 IDLE 最多 25，不会因 32 的上限导致池子变小；随机序每 tick 重算，不会永久排除某几个人。
- **同一 tick 内多 slot**：先 `_create_locked_ticket` 并 `flush`，再下一轮 `_pick_participants` 会看到刚被设为 IN_MEETING 的 2 人，不会重复选同一人；slots 和 LOCKED 计数一致。
- **release_cooldowns / repair_orphaned / recover_stuck**：在每次 tick 开头执行，会把过期 COOLDOWN 和「无 LOCKED 却 IN_MEETING」的 agent 修回 IDLE，不会人为把池子压到不足 2 人（除非真的所有人都卡在 COOLDOWN/IN_MEETING）。
- **advisory lock**：拿不到锁时直接 return，本 tick 不做事，不会导致「匹配逻辑错误」，只会少跑一次。

---

## 5. 建议的验证步骤（不改业务逻辑，只做确认）

1. **看日志**  
   - 搜索 `pick_participants: idle=%d real_with_token=%d`（约 293 行）：若在 35 人在线、5 局已满时，经常出现 `real_with_token=0` 或 `1`，则问题在「谁被算进 real_agents_with_token」。  
   - 搜索 `匹配失败(池子不足2人)`（debug.log）：若大量出现且 `idle` 不小、`real_with_token` 却 ≤1，则进一步印证是 token 筛选问题。

2. **查库**  
   - 对当前在线的 35 个用户，查 `oauth_tokens` 中 `provider='secondme'` 且 `access_token IS NOT NULL` 的数量；若远小于 35，则「接不到单」部分来自确实没有 token 的账号。

3. **确认 token_row 类型**  
   - 在 283 行后临时打 log：`type(token_row)`、`getattr(token_row, 'access_token', None)`（或 try/except 看是否 AttributeError），确认 `db.scalar(select(OAuthToken)...)` 在你当前环境下返回的是 OAuthToken 实例且带 `access_token`。

---

## 6. 小结

- 在「35 人、max 5 局、池子/并发足够」的假设下，代码里**唯一能导致所有人长期接不到单**的路径是：**`real_agents_with_token` 在多数 tick 里不足 2 人**。
- 最值得怀疑的是：**用 `db.scalar(select(OAuthToken)...)` 取 token 时，返回值是否真的是带 `access_token` 的 OAuthToken 实例**；若不是，就会把大部分人筛掉，导致从不或几乎不开单。
- 建议按上面第 5 步做一次日志 + DB + 类型检查；若确认是 `scalar` 语义问题，改为用 `scalars().first()` 取单行实体即可，无需改其它匹配逻辑。
