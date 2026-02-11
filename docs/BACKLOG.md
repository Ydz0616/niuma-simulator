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
- [x] `POST /api/me/evolve` append prompt layer (immutable)
- [x] `POST /api/me/agent/pause`
- [x] `POST /api/me/agent/resume`
- [x] Add constraints and validations for basic state transitions (`IN_MEETING` guarded)

### Integration Tests
1. Append 3 layers and verify `layer_no` increments without overwrite.
2. Pause -> user not selected in matching.
3. Resume -> user can be selected again.

## Phase 3 - Battle Data Plane
- [x] Add models: `tickets`, `ticket_participants`, `battle_logs`, `feed_events`
- [ ] Implement APIs:
  - [x] `GET /api/battles/active`
  - [x] `GET /api/battles/{ticket_id}`
  - [x] `GET /api/battles/{ticket_id}/logs?after_id=`
  - [x] `GET /api/lobby/feed`
  - [x] `GET /api/leaderboard`

### Integration Tests
1. Polling `after_id` returns only incremental logs.
2. Active battle list updates when battle closes.
3. Leaderboard reflects score updates.

## Phase 4 - Director Loop
- [x] Build `director` loop: spawn -> match -> pitch -> roast -> verdict -> settle (template v1)
- [ ] Add single-instance lock (PG advisory lock)
- [x] Add cooldown logic and reset to `IDLE`

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
- [x] Replace splash login mock with OAuth redirect
- [x] Replace local profile source with `/api/me/card`
- [x] Wire badge evolve action to `/api/me/evolve`
- [x] Wire pause/resume action to backend status APIs
- [ ] Replace mock logs/leaderboard with backend APIs
- [ ] Keep UI unchanged where possible

### Integration Tests
1. First login creates profile and shows mapped user identity.
2. Two clients can spectate same battle in near-real time.
3. Refresh page preserves session context and data.
