<script setup lang="ts">
import { computed } from 'vue';
import type { Question, Answer, Player, GameState } from '@quiz-engine/core';

const props = defineProps<{
  question: Question;
  state: GameState;
  answers: Answer[];
  players: Player[];
  isLastQuestion: boolean;
  busy: boolean;
}>();

const emit = defineEmits<{
  lock: [];
  correct: [];
  next: [];
  validate: [playerId: string, isCorrect: boolean];
}>();

const answeredCount = computed(() => props.answers.length);
const correctCount = computed(() => props.answers.filter((a) => a.isCorrect === true).length);
const isManualQuestion = computed(
  () => props.question.answer.mode === 'text' && props.question.answer.correction === 'manual'
);

function nickname(playerId: string): string {
  return props.players.find((p) => p.id === playerId)?.nickname ?? '—';
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Vrai' : 'Faux';
  return String(value);
}

function resolveMediaUrl(source: string): string {
  if (/^https?:\/\//.test(source)) return source;
  return `/quiz-media/${source.replace(/^\.?\//, '')}`;
}

const correctAnswerLabel = computed(() => {
  const answer = props.question.answer;
  switch (answer.mode) {
    case 'boolean':
      return answer.value ? 'Vrai' : 'Faux';
    case 'choice':
      return answer.options.filter((o) => o.correct).map((o) => o.text).join(', ');
    case 'text':
      return answer.correction === 'manual' ? 'Validation manuelle' : (answer.accepted ?? []).join(' / ');
    case 'number':
      return `${answer.value} (± ${answer.tolerance})`;
    default:
      return '';
  }
});
</script>

<template>
  <section class="card question-panel">
    <!-- Aperçu du média pour l'animateur (image seulement pour l'instant —
         l'audio/YouTube reste à lancer manuellement par l'animateur). -->
    <img
      v-if="question.media?.type === 'image' && question.media.source"
      :src="resolveMediaUrl(question.media.source)"
      alt=""
      class="media-preview"
    />

    <div class="meta">
      <span class="type-tag">{{ question.answer.mode }}</span>
      <span v-if="question.media" class="media-tag">{{ question.media.type }}</span>
      <span class="points">{{ question.points }} pt{{ question.points > 1 ? 's' : '' }}</span>
    </div>

    <h2 class="prompt">{{ question.title }}</h2>

    <!-- EN COURS : compteur de réponses en direct -->
    <div v-if="state === 'question_active'" class="active-state">
      <p class="counter">
        <span class="mono-chip">{{ answeredCount }} / {{ players.length }}</span> ont répondu
      </p>
      <button class="btn-primary" :disabled="busy" @click="emit('lock')">Verrouiller la question</button>
    </div>

    <!-- VERROUILLÉE : en attente de passer à la correction -->
    <div v-else-if="state === 'question_locked'" class="locked-state">
      <p class="counter"><span class="mono-chip">{{ answeredCount }} / {{ players.length }}</span> réponses reçues</p>
      <button class="btn-primary" :disabled="busy" @click="emit('correct')">Voir la correction</button>
    </div>

    <!-- CORRECTION -->
    <div v-else-if="state === 'correction'" class="correction-state">
      <p class="correct-answer">
        Bonne réponse : <strong>{{ correctAnswerLabel }}</strong>
      </p>

      <p v-if="!isManualQuestion" class="score-summary">{{ correctCount }} / {{ answeredCount }} bonnes réponses</p>

      <div v-if="isManualQuestion" class="manual-list">
        <p v-if="answers.length === 0" class="empty">Aucune réponse reçue pour cette question.</p>
        <div v-for="answer in answers" :key="answer.playerId" class="manual-row">
          <span class="manual-nickname">{{ nickname(answer.playerId) }}</span>
          <span class="manual-value">« {{ formatValue(answer.value) }} »</span>
          <div class="manual-actions">
            <button
              class="chip-btn chip-yes"
              :class="{ active: answer.isCorrect === true }"
              @click="emit('validate', answer.playerId, true)"
            >
              Correct
            </button>
            <button
              class="chip-btn chip-no"
              :class="{ active: answer.isCorrect === false }"
              @click="emit('validate', answer.playerId, false)"
            >
              Incorrect
            </button>
          </div>
        </div>
      </div>

      <button class="btn-primary next-btn" :disabled="busy" @click="emit('next')">
        {{ isLastQuestion ? 'Voir le classement final' : 'Question suivante' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.question-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.type-tag {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-plum);
  background: var(--color-plum-soft);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.media-tag {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink-soft);
  background: var(--color-sage-soft);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.media-preview {
  display: block;
  max-width: 100%;
  max-height: 180px;
  margin: 0 auto;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.points {
  font-size: 0.8rem;
  color: var(--color-ink-soft);
}

.prompt {
  font-size: 1.7rem;
  line-height: 1.25;
}

.counter {
  color: var(--color-ink-soft);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.active-state,
.locked-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.correction-state {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.correct-answer {
  font-size: 1.05rem;
  margin: 0;
  color: var(--color-ink);
}

.correct-answer strong {
  color: var(--color-sage);
}

.score-summary {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: 0.9rem;
}

.manual-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.empty {
  color: var(--color-ink-soft);
  font-size: 0.9rem;
}

.manual-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  background: var(--color-cream);
  border-radius: var(--radius-md);
}

.manual-nickname {
  font-weight: 600;
  min-width: 100px;
}

.manual-value {
  flex: 1;
  color: var(--color-ink-soft);
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manual-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.chip-btn {
  font-size: 0.8rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  color: var(--color-ink-soft);
}

.chip-yes.active {
  background: var(--color-sage);
  color: white;
  border-color: var(--color-sage);
}

.chip-no.active {
  background: var(--color-error);
  color: white;
  border-color: var(--color-error);
}

.next-btn {
  align-self: flex-start;
  margin-top: 0.25rem;
}
</style>
