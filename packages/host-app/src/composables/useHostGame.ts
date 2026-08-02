import { onMounted, onUnmounted, ref } from 'vue';
import { io, type Socket } from 'socket.io-client';
import type { GameSnapshot } from '@quiz-engine/core';
import type { HostActionAck } from '@quiz-engine/shared';

interface JoinInfo {
  url: string;
  qrCodeDataUrl: string;
}

/**
 * Toute la communication réseau de host-app passe par ce composable.
 * Les composants ne parlent jamais directement à socket.io — ils lisent
 * `snapshot` (mis à jour à chaque `game:snapshot`) et appellent `actions.*`.
 */
export function useHostGame() {
  const snapshot = ref<GameSnapshot | null>(null);
  const connected = ref(false);
  const joinInfo = ref<JoinInfo | null>(null);
  const lastError = ref<string | null>(null);

  let socket: Socket | null = null;

  async function fetchJoinInfo(): Promise<void> {
    try {
      const res = await fetch('/api/join-info');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      joinInfo.value = await res.json();
    } catch (err) {
      lastError.value = "Impossible de récupérer le lien de participation.";
    }
  }

  function callAction(event: string, payload?: unknown): Promise<HostActionAck> {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ accepted: false, reason: 'Non connecté au serveur.' });
        return;
      }
      const handleAck = (result: HostActionAck) => {
        if (!result.accepted && result.reason) lastError.value = result.reason;
        else lastError.value = null;
        resolve(result);
      };
      if (payload === undefined) {
        socket.emit(event, handleAck);
      } else {
        socket.emit(event, payload, handleAck);
      }
    });
  }

  const actions = {
    startGame: () => callAction('host:startGame'),
    lockQuestion: () => callAction('host:lockQuestion'),
    enterCorrection: () => callAction('host:enterCorrection'),
    nextQuestion: () => callAction('host:nextQuestion'),
    validateManualAnswer: (playerId: string, isCorrect: boolean) =>
      callAction('host:validateManualAnswer', { playerId, isCorrect }),
    addTeam: (name: string) => callAction('host:addTeam', { name }),
    assignPlayerToTeam: (playerId: string, teamId: string) =>
      callAction('host:assignPlayerToTeam', { playerId, teamId }),
  };

  onMounted(() => {
    socket = io('/host', { transports: ['websocket'] });
    socket.on('connect', () => {
      connected.value = true;
    });
    socket.on('disconnect', () => {
      connected.value = false;
    });
    socket.on('game:snapshot', (s: GameSnapshot) => {
      snapshot.value = s;
    });
    socket.on('game:error', (payload: { message: string }) => {
      lastError.value = payload.message;
    });

    fetchJoinInfo();
  });

  onUnmounted(() => {
    socket?.disconnect();
  });

  return { snapshot, connected, joinInfo, lastError, actions };
}
