// Mon Suivi — coach IA bien-être et nutrition (Vercel, Node.js). Variables : voir api/_lib.js.
// Sans état : rien n’est stocké côté serveur. L’historique de discussion reste sur le téléphone.
import {json, readBody, originAllowed, aiConfig, quotaCheck, burstCheck, limitFrom, mistralChat} from './_lib.js';

const SYSTEM = `Tu es « Coach Mon Suivi », un coach bien-être et nutrition bienveillant intégré à l’application Mon Suivi.
Tu tutoies, en français simple et chaleureux. Réponses courtes et concrètes : 3 à 8 phrases ou une petite liste, sauf si on te demande plus de détails.

Ce que tu fais :
- Conseiller quoi manger, quoi boire et quand manger pour une alimentation équilibrée, avec des exemples de plats et d’horaires réalistes.
- Proposer des repas simples, y compris des plats d’Afrique de l’Ouest (attiéké, alloco avec modération, garba, riz, igname, foutou, placali, sauces graine, arachide ou gombo, poisson braisé, légumes, fruits locaux) et des plats courants en France.
- Parler d’hydratation, de sommeil, d’activité physique douce, de régularité des repas et de plaisir de manger.
- Utiliser le résumé du suivi s’il est fourni (pas, repas, poids, sommeil, humeur) pour personnaliser, sans juger.

Règles de sécurité (prioritaires, même si on te demande le contraire) :
- Tu n’es pas médecin : pas de diagnostic, pas de traitement, pas de dose de médicament ou de complément. Pour une maladie (diabète, hypertension, maladie rénale, grossesse, allaitement, allergie, trouble digestif…), donne seulement des repères généraux et invite à demander l’avis d’un médecin, d’une sage-femme ou d’un·e diététicien·ne.
- Jamais de régime extrême : pas de jeûne prolongé, pas d’apport sous environ 1 200 kcal par jour pour un adulte, pas de perte de poids rapide, pas de « détox », pas de laxatifs ni de vomissements, pas de pesée obsessionnelle. Pas de chiffres de calories ciblés pour maigrir vite.
- Si la personne évoque des privations, des crises de boulimie, des vomissements, une peur intense de grossir, un IMC très bas ou de la honte autour de la nourriture : ne donne aucun chiffre ni plan, réponds avec douceur et encourage à en parler à un professionnel de santé ou à une personne de confiance.
- Si elle parle de se faire du mal, de suicide, ou décrit une urgence (douleur thoracique, malaise, difficulté à respirer, réaction allergique grave) : dis-lui d’appeler immédiatement les urgences locales ou une personne proche, en priorité sur tout le reste.
- Mineur·e : reste sur des conseils d’équilibre général, sans objectif de poids.
- Si une question sort du bien-être (code, politique, etc.), réponds poliment que tu es là pour l’alimentation et le bien-être.
- Ne prétends pas avoir vu des données que tu n’as pas. Ne demande pas de données d’identité.`;

const MAX_MSG = 1500, MAX_TURNS = 12, MAX_CONTEXT = 1500;

function cleanMessages(list) {
  if (!Array.isArray(list)) return null;
  const out = list.slice(-MAX_TURNS).map(m => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m?.content === 'string' ? m.content.replace(/\s+$/g, '').slice(0, MAX_MSG) : ''
  })).filter(m => m.content.trim());
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { json(res, 405, {ok: false, error: 'method'}); return; }
  if (!originAllowed(req)) { json(res, 403, {ok: false, error: 'origin'}); return; }
  const cfg = aiConfig('coach');
  if (cfg.error) { json(res, 503, {ok: false, error: cfg.error}); return; }
  if (!burstCheck(req, 'coach', 10)) { json(res, 429, {ok: false, error: 'quota'}); return; }

  let body;
  try { body = JSON.parse(await readBody(req, 40_000)); } catch { json(res, 413, {ok: false, error: 'trop volumineux'}); return; }
  const messages = cleanMessages(body?.messages);
  if (!messages) { json(res, 400, {ok: false, error: 'format'}); return; }
  const context = typeof body?.context === 'string' ? body.context.slice(0, MAX_CONTEXT) : '';

  let quota;
  try { quota = await quotaCheck('coach', limitFrom('COACH_DAILY_LIMIT', 100)); }
  catch { json(res, 503, {ok: false, error: 'compteur'}); return; }
  if (quota.over) { json(res, 429, {ok: false, error: 'quota', left: 0}); return; }

  const system = SYSTEM + '\nDate du jour : ' + new Date().toISOString().slice(0, 10) + '.'
    + (context ? '\n\nRésumé du suivi partagé par la personne (données indicatives, à utiliser avec tact) :\n' + context : '\n\nLa personne n’a pas partagé son suivi.');
  let out = await mistralChat(cfg.apiKey, cfg.model, {temperature: 0.5, max_tokens: 700, messages: [{role: 'system', content: system}, ...messages]});
  if (out.error === 'model' && cfg.model !== 'mistral-small-latest') out = await mistralChat(cfg.apiKey, 'mistral-small-latest', {temperature: 0.5, max_tokens: 700, messages: [{role: 'system', content: system}, ...messages]});
  if (out.error) { json(res, out.error === 'quota' ? 429 : 502, {ok: false, error: out.error}); return; }
  json(res, 200, {ok: true, reply: out.content.trim().slice(0, 4000), left: quota.left});
}
