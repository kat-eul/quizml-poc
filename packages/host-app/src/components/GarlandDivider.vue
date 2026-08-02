<script setup lang="ts">
/**
 * Élément signature du design : une guirlande de petits cercles alternant
 * les couleurs d'accent, comme tendue au-dessus de chaque section. C'est le
 * seul motif décoratif récurrent de l'interface — tout le reste reste sobre.
 */
const colors = ['sage', 'apricot', 'plum', 'gold', 'sage', 'apricot', 'plum', 'gold', 'sage', 'apricot', 'plum', 'gold'];
</script>

<template>
  <div class="garland" aria-hidden="true">
    <svg viewBox="0 0 480 20" preserveAspectRatio="none" class="garland-string">
      <path d="M0,2 Q120,20 240,2 Q360,-14 480,2" fill="none" stroke="var(--color-border)" stroke-width="1.5" />
    </svg>
    <div class="garland-dots">
      <span v-for="(color, i) in colors" :key="i" class="dot" :class="`dot--${color}`" />
    </div>
  </div>
</template>

<style scoped>
.garland {
  position: relative;
  height: 22px;
  margin: 0.25rem 0 1.75rem;
}

.garland-string {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.garland-dots {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 4px;
  box-shadow: 0 2px 3px rgba(43, 37, 48, 0.15);
}

.dot--sage {
  background: var(--color-sage);
}
.dot--apricot {
  background: var(--color-apricot);
}
.dot--plum {
  background: var(--color-plum);
}
.dot--gold {
  background: var(--color-gold);
}
</style>
