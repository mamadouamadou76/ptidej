# Handoff technique — P'tit Déj

Dernière mise à jour : 15 août 2026
État de référence : `main` au commit `bf75032`

Ce document doit être mis à jour dans le même commit que toute modification significative du projet.

## Objet du projet

P'tit Déj est une application React 19/Vite permettant à une équipe de répartir équitablement les tours de petit-déjeuner. Elle gère les collègues, les absences, les semaines du matin, les corrections manuelles, les rôles d'équipe et la synchronisation Firebase.

## Architecture courante

- `src/App.tsx` : orchestration de l'application et état métier principal.
- `src/components/FirebaseContext.tsx` : authentification, équipes et synchronisation Firestore.
- `src/components/PlanningView.tsx` : interface mobile du planning.
- `src/components/DesktopPlanningView.tsx` : interface desktop du planning.
- `src/hooks/useScheduleCalculation.ts` : recalcul automatique ou manuel du planning.
- `src/utils/scheduler.ts` : algorithme pur de génération et statistiques.
- `firestore.rules` : autorisations Firebase.
- `api/contact.ts` : fonction serveur du formulaire de contact via Brevo.
- `src/components/AdminDashboard.tsx` : administration globale réservée au claim Firebase `admin`.

## Dernières modifications importantes

### Commit `bf75032` — sécurité et fiabilité

- restriction des profils utilisateur à leur propriétaire ou au super-administrateur ;
- lecture des collègues et absences limitée aux membres de l'équipe ;
- auto-inscription forcée au rôle `viewer` avec validation des champs ;
- blocage des statistiques quotidiennes modifiables directement par le client ;
- génération cryptographique des nouveaux codes d'équipe ;
- validation stricte et limite de 4 000 caractères pour le formulaire de contact ;
- limitation locale à cinq messages par adresse IP et par fenêtre de quinze minutes ;
- suppression de l'intégration Supabase orpheline ;
- optimisation de l'algorithme de planning et extraction du hook de recalcul ;
- ajout de sept tests automatisés ;
- déploiement des règles Firestore ajouté au workflow GitHub Actions.

### Commit `05ab77d` — parité mobile/desktop

- ajout du recalcul automatique et manuel sur les deux vues ;
- ajout du mode correction sur mobile ;
- aide contextuelle `?` cohérente entre les interfaces.

## Sécurité et limites connues

- Le code d'équipe est un secret de partage : toute personne authentifiée qui le connaît peut rejoindre comme `viewer`.
- Le document principal d'une équipe reste lisible par code afin de préserver le parcours d'adhésion actuel. Les collègues, absences et membres restent protégés séparément.
- Des invitations temporaires et révocables demanderaient une fonction serveur et une migration des équipes existantes.
- Le rate limiting du formulaire est conservé en mémoire par instance Vercel. Une protection distribuée nécessite Turnstile ou un stockage partagé.
- Les statistiques de connexion côté client sont désactivées. Elles devront être réintroduites côté serveur si elles sont encore nécessaires.
- Le bundle Firebase dépasse 500 Ko avant gzip ; le build réussit mais Vite émet un avertissement de taille.

## Vérifications de référence

Exécutées avec Node.js 22 après le commit `bf75032` :

- `npm run lint` : réussi ;
- `npm test` : 7 tests réussis ;
- `npm run build` : réussi ;
- `git diff --check` : réussi.

Les tests automatisés couvrent l'équité, les dates locales, les absences, les corrections manuelles et la validation du formulaire. Les règles Firestore doivent encore recevoir une suite dédiée avec l'émulateur Firebase.

## Prochaines priorités

1. Ajouter des tests d'autorisation avec Firebase Emulator Suite.
2. Remplacer les codes permanents par des invitations expirables côté serveur.
3. Ajouter une protection distribuée au formulaire de contact.
4. Découper progressivement `AdminDashboard.tsx`, `App.tsx` et `FirebaseContext.tsx`.
5. Charger paresseusement Firebase Admin et les écrans rarement utilisés pour réduire les bundles.

## Discipline de reprise

Ne pas modifier ou inclure dans un commit les fichiers locaux sans rapport avec la tâche. Au 15 août 2026, `.claude/settings.local.json`, `.firebase/` et `src/images/` sont volontairement hors des commits fonctionnels.
