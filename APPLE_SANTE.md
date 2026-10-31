# Apple Santé — préparation et validation iPhone

Le site ne dispose d’aucun accès direct à HealthKit. Aucun lien de partage iCloud n’a été inventé.

## Intervention nécessaire d’un auteur sur iPhone

Créer et tester une seule fois un raccourci nommé **Mon Suivi — Mes pas**, puis le partager via iCloud. L’utilisatrice finale l’installera depuis ce lien ; elle ne doit pas avoir à construire les actions.

Le raccourci doit :

1. Demander uniquement l’autorisation de lire les pas.
2. Obtenir le total du jour civil local (minuit → maintenant).
3. Tenir compte de la priorité des sources Santé. **Ne pas simplement additionner les échantillons d’un iPhone et d’une montre** : les périodes peuvent se chevaucher. Si une source unique est choisie, l’indiquer et comparer le résultat au total affiché dans Santé.
4. Produire un entier positif ou nul, au maximum 200000, et la date locale au format yyyy-MM-dd.
5. Ouvrir https://mon-suivi-six.vercel.app/#sante-pas=NOMBRE&date=AAAA-MM-JJ avec les valeurs calculées, pas ces mots littéraux.
6. Vérifier que l’espace utilisé par le lien est bien celui contenant le suivi. Safari et une PWA installée peuvent avoir un stockage distinct.

Le site retire le fragment de l’historique, exige une date explicite correspondant au jour courant, refuse les paramètres en double, remplace le total du jour sans l’additionner et conserve l’heure de réception. Un total manuel différent nécessite un choix explicite : le conserver ou le remplacer. Une nouvelle réception du même jour ne crée pas de doublon. Un changement de journée pendant la confirmation impose de relancer le raccourci.

L’aide « Connecter Apple Santé » présente trois écrans et donne accès à la saisie manuelle. L’import exige un espace local avec consentement, et ne change pas l’objectif personnalisé.

## Validation avant partage

- Tester zéro pas, une journée en cours et la présence d’un iPhone + une montre.
- Comparer au total Santé ; ne pas déclarer le raccourci validé si la déduplication n’est pas résolue.
- Tester le premier consentement et le refus d’autorisation.
- Tester le retour dans Safari puis dans la PWA installée, sans perdre l’historique.
- Tester l’automatisation quotidienne dans Raccourcis ; documenter si le déverrouillage est requis.
- Partager ensuite le raccourci et renseigner son vrai lien dans v4-config.js ; passer healthShortcutValidated à true seulement après ces vérifications. Les liens de lancement utilisent le nom exact ci-dessus.

Sources Apple :
- https://support.apple.com/en-euro/guide/shortcuts/apd624386f42/ios
- https://support.apple.com/en-am/guide/shortcuts/apdfbdbd7123/ios

Ce document est un contrat d’intégration et un protocole de validation, pas un raccourci déjà installable.
