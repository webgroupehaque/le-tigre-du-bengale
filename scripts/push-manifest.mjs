// Publie site.manifest.json dans restaurants.content_manifest du projet client.
// À lancer par Rekvo (clé service_role du client, jamais commitée) :
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… RESTAURANT_ID=… npm run manifest:push
// Lit aussi .env à la racine du site si présent.
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(process.cwd());
for (const f of ['.env', '.env.local']) {
  const p = path.join(root, f);
  if (fs.existsSync(p))
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
    }
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const RESTAURANT_ID = process.env.RESTAURANT_ID || process.env.VITE_RESTAURANT_ID;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESTAURANT_ID) {
  console.error('Variables manquantes : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESTAURANT_ID.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site.manifest.json'), 'utf8'));
const TYPES = new Set(['text', 'textarea', 'image', 'url', 'list']);
for (const f of manifest) {
  if (!f.key || !f.label || !TYPES.has(f.type)) {
    console.error('Champ invalide dans site.manifest.json :', f);
    process.exit(1);
  }
}
const keys = manifest.map((f) => f.key);
if (new Set(keys).size !== keys.length) {
  console.error('Clés en double dans site.manifest.json.');
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: r } = await db.from('restaurants').select('id').eq('id', RESTAURANT_ID).maybeSingle();
if (!r) {
  console.error(`Le restaurant « ${RESTAURANT_ID} » n'existe pas dans restaurants (créez-le d'abord).`);
  process.exit(1);
}
const { error } = await db.from('restaurants').update({ content_manifest: manifest }).eq('id', RESTAURANT_ID);
if (error) {
  console.error('Échec :', error.message);
  process.exit(1);
}
console.log(`Manifeste publié : ${manifest.length} champ(s) pour « ${RESTAURANT_ID} ». Le CMS Rekvo les affiche dans « Contenus ».`);
