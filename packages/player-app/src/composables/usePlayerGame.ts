import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { io, type Socket } from 'socket.io-client';
import type { GameSnapshot, Player, SubmitAnswerResult } from '@quiz-engine/core';

const STORAGE_KEY = 'quiz-engine:player-session';

/**
 * Toute la communication réseau de player-app passe par ce composable.
 * Contrairement à host-app, on garde une trace locale de "ai-je déjà
 * répondu à la question courante" — le serveur le sait aussi (il refuse une
 * deuxième réponse), mais on veut désactiver le formulaire côté joueur sans
 * attendre un aller-retour réseau.
 *
 * Reprise de session : l'id du joueur est gardé dans localStorage après un
 * join réussi. Au montage, si un id est présent, on tente un rejoin silencieux
 * avant d'afficher l'écran de connexion — utile si la page est rechargée en
 * cours de partie (verrouillage d'écran, navigation accidentelle...).
 */
export function usePlayerGame() {
  const snapshot = ref<GameSnapshot | null>(null);
  const connected = ref(false);
  const player = ref<Player | null>(null);
  const joinError = ref<string | null>(null);
  const hasAnsweredCurrentQuestion = ref(false);
  const lastAnswerResult = ref<SubmitAnswerResult | null>(null);
  const restoringSession = ref(false);

  let socket: Socket | null = null;

  // Si la question change (nouvel index), on réautorise à répondre.
  watch(
      () => snapshot.value?.currentQuestionIndex,
      () => {
        hasAnsweredCurrentQuestion.value = false;
        lastAnswerResult.value = null;
      }
  );

  function saveSession(p: Player): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ playerId: p.id }));
    } catch {
      // localStorage indisponible (navigation privée stricte, etc.) — tant pis, pas de reprise possible.
    }
  }

  function clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // rien à faire
    }
  }

  function attemptRejoin(): Promise<void> {
    return new Promise((resolve) => {
      let stored: { playerId: string } | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        stored = raw ? JSON.parse(raw) : null;
      } catch {
        stored = null;
      }

      if (!socket || !stored?.playerId) {
        resolve();
        return;
      }

      restoringSession.value = true;
      socket.emit('player:rejoin', { playerId: stored.playerId }, (result: { accepted: boolean; player?: Player }) => {
        if (result.accepted && result.player) {
          player.value = result.player;
        } else {
          clearSession(); // session expirée (serveur relancé, partie différente...)
        }
        restoringSession.value = false;
        resolve();
      });
    });
  }

  function join(nickname: string, teamId?: string): Promise<{ accepted: boolean; reason?: string }> {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ accepted: false, reason: 'Non connecté au serveur.' });
        return;
      }
      socket.emit(
          'player:join',
          { nickname, teamId },
          (result: { accepted: boolean; reason?: string; player?: Player }) => {
            if (result.accepted && result.player) {
              player.value = result.player;
              joinError.value = null;
              saveSession(result.player);
            } else {
              joinError.value = result.reason ?? "Impossible de rejoindre la partie.";
            }
            resolve(result);
          }
      );
    });
  }

  function submitAnswer(value: unknown): void {
    if (!socket || hasAnsweredCurrentQuestion.value) return;
    hasAnsweredCurrentQuestion.value = true; // optimiste : évite un double-tap pendant l'aller-retour réseau
    socket.emit('player:answer', { value }, (result: SubmitAnswerResult) => {
      lastAnswerResult.value = result;
      if (!result.accepted) hasAnsweredCurrentQuestion.value = false; // le serveur a refusé, on réautorise
    });
  }

  const myCurrentAnswer = computed(() => {
    if (!snapshot.value || !player.value) return undefined;
    return snapshot.value.currentQuestionAnswers.find((a) => a.playerId === player.value!.id);
  });

  const myRank = computed(() => {
    if (!snapshot.value || !player.value) return null;
    const sorted = [...snapshot.value.players].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex((p) => p.id === player.value!.id);
    return index === -1 ? null : index + 1;
  });

  onMounted(() => {
    socket = io('/player', { transports: ['websocket'] });
    socket.on('connect', () => {
      connected.value = true;
      if (!player.value) attemptRejoin();
    });
    socket.on('disconnect', () => {
      connected.value = false;
    });
    socket.on('game:snapshot', (s: GameSnapshot) => {
      snapshot.value = s;
    });
  });

  onUnmounted(() => {
    socket?.disconnect();
  });

  return {
    snapshot,
    connected,
    player,
    joinError,
    restoringSession,
    hasAnsweredCurrentQuestion,
    lastAnswerResult,
    myCurrentAnswer,
    myRank,
    join,
    submitAnswer,
  };
}