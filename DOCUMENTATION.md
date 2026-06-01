# 📋 Documentation Complète - Planning Petit Déjeuner

## 🎯 Vue d'Ensemble du Projet

**Planning Petit Déjeuner** est une application web progressive qui automatise la planification des services de petit-déjeuner pour les équipes travaillant en rotation matinale. L'application gère intelligemment l'attribution des responsabilités de service en tenant compte des absences et des préférences de rotation.

### Informations Clés
- **Nom**: Planning Petit Déjeuner (Breakfast Scheduling App)
- **Version**: 0.0.0
- **Type**: Progressive Web App (PWA) avec Vite + React
- **Backend**: Firebase (Authentication + Firestore Database)
- **Langue**: Français (Interface utilisateur)

---

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                    Planning Petit Déjeuner                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Frontend (React + TypeScript)              │ │
│  │  - App.tsx (Composant Principal)                       │ │
│  │  - 7 Vues principales (Composants)                     │ │
│  │  - Tailwind CSS + Lucide Icons                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        Couche Logique & État (Hooks + Context)         │ │
│  │  - FirebaseContext: Auth + Sync Firestore              │ │
│  │  - Scheduler: Génération du planning (6 semaines)      │ │
│  │  - Utilitaires: Couleurs, Données Démo, Dates         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Backend (Firebase + Firestore)                │ │
│  │  - Authentication (Google, Email/Password)             │ │
│  │  - Database: Équipes, Collègues, Absences, Overrides   │ │
│  │  - Security Rules: Contrôle accès fine-grained         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Stockage Local (localStorage)                │ │
│  │  - Fallback offline + données de démo                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure des Dossiers

```
ptidej/
├── public/                          # Ressources publiques
│   ├── manifest.json               # Configuration PWA
│   └── sw.js                       # Service Worker
│
├── src/
│   ├── App.tsx                     # Composant racine + routage/onglets
│   ├── main.tsx                    # Point d'entrée React
│   ├── index.css                   # Styles globaux
│   ├── types.ts                    # Types TypeScript principaux
│   │
│   ├── components/                 # Composants React réutilisables
│   │   ├── AuthView.tsx            # Vue Authentification
│   │   ├── ColleaguesView.tsx      # Gestion des Collègues
│   │   ├── FirebaseContext.tsx     # Context + Hooks Firebase
│   │   ├── MobileFrame.tsx         # Wrapper UI Mobile
│   │   ├── PlanningView.tsx        # Vue Calendrier 6 semaines
│   │   ├── SettingsView.tsx        # Configuration Paramètres
│   │   ├── TeamMgmtView.tsx        # Gestion des Équipes
│   │   └── SettingsView.tsx        # Paramètres de l'app
│   │
│   └── utils/                      # Utilitaires & Logique métier
│       ├── firebase.ts             # Config Firebase + Erreur Handling
│       ├── scheduler.ts            # 🔑 Algorithme de planification
│       ├── demoData.ts             # Données de démo préchargées
│       └── colorMapper.ts          # Mapping Couleurs Tailwind
│
├── assets/                         # Images et ressources statiques
├── firebase-applet-config.json     # Config Firebase (API Keys)
├── firebase-blueprint.json         # Schéma base de données
├── firestore.rules                 # 🔒 Règles de sécurité Firestore
├── security_spec.md                # Spécification sécurité détaillée
│
├── index.html                      # Template HTML
├── vite.config.ts                  # Configuration Vite
├── tsconfig.json                   # Configuration TypeScript
├── package.json                    # Dépendances NPM
├── README.md                       # Readme original
└── metadata.json                   # Métadonnées de l'app
```

---

## 🔑 Types de Données Principaux (`src/types.ts`)

### 1. **Colleague** - Collègue/Utilisateur
```typescript
interface Colleague {
  id: string;                    // Identifiant unique
  name: string;                  // Nom du collègue
  color: string;                 // Couleur Tailwind (rose, amber, emerald, etc.)
  isActive: boolean;             // Inclus dans la rotation ?
  initialCount: number;          // Ajustements manuels de rotation
}
```

### 2. **Absence** - Absence/Congé
```typescript
interface Absence {
  id: string;                    // Identifiant unique
  colleagueId: string;           // Référence au collègue absent
  startDate: string;             // YYYY-MM-DD (date début)
  endDate: string;               // YYYY-MM-DD (date fin, inclusive)
  reason?: string;               // Motif (vacances, maladie, etc.)
}
```

### 3. **ShiftSettings** - Paramètres de Rotation
```typescript
interface ShiftSettings {
  startWeekDate: string;         // YYYY-MM-DD (Lundi de début)
  workDays: number[];            // 1=Lun, 2=Mar, ..., 7=Dim
  morningWeeks: boolean[];       // 6 booléens (semaine 0-5 = rotation matin?)
}
```

