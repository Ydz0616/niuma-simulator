#!/usr/bin/env bash
set -euo pipefail

SERVER="root@43.99.57.106"
REMOTE_DIR="/opt/corporate_asylum"

echo "=== 1. Syncing project files to server ==="
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '__pycache__' \
  --exclude '.DS_Store' \
  --exclude '.env' \
  --exclude 'frontend_ref' \
  ./ "${SERVER}:${REMOTE_DIR}/"

echo ""
echo "=== 2. Building and starting containers on server ==="
ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose down && docker compose build --no-cache && docker compose up -d"

echo ""
echo "=== 3. Waiting for services to start ==="
sleep 5

echo ""
echo "=== 4. Checking service status ==="
ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose ps"

echo ""
echo "=== 5. Running DB cleanup (fix_stuck_agents.sql) ==="
ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose exec -T db psql -U postgres -d corporate_asylum -f /dev/stdin < backend/fix_stuck_agents.sql" || echo "  (skipped — DB may not have tables yet on first deploy)"

echo ""
echo "=== 6. Applying DB Migrations ==="
# ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose exec -T backend python apply_migration.py"

echo ""
echo "✅ Deploy complete!"
echo "   Frontend: https://game.olajob.cn"
echo "   API:      https://game.olajob.cn/api/"
echo "   OAuth CB: https://game.olajob.cn/api/auth/secondme/callback"
