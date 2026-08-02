<script setup lang="ts">
import { computed } from 'vue';
import type { Player, Team } from '@quiz-engine/core';

const props = defineProps<{
  players: Player[];
  teams: Team[];
  teamsEnabled: boolean;
}>();

const ranked = computed(() => [...props.players].sort((a, b) => b.score - a.score));
const rankedTeams = computed(() => [...props.teams].sort((a, b) => b.score - a.score));

const medals = ['🥇', '🥈', '🥉'];
</script>

<template>
  <section class="card podium">
    <h2>Classement final</h2>

    <div v-if="teamsEnabled && teams.length > 0" class="team-podium">
      <div v-for="(team, i) in rankedTeams" :key="team.id" class="podium-row" :class="{ first: i === 0 }">
        <span class="medal">{{ medals[i] ?? `${i + 1}.` }}</span>
        <span class="name">{{ team.name }}</span>
        <span class="score mono-chip">{{ team.score }}</span>
      </div>
    </div>

    <div class="player-podium">
      <div v-for="(player, i) in ranked" :key="player.id" class="podium-row" :class="{ first: i === 0 }">
        <span class="medal">{{ medals[i] ?? `${i + 1}.` }}</span>
        <span class="name">{{ player.nickname }}</span>
        <span class="score mono-chip">{{ player.score }}</span>
      </div>
      <p v-if="ranked.length === 0" class="empty">Aucun joueur n'a participé.</p>
    </div>
  </section>
</template>

<style scoped>
.podium {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

h2 {
  font-size: 1.7rem;
}

.team-podium,
.player-podium {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.podium-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-cream);
}

.podium-row.first {
  background: var(--color-gold-soft);
}

.medal {
  font-size: 1.2rem;
  width: 2rem;
  text-align: center;
}

.name {
  flex: 1;
  font-weight: 600;
}

.empty {
  color: var(--color-ink-soft);
}
</style>
