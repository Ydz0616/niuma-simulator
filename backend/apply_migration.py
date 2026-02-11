import sys
import os
from sqlalchemy import text

# Add current directory to python path so we can import app
sys.path.append(os.getcwd())

from app.core.db import engine

def run_migration():
    print("Starting migration...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE agent_prompt_layers ADD COLUMN IF NOT EXISTS title VARCHAR(32) NOT NULL DEFAULT '进化逻辑';"))
            conn.commit()
        print("Migration successful: Added title column to agent_prompt_layers")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
