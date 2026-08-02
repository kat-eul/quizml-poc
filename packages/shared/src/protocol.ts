import type { GameSnapshot, SubmitAnswerResult } from '@quiz-engine/core';
import type { Player, Team } from '@quiz-engine/core';

/**
 * Contrat des événements WebSocket entre le serveur et les clients.
 * Ce fichier est la SEULE source de vérité pour le nom et la forme des
 * événements — host-app et player-app doivent l'importer plutôt que de
 * redéfinir des types équivalents en local.
 */

// --- Émis par un joueur (player-app) ---
export interface PlayerJoinPayload {
  nickname: string;
  teamId?: string;
}

export interface PlayerAnswerPayload {
  value: unknown;
}

// --- Émis par l'animateur (host-app) — namespace 'host' uniquement ---
export interface HostValidateManualAnswerPayload {
  playerId: string;
  isCorrect: boolean;
}

export interface HostAddTeamPayload {
  name: string;
}

export interface HostAssignTeamPayload {
  playerId: string;
  teamId: string;
}

export interface PlayerRejoinPayload {
  playerId: string;
}

/** Événements que le client (joueur) peut émettre vers le serveur. */
export interface PlayerToServerEvents {
  'player:join': (payload: PlayerJoinPayload, ack: (result: PlayerJoinAck) => void) => void;
  'player:rejoin': (payload: PlayerRejoinPayload, ack: (result: PlayerJoinAck) => void) => void;
  'player:answer': (payload: PlayerAnswerPayload, ack: (result: SubmitAnswerResult) => void) => void;
}

export interface PlayerJoinAck {
  accepted: boolean;
  reason?: string;
  player?: Player;
}

/** Événements que l'animateur peut émettre vers le serveur. */
export interface HostToServerEvents {
  'host:startGame': (ack: (result: HostActionAck) => void) => void;
  'host:lockQuestion': (ack: (result: HostActionAck) => void) => void;
  'host:enterCorrection': (ack: (result: HostActionAck) => void) => void;
  'host:nextQuestion': (ack: (result: HostActionAck) => void) => void;
  'host:validateManualAnswer': (payload: HostValidateManualAnswerPayload, ack: (result: HostActionAck) => void) => void;
  'host:addTeam': (payload: HostAddTeamPayload, ack: (result: { team?: Team } & HostActionAck) => void) => void;
  'host:assignPlayerToTeam': (payload: HostAssignTeamPayload, ack: (result: HostActionAck) => void) => void;
}

export interface HostActionAck {
  accepted: boolean;
  reason?: string;
}

/** Événements diffusés par le serveur à tous les clients (joueurs + animateur). */
export interface ServerToClientEvents {
  'game:snapshot': (snapshot: GameSnapshot) => void;
  'game:error': (payload: { message: string }) => void;
}