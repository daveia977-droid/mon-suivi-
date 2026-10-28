# Mon Suivi

Application de bien-être en français pour noter son poids, ses repas, ses pas et son humeur, à son rythme. Conçue pour une utilisation mobile personnelle (iPhone), sans compte en ligne ni abonnement.

> Version 1 « Fusion Premium ». Ce projet ne fournit aucun diagnostic ni promesse de perte de poids. Les calories sont toujours des estimations modifiables.

## Fonctionnalités (V1)

- **Aujourd'hui** : tableau de bord avec « Bonjour ! », poids récent, mini-courbe, pas du jour, humeur en un geste.
- **Poids** : historique, courbe interactive (toucher un point : écart avec la mesure précédente, modifier, supprimer), objectif facultatif en pointillés.
- **Repas** : 4 modes — recherche Open Food Facts, code-barres saisi, photo (estimation IA modifiable), saisie manuelle. Alternatives « même famille » avec Nutri-Score affiché seulement quand la base le fournit.
- **Activité** : pas saisis manuellement (aucune lecture du podomètre — impossible dans une app web iOS), objectif par défaut 6 000 pas/jour personnalisable ou désactivable, anneau de progression, historique.
- **Humeur** : 4 humeurs colorées (À plat, Moyen, Bien, En forme) avec note facultative.
- **Profil** : prénom, unité kg/lb, export/import JSON (version 2), effacement, autorisation photo révocable.
- **Confidentialité** : tout reste dans le navigateur (localStorage) ; rien ne sort sans consentement explicite. Consentement photo distinct, non précoché, révocable.

## Budget : 0 € strict

Aucune carte bancaire nulle part. GitHub (code), GitHub Pages (version de référence), Vercel Hobby (hébergement live + fonction photo), Mistral AI free mode (analyse photo), Upstash Redis gratuit (compteur anti-abus), Open Food Facts (base alimentaire, ODbL) — tous structurellement non facturables : quota atteint = service en pause ou erreur, jamais de prélèvement.

## Fichiers

| Fichier | Rôle |
|---|---|
| index.html | Structure HTML |
| styles.css | Styles Fusion Premium (palette ivoire/rose/jaune/framboise) |
| app.js | Application complète, sans dépendance |
| api/photo.js | Fonction Vercel : analyse photo (clé Mistral en variable d'environnement uniquement) |
| artwork.svg, favicon.svg | Illustration et icône |
| DEPLOIEMENT_VERCEL.md | Guide de déploiement pas à pas (sans carte) |
| REPRISE_MISTRAL.md | Consignes historiques |

## Analyse photo — fonctionnement et limites

1. La photo est compressée dans le navigateur (~768 px, JPEG, < 1 Mo).
2. Après consentement explicite (non précoché, révocable dans Profil), elle est envoyée à la fonction Vercel.
3. La fonction vérifie le compteur quotidien (Upstash Redis, incrément atomique, 20/jour par défaut), appelle Mistral AI et renvoie une estimation prudente.
4. **Fail-closed** : Upstash injoignable → photo refusée, jamais de comptage approximatif. Tout erreur → bascule douce vers la recherche et la saisie manuelle.
5. **Aucun stockage** : la fonction est sans état, l'image n'est ni journalisée ni persistée. Mistral conserve les entrées/sorties d'API jusqu'à 30 jours glissants (surveillance anti-abus) avant suppression — c'est affiché noir sur blanc à l'utilisatrice.

L'estimation IA est un ordre de grandeur (souvent ±30–50 %), toujours modifiable avant enregistrement.

## État des tests — honnêteté radicale

- **Réalisés (simulés, sandbox)** : syntaxe, validation des données, écrans, flux complets repas/pas/poids/humeur, OFF (recherche, code-barres, alternatives, cache), photo (consentement, quota, fail-closed, repli modèle), export/import. 41 + 46 + 10 + 30 + 25 + 22 + 21 = **195 vérifications vertes** au 28/10/2026, avec DOM et réseau simulés.
- **Non réalisés** : test dans un vrai navigateur, sur un vrai iPhone ; appel réel à Open Food Facts et à Mistral avec de vraies photos (porte GO/NO-GO avant activation photo) ; comportement réel du compteur Upstash.

Aucun test matériel n'est revendiqué. La photo ne fonctionne pas sur GitHub Pages (pas de backend) : elle nécessite le déploiement Vercel (voir DEPLOIEMENT_VERCEL.md).

## Limites connues

- Pas de compte, pas de synchronisation multi-appareils (choix assumé).
- Pas de lecture automatique du podomètre : restriction d'Apple pour les applications web ; nécessiterait une app native (Capacitor + compte développeur Apple 99 $/an — hors périmètre).
- Pas de scan de code-barres par caméra (saisie des chiffres).
- localStorage ≈ 5 Mo : les vignettes photo ne sont pas persistées volontairement.
- Textes juridiques en brouillon, à compléter avant publication officielle.

## Références de design

- Maquettes originales du projet (Fusion Premium : maquette 2 dominante, graphiques maquette 1)
- Apple Design — Emil Kowalski ; Mobile Native — Emil Kowalski

Ces références guident le développement ; elles ne constituent pas une affiliation à Apple ni une certification.
