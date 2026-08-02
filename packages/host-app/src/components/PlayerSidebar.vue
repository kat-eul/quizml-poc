<script setup lang="ts">
import { computed } from 'vue';
import type { Player, Team, Answer } from '@quiz-engine/core';

const props = defineProps<{
  players: Player[];
  teams: Team[];
  teamsEnabled: boolean;
  currentQuestionAnswers: Answer[];
  showAnsweredIndicator: boolean;
}>();

const sortedPlayers = computed(() => [...props.players].sort((a, b) => b.score - a.score));

function hasAnswered(playerId: string): boolean {
  return props.currentQuestionAnswers.some((a) => a.playerId === playerId);
}

function teamName(teamId?: string): string | undefined {
  return props.teams.find((t) => t.id === teamId)?.name;
}
</script>

<template>
  <aside class="sidebar card">
    <h2 class="title">Joueurs <span class="count">{{ players.length }}</span></h2>

    <p v-if="players.length === 0" class="empty">Personne n'a encore rejoint.</p>

    <ul v-else class="list">
      <li v-for="player in sortedPlayers" :key="player.id" class="row">
        <span class="status-dot" :class="{ offline: !player.connected }" />
        <span class="nickname">{{ player.nickname }}</span>
        <span v-if="teamsEnabled && player.teamId" class="team-tag">{{ teamName(player.teamId) }}</span>
        <span v-if="showAnsweredIndicator" class="answered" :class="{ yes: hasAnswered(player.id) }">
          {{ hasAnswered(player.id) ? '✓' : '…' }}
        </span>
        <span class="score mono-chip">{{ player.score }}</span>
      </li>
    </ul>

    <template v-if="teamsEnabled && teams.length > 0">
      <h3 class="subtitle">Équipes</h3>
      <ul class="list">
        <li v-for="team in [...teams].sort((a, b) => b.score - a.score)" :key="team.id" class="row">
          <span class="nickname">{{ team.name }}</span>
          <span class="score mono-chip">{{ team.score }}</span>
        </li>
      </ul>
    </template>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: fit-content;
}

.title {
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-ink-soft);
}

.subtitle {
  font-size: 0.95rem;
  margin-top: 0.5rem;
  color: var(--color-ink-soft);
}

.empty {
  color: var(--color-ink-soft);
  font-size: 0.9rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radius-md);
  background: var(--color-cream);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-sage);
  flex-shrink: 0;
}

.status-dot.offline {
  background: var(--color-error);
}

.nickname {
  flex: 1;
  font-weight: 600;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-tag {
  font-size: 0.75rem;
  color: var(--color-plum);
  background: var(--color-plum-soft);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.answered {
  font-size: 0.85rem;
  color: var(--color-ink-soft);
  width: 1.2rem;
  text-align: center;
}

.answered.yes {
  color: var(--color-sage);
  font-weight: 700;
}

.score {
  min-width: 2.4rem;
  justify-content: center;
}
</style>
