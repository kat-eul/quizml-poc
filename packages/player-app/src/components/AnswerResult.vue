<script setup lang="ts">
import { computed } from 'vue';
import type { Answer } from '@quiz-engine/core';

const props = defineProps<{
  myAnswer: Answer | undefined;
  points: number;
  score: number;
}>();

const status = computed<'correct' | 'incorrect' | 'pending' | 'none'>(() => {
  if (!props.myAnswer) return 'none';
  if (props.myAnswer.isCorrect === true) return 'correct';
  if (props.myAnswer.isCorrect === false) return 'incorrect';
  return 'pending';
});
</script>

<template>
  <div class="result" :class="status">
    <p v-if="status === 'correct'" class="headline">Bonne réponse ! <span class="points">+{{ points }}</span></p>
    <p v-else-if="status === 'incorrect'" class="headline">Ce n'était pas ça.</p>
    <p v-else-if="status === 'pending'" class="headline">Réponse envoyée, en attente de validation.</p>
    <p v-else class="headline">Tu n'as pas répondu à cette question.</p>

    <p class="score">Ton score : <strong>{{ score }}</strong></p>
  </div>
</template>

<style scoped>
.result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.headline {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.correct .headline {
  color: var(--color-sage);
}

.incorrect .headline {
  color: var(--color-error);
}

.pending .headline,
.none .headline {
  color: var(--color-ink-soft);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 1.05rem;
}

.points {
  color: var(--color-gold);
}

.score {
  color: var(--color-ink-soft);
  margin: 0;
}
</style>
