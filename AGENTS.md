# Mon Suivi — consignes de continuité

- Application de bien-être en français, principalement iPhone. Conserver JavaScript/HTML/CSS sans réécriture de framework injustifiée.
- Budget supplémentaire strict : 0 €. Aucun achat, abonnement, API distante facturable ou création de service nécessitant une carte.
- Palette : rose pastel, jaune, ivoire. Le chat rose fourni par l’utilisatrice est déjà le motif confirmé et livré dans icons/. Ne pas inventer une nouvelle identité.
- Accueil : « Avance à ton rythme, célèbre tes progrès. » et « Chaque petit pas compte. ».
- Conserver les 42 recettes, leurs identifiants, les 24 catégories ivoiriennes et les 15 familles d’alternatives. Licences et crédits obligatoires pour les photos.
- Clé historique de stockage : mon-suivi-v1. Préserver les données et la compatibilité des anciennes sauvegardes. Ne pas réinstaller/effacer le stockage pour appliquer une mise à jour.
- Les photos personnelles restent en mémoire locale. api/photo.js est bloqué par ZERO_COST_MODE ; ne pas le réactiver sans nouvelle validation explicite des coûts et de la confidentialité.
- Santé : le web ne lit pas HealthKit. Ne jamais fabriquer de lien iCloud ni affirmer que le raccourci a été validé sur iPhone.
- Rappel : distinction explicite entre rappel dans une app ouverte, événement Calendrier à importer et Web Push (non activé). Ne jamais enregistrer une humeur sans choix.
- Mise à jour PWA : proposer Mettre à jour / Plus tard, protéger toute saisie et les autres onglets, pas de rechargement en boucle. À chaque changement du shell, mettre à jour ensemble CACHE, ASSET_VERSION dans sw.js et les paramètres ?v= des scripts/styles d’index.html.
- Source de vérité : GitHub daveia977-droid/mon-suivi-, production main, https://mon-suivi-six.vercel.app/.
- Lire ROADMAP_V4.md avant une nouvelle session. L’autorisation explicite déjà donnée pour modifications/tests/commits/PR/déploiements gratuits s’applique ; ne pas inventer un nouveau besoin d’approbation.
- Travailler sur une branche, conserver une PR claire. Publier seulement le contenu testé lorsque l’utilisateur l’a autorisé. Ne pas envoyer de messages externes non demandés.
- Tests : node tests/smoke.cjs ; serveur local puis tests/e2e.cjs, tests/pwa.cjs, tests/phase2.cjs et tests/final.cjs avec Playwright. tests/update.cjs démarre son propre serveur pour vérifier une vraie transition de service worker.
- BROWSER_CHANNEL=msedge et TEST_BASE_URL permettent la validation locale. CI utilise Chromium. Aucun essai navigateur ne doit être présenté comme un essai sur iPhone physique.
- Ne pas déclarer la V4 intégralement terminée tant que les limites de ROADMAP_V4.md subsistent.
