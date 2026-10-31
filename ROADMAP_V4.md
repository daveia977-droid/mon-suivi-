# Mon Suivi V4 — état vérifiable

## Réalisé dans la version livrable

- Identité rose/jaune/ivoire et chat fourni ; accueil et navigation flottante.
- 42 recettes (24 classées ivoiriennes), quatre étapes chacune, portions, 15 familles d’alternatives, favoris, recherche et repas récents.
- 52 photos distinctes locales avec crédits et secours. 29 recettes ont une photo validée ; 13 restent à compléter.
- Poids, repas, humeur et pas ; objectifs et encouragements ; bilan sur 7 et 30 jours. Les jours absents ne sont pas assimilés à zéro.
- Rappel d’humeur dans une app ouverte, désactivé par défaut, heure locale modifiable (20 h par défaut), quatre choix explicites, correction et protection contre les doublons.
- Événement Calendrier quotidien à télécharger pour un rappel hors application : import et alerte à confirmer sur iPhone. Le calendrier se modifie séparément ; aucune permission de notification n’est supposée accordée.
- Aperçu photo local sans envoi, sans conservation dans le suivi et sans fausse reconnaissance. Alternatives et saisie nutritionnelle manuelles restent disponibles.
- Mise à jour PWA : détection à l’ouverture/retour au premier plan, message, Mettre à jour / Plus tard, protection des saisies, pas de rechargement automatique des autres onglets.
- Les scripts/styles ont des URL de version et restent disponibles hors ligne ; la migration depuis le comportement de cache précédent est testée.
- Import/export JSON conservé avec favoris, rappel et provenance/horodatage Santé ; clé historique inchangée.
- Phase 3 côté application : aide en trois écrans avec retour à la saisie manuelle, nombre entier borné et date obligatoire, erreurs lisibles, confirmation avant remplacement d’un total manuel différent, horodatage et déduplication quotidienne. Objectif conservé. Installation et lancement conditionnés à un lien iCloud réellement validé.
- Aucun abonnement ni fournisseur IA ajouté ; endpoint photo distant désactivé dans le code même si une ancienne variable d’environnement l’autorisait.

## Partiel / actions extérieures indispensables

1. **Raccourci Apple Santé prêt à installer** : un auteur ayant un iPhone doit le créer/valider puis fournir son vrai lien de partage iCloud. Le contrat est dans APPLE_SANTE.md et health-shortcut-spec.json. Renseigner ensuite v4-config.js. Les boutons d’installation/synchronisation restent désactivés sans lien validé.
2. **Web Push** : non développé/activé, donc aucune promesse d’alerte de la PWA fermée. Le calendrier est l’alternative gratuite, à importer et tester par l’utilisatrice.
3. **IA alimentaire et conseiller IA** : aucun moteur local suffisamment validé sur les plats et l’iPhone cible. Le traitement local a été étudié ; la classification d’un plat ne mesure ni portions ni nutriments. Voir ZERO_EURO.md. Aucun résultat n’est simulé.
4. **Photographies** : les 13 recettes de PHOTOS_A_COMPLETER.md et certaines alternatives demandent encore une photo authentique, pertinente et réutilisable. Le repère esthétique est un secours, pas une photographie du plat.
5. **iPhone physique** : vérifier installation, raccourci, total Santé et sources multiples, calendrier/alertes, permissions, verrouillage, mode hors ligne et mise à jour sans perte de saisie.
6. **Mentions légales** : identité et coordonnées de l’éditeur, contact pour les droits et politique finale nécessitent des données réelles ; ne pas les inventer et ne pas déclarer une conformité juridique complète.

## Tests / publication

- La CI vérifie syntaxe, anciennes sauvegardes, catalogue, photos et parcours mobiles (320, 393, 430 px).
- Nouveaux tests : rappel explicite, export Calendrier local, refus Santé invalides, statistiques, aperçu photo sans POST, API distante bloquée, vraie transition entre deux versions PWA, Plus tard, saisies et deuxième onglet préservés.
- Les résultats effectifs sont ceux de la PR et des logs ; ne pas remplacer un résultat par une promesse.
- Après déploiement, vérifier le commit, l’alias de production et les fichiers publics servis.
- Première adoption depuis l’ancienne PWA : fermer toutes les fenêtres Mon Suivi puis rouvrir peut être nécessaire. Le code ancien ne peut pas afficher rétroactivement une nouvelle bannière. Les versions suivantes utilisent le nouveau parcours. Ne pas supprimer les données.

La V4 reste **partielle**, même si les améliorations indépendantes sont publiées.
