import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import express from 'express';
import { Server } from 'socket.io';
import { resolveQuizPath, loadQuizOrExit } from './quizLoader.js';
import { generateJoinQrCode } from './network.js';
import { GameServer } from './gameServer.js';
import { setupWsGateway } from './wsGateway.js';

const PORT = Number(process.env.PORT ?? 3000);
const QUIZZES_DIR = resolve(process.cwd(), 'quizzes');

// On résout le dossier dist de chaque app via son nom de PACKAGE npm
// (@quiz-engine/host-app), pas via un chemin de dossier codé en dur —
// npm workspaces retrouve un package par le `name` de son package.json,
// indépendamment du nom réel du dossier sur le disque. Ça évite tout bug
// si un dossier a été renommé (host-app vs host_app, par ex.).
const require = createRequire(import.meta.url);

function resolveAppDist(packageName: string): string | null {
  try {
    const pkgJsonPath = require.resolve(`${packageName}/package.json`);
    return join(dirname(pkgJsonPath), 'dist');
  } catch {
    return null;
  }
}

const HOST_APP_DIST = resolveAppDist('@quiz-engine/host-app');
const PLAYER_APP_DIST = resolveAppDist('@quiz-engine/player-app');

/**
 * Sert le build de production d'une app Vite sous `mountPath`, avec repli
 * sur son index.html pour toute route non-fichier (utile si l'app ajoute un
 * jour du client-side routing). Si le build n'existe pas encore (dev sans
 * `npm run build`), affiche un message clair plutôt que de planter.
 */
function serveStaticApp(app: express.Express, mountPath: string, distDir: string | null, label: string): void {
  if (!distDir) {
    console.warn(`⚠️  Package '${label}' introuvable via node_modules. Relance 'npm install' à la racine du monorepo.`);
    app.get(`${mountPath}*`, (_req, res) => {
      res.status(503).send(`${label} est introuvable côté serveur (npm install manquant ou workspace cassé).`);
    });
    return;
  }

  const indexFile = join(distDir, 'index.html');

  if (!existsSync(indexFile)) {
    console.warn(
        `⚠️  ${label} n'est pas construit (${indexFile} introuvable). ` +
        `Lance 'npm run build' à la racine du monorepo, ou utilise son serveur de dev Vite en attendant.`
    );
    app.get(`${mountPath}*`, (_req, res) => {
      res.status(503).send(`${label} n'est pas encore construit. Lance 'npm run build' à la racine du monorepo.`);
    });
    return;
  }

  app.use(mountPath, express.static(distDir));
  app.get(`${mountPath}*`, (_req, res) => res.sendFile(indexFile));
}

async function main() {
  const explicitPath = process.argv[2];
  const quizPath = resolveQuizPath(QUIZZES_DIR, explicitPath);
  const quiz = loadQuizOrExit(quizPath);

  console.log(`✅ Quiz chargé : "${quiz.title}" (${quiz.questions.length} questions)`);

  const gameServer = new GameServer(quiz);

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }, // réseau local privé, pas d'exposition publique
  });

  setupWsGateway(io, gameServer);

  // Sert les fichiers médias référencés dans le .quiz.yml (images, etc.).
  // Convention : un chemin `source: "./images/bebe.jpg"` dans le YAML est
  // relatif au dossier quizzes/ (donc packages/server/quizzes/images/bebe.jpg),
  // et devient accessible à /quiz-media/images/bebe.jpg pour les clients.
  app.use('/quiz-media', express.static(QUIZZES_DIR));

  // TODO (host-app) : brancher ceci sur l'écran d'accueil animateur.
  app.get('/api/join-info', async (_req, res) => {
    try {
      const { url, qrCodeDataUrl } = await generateJoinQrCode(PORT);
      res.json({ url, qrCodeDataUrl });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  serveStaticApp(app, '/host', HOST_APP_DIST, 'host-app');
  serveStaticApp(app, '/play', PLAYER_APP_DIST, 'player-app');

  // L'animateur ouvre le serveur sur son propre ordinateur : "/" renvoie
  // directement vers l'écran de pilotage plutôt qu'une page vide.
  app.get('/', (_req, res) => res.redirect('/host'));

  httpServer.listen(PORT, async () => {
    console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
    try {
      const { url } = await generateJoinQrCode(PORT);
      console.log(`📱 Lien à partager aux joueurs : ${url}`);
    } catch (err) {
      console.warn(`⚠️  Impossible de déterminer l'IP locale : ${(err as Error).message}`);
    }
  });
}

main().catch((err) => {
  console.error('Erreur fatale au démarrage du serveur :', err);
  process.exit(1);
});