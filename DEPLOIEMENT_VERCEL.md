# Déploiement Vercel — Mon Suivi (0 €, sans carte)

Guide pas à pas pour Dave. **Règle d'or : aucune carte bancaire n'est jamais saisie, nulle part.**

## 1. Créer le compte Vercel (sans carte)

1. https://vercel.com → Sign Up → Continue with GitHub (autoriser l'accès au repo `daveia977-droid/mon-suivi-`).
2. Aucune carte demandée à l'inscription. Le plan Hobby est gratuit et non facturable : quota atteint = service en pause, jamais de prélèvement.

## 2. Importer le dépôt

1. Add New → Project → importer `mon-suivi-`.
2. Framework Preset : **Other** (site statique + fonction). Aucun build, aucune commande.
3. Ne rien changer d'autre pour l'instant, Deploy. L'app est servie en statique ; la fonction `api/photo.js` est détectée automatiquement.

## 3. Créer la clé Mistral (free mode, sans carte)

1. https://console.mistral.ai → compte (vérification par téléphone, pas de carte).
2. **Admin Panel → Privacy → désactiver « Anonymous improvement data »** (empêche l'entraînement sur les données ; indépendant du réglage Vibe).
3. Vérifier dans **Admin Panel → Limits** que `mistral-small-latest` est actif en free mode. Sinon, noter le modèle vision disponible et le mettre dans la variable `PHOTO_MODEL` (étape 5).
4. API Keys → Create new key. **Ne jamais partager cette clé** (ni dans le chat, ni dans le code, ni dans GitHub).

## 4. Créer la base Upstash Redis (gratuite, sans carte)

1. https://upstash.com → Continue with GitHub.
2. Create Database → région UE (par ex. eu-central-1) → plan Free (500 000 commandes/mois).
3. **Ne jamais ajouter de carte** : c'est l'ajout d'une carte qui basculerait la base en payant.
4. Noter l'URL REST (`https://...upstash.io`) et le token REST. Jamais dans le code ni le chat.

## 5. Variables d'environnement Vercel

Project → Settings → Environment Variables :

| Nom | Valeur |
|---|---|
| `MISTRAL_API_KEY` | la clé de l'étape 3 |
| `UPSTASH_REDIS_REST_URL` | l'URL REST de l'étape 4 |
| `UPSTASH_REDIS_REST_TOKEN` | le token REST de l'étape 4 |
| `PHOTO_DAILY_LIMIT` | `20` (facultatif — défaut 20) |
| `PHOTO_ENABLED` | `true` (mettre `false` coupe la photo sans toucher au front) |
| `PHOTO_MODEL` | `mistral-small-latest` (facultatif — repli automatique sur mistral-medium-latest) |

Redeploy après ajout (Deployments → … → Redeploy).

## 6. Test GO/NO-GO photo (obligatoire avant validation)

1. Ouvrir l'URL Vercel sur l'iPhone.
2. Repas → Ajouter → onglet Photo → prendre une vraie photo de repas → consentement → Analyser.
3. Consigner honnêtement : qualité de l'estimation (± combien ?), délai de réponse, comportement au quota, erreurs.
4. Si les résultats sont mauvais : Settings → `PHOTO_ENABLED=false` → Redeploy. L'app reste 100 % utile sans photo.

## Garanties zéro euro

- **Vercel Hobby** : sans carte = jamais facturable. Bande passante 100 Go/mois, fonctions 300 s max (Fluid Compute).
- **Mistral free mode** : sans carte = non facturable ; limite atteinte = erreur 429, c'est tout.
- **Upstash** : sans carte = plan Free, arrêt net à 500 000 commandes/mois.
- **Aucun service n'a de moyen de paiement** : aucune bascule automatique vers un plan payant n'est possible.
