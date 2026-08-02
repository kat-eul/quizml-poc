<script setup lang="ts">
defineProps<{
  rank: number | null;
  totalPlayers: number;
  score: number;
}>();
</script>

<template>
  <div class="final">
    <p class="eyebrow">Partie terminée</p>
    <h1 v-if="rank === 1">Tu as gagné 🎉</h1>
    <h1 v-else-if="rank">{{ rank }}e place</h1>
    <h1 v-else>C'est fini</h1>
    <p class="detail">
      <span v-if="rank">sur {{ totalPlayers }} joueurs — </span>{{ score }} points
    </p>
  </div>
</template>

<style scoped>
.final {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-plum);
  margin: 0;
}

h1 {
  font-size: 2.1rem;
}

.detail {
  color: var(--color-ink-soft);
  margin: 0;
}
</style>
