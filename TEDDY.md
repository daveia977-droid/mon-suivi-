# Teddy — fonctionnement et continuité

## Parcours

Dans Progrès, le bouton Mon Teddy ouvre un espace dédié. Le démarrage est explicite et facultatif. Le mode démonstration ne crée pas de progression. L’icône du chat et la barre à cinq destinations restent identiques ; Teddy reste rattaché à Progrès.

Quatre étapes : jours 1–7, 8–14, 15–21, 22–30. Le personnage et tous ses calques sont des SVG originaux. La croissance est calculée en jours civils locaux (dates converties en indices UTC), sans additionner des durées de 24 heures sensibles aux changements d’heure. Une aventure commence à sa date enregistrée, pas au premier jour d’un mois.

Le trophée est disponible au jour 30. Le jour 31 ouvre le cycle suivant avec un petit Teddy et le thème suivant. Les trois thèmes alternent ; les tenues Jardin et Étoiles se débloquent aux jours 31 et 61. Il ne s’agit pas d’une génération infinie de nouvelles illustrations.

## Récompenses et journal

Les vêtements/décors suivent les étapes atteintes depuis le début de l’aventure. Deux accessoires supplémentaires récompensent 3 et 7 jours de journal. Oui, Non et Je ne sais pas ont exactement la même valeur. Aucune perte, tristesse, régression punitive, achat ou publicité.

Une réponse alimentaire n’est enregistrée qu’après validation du formulaire. Une réponse du jour est modifiable et remplace celle du même jour. L’humeur est facultative et partage le suivi existant ; un même jour ne crée pas une deuxième humeur. Un formulaire resté ouvert après minuit refuse d’enregistrer pour la mauvaise date et invite à rouvrir le journal.

La réinitialisation ne concerne que la tenue. Les vêtements acquis, le décor, le journal et les trophées sont conservés. Les anciens cycles sont consultables par pages de douze, avec leurs dates et le nombre de bilans remplis.

## Données

Clé historique inchangée : mon-suivi-v1. Champ teddy facultatif, initialement null. Schéma version 1 : startDate, furthestDay, records datés, outfit et scene. La validation refuse une sauvegarde Teddy incompatible sans remplacer le suivi actuel pendant un import. Les sauvegardes anciennes sans Teddy restent compatibles.

La progression atteinte (furthestDay) conserve les déblocages lors du renouvellement du cycle. Les archives et trophées sont dérivés de la date de départ et de cette progression ; aucun historique de cycles n’est supprimé. Les sauvegardes JSON existantes incluent le nouveau champ sans nouvelle clé séparée ni compte.

## Rappel et fonctionnement hors ligne

Le rappel existant est facultatif et modifiable dans Profil, à 20 h par défaut. Il peut proposer le journal Teddy si l’aventure est commencée, même si l’humeur du jour a déjà été notée. Un bilan Teddy rempli arrête le rappel du jour, même si l’humeur facultative a été laissée vide. Aucun bilan n’est rempli automatiquement.

L’événement Calendrier téléchargé pointe vers #teddy lorsque l’aventure existe. Il doit être importé et son alerte testée sur iPhone. Il se modifie/supprime dans Calendrier. Web Push n’est pas activé. L’application fermée n’exécute pas de minuteur JavaScript de notification. Aucun essai navigateur n’est présenté comme un essai de notification sur iPhone physique.

Les modules et styles Teddy sont précachés par le service worker. La mise à jour conserve la bannière Mettre à jour / Plus tard et la protection des saisies. Vérifier encore l’installation PWA, le calendrier, le verrouillage et le rendu sur un iPhone réel.

## IA et photographies

Aucune clé d’IA serveur exploitable n’a été vérifiée et aucun compte gratuit avec ses quotas/confidentialité n’a été validé. L’utilisateur a autorisé le report si nécessaire : l’IA reste désactivée. Voir IA_ETUDE_GRATUITE.md. Aucun achat, service avec carte, estimation inventée ou appel distant n’a été ajouté.

Une photo de salade de lentilles remplace un repère ; la fiche précise que les œufs sont à ajouter. Six recettes et certaines alternatives attendent encore une photographie fidèle et réutilisable. Les photos de riz au poulet, gratin cru et kédjénou d’escargots trouvées pendant la recherche n’ont pas été présentées comme les plats manquants.
