<script setup>
defineProps({
  id: { type: String, required: true },
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <div class="page-heading-text">
    <div class="eyebrow"><span class="eyebrow-line" aria-hidden="true"></span>{{ eyebrow }}</div>
    <h1 :id="id">{{ title }}<span>.</span></h1>
    <p class="page-description">{{ description }}</p>
  </div>
</template>

<style scoped>
.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.eyebrow-line {
  flex-shrink: 0;
  width: 22px;
  height: 2px;
  background: currentColor;
}

h1 {
  margin: 8px 0;
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 1.2;
}

h1 > span {
  color: rgb(var(--v-theme-primary));
}

.page-description {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 14px;
  line-height: 1.6;
}
</style>
