-- Tracked repositories
CREATE TABLE IF NOT EXISTS repos (
  id TEXT PRIMARY KEY, -- owner/name format
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  added_at INTEGER NOT NULL, -- Unix timestamp
  last_polled_at INTEGER, -- Unix timestamp
  UNIQUE(owner, name)
);

-- Workflow runs tracked from GitHub
CREATE TABLE IF NOT EXISTS workflow_runs (
  id INTEGER PRIMARY KEY, -- GitHub run ID
  repo_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL, -- queued, in_progress, completed
  conclusion TEXT, -- success, failure, cancelled, skipped
  started_at INTEGER, -- Unix timestamp
  completed_at INTEGER, -- Unix timestamp
  html_url TEXT NOT NULL,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_repo ON workflow_runs(repo_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
