# V4 — Phase 2, premier lot à examiner

La phase 1 avec l’icône chat est publiée séparément. Cette branche ne modifie pas la production.

## Disponible
- 42 recettes conservées, dont 24 classées ivoiriennes ; 15 catégories d’alternatives conservées.
- Photographies locales pour 18 recettes et plusieurs catégories/alternatives.
- Crédits, liens vers les sources et licences dans les fiches et PHOTOS_CREDITS.md.
- Repère « Photo à venir » pour les visuels non validés ; secours local en cas d’image introuvable.
- Favoris conservés dans le suivi local et inclus dans les exports JSON.
- Recherche par plusieurs mots, temps maximal et ingrédient à écarter.
- Portions réglables de 1 à 6 personnes ; les unités cru/cuit restent celles de la recette.
- Préparation sous forme d’étapes et préparations des alternatives.
- Reprise des cinq derniers repas distincts, modifiable avant enregistrement explicite.
- Photos déjà consultées mises en cache hors ligne avec une limite de 100 entrées.

## Validation
Tests locaux sur Edge via Playwright aux largeurs 320, 393 et 430 px :
favoris après rechargement, préservation des anciennes entrées, portions,
filtres, reprise d’un repas sans ajout automatique, image du kédjénou et
secours en cas d’erreur. Tests existants et test PWA également exécutés.
L’essai sur un iPhone physique reste nécessaire.

## À compléter avant de considérer toute la phase 2 terminée
- Trouver et examiner les photographies manquantes, pour chaque recette et alternative.
  Une recherche automatique ne garantit pas la correspondance : plusieurs résultats
  Wikimedia ont été rejetés après examen (ex. danse garba, plats différents, illustrations).
- Relecture culinaire détaillée de toutes les recettes ; la préparation actuelle a été
  structurée, mais ne constitue pas encore une réécriture complète des 42 recettes.
- Tester Safari et la PWA sur l’iPhone de l’utilisatrice, notamment les dialogues longs.
- Confirmer visuellement le premier lot avant fusion et publication.

Le filtre d’ingrédients est textuel et ne garantit pas l’absence d’allergènes.
Les valeurs nutritionnelles ne sont pas inventées. Aucune IA ni compte n’a été activé.
