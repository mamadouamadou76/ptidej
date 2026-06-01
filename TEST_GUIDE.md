# 🧪 Guide Rapide de Test - Nouvelles Fonctionnalités

## ✅ Checklist de Vérification

### 1️⃣ Nombre de Semaines Configurable
**Localisation**: Onglet `Paramètres` → En haut

**À Tester**:
```
□ Voir le champ "Nombre de semaines à programmer"
□ Augmenter de 6 à 8 semaines → Planning passe de 6 à 8 semaines
□ Diminuer à 3 semaines → Planning passe à 3 semaines
□ Vérifier que les étiquettes des semaines changent dynamiquement
□ Rafraîchir la page → Nombre de semaines persiste
□ Dans l'onglet "Semaines de Matin", voir 3, 8 ou 12 boutons selon la config
```

**Résultat Attendu**:
- ✅ Contrôle `<input type="number" min="1" max="12">`
- ✅ Planning affiche exactement le nombre de semaines
- ✅ Étiquettes "Semaine 1", "Semaine 2", etc. jusqu'au nombre configuré
- ✅ `morningWeeks` array s'ajuste automatiquement

---

### 2️⃣ Gestion des Absences (Mise à Jour Automatique)

**Localisation**: Onglet `Collègues` → Onglet "Absences"

**À Tester**:

#### Scénario A: Ajouter une Absence
```
1. Configurez 6 semaines
2. Vérifiez qui est assigné la semaine 1 (ex: Thomas)
3. Onglet "Absences" → Ajouter absence
4. Sélectionnez "Thomas" du 01/06 au 05/06
5. Vérifiez que Thomas DISPARAÎT de ces jours dans le planning
6. La rotation se remplit avec d'autres collègues (auto-recalcul)
```

**Résultat Attendu**:
- ✅ Absence créée avec raison (ex: "Vacances")
- ✅ Planning mis à jour **instantanément**
- ✅ Thomas skippé ces jours
- ✅ La boucle de rotation continue avec autres

#### Scénario B: Supprimer une Absence
```
1. Supprimez l'absence de Thomas
2. Planning se recalcule
3. Thomas réapparaît dans la rotation (si son tour arrive)
```

**Résultat Attendu**:
- ✅ Absence supprimée
- ✅ Planning recalculé
- ✅ Rotation continue normalement

---

### 3️⃣ Mise à Jour en Temps Réel

**À Tester**:

#### Test 1: Modifier Paramètres → Planning Change
```
1. Onglet Paramètres
2. Changez "Nombre de semaines" de 6 à 4
3. Revenir à l'onglet Planning
4. Vérifiez que le planning affiche 4 semaines
5. Titre en haut passe de "6 semaines" à "4 semaines"
```

**Résultat Attendu**:
- ✅ Titre dynamique : "Prévisions 4 semaines"
- ✅ Grille: 4 semaines × 7 jours
- ✅ Export: "PLANNING (4 SEMAINES)"

#### Test 2: Changer Date de Début → Planning Change
```
1. Onglet Paramètres
2. Changez la date de début (ex: +14 jours)
3. Planning se recalcule immédiatement
4. Les dates du calendrier changent
```

**Résultat Attendu**:
- ✅ Calendrier mis à jour
- ✅ Rotation recalculée à partir de la nouvelle date
- ✅ Absences existantes s'ajustent si nécessaire

#### Test 3: Modifier Jours Travaillés → Planning Change
```
1. Onglet Paramètres
2. Désélectionnez "Samedi"
3. Le planning passe de 5 à 6 jours travaillés (L-V-S → L-V uniquement)
```

**Résultat Attendu**:
- ✅ Le samedi disparaît de la grille
- ✅ Rotation se comprime sur 5 jours
- ✅ Nombre total d'assignations diminue

---

### 4️⃣ Surcharges Manuelles (Overrides)

**À Tester**:

```
1. Cliquez sur un jour dans le planning
2. Sélectionnez un collègue différent
3. Vérifiez que le jour passe en "✍️ Override"
4. Modifiez une absence
5. Le jour reste avec le collègue choisi (pas affecté par recalcul)
6. Cliquez à nouveau → "Enlever l'override"
7. Le jour revient à l'auto-assignation
```

**Résultat Attendu**:
- ✅ Jour affiche ✍️ quand surchargé
- ✅ Jour affiche 🔄 quand auto
- ✅ Override persiste à travers recalculs
- ✅ Enlever override = retour à auto

---

### 5️⃣ Persistance des Données

#### Mode Local (localStorage)
```
1. Configurez 8 semaines
2. Ajoutez une absence
3. Fermez l'onglet complètement
4. Rouvrez l'app
5. Vérifiez que 8 semaines et l'absence persistent
```

