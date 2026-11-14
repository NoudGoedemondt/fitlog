<script setup>
import { formatNutrition, formatCalendarDate } from '@/utils/nutrition.js'

defineProps({
  summary: { type: Object, default: null },
  dailyTotal: { type: Object, default: null },
  date: { type: String, default: null },
  loading: { type: Boolean, default: false },
  fetchError: { type: String, default: null },
  busy: { type: Boolean, default: false },
  ready: { type: Boolean, default: false },
})
const emit = defineEmits(['add', 'edit', 'delete'])

const summaryMacros = [
  { key: 'protein_g', label: 'protein' },
  { key: 'carbs_g', label: 'carbs' },
  { key: 'fats_g', label: 'fats' },
]
</script>

<template>
  <section
    class="summary-card daily-summary"
    aria-labelledby="daily-summary-title"
    :aria-busy="loading"
    aria-live="polite"
  >
    <div class="summary-heading">
      <h2 id="daily-summary-title" class="summary-label">
        <span class="status-dot"></span> DAILY NUTRITION
      </h2>
      <v-btn
        v-if="!dailyTotal"
        color="on-measurement"
        prepend-icon="mdi-plus"
        variant="tonal"
        rounded="lg"
        :disabled="busy || !ready"
        @click="emit('add')"
        >Add daily total</v-btn
      >
      <div v-else class="row-actions">
        <v-btn
          icon="mdi-pencil-outline"
          color="on-measurement-muted"
          variant="text"
          size="small"
          aria-label="Edit daily total"
          title="Edit daily total"
          :disabled="busy || !ready"
          @click="emit('edit')"
        ></v-btn>
        <v-btn
          class="delete-entry-button"
          icon="mdi-trash-can-outline"
          color="on-measurement-muted"
          variant="text"
          size="small"
          aria-label="Delete daily total"
          title="Delete daily total"
          :disabled="busy || !ready"
          @click="emit('delete')"
        ></v-btn>
      </div>
    </div>
    <div class="summary-content">
      <v-skeleton-loader
        v-if="loading && date"
        type="heading"
        color="transparent"
        width="180"
      ></v-skeleton-loader>
      <div v-else class="summary-value">
        {{ summary ? formatNutrition(summary.values.calories_kcal) : '—' }}<span>kcal</span>
      </div>
      <div class="summary-macros">
        <div v-for="field in summaryMacros" :key="field.key" class="summary-macro">
          <v-skeleton-loader
            v-if="loading && date"
            type="text"
            color="transparent"
            width="100"
          ></v-skeleton-loader>
          <template v-else>
            <span class="macro-value"
              >{{ summary ? formatNutrition(summary.values[field.key]) : '—' }}g</span
            >
            <span>{{ field.label }}</span>
          </template>
        </div>
      </div>
    </div>
    <div class="summary-date">
      <v-icon icon="mdi-calendar-blank-outline" size="16" aria-hidden="true"></v-icon>
      {{ formatCalendarDate(date) }}
      <span v-if="summary" class="summary-source">
        · {{ summary.source === 'manual' ? 'Manual daily total' : 'Calculated from meals' }}
      </span>
    </div>
    <p v-if="ready && dailyTotal?.notes" class="summary-notes entry-description">
      {{ dailyTotal.notes }}
    </p>
    <p v-if="!date" class="summary-caption">Select a valid date to view nutrition.</p>
    <p v-else-if="loading" class="summary-caption">Loading nutrition…</p>
    <p v-else-if="fetchError" class="summary-caption">
      Daily nutrition unavailable. Reload both registration methods to see a reliable total.
    </p>
    <p v-else-if="!summary" class="summary-caption">
      No nutrition recorded for this date. Add a meal or a manual daily total.
    </p>
    <p v-else-if="summary.source === 'manual'" class="summary-caption d-flex align-start ga-2">
      <v-icon
        icon="mdi-information-outline"
        size="16"
        class="flex-shrink-0"
        aria-hidden="true"
      ></v-icon>
      <span>This manual daily total replaces the sum of your meals. Your meals remain saved.</span>
    </p>
    <v-icon
      class="summary-watermark"
      icon="mdi-silverware-fork-knife"
      size="116"
      aria-hidden="true"
    ></v-icon>
  </section>
</template>

<style scoped src="../assets/summary-card.css"></style>

<style scoped>
p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  line-height: 1.6;
}

.daily-summary {
  margin-bottom: 32px;
}

.summary-macros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
}

.summary-macro {
  display: flex;
  align-items: baseline;
  gap: 5px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 12px;
}

.macro-value {
  color: rgb(var(--v-theme-on-measurement));
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.summary-caption {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 12px;
}

.summary-notes {
  position: relative;
  z-index: 1;
  color: rgb(var(--v-theme-on-measurement-muted));
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  color: rgb(var(--v-theme-secondary));
}

.row-actions .v-btn {
  border-radius: 9px;
}

.delete-entry-button:hover {
  color: rgb(var(--v-theme-error)) !important;
}

.v-btn {
  text-transform: none;
  letter-spacing: 0;
}

.entry-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 12px 0;
}

@media (max-width: 600px) {
  .daily-summary {
    margin-bottom: 24px;
  }
}
</style>
