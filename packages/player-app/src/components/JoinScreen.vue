<script setup lang="ts">
import { ref } from 'vue';
import type { Team } from '@quiz-engine/core';

const props = defineProps<{
  quizTitle: string;
  teamsEnabled: boolean;
  teams: Team[];
  joining: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ join: [nickname: string, teamId?: string] }>();

const nickname = ref('');
const selectedTeamId = ref<string | undefined>(undefined);

function handleSubmit() {
  const trimmed = nickname.value.trim();
  if (!trimmed) return;
  emit('join', trimmed, selectedTeamId.value);
}
</script>

<template>
  <div class="join-screen">
    <div class="intro">
      <h1>{{ quizTitle }}</h1>
      <p>Entre ton pseudo pour rejoindre la partie.</p>
    </div>

    <form class="form" @submit.prevent="handleSubmit">
      <input
        v-model="nickname"
        type="text"
        placeholder="Ton pseudo"
        maxlength="24"
        autocomplete="off"
        autofocus
      />

      <div v-if="teamsEnabled && teams.length > 0" class="team-picker">
        <p class="team-label">Ton équipe</p>
        <button
          v-for="team in teams"
          :key="team.id"
          type="button"
          class="btn-option"
          :class="{ selected: selectedTeamId === team.id }"
          @click="selectedTeamId = team.id"
        >
          {{ team.name }}
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="btn-primary" type="submit" :disabled="!nickname.trim() || joining">
        {{ joining ? 'Connexion…' : 'Rejoindre' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.join-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.5rem;
  gap: 2.5rem;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
}

.intro {
  text-align: center;
}

h1 {
  font-size: 1.7rem;
  margin-bottom: 0.5rem;
}

.intro p {
  color: var(--color-ink-soft);
  margin: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.team-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.team-label {
  font-size: 0.85rem;
  color: var(--color-ink-soft);
  margin: 0 0 0.15rem;
}

.error {
  color: var(--color-error);
  font-size: 0.9rem;
  margin: 0;
}
</style>