**Résultat Attendu**:
- ✅ Configuration et données restaurées
- ✅ localStorage.getItem('breakfast_settings').numberOfWeeks === 8

#### Mode Firestore
```
1. Connectez-vous à Firestore
2. Créez une équipe
3. Définissez 10 semaines
4. Ouvrez dans un autre navigateur/onglet
5. Verifier que l'autre session voit 10 semaines
```

**Résultat Attendu**:
- ✅ Real-time sync à travers navigateurs
- ✅ `onSnapshot` listeners mettent à jour
- ✅ Firestore contient `settings.numberOfWeeks: 10`

---

### 6️⃣ Statistiques et Équité

**À Tester**:

```
1. Onglet Collègues → Cherchez les statistiques
2. Vérifiez que chaque collègue a un compteur de "tours"
3. Ajoutez une absence
4. Les statistiques changent en temps réel
5. Collecte avec le plus bas compteur est assigné en priorité
```

**Résultat Attendu**:
- ✅ Statistiques mises à jour à chaque changement
- ✅ Équité respectée (rotation fair)
- ✅ Absent = pas compté ce jour

---

### 7️⃣ Export WhatsApp/Slack

**À Tester**:

```
1. Configurez 3 semaines
2. Cliquez "Exporter WhatsApp / Slack"
3. Texte copié dans le presse-papiers
4. Collez dans un éditeur de texte
5. Vérifiez le contenu:
```

**Contenu Attendu**:
```
☕ *PLANNING PETITS DÉJEUNERS (3 SEMAINES)* 🥐
Période : du Lundi XX/MM au Dimanche XX/MM

*Semaine 1 (du XX sep)* : 🌞 Matin
  - Lundi 01/06 : *Thomas* 🔄
  - Mardi 02/06 : *Mathilde* 🔄
  ...

*Semaine 2 (du XX sep)* : 💤 Repos
  ...
```

**Résultat Attendu**:
- ✅ Titre affiche "3 SEMAINES" (dynamique)
- ✅ Dates correctes
- ✅ Symboles 🌞/💤 corrects
- ✅ Symboles ✍️/🔄 corrects

---

## 🐛 Cas Limites à Tester

### Edge Case 1: Une Seule Semaine
```
1. Configurez 1 semaine
2. Vérifiez que ça fonctionne correctement
3. Planning affiche 1 semaine × 7 jours
```

### Edge Case 2: Maximum (12 Semaines)
```
1. Configurez 12 semaines
2. Vérifiez perf et affichage
3. 84 jours à afficher = 84 × 5 = 420 assignations max
```

### Edge Case 3: Absence Plus Longue que Période
```
1. Configurez 2 semaines (14 jours)
2. Absence du 01/06 au 30/06 (sur 3 semaines)
3. Collègue absent tout le mois
4. Planning s'adapte correctement
```

### Edge Case 4: Tous les Collègues Absents le Même Jour
```
1. Ajoutez 3 absences pour le même jour
2. Vérifiez que ce jour affiche "⚠️ Aucun volontaire"
```

---

## 📊 Fichiers à Vérifier

### Code Source
```bash
# Compiler l'app
npm run lint

# Pas d'erreurs TypeScript
npm run build

# Pas de warnings React
```

### Structures de Données
```typescript
// ✅ settings doit contenir numberOfWeeks
const settings: ShiftSettings = {
  startWeekDate: "2026-06-01",
  workDays: [1,2,3,4,5],
  morningWeeks: [true, true, false, ...],
  numberOfWeeks: 8  // ← NOUVEAU
};

// ✅ localStorage persistant
localStorage.breakfast_settings = '{"numberOfWeeks":8,...}'

// ✅ Firestore persistant
db.collection('teams').doc(teamId).data().settings.numberOfWeeks === 8
```

---

## 📈 Performance à Tester

```
Scénario: 12 semaines + 10 collègues + 5 absences

⏱️ Temps de recalcul du planning: < 100ms (immédiat)
📊 Mémoire utilisée: < 5MB (acceptable)
🎨 Rendu: Fluide, sans lag
⚡ Interaction: Réactive
```

---

## ✨ Résumé

**Avant**:
```
- Planning limité à 6 semaines
- Pas de gestion flexible des absences
- Recalcul manuel ou limité
```

**Après**:
```
✅ Planning 1-12 semaines configurable
✅ Absences intégrées au recalcul automatique
✅ Mises à jour instantanées en temps réel
✅ Surcharges manuelles persistantes
✅ Synchronisation Firestore complète
✅ Statistiques dynamiques
✅ Export adaptatif (nombre de semaines)
```

---

**Fin du guide de test - Vérifiez tous les points avant de déployer!** ✅

*Dernière mise à jour: Juin 2026*
