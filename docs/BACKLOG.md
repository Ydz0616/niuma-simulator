# Corporate Asylum - Build Backlog

## Phase 1 - Foundation (Done)
- [x] Backend skeleton (`FastAPI + SQLAlchemy + PostgreSQL`)
- [x] OAuth config/env structure
- [x] Core models (`users`, `agents`, `agent_prompt_layers`, `oauth_tokens`)
- [x] Health endpoint
- [x] OAuth start/callback endpoints
- [x] `GET /api/me/card`

### Integration Tests
1. Start backend and call `GET /health` -> 200.
2. Call `GET /api/auth/secondme/start` -> returns `authorize_url`.
3. Complete OAuth in browser -> callback redirects to frontend with `user_id`.
4. Call `GET /api/me/card?user_id=<uuid>` -> returns card and prompt layers.

## Phase 2 - Agent Control
- [ ] `POST /api/me/evolve` append prompt layer (immutable)
- [ ] `POST /api/me/agent/pause`
- [ ] `POST /api/me/agent/resume`
- [ ] Add constraints and validations for agent state transitions

### Integration Tests
1. Append 3 layers and verify `layer_no` increments without overwrite.
2. Pause -> user not selected in matching.
3. Resume -> user can be selected again.

## Phase 3 - Battle Data Plane
- [ ] Add models: `tickets`, `ticket_participants`, `battle_logs`, `feed_events`
- [ ] Implement APIs:
  - [ ] `GET /api/battles/active`
  - [ ] `GET /api/battles/{ticket_id}`
  - [ ] `GET /api/battles/{ticket_id}/logs?after_id=`
  - [ ] `GET /api/lobby/feed`
  - [ ] `GET /api/leaderboard`

### Integration Tests
1. Polling `after_id` returns only incremental logs.
2. Active battle list updates when battle closes.
3. Leaderboard reflects score updates.

## Phase 4 - Director Loop
- [ ] Build `director` loop: spawn -> match -> pitch -> roast -> verdict -> settle
- [ ] Add single-instance lock (PG advisory lock)
- [ ] Add cooldown logic and reset to `IDLE`

### Integration Tests
1. Run director for 10 minutes and verify tickets flow `OPEN -> LOCKED -> CLOSED`.
2. Two backend processes running -> only one director acquires lock.
3. Cooldown expiry returns agent to `IDLE`.

## Phase 5 - Model Integration
- [ ] Implement `LLM Router` interface
- [ ] Add `Gemini` provider as default
- [ ] Add fallback for provider errors
- [ ] Add Judge JSON enforcement + retry

### Integration Tests
1. 20 battles complete without crash under occasional provider failures.
2. Judge JSON parse success rate >= 95%.
3. Output contains required blackword keywords in rounds.

## Phase 6 - Frontend Wiring
- [ ] Replace splash login mock with OAuth redirect
- [ ] Replace local profile source with `/api/me/card`
- [ ] Replace mock logs/leaderboard with backend APIs
- [ ] Keep UI unchanged where possible

### Integration Tests
1. First login creates profile and shows mapped user identity.
2. Two clients can spectate same battle in near-real time.
3. Refresh page preserves session context and data.
