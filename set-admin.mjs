/**
 * set-admin.mjs — Attribue le custom claim "admin: true" à un utilisateur Firebase.
 * Usage : node set-admin.mjs <email>
 *
 * Prérequis :
 *   npm install firebase-admin dotenv  (une fois, globalement ou dans le projet)
 *   Définir GOOGLE_APPLICATION_CREDENTIALS dans .env ou en variable d'env :
 *   GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccountKey.json
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('❌  GOOGLE_APPLICATION_CREDENTIALS non défini.');
  console.error('    Ajoutez-le dans .env ou en variable d\'environnement.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf8'));
} catch {
  console.error(`❌  Impossible de lire le fichier de clé : ${serviceAccountPath}`);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });

const email = process.argv[2];
if (!email) {
  console.error('❌  Aucun email fourni.');
  console.error('    Usage : node set-admin.mjs <email>');
  process.exit(1);
}

const adminAuth = getAuth();

try {
  const user = await adminAuth.getUserByEmail(email);
  await adminAuth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`✅  Claim admin positionné pour ${email}`);
  console.log(`    UID : ${user.uid}`);
  console.log('');
  console.log('ℹ️   L\'utilisateur devra se déconnecter puis se reconnecter');
  console.log('    pour que le token Firebase soit rafraîchi avec le nouveau claim.');
} catch (err) {
  if (err instanceof Error && err.message.includes('There is no user record')) {
    console.error(`❌  Aucun utilisateur trouvé pour l'email : ${email}`);
  } else {
    console.error('❌  Erreur :', err instanceof Error ? err.message : err);
  }
  process.exit(1);
}
