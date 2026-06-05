import { readEnv } from '@/lib/env';

export async function register() {
  // Échoue bruyamment au démarrage si une variable d'environnement manque.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    readEnv(process.env);
  }
}
