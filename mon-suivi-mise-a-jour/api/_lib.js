// Mon Suivi — outils communs aux fonctions IA (photo, coach). Le préfixe « _ » empêche Vercel d’en faire une route.
//
// Variables d’environnement (Vercel → Settings → Environment Variables, jamais dans le code ni dans le chat) :
//   MISTRAL_API_KEY            — clé Mistral (console.mistral.ai, offre gratuite « Experiment »). Obligatoire.
//   AI_ENABLED                 — 'false' coupe photo et coach sans toucher au code (défaut : activé si la clé existe).
//   PHOTO_DAILY_LIMIT          — photos par jour pour tout le site (défaut : 30).
//   COACH_DAILY_LIMIT          — questions au coach par jour pour tout le site (défaut : 100).
//   AI_MODEL                   — modèle Mistral (défaut : mistral-small-latest, qui lit aussi les images).
//   ALLOWED_ORIGINS            — domaines autorisés en plus de *.vercel.app du projet, séparés par des virgules.
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — facultatif : compteur partagé fiable entre instances.
//     Sans Upstash, un compteur en mémoire (par instance) s’applique : moins strict, mais toujours plafonné.

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

export function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > max) { reject(new Error('trop volumineux')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Refuse les appels venant d’autres sites (le navigateur envoie toujours l’en-tête Origin sur un POST).
export function originAllowed(req) {
  const origin = req.headers?.origin;
  if (!origin) return true; // appel serveur à serveur ou même origine ancienne : le quota reste la protection
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  if (host === req.headers?.host) return true;
  const extra = String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return extra.some(o => { try { return new URL(o).host === host; } catch { return o === host; } });
}

export function aiConfig(kind) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (process.env.AI_ENABLED === 'false') return {error: 'disabled'};
  if (kind === 'photo' && process.env.PHOTO_ENABLED === 'false') return {error: 'disabled'};
  if (!apiKey) return {error: 'config'};
  return {apiKey, model: process.env.AI_MODEL || process.env.PHOTO_MODEL || 'mistral-small-latest'};
}

const memory = new Map();
const ipMemory = new Map();
// Compteur journalier. Upstash si configuré (fiable), sinon mémoire de l’instance.
export async function quotaCheck(kind, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const key = kind + ':' + day;
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  let n;
  if (url && token) {
    const headers = {Authorization: 'Bearer ' + token};
    const incr = await fetch(url + '/incr/' + encodeURIComponent(key), {method: 'POST', headers});
    if (!incr.ok) throw new Error('counter');
    n = Number((await incr.json()).result);
    if (!Number.isInteger(n) || n < 1) throw new Error('counter');
    if (n === 1) await fetch(url + '/expire/' + encodeURIComponent(key) + '/93600', {method: 'POST', headers}).catch(() => {});
  } else {
    for (const k of memory.keys()) if (!k.endsWith(day)) memory.delete(k);
    n = (memory.get(key) || 0) + 1;
    memory.set(key, n);
  }
  return {n, left: Math.max(0, limit - n), over: n > limit};
}

// Limite douce par adresse IP et par minute, contre les rafales (en mémoire de l’instance).
export function burstCheck(req, kind, perMinute) {
  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim();
  const now = Date.now(), key = kind + '|' + ip;
  const list = (ipMemory.get(key) || []).filter(t => now - t < 60000);
  list.push(now);
  ipMemory.set(key, list);
  if (ipMemory.size > 5000) ipMemory.clear();
  return list.length <= perMinute;
}

export function limitFrom(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.round(v) : fallback;
}

export async function mistralChat(apiKey, model, body, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey},
      signal: controller.signal,
      body: JSON.stringify({model, ...body})
    });
    if (r.status === 429) return {error: 'quota'};
    if (r.status === 401 || r.status === 403) return {error: 'config'};
    if (r.status === 404 || r.status === 400) return {error: 'model'};
    if (!r.ok) return {error: 'mistral'};
    const d = await r.json();
    const content = d?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) return {error: 'mistral'};
    return {content};
  } catch (err) {
    return {error: err?.name === 'AbortError' ? 'timeout' : 'mistral'};
  } finally {
    clearTimeout(timer);
  }
}
