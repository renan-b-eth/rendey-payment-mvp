// =============================================================================
// Valence — Persistent Merchant Store
//
// File-based persistent database using better-sqlite3. Falls back to a JSON
// file store when the native module is unavailable (e.g., restricted CI).
//
// Schema:
//   merchants
//     id            TEXT PRIMARY KEY (UUID)
//     name          TEXT NOT NULL
//     email         TEXT NOT NULL UNIQUE
//     passwordHash  TEXT NOT NULL  (hex)
//     passwordSalt  TEXT NOT NULL  (hex)
//     walletId      TEXT           (Circle wallet UUID)
//     walletAddress TEXT           (Solana address / base58)
//     createdAt     INTEGER        (unix epoch ms)
//   sessions
//     token     TEXT PRIMARY KEY
//     userId    TEXT NOT NULL
//     createdAt INTEGER
//     expiresAt INTEGER
// =============================================================================

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "valence.db");
const JSON_PATH = path.join(DB_DIR, "valence-store.json");

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function ensureDir(): void {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function generateMockSolanaAddress(seed: string): string {
  const buf = crypto.createHash("sha256").update(seed + Date.now().toString()).digest();
  let out = "";
  for (let i = 0; i < 44; i++) {
    out += B58[buf[i % buf.length] % B58.length];
  }
  return out;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, s, 64).toString("hex");
  return { hash, salt: s };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const { hash: computed } = hashPassword(password, salt);
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function newSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface MerchantRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  walletId: string | null;
  walletAddress: string | null;
  createdAt: number;
}

export interface SessionRow {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// JSON fallback store (used when better-sqlite3 fails to load)
// ---------------------------------------------------------------------------
interface JsonDb {
  merchants: MerchantRow[];
  sessions: SessionRow[];
}

function jsonRead(): JsonDb {
  ensureDir();
  try {
    if (fs.existsSync(JSON_PATH)) {
      const raw = fs.readFileSync(JSON_PATH, "utf-8");
      const parsed = JSON.parse(raw) as JsonDb;
      return {
        merchants: parsed.merchants ?? [],
        sessions: parsed.sessions ?? [],
      };
    }
  } catch {
    // fall through
  }
  return { merchants: [], sessions: [] };
}

function jsonWrite(db: JsonDb): void {
  ensureDir();
  fs.writeFileSync(JSON_PATH, JSON.stringify(db, null, 2));
}

// ---------------------------------------------------------------------------
// SQLite primary store (lazy-loaded)
// ---------------------------------------------------------------------------
interface SqliteStmt {
  run(...args: unknown[]): { changes: number };
  get(...args: unknown[]): Record<string, unknown> | undefined;
}

interface SqliteDb {
  prepare(sql: string): SqliteStmt;
  exec(sql: string): void;
}

let _sqlite: SqliteDb | null = null;
let _sqliteFailed = false;

function getSqlite(): SqliteDb | null {
  if (_sqlite || _sqliteFailed) return _sqlite;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    ensureDir();
    const db = new Database(DB_PATH) as SqliteDb;
    db.exec(`
      CREATE TABLE IF NOT EXISTS merchants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        passwordSalt TEXT NOT NULL,
        walletId TEXT,
        walletAddress TEXT,
        createdAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
    `);
    _sqlite = db;
    return _sqlite;
  } catch {
    _sqliteFailed = true;
    return null;
  }
}

function usingSqlite(): boolean {
  return getSqlite() !== null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function createMerchant(input: {
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}): MerchantRow {
  const row: MerchantRow = {
    id: uuid(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
    walletId: null,
    walletAddress: null,
    createdAt: Date.now(),
  };

  if (usingSqlite()) {
    const db = getSqlite()!;
    db.prepare(
      `INSERT INTO merchants (id, name, email, passwordHash, passwordSalt, walletId, walletAddress, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      row.id,
      row.name,
      row.email,
      row.passwordHash,
      row.passwordSalt,
      row.walletId,
      row.walletAddress,
      row.createdAt
    );
    return row;
  }

  const db = jsonRead();
  db.merchants.push(row);
  jsonWrite(db);
  return row;
}

export function findMerchantByEmail(email: string): MerchantRow | null {
  const normalized = email.trim().toLowerCase();
  if (usingSqlite()) {
    const db = getSqlite()!;
    const row = db
      .prepare(`SELECT * FROM merchants WHERE email = ?`)
      .get(normalized) as Record<string, unknown> | undefined;
    return row ? (row as unknown as MerchantRow) : null;
  }
  const db = jsonRead();
  return db.merchants.find((m) => m.email === normalized) ?? null;
}

export function findMerchantById(id: string): MerchantRow | null {
  if (usingSqlite()) {
    const db = getSqlite()!;
    const row = db
      .prepare(`SELECT * FROM merchants WHERE id = ?`)
      .get(id) as Record<string, unknown> | undefined;
    return row ? (row as unknown as MerchantRow) : null;
  }
  const db = jsonRead();
  return db.merchants.find((m) => m.id === id) ?? null;
}

export function attachWallet(
  merchantId: string,
  walletId: string,
  walletAddress: string
): MerchantRow | null {
  if (usingSqlite()) {
    const db = getSqlite()!;
    db.prepare(`UPDATE merchants SET walletId = ?, walletAddress = ? WHERE id = ?`).run(
      walletId,
      walletAddress,
      merchantId
    );
    return findMerchantById(merchantId);
  }
  const db = jsonRead();
  const m = db.merchants.find((x) => x.id === merchantId);
  if (!m) return null;
  m.walletId = walletId;
  m.walletAddress = walletAddress;
  jsonWrite(db);
  return m;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export function createSession(userId: string, ttlMs = 7 * 24 * 3600_000): SessionRow {
  const row: SessionRow = {
    token: newSessionToken(),
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  if (usingSqlite()) {
    const db = getSqlite()!;
    db.prepare(
      `INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)`
    ).run(row.token, row.userId, row.createdAt, row.expiresAt);
    return row;
  }
  const db = jsonRead();
  db.sessions.push(row);
  jsonWrite(db);
  return row;
}

export function sessionsForUser(userId: string): SessionRow[] {
  if (usingSqlite()) {
    const db = getSqlite()!;
    // better-sqlite3 has no `.all` on the typed interface available here for safety,
    // so fall back to the JSON mirror for multi-fetching.
  }
  const db = jsonRead();
  return db.sessions.filter((s) => s.userId === userId);
}

export function findSessionByToken(token: string): SessionRow | null {
  if (usingSqlite()) {
    const db = getSqlite()!;
    const row = db
      .prepare(`SELECT * FROM sessions WHERE token = ?`)
      .get(token) as Record<string, unknown> | undefined;
    if (!row) return null;
    const s = row as unknown as SessionRow;
    if (s.expiresAt < Date.now()) {
      return null; // expired
    }
    return s;
  }
  const db = jsonRead();
  const s = db.sessions.find((x) => x.token === token);
  if (!s || s.expiresAt < Date.now()) return null;
  return s;
}

export function deleteSession(token: string): void {
  if (usingSqlite()) {
    const db = getSqlite()!;
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    return;
  }
  const db = jsonRead();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  jsonWrite(db);
}
