# Coach IA et analyse photo — mise en service

Mon Suivi utilise **Mistral AI** (offre gratuite « Experiment ») via deux fonctions Vercel :
`api/coach.js` (coach bien-être) et `api/photo.js` (photo d’un repas → plat, ingrédients, calories, nutriments).

## Activer (une seule fois, 10 minutes)

1. Créer un compte sur https://console.mistral.ai (offre gratuite, sans carte bancaire), puis **API Keys → Create new key**. Copier la clé.
2. Sur https://vercel.com, ouvrir le projet *mon-suivi* → **Settings → Environment Variables** → ajouter :
   - `MISTRAL_API_KEY` = la clé (cocher Production, Preview, Development).
3. **Deployments → ⋯ → Redeploy** pour que la clé soit prise en compte.
4. Dans la console Mistral, ouvrir les paramètres de confidentialité de l’organisation et **désactiver l’utilisation des données pour l’entraînement** si l’option est proposée (offre gratuite).

Ne jamais coller la clé dans le code, dans GitHub ni dans une conversation.

## Réglages facultatifs (même écran Vercel)

| Variable | Rôle | Défaut |
|---|---|---|
| `AI_ENABLED` | `false` coupe coach et photo immédiatement | activé si la clé existe |
| `PHOTO_ENABLED` | `false` coupe seulement la photo | activé |
| `COACH_DAILY_LIMIT` | questions par jour pour tout le site | 100 |
| `PHOTO_DAILY_LIMIT` | photos par jour pour tout le site | 30 |
| `AI_MODEL` | modèle Mistral | `mistral-small-latest` |
| `ALLOWED_ORIGINS` | autre domaine autorisé (ex. un nom de domaine perso) | — |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | compteur partagé plus strict | compteur en mémoire |

## Protections en place

- Accord explicite avant chaque photo, et avant la première question au coach (révocable dans l’écran du coach).
- Résumé du suivi envoyé au coach seulement si la case est cochée ; le prénom n’est jamais envoyé.
- Garde-fous du coach : pas de diagnostic ni de dose, pas de régime extrême ni de jeûne, orientation vers un professionnel et les urgences si besoin.
- Réponses de l’IA échappées (aucun HTML exécuté), appels réservés au site (en-tête Origin), taille limitée, quota journalier et limite par minute.
- Rien n’est stocké côté serveur ; Mistral conserve les échanges d’API jusqu’à 30 jours (anti-abus).

L’offre gratuite de Mistral a ses propres limites de débit : au-delà, l’app affiche « limite atteinte, réessaie demain » ; rien n’est facturé.
