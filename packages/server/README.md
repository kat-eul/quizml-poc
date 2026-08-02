# @quiz-engine/server

Serveur local (HTTP + WebSocket) qui charge un `.quiz.yml`, instancie le
`GameEngine` de `@quiz-engine/core`, et diffuse l'état de la partie aux
clients (host-app et player-app, pas encore créés à ce stade).

## Installation

Depuis la racine du monorepo (pas depuis `packages/server`), pour que les
workspaces npm résolvent correctement `@quiz-engine/core` et
`@quiz-engine/shared` :

```bash
cd quiz-engine
npm install
```

## Lancer le serveur

```bash
npm run dev:server
```

Ou directement depuis `packages/server` :

```bash
cd packages/server
npm run dev
```

Par défaut, il charge le seul fichier `.quiz.yml` trouvé dans
`packages/server/quizzes/` (le `gender-reveal.quiz.yml` d'exemple y est
déjà). Pour charger un autre fichier explicitement :

```bash
npm run dev -- ./quizzes/mon-autre-quiz.quiz.yml
```

Au démarrage, le serveur affiche l'IP locale à partager aux joueurs (ex.
`http://192.168.1.24:3000/play`) — assure-toi que l'ordinateur est bien
connecté au même réseau WiFi que les téléphones des joueurs.

## Vérifier que ça tourne

```bash
curl http://localhost:3000/api/join-info
```

Doit renvoyer `{ "url": "...", "qrCodeDataUrl": "data:image/png;base64,..." }`.

Pour tester le WebSocket sans encore avoir player-app, on peut utiliser
`wscat` ou un petit script socket.io-client — je fournirai un exemple si
besoin à l'étape suivante.

## Ce qui n'est PAS encore fait

- Servir les pages `/host` et `/play` (arrive avec les packages `host-app`
  et `player-app`)
- Persistance/reprise après crash serveur (hors scope, tout est en mémoire)
- Authentification du namespace `/host` (acceptable pour un usage réseau
  local privé, à revoir sinon)
