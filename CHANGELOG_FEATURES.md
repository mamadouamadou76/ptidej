# 📋 Journal des Modifications - Planning Petit Déjeuner

## ✨ Nouvelles Fonctionnalités Implémentées

### 1. **Nombre de Semaines Configurable** 📅
- **Avant**: Le planning était limité à 6 semaines fixes
- **Après**: Vous pouvez maintenant configurer entre **1 et 12 semaines** de prévisions
- **Où**: Onglet **Paramètres** → Section "Nombre de semaines à programmer"
- **Effet**: Le planning se recalcule automatiquement avec le nombre exact de semaines demandé

#### Fichiers Modifiés:
- ✅ `src/types.ts` - Ajout de `numberOfWeeks: number` à `ShiftSettings`
- ✅ `src/App.tsx` - Initialisation et gestion du nouveau paramètre
- ✅ `src/components/SettingsView.tsx` - Interface utilisateur avec input numérique
- ✅ `src/utils/scheduler.ts` - Génération dynamique du planning basée sur `numberOfWeeks`
- ✅ `src/utils/demoData.ts` - Données de démo incluent `numberOfWeeks: 6`
- ✅ `src/components/PlanningView.tsx` - Affichage dynamique des semaines

---

## 🔄 Gestion Automatique des Absences et Mises à Jour

### Comment Cela Fonctionne?

L'application utilise un système **réactif** complet:

1. **Ajout d'une Absence**: Lorsque vous marquez un collègue en congé
   - L'absence est enregistrée (localement ou dans Firestore)
   - Le planning se **recalcule instantanément**
   - Les jours d'absence sont **skippés** automatiquement
   - La rotation s'adapte avec les autres collègues

2. **Suppression d'une Absence**: Quand le collègue revient
   - L'absence est supprimée
   - Le planning est **repartitionné** automatiquement
   - Les futures assignations changent si nécessaire

3. **Modification des Collègues**:
   - Ajouter/modifier/désactiver un collègue → **Recalcul auto**
   - Suppression d'un collègue → Toutes les absences liées sont nettoyées

4. **Modification des Paramètres**:
   - Changer la date de début
   - Changer les jours travaillés (Lun-Sam)
   - Changer les semaines de matin
   - **Tout provoque une repartition automatique du planning**

---

## 🎛️ Contrôle Manuel vs Automatique

### Mode Automatique (Par Défaut)
L'algorithme de planification génère automatiquement une rotation équitable:
- Assigne les collègues en **respectant l'ordre d'équité**
- Skipe les absences
- Recalcule à chaque changement de données

### Mode Surcharge (Manuel)
Vous pouvez **remplacer** les assignations automatiques:
- **Clic sur un jour** dans la grille de planning
- Choisir un collègue spécifique (ou "Personne" pour laisser vide)
- L'assignation manuelle est marquée par ✍️ (vs 🔄 pour auto)
- **Les surcharges persistent** même si le planning se recalcule

### Supprimer une Surcharge
- Cliquez sur un jour avec ✍️
- Sélectionnez "Enlever l'override" pour revenir à l'auto-assignation

---

## 📊 Flux de Données Réactif

```
Modification (Absences, Collègues, Paramètres, etc.)
           ↓
State Update dans App.tsx
           ↓
Effet React se déclenche
           ↓
scheduler.generateSchedule() appelée AUTOMATIQUEMENT
           ↓
Planning recalculé avec les nouvelles données
           ↓
PlanningView mise à jour
           ↓
Utilisateur voit les changements en temps réel
```

---

## 🔒 Synchronisation Firestore

Quand vous êtes connecté à une **équipe Firestore**:
- **Toutes les modifications** sont synchro en temps réel
- Autres membres voient **les mêmes mises à jour**
- Si un membre change une absence, **le planning change pour tous**
- Système de **real-time listeners** avec `onSnapshot`

Quand vous êtes en **mode local**:
- Les modifications sont sauvegardées en `localStorage`
- Aucune sync réseau
- Vous pouvez travailler **hors-ligne**

---

## 📈 Exemples d'Usage

### Exemple 1: Prévoir 2 mois (8 semaines)
1. Allez à **Paramètres**
2. **"Nombre de semaines à programmer"** → Mettez `8`
3. Le calendrier change instantanément pour afficher **8 semaines**
4. Export/WhatsApp met à jour le titre : "PLANNING (8 SEMAINES)"

### Exemple 2: Un collègue en congé
1. Allez à **Collègues** → Onglet **Absences**
2. Ajoutez absence : "Thomas" du 01/06 au 07/06 (raison: "Vacances")
3. **En temps réel**:
   - Thomas disparaît de ces 5 jours dans le planning
   - La rotation se repartition entre les autres
   - Les statistiques de "tours" se recalculent

### Exemple 3: Remplacer un jour manuellement
1. Cliquez sur un jour dans le planning
2. Choisissez "Mathilde" au lieu de "Thomas" (auto)
3. Le jour passe en mode **✍️ Override**
4. Si vous changez les absences, ce jour **reste avec Mathilde** (pas affecté par recalcul)

