# @quiz-engine/player-app

Application joueur (mobile-first) : rejoindre par pseudo, répondre aux
questions, voir le résultat de chaque question et le classement final.

## Lancer (en plus du serveur et éventuellement de host-app)

Depuis la racine du monorepo :

```bash
npm run dev --workspace=@quiz-engine/player-app
```

Ouvre `http://localhost:5174` sur ton téléphone (même réseau WiFi que le
serveur) — ou passe par le lien/QR code généré par host-app en pointant vers
`/play` une fois le build de production servi par `packages/server`.

## Ce qui est géré

- Pseudo + sélection d'équipe si `teams.enabled: true` dans le quiz
- Les 6 types de questions (`boolean`, `choice`, `image`, `text`, `number`, `music`)
- Un joueur qui rejoint après le début de la partie est accepté avec un score de départ à 0
- Résultat par question (correct / incorrect / en attente de validation manuelle) et classement final

## Reprise de session

Si la page est rechargée en cours de partie (verrouillage d'écran, navigation
accidentelle), l'id du joueur est retrouvé automatiquement via `localStorage`
et une reprise silencieuse est tentée auprès du serveur avant d'afficher
l'écran de connexion. Si le serveur ne reconnaît plus cet id (redémarré pour
un nouvel événement, par exemple), le joueur retombe normalement sur l'écran
de pseudo.

Limite : si le même navigateur (donc le même `localStorage`) est utilisé
pour rejoindre deux fois de suite sans vider le cache, la seconde reprise
réutilisera le même id de joueur plutôt que d'en créer un nouveau — cas de
bord rare, pas géré spécifiquement.