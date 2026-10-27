# mon-suivi-
Mon Suivi

Une application de bien-être en français pour noter son poids, ses repas et son humeur, à son rythme.

Interface rose et jaune, conçue pour le mobile et inspirée des principes de simplicité des interfaces Apple.

> Première version de travail. Ce projet ne fournit aucun diagnostic ni promesse de perte de poids.

Fonctionnalités présentes

• Accueil et mode démonstration avec données fictives.
• Ajout, modification et suppression des mesures de poids en kilogrammes.
• Courbe de l’historique du poids.
• Journal des repas : aliment, quantité et calories estimées saisies manuellement.
• Suivi de l’humeur avec note facultative.
• Sauvegarde dans le navigateur après consentement explicite.
• Export des données au format JSON.
• Retrait du consentement et effacement des données locales.
• Pages de confidentialité, conditions, cookies, mentions légales et remboursements à compléter.

Technologies

HTML, CSS et JavaScript, sans dépendance externe ni étape de compilation.

Fichiers

|Fichier           |Rôle                                      |
|------------------|------------------------------------------|
|index.html        |Structure et styles                       |
|app.js            |Navigation, suivi et sauvegarde locale    |
|REPRISE_MISTRAL.md|Consignes pour poursuivre le développement|
|README.md         |Présentation et installation              |

Essayer l’application

Télécharger les fichiers et ouvrir index.html pour une première inspection.

Pour un environnement web local stable, depuis le dossier du projet :

python3 -m http.server 8000

Ouvrir ensuite http://localhost:8000.

La sauvegarde dépend du navigateur et de l’adresse utilisée. Les données locales ne sont pas automatiquement transférées vers le site publié.

Héberger sur GitHub Pages

1. Placer index.html et app.js à la racine du dépôt.
2. Ouvrir Settings → Pages.
3. Choisir Deploy from a branch.
4. Sélectionner main et / (root), puis enregistrer.
5. Ouvrir l’adresse fournie par GitHub après le déploiement.

Compléter les textes juridiques et vérifier le fonctionnement avant de partager publiquement le site.

Confidentialité

Cette version ne crée pas de compte en ligne. Elle ne synchronise pas les données entre appareils et ne les transmet pas à un serveur applicatif.

Après consentement, les données de suivi sont conservées dans localStorage. Elles ne sont pas chiffrées par l’application et peuvent être accessibles à une personne utilisant la même session de navigateur.

Effacer les données du navigateur peut supprimer le suivi. Effectuer régulièrement un export ; l’import de sauvegarde n’est pas encore implémenté.

Ne jamais ajouter au dépôt GitHub d’exports personnels, de données réelles de santé, de mots de passe ou de clés API.

Aucun outil publicitaire ou de mesure d’audience n’est intégré au code. L’hébergeur peut toutefois traiter des informations techniques de connexion selon ses propres règles.

Limites actuelles

• Pas de compte utilisateur ni d’authentification.
• Pas de synchronisation ou de sauvegarde distante.
• Pas d’analyse de photo, de conseiller IA ou de notifications automatiques.
• Pas de conversion kg/lb ni de filtres 7/30 jours.
• Calories saisies manuellement, sans base nutritionnelle connectée.
• Courbe avec points espacés uniformément : les intervalles entre dates ne sont pas encore proportionnels.
• Textes juridiques en brouillon, sans certification de conformité.

Vérifications

La syntaxe JavaScript de la base a été vérifiée avec :

node --check app.js

Les tests fonctionnels complets dans le navigateur et sur un véritable iPhone restent à réaliser. Aucun test matériel n’est revendiqué.

Prochaines étapes

• Renforcer la validation des données et tester les parcours.
• Ajouter un import JSON sécurisé, les unités kg/lb et les filtres temporels.
• Améliorer les graphiques, l’accessibilité et les formulaires mobiles.
• Étudier un backend pour les comptes et la synchronisation.
• Ajouter éventuellement IA, photos et rappels après validation technique et budgétaire.

Références de design

• Apple Design — Emil Kowalski
• Mobile Native — Emil Kowalski

Ces références guident le développement ; elles ne constituent pas une affiliation à Apple ni une certification.