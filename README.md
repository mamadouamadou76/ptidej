# P'tit Déj

Application collaborative de planification des petits-déjeuners d'équipe. Elle répartit les tours équitablement, tient compte des absences et permet aux administrateurs de corriger manuellement le planning.

## Fonctionnalités

- planning configurable sur plusieurs semaines ;
- répartition automatique et compteur d'équité ;
- absences et corrections manuelles ;
- équipes partagées avec rôles `admin`, `member` et `viewer` ;
- synchronisation temps réel avec Firebase ;
- interfaces mobile et desktop ;
- export du planning et installation PWA ;
- tableau de bord réservé aux super-administrateurs.

## Développement local

Prérequis : Node.js 22.

```bash
npm ci
npm run dev
```

L'application utilise la configuration publique Firebase de `firebase-applet-config.json`. La clé Brevo reste exclusivement côté serveur : renseignez `BREVO_API_KEY` dans l'environnement de l'hébergeur.

## Vérifications

```bash
npm run lint
npm test
npm run build
```

Les tests couvrent l'algorithme de planning et la validation du formulaire de contact. Les scénarios manuels complémentaires sont décrits dans `TEST_GUIDE.md`.

## Déploiement

- Firebase Hosting sert l'application statique et déploie `firestore.rules` via GitHub Actions.
- `api/contact.ts` nécessite un hébergement compatible avec les fonctions Vercel et la variable `BREVO_API_KEY`.
- La limitation de fréquence du formulaire est locale à chaque instance serveur. Une protection distribuée forte nécessitera un stockage partagé ou un CAPTCHA.

## Sécurité des équipes

Le code d'équipe agit comme un secret de partage. Les collègues, absences et membres sont limités aux utilisateurs autorisés par les règles Firestore. Un nouveau membre rejoint toujours avec le rôle `viewer`; seul le propriétaire peut modifier les rôles et le planning.

Ne placez jamais de clé Firebase Admin, Brevo ou autre secret serveur dans une variable `VITE_*` ou dans le dépôt.
