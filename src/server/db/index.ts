import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { Repo, WorkflowRun } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

/**
 * Initialize the database, create tables, and return the instance
 */
export function initDb(): Database.Database {
  try {
    const dbPath = process.env.DATABASE_PATH || './data/orchestrator.db';
    const dbDir = dirname(dbPath);
    
    // Create data directory if it doesn't exist
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    
    // Open/create database
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the database instance (must call initDb first)
 */
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

// Query helpers

/**
 * Add a repository to track
 */
export function addRepo(owner: string, name: string): Repo {
  const db = getDb();
  const id = `${owner}/${name}`;
  const addedAt = Math.floor(Date.now() / 1000);
  
  const stmt = db.prepare(`
    INSERT INTO repos (id, owner, name, added_at)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(id, owner, name, addedAt);
  
  return { id, owner, name, addedAt };
}

/**
 * Get all tracked repositories
 */
export function getRepos(): Repo[] {
  const db = getDb();
  
  const stmt = db.prepare(`
    SELECT id, owner, name, added_at as addedAt, last_polled_at as lastPolledAt
    FROM repos
    ORDER BY added_at DESC
  `);
  
  return stmt.all() as Repo[];
}

/**
 * Remove a repository from tracking
 */
export function removeRepo(id: string): void {
  const db = getDb();
  
  const stmt = db.prepare(`
    DELETE FROM repos WHERE id = ?
  `);
  
  stmt.run(id);
}

/**
 * Add a workflow run
 */
export function addWorkflowRun(run: Omit<WorkflowRun, 'id'>): WorkflowRun {
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO workflow_runs (id, repo_id, workflow_name, status, conclusion, started_at, completed_at, html_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Note: id is provided in the input (GitHub run ID), not auto-generated
  const id = (run as any).id || 0; // This should be passed in the run object
  
  stmt.run(
    id,
    run.repoId,
    run.workflowName,
    run.status,
    run.conclusion || null,
    run.startedAt || null,
    run.completedAt || null,
    run.htmlUrl
  );
  
  return { id, ...run };
}

/**
 * Get workflow runs for a repository
 */
export function getWorkflowRuns(repoId: string, limit: number = 50): WorkflowRun[] {
  const db = getDb();
  
  const stmt = db.prepare(`
    SELECT 
      id, 
      repo_id as repoId, 
      workflow_name as workflowName, 
      status, 
      conclusion, 
      started_at as startedAt, 
      completed_at as completedAt, 
      html_url as htmlUrl
    FROM workflow_runs
    WHERE repo_id = ?
    ORDER BY started_at DESC
    LIMIT ?
  `);
  
  return stmt.all(repoId, limit) as WorkflowRun[];
}

/**
 * Update a workflow run
 */
export function updateWorkflowRun(id: number, updates: Partial<WorkflowRun>): void {
  const db = getDb();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.conclusion !== undefined) {
    fields.push('conclusion = ?');
    values.push(updates.conclusion);
  }
  if (updates.startedAt !== undefined) {
    fields.push('started_at = ?');
    values.push(updates.startedAt);
  }
  if (updates.completedAt !== undefined) {
    fields.push('completed_at = ?');
    values.push(updates.completedAt);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE workflow_runs
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
}