### 4. **CalendarDay** - Jour du Calendrier (Calculé)
```typescript
interface CalendarDay {
  dateString: string;            // YYYY-MM-DD
  date: Date;                    // Objet Date JS
  dayOfWeek: number;             // 1-7 (Lun-Dim)
  isWorkDay: boolean;            // Jour travaillé configuré ?
  isMorningShift: boolean;       // Rotation matin cette semaine ?
  weekIndex: number;             // 0-5 (6 semaines)
  colleagueId: string | null;    // Qui est assigné ce jour ?
  isManualOverride: boolean;     // Surcharge manuelle ?
  colleagueName?: string;        // Nom du collègue (hydraté)
  colleagueColor?: string;       // Couleur du collègue (hydratée)
}
```

### 5. **ManualOverride** - Surcharges Manuelles
```typescript
type ManualOverride = {
  [dateString: string]: string | null;  // dateStr -> colleagueId (ou null)
}
```

---

## 🔄 Composants React Principaux

### **App.tsx** - Composant Racine
- **Rôle**: Conteneur principal, gestion d'état global
- **Données**: Collègues, Absences, Paramètres, Surcharges
- **Initialisation**: 
  - Chargement depuis localStorage (offline fallback)
  - Chargement des données de démo si nécessaire
- **Persistance**: Synchronisation localStorage quand l'état change

### **FirebaseContext.tsx** - Authentification & Sync
- **Fonctionnalités**:
  - ✅ Authentification Google via popup
  - ✅ Authentification Email/Mot de passe
  - ✅ Création et gestion d'équipes
  - ✅ Sync real-time Firestore (onSnapshot listeners)
  - ✅ Opérations CRUD (Collègues, Absences, Paramètres)
- **État**: `user`, `profile`, `activeTeamId`, `isSyncing`, `connError`
- **Callbacks**: Synchronisation des modifications vers le backend

### **PlanningView.tsx** - Calendrier Principal 📅
- **Affichage**: Grille 6 semaines × 7 jours
- **Fonctionnalités**:
  - Affichage du planning auto-généré
  - Surcharges manuelles (clic pour assigner)
  - Indicateurs visuels des absences
  - Statistiques (tours de rotation)

### **ColleaguesView.tsx** - Gestion Collègues 👥
- **Actions**:
  - ➕ Ajouter un collègue
  - ✏️ Éditer nom/couleur
  - 🗑️ Supprimer un collègue
  - 🔁 Activer/Désactiver un collègue

### **SettingsView.tsx** - Configuration Paramètres ⚙️
- **Configuration**:
  - Définir date de début (lundi)
  - Sélectionner jours de travail
  - Configurer semaines de rotation (matin vs après-midi)
- **Gestion Absences**:
  - ➕ Ajouter une absence
  - 🗑️ Supprimer une absence

### **TeamMgmtView.tsx** - Gestion Équipes 🏢
- **Actions**:
  - Créer une nouvelle équipe
  - Rejoindre une équipe existante (via Code)
  - Quitter une équipe
  - Afficher les membres

### **AuthView.tsx** - Authentification 🔐
- **Pages**:
  - Connexion Google
  - Connexion Email/Mot de passe
  - Inscription Email

### **MobileFrame.tsx** - Wrapper UI
- Cadre responsive pour mobile
- Gestion de la barre de navigation

---

## 🧮 Algorithme de Planification (`src/utils/scheduler.ts`)

### **Fonction Principale: `generateSchedule()`**

L'algorithme génère un planning équitable sur 6 semaines en assignant automatiquement les jours de petit-déjeuner.

#### **Étapes**:

1. **Initialisation du Calendrier** (42 jours = 6 semaines)
   - Crée un `CalendarDay` pour chaque jour
   - Marque les jours travaillés (`workDays`)
   - Marque les semaines de rotation matin (`morningWeeks`)

2. **Assignation Séquentielle**
   - Itère sur les 42 jours
   - Pour chaque jour de matin (isWorkDay + isMorningShift):
     - Cherche le collègue avec le **compteur de rotation le plus bas** (equity)
     - Vérifie que le collègue **n'est pas absent** ce jour
     - Assigne le collègue et incrémente son compteur

3. **Surcharges Manuelles** (`overrides`)
   - Applique les surcharges après l'assignation automatique
   - Permet de remplacer manuellement un jour spécifique
   - `null` = personne (jour non assigné)

4. **Hydratation des Données**
   - Ajoute `colleagueName` et `colleagueColor` au `CalendarDay`

### **Formule d'Équité**
```
score = initialCount + numberOfAssignments
=> Le collègue avec le score le plus bas est assigné
```

