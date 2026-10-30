# Mon Suivi V4 — Phase 2

Branche de travail séparée de la phase 1 publiée. La version de production est conservée tant que cette phase n’est pas validée.

## Réalisé
- 42 recettes conservées, dont 24 classées ivoiriennes, avec quatre étapes spécifiques chacune.
- 15 catégories d’alternatives conservées ; chaque proposition possède une préparation et des quantités indicatives pour une personne.
- 52 photographies distinctes sous licence vérifiée, conservées localement, couvrant 29 recettes et plusieurs alternatives.
- Crédits complets dans les fiches et PHOTOS_CREDITS.md ; secours explicite si une image manque.
- Favoris persistants, recherche avec ou sans accents/ligatures, filtres par durée et ingrédients à écarter.
- Portions de 1 à 6 personnes ; les quarts ne sont plus arrondis au dixième.
- Reprise des repas récents, avec correction et enregistrement explicite.
- Conservation des données locales, export/import des favoris et cache des photos déjà consultées.

## Vérification
Tests smoke, PWA et parcours mobiles Edge/Playwright aux largeurs 320, 393 et 430 px. Les essais sur un iPhone physique restent nécessaires.

## Limites
- 13 recettes conservent un repère « Photo à venir » : voir PHOTOS_A_COMPLETER.md. Certaines alternatives sont également en attente d’une photo fidèle.
- Les photographies montrent des exemples de présentation, et non une mesure des ingrédients ou des calories de la recette.
- Les préparations sont des propositions maison ; les temps sont indicatifs et les variantes familiales restent possibles.
- Le filtre d’ingrédients est textuel et ne garantit pas l’absence d’allergènes.
- Aucun compte, abonnement, service IA ou synchronisation Santé supplémentaire n’est activé.

## Essai sur iPhone
Ouvrir la préversion avec son compte Vercel, créer un espace de test, ouvrir Repas, consulter une recette, choisir plusieurs personnes, enregistrer un favori puis recharger. Vérifier les alternatives et reprendre un repas récent. Le stockage de la préversion est séparé du site de production ; ne pas effacer les données du site actuel.