---

## 🛠️ Détails Techniques

### `generateSchedule()` - Algorithme Principal

```typescript
generateSchedule(
  colleagues: Colleague[],
  absences: Absence[],
  settings: ShiftSettings,  // ← Contient numberOfWeeks
  overrides: ManualOverride
): CalendarDay[]
```

**Changements apportés**:
- Itère sur `settings.numberOfWeeks * 7` jours au lieu de 42 jours fixes
- Teste `isColleagueAbsent()` pour chaque assignation
- Applique les surcharges manuelles (`overrides`) après assignation auto
- Retourne un planning totalement recalculé

### `computeStats()` - Statistiques
Compte combien de fois chaque collègue a été assigné:
```typescript
{
  colleagueId: number; // Nombre de jours assignés cette année
}
```
Utilisé pour l'affichage dans **Collègues** et pour calculer l'équité.

---

## 🔔 Ce Qui Déclenche une Mise à Jour

### ✅ Déclenche Automatiquement le Recalcul
- ➕ Ajouter/Modifier/Supprimer un collègue
- ➕ Ajouter/Supprimer une absence
- ➕ Changer le nombre de semaines
- ➕ Changer la date de début
- ➕ Changer les jours travaillés
- ➕ Changer les semaines de matin/après-midi
- ➕ Modifier les surcharges manuelles

### ⚪ N'Affecte Pas le Planning
- Changer le nom/couleur d'un collègue → Pas de recalcul (les IDs restent les mêmes)
- Marquer inactif/actif → Recalcul oui (selon implémentation)

---

## 💾 Persistance des Données

### Mode Local (localStorage)
```javascript
localStorage.setItem('breakfast_colleagues', JSON.stringify(colleagues));
localStorage.setItem('breakfast_absences', JSON.stringify(absences));
localStorage.setItem('breakfast_settings', JSON.stringify(settings)); // ← Contient numberOfWeeks
localStorage.setItem('breakfast_overrides', JSON.stringify(overrides));
```

### Mode Firestore
```javascript
db.collection('teams').doc(teamId).update({
  settings: { numberOfWeeks: 8, ... },
  overrides: { "2026-06-01": "col-id", ... }
});
```

---

## 🐛 Tests à Effectuer

### Test 1: Nombre de Semaines
- [ ] Définir 3 semaines → Voir 3 semaines dans le planning
- [ ] Définir 12 semaines → Voir 12 semaines
- [ ] Rafraîchir la page → Les 12 semaines persistent
- [ ] Export WhatsApp affiche le bon nombre

### Test 2: Absence et Recalcul
- [ ] Ajouter absence → Planning change immédiatement
- [ ] Supprimer absence → Collègue réapparaît dans la rotation
- [ ] Modifier une absence (dates) → Recalcul automatique

### Test 3: Surcharges Manuelles
- [ ] Cliquer jour → Choisir collègue → ✍️ apparaît
- [ ] Changer absence → Jour surchargé reste inchangé
- [ ] Enlever override → Revient à auto

### Test 4: Synchronisation Firestore
- [ ] Créer équipe → Définir 8 semaines
- [ ] Autre membre rejoint → Voit 8 semaines aussi
- [ ] Membre 1 ajoute absence → Membre 2 voit recalcul auto

---

## 📝 Résumé des Changements

| Fichier | Changement | Ligne(s) |
|---------|-----------|---------|
| `types.ts` | Ajout `numberOfWeeks: number` | ✅ |
| `App.tsx` | Init/gestion `numberOfWeeks`, correction `handleClearAll` | ✅ |
| `SettingsView.tsx` | Input UI + `weekLabels` dynamique | ✅ |
| `scheduler.ts` | Boucle 42→`numberOfWeeks * 7` | ✅ |
| `demoData.ts` | Ajout `numberOfWeeks: 6` | ✅ |
| `PlanningView.tsx` | Affichage semaines dynamique | ✅ |

---

## 🚀 Prochaines Améliorations Possibles

1. **Suggestion d'Absences**: Pré-remplir les congés annuels prévus
2. **Absences Récurrentes**: Congés réguliers (tous les vendredis du mois, etc.)
3. **Préférences de Collègues**: Permettre des préférences (pas le matin tôt, etc.)
4. **Notifs**: Rappeler quand c'est votre tour dans 2 jours
5. **Export PDF**: Générer un PDF imprimable du planning
6. **API Gemini**: Utiliser l'IA pour suggérer des optimisations

---

## 🎯 Conclusion

Vous pouvez maintenant:
✅ **Choisir le nombre de semaines** à l'avance (1-12)
✅ **Gérer les absences** simplement
✅ **Voir les mises à jour automatiques** du planning
✅ **Forcer des assignations manuelles** si nécessaire
✅ **Synchroniser en équipe** via Firestore

L'application recalcule **instantanément** à chaque changement! 🎉

---

*Documentation des modifications - Juin 2026*
