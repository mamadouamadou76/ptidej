/**
 * Attribue le custom claim { admin: true } à un utilisateur Firebase Auth.
 *
 * Prérequis — une des deux options :
 *   1. Clé de service locale :
 *      Firebase Console → Paramètres du projet → Comptes de service
 *      → Générer une nouvelle clé privée → enregistrer sous scripts/serviceAccountKey.json
 *      (ce fichier est dans .gitignore, ne jamais le committer)
 *
 *   2. Variable d'environnement :
 *      GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccountKey.json
 *
 * Utilisation :
 *   node scripts/set-admin.mjs mamadouamadou76@gmail.com
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'ptidej-f26a2';

const email = process.argv[2];
if (!email) {
  console.error('Usage : node scripts/set-admin.mjs <email>');
  process.exit(1);
}

// Résolution des credentials
let credential;
const localKeyPath = resolve(__dirname, 'serviceAccountKey.json');

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const { applicationDefault } = await import('firebase-admin/app');
  credential = applicationDefault();
} else if (existsSync(localKeyPath)) {
  const serviceAccount = JSON.parse(readFileSync(localKeyPath, 'utf8'));
  credential = cert(serviceAccount);
} else {
  console.error([
    '',
    'Aucune credential trouvée. Deux options :',
    '',
    '  Option 1 — clé de service locale :',
    '    Firebase Console → Paramètres du projet → Comptes de service',
    '    → Générer une nouvelle clé privée',
    '    → Enregistrer sous : scripts/serviceAccountKey.json',
    '',
    '  Option 2 — variable d\'environnement :',
    '    GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccountKey.json \\',
    '    node scripts/set-admin.mjs <email>',
    '',
  ].join('\n'));
  process.exit(1);
}

initializeApp({ credential, projectId: PROJECT_ID });

try {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`✓ Claim { admin: true } attribué à ${email} (uid : ${user.uid})`);
  console.log('  L\'utilisateur doit se reconnecter pour que le claim soit actif dans son token.');
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.error(`✗ Aucun utilisateur trouvé avec l'email : ${email}`);
  } else {
    console.error('✗ Erreur :', err.message);
  }
  process.exit(1);
}
