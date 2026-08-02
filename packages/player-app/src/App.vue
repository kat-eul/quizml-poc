<script setup lang="ts">
import { computed, ref } from 'vue';
import JoinScreen from './components/JoinScreen.vue';
import WaitingScreen from './components/WaitingScreen.vue';
import AnswerForm from './components/AnswerForm.vue';
import AnswerResult from './components/AnswerResult.vue';
import FinalResult from './components/FinalResult.vue';
import { usePlayerGame } from './composables/usePlayerGame';

const {
  snapshot,
  connected,
  player,
  joinError,
  restoringSession,
  hasAnsweredCurrentQuestion,
  myCurrentAnswer,
  myRank,
  join,
  submitAnswer,
} = usePlayerGame();

const joining = ref(false);

async function handleJoin(nickname: string, teamId?: string) {
  joining.value = true;
  await join(nickname, teamId);
  joining.value = false;
}

const myLiveScore = computed(() => {
  if (!snapshot.value || !player.value) return 0;
  return snapshot.value.players.find((p) => p.id === player.value!.id)?.score ?? 0;
});
</script>

<template>
  <div class="app-shell">
    <span class="connection-dot" :class="{ offline: !connected }" />

    <WaitingScreen v-if="restoringSession" message="Reconnexion à la partie…" />

    <JoinScreen
        v-else-if="!player"
        :quiz-title="snapshot?.quizTitle ?? 'Quiz'"
        :teams-enabled="snapshot?.teamsEnabled ?? false"
        :teams="snapshot?.teams ?? []"
        :joining="joining"
        :error="joinError"
        @join="handleJoin"
    />

    <template v-else-if="snapshot">
      <WaitingScreen v-if="snapshot.state === 'lobby'" message="La partie va bientôt commencer…" />

      <template v-else-if="snapshot.state === 'question_active' && snapshot.currentQuestion">
        <WaitingScreen v-if="hasAnsweredCurrentQuestion" message="Réponse envoyée. En attente des autres joueurs…" />
        <div v-else class="question-block">
          <p class="question-counter">Question {{ snapshot.currentQuestionIndex + 1 }} / {{ snapshot.totalQuestions }}</p>
          <h2 class="question-title">{{ snapshot.currentQuestion.title }}</h2>
          <AnswerForm :question="snapshot.currentQuestion" :disabled="hasAnsweredCurrentQuestion" @submit="submitAnswer" />
        </div>
      </template>

      <WaitingScreen
          v-else-if="snapshot.state === 'question_locked'"
          message="Question verrouillée. La correction arrive…"
      />

      <AnswerResult
          v-else-if="snapshot.state === 'correction' && snapshot.currentQuestion"
          :my-answer="myCurrentAnswer"
          :points="snapshot.currentQuestion.points"
          :score="myLiveScore"
      />

      <FinalResult
          v-else-if="snapshot.state === 'finished'"
          :rank="myRank"
          :total-players="snapshot.players.length"
          :score="myLiveScore"
      />
    </template>

    <WaitingScreen v-else message="Connexion…" />
  </div>
</template>

<style scoped>
.app-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.connection-dot {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-sage);
  z-index: 10;
}

.connection-dot.offline {
  background: var(--color-error);
}

.question-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  gap: 0.5rem;
}

.question-counter {
  font-size: 0.85rem;
  color: var(--color-ink-soft);
  margin: 0;
}

.question-title {
  font-size: 1.4rem;
  line-height: 1.3;
  margin: 0 0 1rem;
}
</style>