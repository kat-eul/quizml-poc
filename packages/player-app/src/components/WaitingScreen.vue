<script setup lang="ts">
defineProps<{
  message: string;
}>();
</script>

<template>
  <div class="waiting">
    <div class="pulse-dot" />
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.waiting {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  padding: 2rem;
  text-align: center;
}

.pulse-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-apricot);
}

p {
  color: var(--color-ink-soft);
  font-size: 1.05rem;
  max-width: 32ch;
}
</style>
