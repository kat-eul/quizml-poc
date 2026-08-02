<script setup lang="ts">
defineProps<{
  joinUrl: string | null;
  qrCodeDataUrl: string | null;
  playerCount: number;
  starting: boolean;
}>();

const emit = defineEmits<{ start: [] }>();
</script>

<template>
  <section class="card join-panel">
    <div class="qr-block">
      <div class="qr-frame">
        <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR code pour rejoindre la partie" />
        <div v-else class="qr-placeholder">Génération du QR code…</div>
      </div>
      <p v-if="joinUrl" class="url mono-chip">{{ joinUrl.replace('http://', '') }}</p>
    </div>

    <div class="instructions">
      <h2>On rejoint la partie</h2>
      <p>Scannez le QR code depuis votre téléphone, ou entrez le lien dans votre navigateur. Tout le monde doit être sur le même réseau WiFi.</p>

      <button class="btn-primary start-btn" :disabled="playerCount === 0 || starting" @click="emit('start')">
        {{ starting ? 'Démarrage…' : `Démarrer la partie (${playerCount} joueur${playerCount > 1 ? 's' : ''})` }}
      </button>
      <p v-if="playerCount === 0" class="hint">En attente d'au moins un joueur.</p>
    </div>
  </section>
</template>

<style scoped>
.join-panel {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  align-items: center;
}

.qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.qr-frame {
  width: 200px;
  height: 200px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  padding: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-frame img {
  width: 100%;
  height: 100%;
}

.qr-placeholder {
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  text-align: center;
}

.url {
  word-break: break-all;
  text-align: center;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.instructions p {
  color: var(--color-ink-soft);
  margin: 0 0 1.25rem;
  max-width: 42ch;
}

.start-btn {
  font-size: 1.05rem;
  padding: 0.9rem 1.75rem;
}

.hint {
  margin-top: 0.6rem !important;
  font-size: 0.85rem;
}

@media (max-width: 720px) {
  .join-panel {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}
</style>