### **Fonction Utilitaire: `computeStats()`**
Retourne les statistiques de chaque collègue:
```typescript
{
  colleagueId: number;  // Nombre de jours assignés
}
```

---

## 🔐 Sécurité & Firebase Firestore Rules (`firestore.rules`)

### **Architecture Sécurité**

L'application utilise un système de **sécurité en couches** défini dans `firestore.rules`:

#### **1. Authentification Requise**
```
Tous les accès nécessitent:
- Utilisateur authentifié
- Email vérifié
```

#### **2. Isolation des Données**

**Documents Utilisateur** (`/users/{userId}/private/info`):
- Lecture: Propriétaire seulement
- Écriture: Propriétaire seulement
- Champs protégés: Email, ID Firebase

**Documents d'Équipe** (`/teams/{teamId}/*`):
- Accès: Membres de l'équipe uniquement
- Sous-collections:
  - `colleagues`: Collègues de l'équipe
  - `absences`: Absences de l'équipe
  - `settings`: Paramètres de rotation
  - `overrides`: Surcharges manuelles

#### **3. Validations Côté Sécurité**

**Identifiants** (isValidId):
- Max 128 caractères
- Alphanumériques + tirets/underscores

**Collègues** (isValidColleague):
- `name`: 1-100 caractères
- `color`: Couleur Tailwind valide
- `isActive`: Booléen
- `initialCount`: 0-20

**Absences** (isValidAbsence):
- `startDate` ≤ `endDate` (dates valides)
- `colleagueId`: Référence valide
- Format: YYYY-MM-DD

**Immutabilité**:
- `createdAt`: Immuable après création
- `ownerId`: Immuable (ne peut pas transférer)

#### **4. Tests de Pénétration**

L'équipe a validé **12 scénarios d'attaque** (Dirty Dozen):
1. ✅ Self-Promote (spoofage de rôle)
2. ✅ Read PII (lecture données privées)
3. ✅ Hijack Team (usurpation équipe)
4. ✅ Shadow Update (injection champs)
5. ✅ Resource Poisoning (IDs géants)
6. ✅ Unauthenticated Scraping (accès anonyme)
7. ✅ Counter Spoof (manipulation rotation)
8. ✅ Absence Poisoning (absences invalides)
... et 4 autres

Tous retournent `PERMISSION_DENIED` ✓

---

## 💾 Stockage & Synchronisation

### **1. Firestore Database** (Temps Réel)
- **Collection**: `teams/{teamId}`
  - `colleagues` subcollection
  - `absences` subcollection
  - `settings` document
  - `overrides` document

### **2. localStorage** (Fallback Offline)
Clés:
- `breakfast_colleagues` - JSON stringifié
- `breakfast_absences` - JSON stringifié
- `breakfast_settings` - JSON stringifié
- `breakfast_overrides` - JSON stringifié

**Stratégie**:
- Lors du démarrage, charge Firestore si authentifié
- Sinon, charge localStorage
- Si vide, charge données démo
- Sauvegarde localStorage continuellement (hors équipe)

### **3. Données Démo** (`src/utils/demoData.ts`)
- Collègues pré-créés (Marie, Jean, Sophie, etc.)
- Absence d'exemple
- Paramètres par défaut
- **Objectif**: L'app n'est jamais vide

---

## 🌐 Dépendances Principales (`package.json`)

### **Dépendances Critiques**
| Paquet | Version | Usage |
|--------|---------|-------|
| `react` | 19.0.1 | Framework UI |
| `react-dom` | 19.0.1 | Rendu DOM |
| `firebase` | 12.14.0 | Auth + Firestore |
| `@tailwindcss/vite` | 4.1.14 | Styling CSS-in-JS |
| `@vitejs/plugin-react` | 5.0.4 | JSX compilation |
| `lucide-react` | 0.546.0 | Icons |
| `motion` | 12.23.24 | Animations |
| `vite` | 6.2.3 | Bundler |
| `@google/genai` | 2.4.0 | Gemini API (optionnel) |
| `express` | 4.21.2 | Backend/Server (optionnel) |

### **Dépendances Développement**
| Paquet | Version | Usage |
|--------|---------|-------|
| `typescript` | 5.8.2 | Type checking |
| `tailwindcss` | 4.1.14 | CSS framework |
| `esbuild` | 0.25.0 | Minification |

---

## 🚀 Configuration & Déploiement

### **Vite Configuration** (`vite.config.ts`)
```typescript
plugins: [react(), tailwindcss()]
resolve.alias: '@' -> root directory
HMR: Désactivé en mode AI Studio (DISABLE_HMR env var)
```

### **TypeScript Configuration** (`tsconfig.json`)
- Cible: ES2020
- Module: ESNext
- Strict mode activé

