<script setup lang="ts">
import { computed } from 'vue';
import GarlandDivider from './components/GarlandDivider.vue';
import JoinPanel from './components/JoinPanel.vue';
import QuestionPanel from './components/QuestionPanel.vue';
import PlayerSidebar from './components/PlayerSidebar.vue';
import PodiumView from './components/PodiumView.vue';
import { useHostGame } from './composables/useHostGame';

const { snapshot, connected, joinInfo, lastError, actions } = useHostGame();

const questionCounterLabel = computed(() => {
  if (!snapshot.value || snapshot.value.state === 'lobby') return null;
  return `Q ${snapshot.value.currentQuestionIndex + 1} / ${snapshot.value.totalQuestions}`;
});

const isLastQuestion = computed(
  () => !!snapshot.value && snapshot.value.currentQuestionIndex >= snapshot.value.totalQuestions - 1
);
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-top">
        <h1 v-if="snapshot">{{ snapshot.quizTitle }}</h1>
        <h1 v-else>Chargement…</h1>
        <div class="header-right">
          <span v-if="questionCounterLabel" class="mono-chip">{{ questionCounterLabel }}</span>
          <span class="connection-dot" :class="{ offline: !connected }" :title="connected ? 'Connecté' : 'Déconnecté'" />
        </div>
      </div>
      <GarlandDivider />
    </header>

    <p v-if="lastError" class="error-banner">{{ lastError }}</p>

    <main v-if="snapshot" class="layout">
      <div class="main-col">
        <JoinPanel
          v-if="snapshot.state === 'lobby'"
          :join-url="joinInfo?.url ?? null"
          :qr-code-data-url="joinInfo?.qrCodeDataUrl ?? null"
          :player-count="snapshot.players.length"
          :starting="false"
          @start="actions.startGame()"
        />

        <QuestionPanel
          v-else-if="snapshot.currentQuestion && snapshot.state !== 'finished'"
          :question="snapshot.currentQuestion"
          :state="snapshot.state"
          :answers="snapshot.currentQuestionAnswers"
          :players="snapshot.players"
          :is-last-question="isLastQuestion"
          :busy="false"
          @lock="actions.lockQuestion()"
          @correct="actions.enterCorrection()"
          @next="actions.nextQuestion()"
          @validate="(playerId, isCorrect) => actions.validateManualAnswer(playerId, isCorrect)"
        />

        <PodiumView
          v-else-if="snapshot.state === 'finished'"
          :players="snapshot.players"
          :teams="snapshot.teams"
          :teams-enabled="snapshot.teamsEnabled"
        />
      </div>

      <PlayerSidebar
        :players="snapshot.players"
        :teams="snapshot.teams"
        :teams-enabled="snapshot.teamsEnabled"
        :current-question-answers="snapshot.currentQuestionAnswers"
        :show-answered-indicator="snapshot.state === 'question_active' || snapshot.state === 'question_locked'"
      />
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2.5rem 2rem 4rem;
}

.header-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

h1 {
  font-size: 2rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.connection-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-sage);
}

.connection-dot.offline {
  background: var(--color-error);
}

.error-banner {
  background: var(--color-error-soft);
  color: var(--color-error);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
