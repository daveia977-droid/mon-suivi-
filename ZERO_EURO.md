# Budget et limites de la V4

## Mesures appliquées

- Aucun compte, abonnement ou fournisseur payant créé.
- Aucun appel à Mistral, Upstash ou une autre IA ne peut être déclenché via api/photo dans cette version : ZERO_COST_MODE renvoie disabled avant traitement et avant tout appel externe.
- Les anciennes fonctions expérimentales demeurent derrière cette barrière ; leur présence dans les sources ne signifie pas qu’elles sont activées.
- L’aperçu photo utilise un objet URL local, révoqué à la fermeture du panneau. Aucun téléchargement de modèle ni envoi de photo n’a lieu.
- Les recherches alimentaires volontaires et les photographies du catalogue préexistantes sont conservées. Pas d’ajout de serveur de notifications ou de stockage santé distant.
- Les outils de gestion ne fournissent pas ici le détail du plan de facturation Vercel. Aucun changement de plan, carte ou option payante n’est effectué. Le déploiement réutilise le projet existant.

## Traitement sur appareil étudié

Transformers.js permet la classification d’images dans le navigateur avec ONNX/WASM ou WebGPU. Cela prouve la possibilité technique d’exécuter un modèle local, pas la fiabilité d’un estimateur nutritionnel sur cet iPhone.

Food-101 vise 101 classes de plats. Une classe n’est pas une liste d’ingrédients mesurés et ne fournit pas le poids des portions. La couverture des recettes ivoiriennes, les performances/mémoire sur l’iPhone cible, les licences des poids et la fiabilité nutritionnelle ne sont pas validées ici.

Conclusion pour cette livraison : moteur IA désactivé, aperçu local et correction/saisie manuelle disponibles. Aucune impossibilité universelle de l’IA gratuite n’est affirmée ; aucune solution non testée n’est présentée comme opérationnelle.

Sources primaires :
- https://huggingface.co/docs/transformers.js/en/index
- https://huggingface.co/docs/transformers.js/guides/webgpu
- https://huggingface.co/datasets/ethz/food101

## Rappels

Le Web Push sur iPhone nécessite une PWA sur l’écran d’accueil, une permission explicite et un service d’envoi. Aucun service ni droit de notification n’est activé par défaut. Le rappel dans l’app et l’événement Calendrier constituent les solutions gratuites livrées ; l’alerte Calendrier doit être validée sur l’appareil.

- https://webkit.org/blog/13878/
- https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
