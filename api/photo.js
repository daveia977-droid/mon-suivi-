// Mon Suivi — fonction photo (Vercel Hobby, Node.js runtime).
// Analyse une photo de repas via Mistral AI (free mode). Zéro stockage : la fonction
// est sans état, l'image n'est ni journalisée ni persistée côté application.
//
// Variables d'environnement (jamais dans le code, jamais dans le chat) :
//   MISTRAL_API_KEY            — clé free mode (console Mistral, sans carte)
//   UPSTASH_REDIS_REST_URL     — URL REST de la base Upstash gratuite (compteur)
//   UPSTASH_REDIS_REST_TOKEN   — token REST Upstash
//   PHOTO_DAILY_LIMIT          — plafond journalier (défaut : 20)
//   PHOTO_ENABLED              — 'false' coupe la fonction photo sans toucher au front
//   PHOTO_MODEL                — modèle vision (défaut : mistral-small-latest, repli mistral-medium-latest)
//
// Confidentialité : entrées/sorties API conservées par Mistral jusqu'à 30 jours
// glissants (surveillance anti-abus) avant suppression — disclosed dans l'app.

const MAX_BASE64 = 1_100_000; // ~0,8 Mo d'image une fois décodée, payload total < 1 Mo
const DEFAULT_LIMIT = 20;
const PHOTO_PROMPT = 'Tu es un estimateur nutritionnel prudent. Cette photo montre un repas ou un aliment. Réponds uniquement en JSON valide : {"name":"nom court du plat en français","kcal100g": calories pour 100 g si estimable sinon null,"grams": poids estimé de la portion photographiée en grammes,"confidence":"haute|moyenne|faible"}. En cas de doute, préfère une estimation prudente (valeur basse plausible) et une confiance "faible".';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function sanitizeAI(v) {
  const name = typeof v?.name === 'string' && v.name.trim() ? v.name.trim().slice(0, 150) : 'Repas photographié';
  const kcal = Number(v?.kcal100g);
  const grams = Number(v?.grams);
  return {
    name,
    kcal100g: Number.isFinite(kcal) && kcal >= 0 && kcal <= 900 ? Math.round(kcal) : null,
    grams: Number.isFinite(grams) && grams >= 1 && grams <= 3000 ? Math.round(grams) : null,
    confidence: ['haute', 'moyenne', 'faible'].includes(v?.confidence) ? v.confidence : 'faible'
  };
}

// Compteur quotidien atomique : INCR Redis résiste aux appels simultanés.
// Fail-closed : Upstash injoignable => photo refusée (jamais de comptage approximatif).
async function quotaCheck(url, token, limit) {
  const key = 'photo:' + new Date().toISOString().slice(0, 10);
  const headers = { Authorization: 'Bearer ' + token };
  const incr = await fetch(url + '/incr/' + encodeURIComponent(key), { method: 'POST', headers });
  if (!incr.ok) throw new Error('counter');
  const counted = await incr.json();
  const n = Number(counted.result);
  if (!Number.isInteger(n) || n < 1) throw new Error('counter');
  if (n === 1) {
    // Le compteur du jour expire de lui-même (26 h > 24 h, marge de fuseaux).
    await fetch(url + '/expire/' + encodeURIComponent(key) + '/93600', { method: 'POST', headers }).catch(() => {});
  }
  return { n, left: Math.max(0, limit - n) };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > 1_200_000) { reject(new Error('trop volumineux')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function mistralAnalyze(apiKey, model, dataUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PHOTO_PROMPT },
            { type: 'image_url', image_url: dataUrl }
          ]
        }]
      })
    });
    if (r.status === 404 || r.status === 400) return { error: 'model' };
    if (!r.ok) return { error: 'mistral' };
    const d = await r.json();
    const raw = d?.choices?.[0]?.message?.content;
    if (!raw) return { error: 'mistral' };
    const parsed = JSON.parse(raw);
    return { result: sanitizeAI(parsed) };
  } catch (err) {
    return { error: err?.name === 'AbortError' ? 'timeout' : 'mistral' };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { json(res, 405, { ok: false, error: 'method' }); return; }

  if (process.env.PHOTO_ENABLED === 'false') { json(res, 503, { ok: false, error: 'disabled' }); return; }
  const apiKey = process.env.MISTRAL_API_KEY, upUrl = process.env.UPSTASH_REDIS_REST_URL, upToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!apiKey || !upUrl || !upToken) { json(res, 503, { ok: false, error: 'config' }); return; }

  let body;
  try { body = JSON.parse(await readBody(req)); } catch { json(res, 413, { ok: false, error: 'trop volumineux' }); return; }

  const dataUrl = typeof body?.image === 'string' ? body.image : '';
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) { json(res, 400, { ok: false, error: 'format' }); return; }
  if (dataUrl.length > MAX_BASE64) { json(res, 413, { ok: false, error: 'trop volumineux' }); return; }

  const limit = Number(process.env.PHOTO_DAILY_LIMIT) > 0 ? Math.round(Number(process.env.PHOTO_DAILY_LIMIT)) : DEFAULT_LIMIT;
  let quota;
  try { quota = await quotaCheck(upUrl, upToken, limit); }
  catch { json(res, 503, { ok: false, error: 'compteur' }); return; }
  if (quota.n > limit) { json(res, 429, { ok: false, error: 'quota', left: 0 }); return; }

  const model = process.env.PHOTO_MODEL || 'mistral-small-latest';
  const first = await mistralAnalyze(apiKey, model, dataUrl);
  let outcome = first;
  if (first.error === 'model') {
    // Repli documenté : mistral-medium-latest si le modèle par défaut est indisponible.
    outcome = model === 'mistral-medium-latest'
      ? { error: 'model' }
      : await mistralAnalyze(apiKey, 'mistral-medium-latest', dataUrl);
  }
  if (outcome.error) { json(res, 502, { ok: false, error: outcome.error }); return; }
  json(res, 200, { ok: true, ...outcome.result, left: quota.left });
}
