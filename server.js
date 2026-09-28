// ==================== СЕРВЕР ФАРМНАВИГАТОРА ====================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'node:fs';
import { Agent } from 'node:https';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createUser, findUserByEmail, findUserById, loadUserData, saveUserData } from './database.js';
import { hashPassword, checkPassword, createToken, authMiddleware } from './auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

// HTTPS-агент с сертификатом Минцифры
const httpsAgent = new Agent({
  ca: fs.readFileSync(path.join(__dirname, 'certs', 'russian_trusted_root_ca.cer'))
});

// ==================== ТОКЕН GIGACHAT ====================
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;

  const res = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'RqUID': randomUUID(),
      'Authorization': `Basic ${process.env.GIGACHAT_AUTH_KEY}`
    },
    body: new URLSearchParams({
      scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS'
    }).toString(),
    agent: httpsAgent
  });

  if (!res.ok) throw new Error(`Токен: ${res.status} — ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = data.expires_at * 1000;
  console.log('🔑 Токен GigaChat получен');
  return cachedToken;
}

// ==================== ВЫБОР МОДЕЛИ ====================
async function getAvailableModels() {
  try {
    const token = await getAccessToken();
    const res = await fetch('https://api.giga.chat/v1/models', {
      headers: { 'Authorization': `Bearer ${token}` },
      agent: httpsAgent
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data && Array.isArray(data.data) ? data.data.map(m => m.id) : [];
  } catch { return []; }
}

const MODEL_CANDIDATES = [
  'GigaChat-Pro', 'GigaChat-2-Pro', 'GigaChat-2',
  'GigaChat-2-Max', 'GigaChat-Max', 'GigaChat-Lite', 'GigaChat'
];

async function pickWorkingModel() {
  const available = await getAvailableModels();
  if (available.length > 0) {
    for (const c of MODEL_CANDIDATES) {
      if (available.includes(c)) {
        console.log(`✅ Модель: ${c}`);
        return c;
      }
    }
    return available[0];
  }
  return 'GigaChat-Pro';
}

let selectedModel = null;
async function getModel() {
  if (!selectedModel) selectedModel = await pickWorkingModel();
  return selectedModel;
}

// ==================== РЕГИСТРАЦИЯ ====================
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name = '' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Неверный формат email' });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Такой email уже зарегистрирован' });
    }

    const passwordHash = await hashPassword(password);
    const userId = createUser(email, passwordHash, name);
    const token = createToken(userId);

    console.log(`👤 Новый пользователь: ${email}`);
    res.json({
      token,
      user: { id: userId, email, name }
    });
  } catch (err) {
    console.error('❌ Ошибка регистрации:', err.message);
    res.status(500).json({ error: 'Ошибка регистрации', details: err.message });
  }
});

// ==================== ВХОД ====================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const valid = await checkPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = createToken(user.id);

    console.log(`🔓 Вход: ${email}`);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('❌ Ошибка входа:', err.message);
    res.status(500).json({ error: 'Ошибка входа', details: err.message });
  }
});

// ==================== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ====================
app.get('/api/me', authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, city: user.city }
  });
});

// ==================== ВЫХОД ====================
app.post('/api/logout', authMiddleware, (req, res) => {
  // JWT — на клиенте просто удаляется токен
  res.json({ ok: true });
});

// ==================== СИНХРОНИЗАЦИЯ ====================
app.get('/api/sync', authMiddleware, (req, res) => {
  try {
    const data = loadUserData(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки', details: err.message });
  }
});

app.post('/api/sync', authMiddleware, (req, res) => {
  try {
    const { kit, profile, chatHistory } = req.body;
    saveUserData(req.userId, { kit, profile, chatHistory });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сохранения', details: err.message });
  }
});

// ==================== ИИ-ЧАТ ====================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, kit = [], history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Пустое сообщение' });

    const token = await getAccessToken();
    const model = await getModel();

    const kitList = kit.length
      ? kit.map(i => `- ${i.name}${i.purpose ? ` (${i.purpose})` : ''}${i.quantity ? `, ${i.quantity} шт.` : ''}`).join('\n')
      : 'аптечка пока пуста';

    const systemPrompt = `Ты — Гиги, цифровой медицинский ассистент приложения «ФармНавигатор». Ты — робо-девушка: умная, спокойная, доброжелательная.

ХАРАКТЕР:
- Добрая и позитивная, но БЕЗ приторности. Никаких "солнышко", "зайка".
- Спокойный профессионал. Как семейный врач, который не устаёт помогать.
- Не боишься НИКАКИХ тем. Интимные вопросы, потенция, зппп, контрацепция, психика — это медицина.
- Не осуждаешь. Никогда.
- Хочешь помочь всем и всегда.

СТИЛЬ:
- Обращение на «вы». Уважительно.
- 2-4 предложения. Простые слова.
- Эмодзи умеренно: 0-1 за сообщение.

Аптечка пользователя:
${kitList}

ПРАВИЛА:
1. Если лекарство есть в аптечке — скажи об этом.
2. Если нет — предложи с ценой и аналогом.
3. Рецептурные — только через врача.
4. Опасные симптомы — врач (103).

ОСОБЫЕ ТЕМЫ: потенция, зппп, психика, геморрой — отвечай спокойно и по делу.

ВАЖНО: Отвечай СТРОГО в формате JSON без markdown:
{
  "answer": "твой ответ в стиле Гиги",
  "drug": {
    "name": "Название",
    "activeIngredient": "Вещество",
    "description": "Что лечит",
    "price": 150,
    "analogs": [{"name": "Аналог", "price": 100}]
  }
}

Если лекарство не нужно — { "answer": "ответ", "drug": null }`;

    const messages = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach(h => {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.giga.chat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 700
      }),
      agent: httpsAgent
    });

    if (!response.ok) throw new Error(`GigaChat: ${response.status} — ${await response.text()}`);

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); }
        catch { parsed = { answer: parsed, drug: null }; }
      }
      if (!parsed.answer && !parsed.drug) parsed = { answer: content, drug: null };
    } catch {
      const m = content.match(/\{[\s\S]*"answer"[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); }
        catch { parsed = { answer: content, drug: null }; }
      } else {
        parsed = { answer: content, drug: null };
      }
    }

    res.json(parsed);
  } catch (err) {
    console.error('❌ Ошибка ИИ:', err.message);
    res.status(500).json({ error: 'Ошибка ИИ', details: err.message });
  }
});

// ==================== ЗАПУСК ====================
app.listen(PORT, async () => {
  console.log('');
  console.log('🚀 Сервер ФармНавигатора запущен!');
  console.log(`   Открыть сайт: http://localhost:${PORT}/index.html`);
  console.log('   Нажмите Ctrl+C чтобы остановить.');
  console.log('');

  await getModel();
});