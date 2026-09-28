// ==================== БАЗА ДАННЫХ SQLITE ====================
import DatabaseModule from 'better-sqlite3';
const Database = DatabaseModule.default || DatabaseModule;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Файл БД — рядом с server.js
const db = new Database(path.join(__dirname, 'auth.db'));

// Включаем WAL для скорости
db.pragma('journal_mode = WAL');

// ==================== СОЗДАНИЕ ТАБЛИЦ ====================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT DEFAULT '',
    city TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id INTEGER PRIMARY KEY,
    kit TEXT DEFAULT '[]',
    profile TEXT DEFAULT '{}',
    chat_history TEXT DEFAULT '[]',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('✅ База данных готова');

// ==================== ФУНКЦИИ ====================

/* ---------- Создание пользователя ---------- */
export function createUser(email, passwordHash, name = '') {
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, name, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const now = Date.now();
  const result = stmt.run(email.toLowerCase(), passwordHash, name, now);

  // Создаём пустые данные пользователя
  db.prepare(`
    INSERT INTO user_data (user_id, kit, profile, chat_history, updated_at)
    VALUES (?, '[]', '{}', '[]', ?)
  `).run(result.lastInsertRowid, now);

  return result.lastInsertRowid;
}

/* ---------- Поиск пользователя по email ---------- */
export function findUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase());
}

/* ---------- Поиск пользователя по ID ---------- */
export function findUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

/* ---------- Загрузка данных пользователя ---------- */
export function loadUserData(userId) {
  const stmt = db.prepare('SELECT * FROM user_data WHERE user_id = ?');
  const row = stmt.get(userId);

  if (!row) {
    // Если данных нет — создаём пустые
    db.prepare(`
      INSERT INTO user_data (user_id, kit, profile, chat_history, updated_at)
      VALUES (?, '[]', '{}', '[]', ?)
    `).run(userId, Date.now());

    return { kit: [], profile: {}, chatHistory: [] };
  }

  return {
    kit: JSON.parse(row.kit || '[]'),
    profile: JSON.parse(row.profile || '{}'),
    chatHistory: JSON.parse(row.chat_history || '[]')
  };
}

/* ---------- Сохранение данных пользователя ---------- */
export function saveUserData(userId, { kit, profile, chatHistory }) {
  const current = loadUserData(userId);

  const newKit = kit !== undefined ? JSON.stringify(kit) : JSON.stringify(current.kit);
  const newProfile = profile !== undefined ? JSON.stringify(profile) : JSON.stringify(current.profile);
  const newChat = chatHistory !== undefined ? JSON.stringify(chatHistory) : JSON.stringify(current.chatHistory);

  db.prepare(`
    UPDATE user_data
    SET kit = ?, profile = ?, chat_history = ?, updated_at = ?
    WHERE user_id = ?
  `).run(newKit, newProfile, newChat, Date.now(), userId);
}

export default db;