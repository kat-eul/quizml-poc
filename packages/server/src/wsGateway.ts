import type { Server } from 'socket.io';
import { GameEngineError } from '@quiz-engine/core';
import type {
  PlayerToServerEvents,
  HostToServerEvents,
  ServerToClientEvents,
  PlayerJoinAck,
  HostActionAck,
} from '@quiz-engine/shared';
import type { GameServer } from './gameServer.js';

/**
 * Deux namespaces Socket.IO :
 *   /player — utilisé par player-app (téléphones des joueurs)
 *   /host   — utilisé par host-app (ordinateur de l'animateur)
 *
 * Note sécurité : le réseau visé est un WiFi local privé (événement familial),
 * donc /host n'est pas authentifié pour l'instant — n'importe qui sur le même
 * réseau pourrait en théorie s'y connecter. Acceptable pour l'usage prévu,
 * mais à documenter si le projet évolue vers un contexte moins privé.
 */
export function setupWsGateway(io: Server, gameServer: GameServer): void {
  const playerNamespace = io.of('/player');
  const hostNamespace = io.of('/host');

  function broadcastSnapshot(): void {
    const snapshot = gameServer.engine.getSnapshot();
    playerNamespace.emit('game:snapshot', snapshot);
    hostNamespace.emit('game:snapshot', snapshot);
  }

  playerNamespace.on('connection', (socket) => {
    // Envoie l'état courant dès la connexion, avant même que le joueur ait
    // rejoint (utile pour afficher le titre du quiz, les équipes disponibles,
    // ou un message "partie déjà terminée" sur l'écran de join).
    socket.emit('game:snapshot', gameServer.engine.getSnapshot());

    socket.on(
        'player:join' as keyof PlayerToServerEvents,
        (payload: { nickname: string; teamId?: string }, ack: (result: PlayerJoinAck) => void) => {
          try {
            const player = gameServer.engine.addPlayer(payload.nickname, payload.teamId);
            gameServer.registerPlayerSocket(player.id, socket.id);
            socket.data.playerId = player.id;
            ack({ accepted: true, player });
            broadcastSnapshot();
          } catch (err) {
            ack({ accepted: false, reason: errorMessage(err) });
          }
        }
    );

    socket.on(
        'player:rejoin' as keyof PlayerToServerEvents,
        (payload: { playerId: string }, ack: (result: PlayerJoinAck) => void) => {
          const player = gameServer.engine.getPlayer(payload.playerId);
          if (!player) {
            // Id inconnu du moteur actuel (serveur relancé pour un nouvel événement,
            // ou partie différente) — le client doit retomber sur l'écran de join normal.
            ack({ accepted: false, reason: 'Session introuvable, merci de rejoindre à nouveau.' });
            return;
          }
          gameServer.registerPlayerSocket(player.id, socket.id);
          gameServer.engine.setPlayerConnected(player.id, true);
          socket.data.playerId = player.id;
          ack({ accepted: true, player });
          broadcastSnapshot();
        }
    );

    socket.on(
        'player:answer' as keyof PlayerToServerEvents,
        (payload: { value: unknown }, ack: (result: ReturnType<GameServer['engine']['submitAnswer']>) => void) => {
          const playerId = socket.data.playerId as string | undefined;
          if (!playerId) {
            ack({ accepted: false, reason: "Vous n'avez pas encore rejoint la partie." });
            return;
          }
          const result = gameServer.engine.submitAnswer(playerId, payload.value);
          ack(result);
          broadcastSnapshot();
        }
    );

    socket.on('disconnect', () => {
      gameServer.handlePlayerDisconnect(socket.id);
      broadcastSnapshot();
    });
  });

  hostNamespace.on('connection', (socket) => {
    // Envoie l'état courant dès la connexion (utile si l'animateur recharge la page)
    socket.emit('game:snapshot', gameServer.engine.getSnapshot());

    const guarded = (action: () => void, ack: (result: HostActionAck) => void) => {
      try {
        action();
        ack({ accepted: true });
        broadcastSnapshot();
      } catch (err) {
        ack({ accepted: false, reason: errorMessage(err) });
      }
    };

    socket.on('host:startGame' as keyof HostToServerEvents, (ack: (result: HostActionAck) => void) =>
        guarded(() => gameServer.engine.startGame(), ack)
    );

    socket.on('host:lockQuestion' as keyof HostToServerEvents, (ack: (result: HostActionAck) => void) =>
        guarded(() => gameServer.engine.lockCurrentQuestion(), ack)
    );

    socket.on('host:enterCorrection' as keyof HostToServerEvents, (ack: (result: HostActionAck) => void) =>
        guarded(() => gameServer.engine.enterCorrection(), ack)
    );

    socket.on('host:nextQuestion' as keyof HostToServerEvents, (ack: (result: HostActionAck) => void) =>
        guarded(() => gameServer.engine.nextQuestion(), ack)
    );

    socket.on(
        'host:validateManualAnswer' as keyof HostToServerEvents,
        (payload: { playerId: string; isCorrect: boolean }, ack: (result: HostActionAck) => void) =>
            guarded(() => gameServer.engine.validateManualAnswer(payload.playerId, payload.isCorrect), ack)
    );

    socket.on(
        'host:addTeam' as keyof HostToServerEvents,
        (payload: { name: string }, ack: (result: { team?: import('@quiz-engine/core').Team } & HostActionAck) => void) => {
          try {
            const team = gameServer.engine.addTeam(payload.name);
            ack({ accepted: true, team });
            broadcastSnapshot();
          } catch (err) {
            ack({ accepted: false, reason: errorMessage(err) });
          }
        }
    );

    socket.on(
        'host:assignPlayerToTeam' as keyof HostToServerEvents,
        (payload: { playerId: string; teamId: string }, ack: (result: HostActionAck) => void) =>
            guarded(() => gameServer.engine.assignPlayerToTeam(payload.playerId, payload.teamId), ack)
    );
  });
}

function errorMessage(err: unknown): string {
  if (err instanceof GameEngineError) return err.message;
  return err instanceof Error ? err.message : String(err);
}