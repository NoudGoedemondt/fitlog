<script setup>
import { formatMeasuredAt } from '@/utils/measuredAtFormatting.js'
import { formatWeight } from '@/utils/weightFormatting.js'

defineProps({
  entries: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  fetchError: { type: String, default: null },
})
const emit = defineEmits(['add', 'edit', 'delete'])

const headers = [
  { title: 'Weight (kg)', key: 'weight_kg' },
  { title: 'Measured at', key: 'measured_at' },
  { title: '', key: 'actions', align: 'end', sortable: false, width: '104px' },
]
</script>

<template>
  <div class="history-card">
    <div class="history-heading">
      <div>
        <h2>Measurement history</h2>
        <p>Use the row actions to edit or delete a measurement.</p>
      </div>
      <span v-if="!loading && !fetchError" class="entry-count">
        {{ entries.length }}
        {{ entries.length === 1 ? 'entry' : 'entries' }}
      </span>
    </div>
    <v-data-table
      class="weight-table"
      :headers="headers"
      :items="entries"
      :loading="loading"
      :items-per-page="10"
      :items-per-page-options="[10, 25, 50]"
      loading-text="Loading measurements…"
      hover
    >
      <template #[`item.weight_kg`]="{ item }">
        <span class="row-weight">{{ formatWeight(item.weight_kg) }}<span>kg</span></span>
      </template>
      <template #[`item.measured_at`]="{ item }">
        <span class="row-date">
          <v-icon icon="mdi-calendar-blank-outline" size="17" aria-hidden="true"></v-icon>
          {{ formatMeasuredAt(item.measured_at) }}
        </span>
      </template>
      <template #[`item.actions`]="{ item }">
        <div class="row-actions">
          <v-btn
            icon="mdi-pencil-outline"
            color="secondary"
            variant="text"
            size="small"
            :aria-label="`Edit measurement from ${formatMeasuredAt(item.measured_at)}`"
            title="Edit measurement"
            :disabled="busy"
            @click="emit('edit', item.id)"
          ></v-btn>
          <v-btn
            class="delete-entry-button"
            icon="mdi-trash-can-outline"
            color="secondary"
            variant="text"
            size="small"
            :aria-label="`Delete measurement from ${formatMeasuredAt(item.measured_at)}`"
            title="Delete measurement"
            :disabled="busy"
            @click="emit('delete', item.id)"
          ></v-btn>
        </div>
      </template>
      <template #no-data>
        <div class="empty-state">
          <span class="empty-icon"><v-icon icon="mdi-scale-bathroom" size="30"></v-icon></span>
          <h3>
            {{ fetchError ? 'Unable to load measurements' : 'No measurements recorded' }}
          </h3>
          <p>
            {{
              fetchError
                ? 'Select Try again above to reload the measurements.'
                : 'Add a measurement to record your weight, date and time.'
            }}
          </p>
          <v-btn
            v-if="!fetchError"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            :disabled="busy"
            @click="emit('add')"
            >Add measurement</v-btn
          >
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.history-heading p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 14px;
  line-height: 1.6;
}

.history-card {
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 24px rgb(var(--v-theme-shadow) / 3%);
}

.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
}

.history-heading h2 {
  margin-bottom: 3px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.history-heading p {
  font-size: 12px;
}

.entry-count {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 7px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
  font-weight: 500;
}

.weight-table {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  --v-table-row-height: 76px;
  --v-table-header-height: 44px;
}

.weight-table :deep(.v-data-table__th) {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.035em;
}

.weight-table :deep(th:first-child) {
  padding-left: 28px;
}

.weight-table :deep(td:first-child) {
  padding-left: 28px;
}

.weight-table :deep(th:last-child) {
  padding-right: 20px;
}

.weight-table :deep(td:last-child) {
  padding-right: 20px;
}

.weight-table :deep(.v-data-table-footer) {
  padding: 14px 20px;
  border-top: 1px solid rgb(var(--v-theme-outline));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
}

.row-weight {
  white-space: nowrap;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.row-weight > span {
  margin-left: 5px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0;
}

.row-date {
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.row-date .v-icon {
  color: rgb(var(--v-theme-on-surface-variant));
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  color: rgb(var(--v-theme-secondary));
}

.row-actions .v-btn {
  border-radius: 9px;
}

.delete-entry-button:hover {
  color: rgb(var(--v-theme-error)) !important;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  padding: 16px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface-accent));
  color: rgb(var(--v-theme-primary));
}

.empty-state h3 {
  margin: 18px 0 6px;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  margin-bottom: 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
}

.empty-state .v-btn {
  text-transform: none;
  letter-spacing: 0;
}

@media (max-width: 600px) {
  .history-heading {
    padding: 20px 16px;
  }

  .history-heading h2 {
    font-size: 17px;
  }

  .weight-table :deep(th:first-child) {
    padding-left: 16px;
  }

  .weight-table :deep(td:first-child) {
    padding-left: 16px;
  }

  .weight-table :deep(th:last-child) {
    padding-right: 8px;
  }

  .weight-table :deep(td:last-child) {
    padding-right: 8px;
  }

  .weight-table :deep(th) {
    padding-inline: 8px;
  }

  .weight-table :deep(td) {
    padding-inline: 8px;
  }

  .row-weight {
    font-size: 17px;
  }

  .row-date {
    font-size: 11px;
  }

  .row-date .v-icon {
    display: none;
  }
}
</style>
