# Instructions de reprise

Avant toute modification, lire dans cet ordre :

1. `README.md` pour installer, tester et déployer le projet ;
2. `HANDOFF.md` pour comprendre l'état courant, les décisions et les limites connues ;
3. `DOCUMENTATION.md` pour la description fonctionnelle détaillée.

## Règles de travail

- Maintenir la parité fonctionnelle entre `PlanningView.tsx` (mobile) et `DesktopPlanningView.tsx`.
- Conserver les explications contextuelles `?` pour les contrôles métier non évidents.
- Ne jamais assouplir `firestore.rules` pour contourner une erreur d'autorisation. Vérifier l'appartenance à l'équipe et le rôle attendu.
- Ne jamais exposer une clé serveur dans une variable `VITE_*`.
- Exécuter `npm run lint`, `npm test` et `npm run build` avant chaque livraison.
- Préserver les changements locaux sans rapport avec la tâche, notamment `.claude/settings.local.json`, `.firebase/` et `src/images/` lorsqu'ils sont présents.
- Après toute évolution significative, mettre à jour `HANDOFF.md` dans le même commit : état courant, décision prise, vérifications réalisées et travail restant.
- Ne marquer une information comme vérifiée que si elle a été contrôlée dans le dépôt ou par une commande exécutée.

## Livraison

Suivre l'ordre : modification, vérifications, validation utilisateur, commit, puis push après accord explicite.
