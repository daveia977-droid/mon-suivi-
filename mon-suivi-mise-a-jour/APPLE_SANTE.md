# Apple Santé — raccourci « Mon Suivi — Santé »

Un site web n’a aucun accès direct à HealthKit. L’app **Raccourcis** de l’iPhone lit Santé et ouvre Mon Suivi avec les mesures du jour dans le fragment de l’adresse (`#…`), qui n’est jamais envoyé au serveur.

## Contrat du lien

```
https://mon-suivi-six.vercel.app/#sante=1&date=AAAA-MM-JJ&pas=8234&poids=72,5&sommeil=7,2&kcal=420&fc=62&eau=1500&distance=5,8
```

| Paramètre | Mesure Santé | Unité | Bornes |
|---|---|---|---|
| `date` | date locale du jour (obligatoire) | yyyy-MM-dd | doit être aujourd’hui |
| `pas` | Nombre de pas (somme du jour) | pas | 0 – 200 000 |
| `poids` | Poids (dernier échantillon) | kg | 20 – 400 |
| `sommeil` | Analyse du sommeil, durée endormie | heures | 0 – 24 |
| `kcal` | Énergie active (somme du jour) | kcal | 0 – 10 000 |
| `fc` | Fréquence cardiaque au repos (dernier) | bpm | 25 – 220 |
| `eau` | Eau (somme du jour) | ml | 0 – 10 000 |
| `distance` | Distance de marche et de course (somme) | km | 0 – 300 |

Chaque mesure est facultative (au moins une), une valeur vide est ignorée, la virgule décimale et les espaces de Raccourcis sont acceptés. Les valeurs reçues remplacent celles du jour sans s’additionner ; si des pas ont été notés à la main, l’app demande lequel conserver. L’ancien lien `#sante-pas=…&date=…` reste accepté.

## Créer le raccourci (sur iPhone)

1. Raccourcis → **+** → nommer « Mon Suivi — Santé ».
2. **Rechercher des échantillons de santé** : Type *Nombre de pas*, Date de début *Aujourd’hui*, Regrouper par *Jour* → **Calculer les statistiques** *Somme* → **Arrondir** → variable « Pas ».
3. Idem pour *Énergie active* (« Kcal »), *Eau* en ml (« Eau »), *Distance de marche et de course* en km (« Distance »).
4. *Poids* et *Fréquence cardiaque au repos* : Trier par *Date de début*, *Plus récent d’abord*, Limite *1* → « Poids », « FC ».
5. Facultatif : *Analyse du sommeil* depuis hier 18 h, valeur *Endormi* (ou Principal/Profond/Paradoxal selon iOS) → **Obtenir les détails** *Durée* → Somme, convertie en heures → « Sommeil ».
6. **Date actuelle** → **Formater la date**, format personnalisé `yyyy-MM-dd` → « Date ».
7. **Texte** : le lien ci-dessus avec les variables à la place des valeurs → **Ouvrir les URL**.

Les noms exacts des actions et des types varient légèrement selon la version d’iOS.

## Valider avant de partager

- Comparer chaque valeur reçue avec l’app Santé (en particulier les pas iPhone + Apple Watch, qui ne doivent pas être comptés deux fois : utiliser la somme de Santé, pas l’addition des sources).
- Tester une journée sans poids ni sommeil (paramètres vides), le refus d’autorisation, Safari et la PWA installée (stockages séparés).
- Automatisation : Raccourcis → Automatisation → Heure de la journée → ce raccourci → Exécuter immédiatement. Le déverrouillage peut être requis pour lire Santé.
- Partager le raccourci (iCloud), puis renseigner `healthShortcutShareUrl` et `healthShortcutValidated: true` dans `v4-config.js`.
