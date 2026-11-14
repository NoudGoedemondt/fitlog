<script setup>
import { formatMeasuredAt } from '@/utils/measuredAtFormatting.js'
import { formatWeight } from '@/utils/weightFormatting.js'

defineProps({
  entry: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  fetchError: { type: String, default: null },
})
</script>

<template>
  <div class="summary-card" :aria-busy="loading">
    <div class="summary-heading">
      <div class="summary-label"><span class="status-dot"></span> LATEST MEASUREMENT</div>
    </div>
    <div class="summary-content">
      <v-skeleton-loader
        v-if="loading && !entry"
        type="heading"
        color="transparent"
        width="180"
      ></v-skeleton-loader>
      <div v-else class="summary-value">
        {{ entry ? formatWeight(entry.weight_kg) : '—' }}<span>kg</span>
      </div>
    </div>
    <div class="summary-date">
      <v-icon icon="mdi-clock-outline" size="16"></v-icon>
      {{
        entry
          ? formatMeasuredAt(entry.measured_at)
          : loading
            ? 'Loading measurements…'
            : fetchError
              ? 'Measurement unavailable'
              : 'No measurements recorded'
      }}
    </div>
    <v-icon
      class="summary-watermark"
      icon="mdi-scale-bathroom"
      size="116"
      aria-hidden="true"
    ></v-icon>
  </div>
</template>

<style scoped src="../assets/summary-card.css"></style>
