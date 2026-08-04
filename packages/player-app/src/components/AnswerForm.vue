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
  if (/^https?:\/\//.test(source)) return source;
  return `/quiz-media/${source.replace(/^\.?\//, '')}`;
}

/** Extrait l'id d'une vidéo YouTube depuis les formats d'URL les plus courants. */
function youtubeVideoId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const youtubeEmbedUrl = computed(() => {
  const media = props.question.media;
  if (!media || media.type !== 'youtube' || !media.url) return null;
  const videoId = youtubeVideoId(media.url);
  if (!videoId) return null;
  const start = media.clip?.start ? `?start=${Math.floor(media.clip.start)}` : '';
  return `https://www.youtube.com/embed/${videoId}${start}`;
});

// État local du brouillon de réponse — remis à zéro à chaque nouvelle question.
const selectedChoices = ref<string[]>([]);
const textValue = ref('');
const numberValue = ref<number | null>(null);

watch(
  () => props.question.id,
  () => {
    selectedChoices.value = [];
    textValue.value = '';
    numberValue.value = null;
  }
);

function toggleChoice(optionText: string) {
  if (props.disabled) return;
  const answer = props.question.answer;
  if (answer.mode !== 'choice') return;

  if (answer.multiple) {
    const idx = selectedChoices.value.indexOf(optionText);
    if (idx === -1) selectedChoices.value.push(optionText);
    else selectedChoices.value.splice(idx, 1);
  } else {
    selectedChoices.value = [optionText];
  }
}

const canSubmit = computed(() => {
  const answer = props.question.answer;
  switch (answer.mode) {
    case 'boolean':
      return true; // les boutons Vrai/Faux soumettent directement
    case 'choice':
      return selectedChoices.value.length > 0;
    case 'text':
      return textValue.value.trim().length > 0;
    case 'number':
      return numberValue.value !== null;
    default:
      return false;
  }
});

function submitBoolean(value: boolean) {
  if (props.disabled) return;
  emit('submit', value);
}

function submitChoiceOption(optionText: string) {
  const answer = props.question.answer;
  if (answer.mode === 'choice' && !answer.multiple) {
    if (props.disabled) return;
    emit('submit', [optionText]); // choix unique : envoi direct au clic, comme boolean
    return;
  }
  toggleChoice(optionText);
}

function submitCurrentDraft() {
  if (props.disabled || !canSubmit.value) return;
  const answer = props.question.answer;
  if (answer.mode === 'choice') emit('submit', selectedChoices.value);
  else if (answer.mode === 'text') emit('submit', textValue.value.trim());
  else if (answer.mode === 'number') emit('submit', numberValue.value);
}
</script>

<template>
  <div class="answer-form">
    <!-- MÉDIA — indépendant du format de réponse, affiché s'il est présent -->
    <div v-if="question.media" class="media-block">
      <img
        v-if="question.media.type === 'image' && question.media.source"
        :src="resolveMediaUrl(question.media.source)"
        alt=""
        class="question-image"
      />
      <audio
        v-else-if="question.media.type === 'audio' && question.media.source"
        controls
        :src="resolveMediaUrl(question.media.source)"
        class="question-audio"
      />
      <iframe
        v-else-if="question.media.type === 'youtube' && youtubeEmbedUrl"
        class="question-youtube"
        :src="youtubeEmbedUrl"
        title="Extrait vidéo"
        allow="autoplay; encrypted-media"
        allowfullscreen
      />
      <a
        v-else-if="question.media.type === 'youtube' && question.media.url"
        :href="question.media.url"
        target="_blank"
        rel="noopener"
        class="youtube-fallback-link"
      >
        ▶ Écouter sur YouTube
      </a>
    </div>

    <!-- BOOLEAN -->
    <div v-if="question.answer.mode === 'boolean'" class="boolean-buttons">
      <button class="btn-option bool-btn" :disabled="disabled" @click="submitBoolean(true)">Vrai</button>
      <button class="btn-option bool-btn" :disabled="disabled" @click="submitBoolean(false)">Faux</button>
    </div>

    <!-- CHOICE -->
    <div v-else-if="question.answer.mode === 'choice'" class="choice-list">
      <button
        v-for="option in question.answer.options"
        :key="option.text"
        class="btn-option"
        :class="{ selected: selectedChoices.includes(option.text) }"
        :disabled="disabled"
        @click="submitChoiceOption(option.text)"
      >
        {{ option.text }}
      </button>
      <button
        v-if="question.answer.multiple"
        class="btn-primary submit-btn"
        :disabled="disabled || !canSubmit"
        @click="submitCurrentDraft"
      >
        Valider
      </button>
    </div>

    <!-- TEXT -->
    <div v-else-if="question.answer.mode === 'text'" class="text-input-block">
      <input v-model="textValue" type="text" placeholder="Ta réponse" :disabled="disabled" autocomplete="off" />
      <button class="btn-primary submit-btn" :disabled="disabled || !canSubmit" @click="submitCurrentDraft">
        Valider
      </button>
    </div>

    <!-- NUMBER -->
    <div v-else-if="question.answer.mode === 'number'" class="number-block">
      <input
        v-model.number="numberValue"
        type="number"
        :min="question.answer.range.min"
        :max="question.answer.range.max"
        :placeholder="`Entre ${question.answer.range.min} et ${question.answer.range.max}`"
        :disabled="disabled"
      />
      <input
        v-if="numberValue !== null"
        v-model.number="numberValue"
        type="range"
        :min="question.answer.range.min"
        :max="question.answer.range.max"
        :disabled="disabled"
        class="range-slider"
      />
      <button class="btn-primary submit-btn" :disabled="disabled || !canSubmit" @click="submitCurrentDraft">
        Valider
      </button>
    </div>
  </div>
</template>

<style scoped>
.answer-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.media-block {
  margin-bottom: 0.5rem;
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

.question-audio {
  width: 100%;
}

.question-youtube {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: var(--radius-md);
}

.youtube-fallback-link {
  display: inline-block;
  color: var(--color-plum);
  font-weight: 600;
  text-decoration: none;
  padding: 0.75rem 0;
}

.range-slider {
  width: 100%;
  accent-color: var(--color-plum);
}

.submit-btn {
  margin-top: 0.4rem;
}
</style>
