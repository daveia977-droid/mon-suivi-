# Conversation et photo — étude du 31 octobre 2026

L’utilisateur a corrigé son choix : l’étude d’un fournisseur externe gratuit est autorisée. Cela ne constitue pas une validation technique du compte, des quotas ou des paramètres de confidentialité. Aucun fournisseur n’est activé dans cette livraison et aucune clé n’est demandée dans le chat.

## Piste recommandée à vérifier : Groq Free

L’offre Free et les capacités texte/image sont documentées. La documentation vision indique actuellement qwen/qwen3.8-27b ; vérifier sa disponibilité sur le compte réel avant de figer le modèle. Les limites publiques indicatives sont 30 requêtes/minute, 1 000/jour, 8 000 tokens/minute et 200 000/jour pour ce modèle. Elles sont partagées par l’organisation et peuvent différer selon le compte ; ce ne sont pas des quotas garantis par utilisatrice.

- Coûts : conserver le compte Free, sans moyen de paiement ni passage au plan Developer. Un dépassement doit produire une indisponibilité lisible, jamais une bascule payante ou un changement automatique de fournisseur.
- Données : aucune conservation habituelle des contenus d’inférence n’est annoncée, avec exceptions de fiabilité/abus jusqu’à 30 jours. Activer et vérifier Zero Data Retention dans Data Controls avant les essais utilisateurs. Les métadonnées d’usage subsistent. La documentation situe les données conservées aux États-Unis : ne pas promettre un traitement exclusivement européen ni une conformité santé certifiée.
- Les appels seront sans état, sans upload Files/Batch, sans journalisation des photos ou conversations dans l’application, avec suppression des métadonnées EXIF et consentement explicite avant chaque envoi. Ne transmettre ni poids, ni humeur, ni pas, ni historique complet du suivi.
- La clé doit être enregistrée uniquement dans les variables serveur Vercel, jamais dans le navigateur, Git ou le chat. La vérification du plan et des réglages doit précéder son utilisation.

Sources : [facturation](https://console.groq.com/docs/billing-faqs), [quotas](https://console.groq.com/docs/rate-limits), [vision](https://console.groq.com/docs/vision), [données et ZDR](https://console.groq.com/docs/your-data).

## Autres offres étudiées

Mistral propose un Free mode sans carte pour évaluation/prototypage. Les données peuvent être utilisées pour entraînement sauf désinscription ; la conservation API peut atteindre 30 jours. Le ZDR est réservé aux offres payantes : ne pas promettre une absence de conservation avec le Free mode.

Sources : [mise en route](https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key), [entraînement](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models), [ZDR](https://docs.mistral.ai/admin/monitor-comply/zero-data-retention).

Gemini possède une offre gratuite. La page tarifaire mentionne une utilisation des contenus pour amélioration des produits ; les conditions prévoient des dispositions particulières pour l’EEE, le Royaume-Uni et la Suisse. Vérifier le contrat, la région et le projet exacts avant toute sélection ; ne pas assimiler un compte Google AI Studio gratuit à une API sans risque de facturation après activation de Cloud Billing.

Sources : [tarifs](https://ai.google.dev/gemini-api/docs/pricing), [conditions](https://ai.google.dev/gemini-api/terms), [facturation](https://ai.google.dev/gemini-api/docs/billing).

## Parcours à activer après configuration vérifiée

1. **Conversation** : bouton facultatif, information du fournisseur et du transfert, accord explicite, conversation limitée en mémoire avec bouton d’effacement. Aucun diagnostic, conseil thérapeutique ou objectif de restriction automatique.
2. **Alternatives** : texte saisi par la personne ou photo autorisée. L’IA suggère les aliments ; la personne corrige, précise préférences/allergènes et valide. Les alternatives pointent vers les recettes/photos existantes ; aucune absence d’allergène n’est déduite de l’image.
3. **Calories** : après confirmation des aliments et des quantités, estimer depuis des données nutritionnelles sourcées. Afficher une fourchette et les hypothèses, laisser une valeur inconnue si nécessaire. La photo ne mesure ni la masse ni l’huile.
4. **Score sur 10** : grille transparente à définir et tester ; ne pas présenter une opinion du modèle comme une mesure scientifique ou un jugement sur la personne.
5. **Nutri-Score** : ne pas le déduire d’une photo ou convertir arbitrairement une note /10. Afficher le score d’un produit identifié et sourcé, ou calculer uniquement avec toutes les données requises et l’algorithme applicable. Sinon afficher « Non calculable avec les informations disponibles ».

Source : [calcul officiel expliqué par Santé publique France](https://www.mangerbouger.fr/manger-mieux/s-informer-sur-les-produits-qu-on-achete/nouveau-nutri-score/comment-calcule-t-on-le-nutri-score).

## Conditions restantes avant activation

- Compte réel Free vérifié, ZDR configuré, clé stockée côté serveur et modèle accessible.
- Limitation globale et par session, plafonds de taille/durée, refus si compteur indisponible ; aucun compteur en mémoire seule présenté comme une limite globale Vercel.
- Tests de refus/annulation, panne/quota, images non alimentaires, corrections de portions et plats ivoiriens ; test iPhone physique.
- Mise à jour des informations de confidentialité et consentement de l’utilisatrice. Aucun envoi de données réelles pendant l’étude.

État : étude terminée, activation non réalisée. L’endpoint existant api/photo.js reste bloqué par ZERO_COST_MODE.
