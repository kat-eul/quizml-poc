import { GameEngine, type Quiz } from '@quiz-engine/core';

/**
 * Le serveur ne gère qu'UNE SEULE partie active à la fois — cohérent avec
 * l'usage visé (un ordinateur = un événement = une partie). Si besoin de
 * plusieurs parties simultanées un jour, c'est ici qu'il faudrait passer
 * d'une instance unique à une Map<gameId, GameServer>.
 */
export class GameServer {
  readonly engine: GameEngine;
  readonly quiz: Quiz;

  /** playerId → socket.id, pour retrouver le socket d'un joueur si besoin d'un message ciblé. */
  private readonly playerSockets = new Map<string, string>();

  constructor(quiz: Quiz) {
    this.quiz = quiz;
    this.engine = new GameEngine(quiz);
  }

  registerPlayerSocket(playerId: string, socketId: string): void {
    this.playerSockets.set(playerId, socketId);
  }

  getSocketIdForPlayer(playerId: string): string | undefined {
    return this.playerSockets.get(playerId);
  }

  handlePlayerDisconnect(socketId: string): void {
    for (const [playerId, sid] of this.playerSockets.entries()) {
      if (sid === socketId) {
        this.engine.setPlayerConnected(playerId, false);
        return;
      }
    }
  }
}
