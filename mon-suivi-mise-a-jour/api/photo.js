// Mon Suivi — analyse d’une photo de repas (Vercel, Node.js). Variables : voir api/_lib.js.
// Sans état : l’image n’est ni journalisée ni stockée par l’application. Mistral conserve les échanges d’API
// jusqu’à 30 jours (surveillance anti-abus) : c’est indiqué à l’utilisatrice avant chaque envoi.
import {json, readBody, originAllowed, aiConfig, quotaCheck, burstCheck, limitFrom, mistralChat} from './_lib.js';

const MAX_BASE64 = 1_100_000; // ~0,8 Mo d’image décodée
const PHOTO_PROMPT = 'Tu es un estimateur nutritionnel prudent. La photo montre un repas, une boisson ou un aliment, parfois un plat africain (attiéké, alloco, garba, foutou, placali, kedjenou, riz sauce graine, pâte, akassa, igname pilée…). '
  + 'Réponds UNIQUEMENT en JSON valide, en français : {"name":"nom court du plat","items":[{"name":"ingrédient visible","grams":poids estimé}],'
  + '"grams":poids total estimé de la portion,"kcal100g":calories pour 100 g,"protein":protéines g/100 g,"carbs":glucides g/100 g,"fat":lipides g/100 g,'
  + '"fiber":fibres g/100 g,"sugar":sucres g/100 g,"tip":"un conseil bienveillant d’une phrase pour équilibrer ce repas, sans culpabiliser","confidence":"haute|moyenne|faible"}. '
  + 'Si ce n’est pas de la nourriture, renvoie {"name":"Aucun aliment reconnu","items":[],"grams":null,"kcal100g":null,"confidence":"faible"}. '
  + 'En cas de doute sur une valeur, mets null plutôt que d’inventer. Ne donne jamais d’avis médical.';

function sanitizeAI(v) {
  const num = (x, lo, hi, dec) => { if (x === null || x === undefined || x === '') return null; const n = Number(x); if (!Number.isFinite(n) || n < lo || n > hi) return null; const f = Math.pow(10, dec || 0); return Math.round(n * f) / f; };
  const text = (x, max) => typeof x === 'string' && x.trim() ? x.trim().replace(/\s+/g, ' ').slice(0, max) : '';
  const name = text(v?.name, 150) || 'Repas photographié';
  const items = Array.isArray(v?.items) ? v.items.slice(0, 12).map(i => ({name: text(i?.name, 60), grams: num(i?.grams, 1, 3000, 0)})).filter(i => i.name) : [];
  return {
    name,
    items,
    kcal100g: num(v?.kcal100g, 0, 900, 0),
    grams: num(v?.grams, 1, 3000, 0),
    protein: num(v?.protein, 0, 100, 1),
    carbs: num(v?.carbs, 0, 100, 1),
    fat: num(v?.fat, 0, 100, 1),
    fiber: num(v?.fiber, 0, 100, 1),
    sugar: num(v?.sugar, 0, 100, 1),
    tip: text(v?.tip, 220),
    confidence: ['haute', 'moyenne', 'faible'].includes(v?.confidence) ? v.confidence : 'faible'
  };
}

async function analyze(apiKey, model, dataUrl) {
  const out = await mistralChat(apiKey, model, {
    temperature: 0.2,
    max_tokens: 600,
    response_format: {type: 'json_object'},
    messages: [{role: 'user', content: [{type: 'text', text: PHOTO_PROMPT}, {type: 'image_url', image_url: dataUrl}]}]
  }, 60000);
  if (out.error) return out;
  try { return {result: sanitizeAI(JSON.parse(out.content))}; } catch { return {error: 'mistral'}; }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { json(res, 405, {ok: false, error: 'method'}); return; }
  if (!originAllowed(req)) { json(res, 403, {ok: false, error: 'origin'}); return; }
  const cfg = aiConfig('photo');
  if (cfg.error) { json(res, 503, {ok: false, error: cfg.error}); return; }
  if (!burstCheck(req, 'photo', 6)) { json(res, 429, {ok: false, error: 'quota'}); return; }

  let body;
  try { body = JSON.parse(await readBody(req, 1_200_000)); } catch { json(res, 413, {ok: false, error: 'trop volumineux'}); return; }
  const dataUrl = typeof body?.image === 'string' ? body.image : '';
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) { json(res, 400, {ok: false, error: 'format'}); return; }
  if (dataUrl.length > MAX_BASE64) { json(res, 413, {ok: false, error: 'trop volumineux'}); return; }

  let quota;
  try { quota = await quotaCheck('photo', limitFrom('PHOTO_DAILY_LIMIT', 30)); }
  catch { json(res, 503, {ok: false, error: 'compteur'}); return; }
  if (quota.over) { json(res, 429, {ok: false, error: 'quota', left: 0}); return; }

  let outcome = await analyze(cfg.apiKey, cfg.model, dataUrl);
  if (outcome.error === 'model' && cfg.model !== 'mistral-medium-latest') outcome = await analyze(cfg.apiKey, 'mistral-medium-latest', dataUrl);
  if (outcome.error) { json(res, outcome.error === 'quota' ? 429 : 502, {ok: false, error: outcome.error}); return; }
  json(res, 200, {ok: true, ...outcome.result, left: quota.left});
}