### **Scripts NPM**
```bash
npm run dev       # Démarrer dev server sur port 3000
npm run build     # Build production (dist/)
npm run preview   # Prévisualiser build production
npm run clean     # Supprimer dist/ et server.js
npm run lint      # Vérifier types avec TypeScript
```

### **Variables d'Environnement**
- `GEMINI_API_KEY`: Clé API Google Gemini (optionnel)
- `DISABLE_HMR`: Désactiver Hot Module Replacement (en production)

---

## 🎨 Design & UI

### **Stack UI**
- **CSS Framework**: Tailwind CSS 4.1
- **Icons**: Lucide React (546+ icons)
- **Animations**: Motion (déplacements fluides)
- **Fonts**: 
  - Plus Jakarta Sans (body)
  - Space Grotesk (headings)
  - JetBrains Mono (code)

### **Couleurs Predéfines**
Mapping Tailwind `colorMapper.ts`:
- rose, amber, emerald, blue, purple, pink, red, orange, yellow, green, cyan, violet, indigo, lime, teal, sky...

### **Responsive Design**
- Mobile-first
- PWA compatible (manifest.json)
- Service Worker support (sw.js)

---

## 📊 Flux de Données

```
User Input (UI)
    ↓
React State (App.tsx)
    ↓
Actions (Add/Update/Delete)
    ↓
├─ Si équipe active → Firestore (FirebaseContext)
└─ Si offline → localStorage
    ↓
Data Listeners (onSnapshot)
    ↓
State Updated → Component Rerender
    ↓
scheduler.generateSchedule() → CalendarDay[]
    ↓
PlanningView affiche le calendrier
```

---

## 🛠️ Commandes Courantes

### **Développement**
```bash
# Installer les dépendances
npm install

# Démarrer le serveur dev
npm run dev  # → http://localhost:3000

# Vérifier les types
npm run lint

# Build pour production
npm run build

# Prévisualiser le build
npm run preview

# Nettoyer les fichiers de build
npm run clean
```

### **Configuration Firebase**
1. Créer un projet Firebase
2. Ajouter l'app Web
3. Copier la config dans `firebase-applet-config.json`
4. Configurer les règles Firestore (`firestore.rules`)
5. Activer l'authentification Google et Email

---

## 🔍 Points Clés d'Intégration

### **Authentification**
- `FirebaseContext` → `signInWithGoogle()`, `signUpWithEmail()`
- Stockage du `user` et `profile`
- Gestion `activeTeamId` après authentification

### **Sync Temps Réel**
- `onSnapshot` listeners dans `FirebaseContext`
- Callbacks de synchronisation vers `App.tsx`
- Gestion des erreurs réseau (`connError`, `isSyncing`)

### **Scheduling**
- `generateSchedule()` appelée quand Collègues/Absences/Settings changent
- Recalcul automatique du planning
- Affichage dans `PlanningView`

---

## 📱 PWA (Progressive Web App)

### **Configuration**
- **manifest.json**: Configuration PWA
- **sw.js**: Service Worker (offline support)
- **Meta tags**: iOS/Android support

### **Fonctionnalités**
- Installation sur l'écran d'accueil
- Utilisation offline (avec données en cache)
- Notifications push (optionnel)

---

## 🐛 Debugging & Logs

### **Firebase Errors**
Tous les erreurs Firestore sont loggées via `handleFirestoreError()`:
```typescript
{
  error: string,
  operationType: CREATE|UPDATE|DELETE|LIST|GET|WRITE,
  path: string,
  authInfo: { userId, email, emailVerified, isAnonymous, ... }
}
```

### **Console Logs**
- `console.warn()`: Chargement localStorage/fallback
- `console.error()`: Erreurs critiques

---

## 📚 Ressources & Références

- **Firebase SDK**: https://firebase.google.com/docs
- **React 19**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev
- **TypeScript**: https://www.typescriptlang.org

---

## 📝 Résumé Technique

| Aspect | Détail |
|--------|--------|
| **Framework** | React 19 + TypeScript |
| **Bundler** | Vite 6.2 |
| **Styling** | Tailwind CSS 4.1 |
| **Backend** | Firebase (Auth + Firestore) |
| **State Management** | React Context + Hooks |
| **Storage** | Firestore + localStorage |
| **Language** | TypeScript 5.8 |
| **Node Version** | 18+ |
| **Deployment** | Vite Build → Static Hosting |

---

## 🎓 Conclusion

**Planning Petit Déjeuner** est une application de planification robuste et sécurisée, conçue pour simplifier la gestion des rotations de petit-déjeuner en équipe. Elle combine une UX moderne (React + Tailwind), une logique métier sophistiquée (scheduling fairness), et une sécurité de classe entreprise (Firestore Rules).

L'architecture permet le fonctionnement offline et offre une excellente scalabilité grâce à la base de données Firebase.

---

*Documentation générée - Juin 2026*
