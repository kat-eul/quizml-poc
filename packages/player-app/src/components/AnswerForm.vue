<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Question } from '@quiz-engine/core';

const props = defineProps<{
  question: Question;
  disabled: boolean;
}>();

const emit = defineEmits<{ submit: [value: unknown] }>();

/**
 * Un chemin comme "./images/bebe.jpg" dans le YAML est relatif au dossier
 * quizzes/ côté serveur, pas une URL web. Le serveur sert ce dossier sous
 * /quiz-media (voir packages/server/src/index.ts) — on reconstruit donc
 * l'URL réelle ici plutôt que d'utiliser la valeur du YAML telle quelle.
 */
function resolveMediaUrl(source: string): string {
  if (/^https?:\/\//.test(source)) return source; // URL déjà absolue (rare, mais on ne casse pas ce cas)
  return `/quiz-media/${source.replace(/^\.?\//, '')}`;
}

// État local du brouillon de réponse — remis à zéro à chaque nouvelle question.
const selectedChoices = ref<string[]>([]);
const textValue = ref('');
const numberValue = ref<number | null>(null);
const musicChoice = ref<string | null>(null);

watch(
    () => props.question.id,
    () => {
      selectedChoices.value = [];
      textValue.value = '';
      numberValue.value = null;
      musicChoice.value = null;
    }
);

function toggleChoice(optionText: string) {
  if (props.disabled) return;
  const q = props.question;
  if (q.type !== 'choice') return;

  if (q.multiple) {
    const idx = selectedChoices.value.indexOf(optionText);
    if (idx === -1) selectedChoices.value.push(optionText);
    else selectedChoices.value.splice(idx, 1);
  } else {
    selectedChoices.value = [optionText];
  }
}

const canSubmit = computed(() => {
  const q = props.question;
  switch (q.type) {
    case 'boolean':
      return true; // les boutons Vrai/Faux soumettent directement
    case 'choice':
      return selectedChoices.value.length > 0;
    case 'image':
    case 'text':
      return textValue.value.trim().length > 0;
    case 'number':
      return numberValue.value !== null;
    case 'music':
      return q.answer.mode === 'choice' ? musicChoice.value !== null : textValue.value.trim().length > 0;
    default:
      return false;
  }
});

function submitBoolean(value: boolean) {
  if (props.disabled) return;
  emit('submit', value);
}

function submitChoiceOrMusicChoice(value: string) {
  musicChoice.value = value;
  if (props.disabled) return;
  emit('submit', value);
}

function submitCurrentDraft() {
  if (props.disabled || !canSubmit.value) return;
  const q = props.question;
  if (q.type === 'choice') emit('submit', selectedChoices.value);
  else if (q.type === 'image' || q.type === 'text') emit('submit', textValue.value.trim());
  else if (q.type === 'number') emit('submit', numberValue.value);
  else if (q.type === 'music' && q.answer.mode === 'text') emit('submit', textValue.value.trim());
}
</script>

<template>
  <div class="answer-form">
    <!-- BOOLEAN -->
    <div v-if="question.type === 'boolean'" class="boolean-buttons">
      <button class="btn-option bool-btn" :disabled="disabled" @click="submitBoolean(true)">Vrai</button>
      <button class="btn-option bool-btn" :disabled="disabled" @click="submitBoolean(false)">Faux</button>
    </div>

    <!-- CHOICE -->
    <div v-else-if="question.type === 'choice'" class="choice-list">
      <button
          v-for="option in question.options"
          :key="option.text"
          class="btn-option"
          :class="{ selected: selectedChoices.includes(option.text) }"
          :disabled="disabled"
          @click="toggleChoice(option.text)"
      >
        {{ option.text }}
      </button>
      <button class="btn-primary submit-btn" :disabled="disabled || !canSubmit" @click="submitCurrentDraft">
        Valider
      </button>
    </div>

    <!-- IMAGE : deviner à partir de la photo -->
    <div v-else-if="question.type === 'image'" class="text-input-block">
      <img v-if="question.media.source" :src="resolveMediaUrl(question.media.source)" alt="" class="question-image" />
      <input v-model="textValue" type="text" placeholder="Ta réponse" :disabled="disabled" autocomplete="off" />
      <button class="btn-primary submit-btn" :disabled="disabled || !canSubmit" @click="submitCurrentDraft">
        Valider
      </button>
    </div>

    <!-- TEXT -->
    <div v-else-if="question.type === 'text'" class="text-input-block">
      <input v-model="textValue" type="text" placeholder="Ta réponse" :disabled="disabled" autocomplete="off" />
      <button class="btn-primary submit-btn" :disabled="disabled || !canSubmit" @click="submitCurrentDraft">
        Valider
      </button>
    </div>

    <!-- NUMBER -->
    <div v-else-if="question.type === 'number'" class="number-block">
      <input
          v-model.number="numberValue"
          type="number"
          :min="question.range.min"
          :max="question.range.max"
          :placeholder="`Entre ${question.range.min} et ${question.range.max}`"
          :disabled="disabled"
      />
      <input
          v-if="numberValue !== null"
          v-model.number="numberValue"
          type="range"
          :min="question.range.min"
          :max="question.range.max"
          :disabled="disabled"
          class="range-slider"
      />
      <button class="btn-primary submit-btn" :disabled="disabled || !canSubmit" @click="submitCurrentDraft">
        Valider
      </button>
    </div>

    <!-- MUSIC -->
    <div v-else-if="question.type === 'music'" class="music-block">
      <div v-if="question.answer.mode === 'choice'" class="choice-list">
        <button
            v-for="option in question.answer.options ?? []"
            :key="option.text"
            class="btn-option"
            :class="{ selected: musicChoice === option.text }"
            :disabled="disabled"
            @click="submitChoiceOrMusicChoice(option.text)"
        >
          {{ option.text }}
        </button>
      </div>
      <div v-else class="text-input-block">
        <input v-model="textValue" type="text" placeholder="Titre / artiste" :disabled="disabled" autocomplete="off" />
        <button class="btn-primary submit-btn" :disabled="disabled || !canSubmit" @click="submitCurrentDraft">
          Valider
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.answer-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.boolean-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.bool-btn {
  text-align: center;
  font-size: 1.1rem;
  padding: 1.5rem 1rem;
}

.choice-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.text-input-block,
.number-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-image {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 200px;
  margin: 0 auto;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.range-slider {
  width: 100%;
  accent-color: var(--color-plum);
}

.submit-btn {
  margin-top: 0.4rem;
}
</style>