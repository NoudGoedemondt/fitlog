<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWeightLogs } from '../composables/useWeightLogs.js'
import {
  splitMeasuredAt,
  combineToMeasuredAt,
  parseDateInput,
} from '@/utils/measuredAtFormatting.js'
import { useAuthStore } from '@/stores/auth.js'
import {
  required,
  positiveNumber,
  validDate,
  validHour,
  validMinute,
} from '@/utils/validationRules.js'

const authStore = useAuthStore()
const weightLogs = useWeightLogs()

const headers = [
  { title: 'Weight (kg)', key: 'weight_kg' },
  { title: 'Measured at', key: 'measured_at' },
  { title: '', key: 'actions', align: 'end', sortable: false, width: '104px' },
]

const formatMeasuredAt = (value) => {
  const { date, hour, minute } = splitMeasuredAt(value)
  if (!date) return '—'

  const pad = (number) => String(number).padStart(2, '0')
  const year = String(date.getFullYear()).padStart(4, '0')
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${year} ${pad(hour)}:${pad(minute)}`
}

const createNewRecord = () => {
  return {
    weight_kg: 0,
    date: new Date(),
    hour: null,
    minute: null,
  }
}

const formModel = ref(createNewRecord())
const weightEntryForm = ref(null)
const dialogTarget = ref(false) // false | 'new' | <id> — single source of truth
const dialogIsOpen = ref(false) // controls dialog *visibility*
const deletingItemId = ref(null)
// Keep typed text: VDateInput can retain or normalize its model when input is invalid.
const dateInputText = ref(null)
const formError = ref(null)
const isSaving = ref(false)
const isBusy = computed(() => isSaving.value || weightLogs.isMutationLoading.value)
const formDate = computed(() =>
  dateInputText.value === null ? formModel.value.date : parseDateInput(dateInputText.value),
)
const dateRule = () => validDate(formDate.value)

const latestEntry = computed(() => weightLogs.weightEntries.value[0] ?? null)
const entryToDelete = computed(() =>
  weightLogs.weightEntries.value.find((entry) => entry.id === deletingItemId.value),
)
const deleteDialogIsOpen = computed({
  get: () => deletingItemId.value !== null,
  set: (value) => {
    if (!value && !isBusy.value) deletingItemId.value = null
  },
})
const weightFormatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})
const formatWeight = (value) => weightFormatter.format(value)

const openDialog = (target) => {
  if (isBusy.value) return
  dateInputText.value = null
  formError.value = null
  weightLogs.mutationError.value = null
  dialogTarget.value = target
  dialogIsOpen.value = true
}

const resetTargetAfterLeave = () => {
  dialogTarget.value = false
}

const add = () => {
  if (isBusy.value) return
  formModel.value = createNewRecord()
  openDialog('new')
}

const edit = (id) => {
  if (isBusy.value) return
  const found = weightLogs.weightEntries.value.find((entry) => entry.id === id)
  if (!found) {
    weightLogs.mutationError.value = 'This weight entry is no longer available. Reload the entries.'
    return
  }
  const { date, hour, minute } = splitMeasuredAt(found.measured_at)

  formModel.value = {
    id: found.id,
    weight_kg: found.weight_kg,
    date: date,
    hour: hour,
    minute: minute,
  }

  openDialog(id)
}

const save = async () => {
  if (isBusy.value || !weightEntryForm.value) return
  isSaving.value = true
  formError.value = null
  weightLogs.mutationError.value = null

  try {
    const { valid } = await weightEntryForm.value.validate()
    if (!valid) return

    const measuredAt = combineToMeasuredAt(
      formDate.value,
      formModel.value.hour,
      formModel.value.minute,
    )
    if (!measuredAt) {
      formError.value = 'Enter a valid date and time.'
      return
    }
    if (!authStore.user) {
      formError.value = 'Please log in again before saving a weight entry.'
      return
    }

    const values = { weight_kg: formModel.value.weight_kg, measured_at: measuredAt }
    if (dialogTarget.value === 'new') {
      await weightLogs.createWeightEntry({ user_id: authStore.user.id, ...values })
    } else if (typeof dialogTarget.value === 'number') {
      await weightLogs.updateWeightEntry(dialogTarget.value, values)
    } else {
      formError.value = 'Reopen the weight entry before saving.'
      return
    }

    if (!weightLogs.mutationError.value) dialogIsOpen.value = false
  } catch (error) {
    formError.value = error?.message || 'Unable to save the weight entry. Please try again.'
  } finally {
    isSaving.value = false
  }
}

const remove = async (id) => {
  if (isBusy.value) return
  await weightLogs.deleteWeightEntry(id)
  if (!weightLogs.mutationError.value) deletingItemId.value = null
}

const toggleRemove = (id) => {
  if (isBusy.value) return
  weightLogs.mutationError.value = null
  deletingItemId.value = deletingItemId.value === id ? null : id
}

const dialogModeLabel = computed(() => {
  if (dialogTarget.value === 'new') return 'Add'
  if (typeof dialogTarget.value === 'number') return 'Update'
  return ''
})

onMounted(async () => {
  await weightLogs.fetchAllWeights()
})
</script>

<template>
  <section class="weight-page" aria-labelledby="weight-page-title">
    <header class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> BODY MEASUREMENTS</div>
        <h1 id="weight-page-title">Weight logs<span>.</span></h1>
        <p class="page-description">Record and manage your weight measurements.</p>
      </div>
      <v-btn
        class="add-entry-button"
        color="primary"
        prepend-icon="mdi-plus"
        size="large"
        rounded="lg"
        elevation="0"
        :disabled="isBusy"
        @click="add"
        >Add measurement</v-btn
      >
    </header>

    <v-alert v-if="weightLogs.fetchError.value" type="error" variant="tonal" class="mb-4">
      {{ weightLogs.fetchError.value }}
      <v-btn
        text="Try again"
        variant="text"
        :disabled="isBusy"
        :loading="weightLogs.isFetchLoading.value"
        @click="weightLogs.fetchAllWeights"
      ></v-btn>
    </v-alert>
    <v-alert
      v-if="weightLogs.mutationError.value && !dialogIsOpen && !deleteDialogIsOpen"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ weightLogs.mutationError.value }}
    </v-alert>

    <div class="journal-overview">
      <div class="latest-measurement" :aria-busy="weightLogs.isFetchLoading.value">
        <div class="summary-label"><span class="status-dot"></span> LATEST MEASUREMENT</div>
        <v-skeleton-loader
          v-if="weightLogs.isFetchLoading.value && !latestEntry"
          type="heading"
          color="transparent"
        ></v-skeleton-loader>
        <div v-else class="latest-weight">
          {{ latestEntry ? formatWeight(latestEntry.weight_kg) : '—' }}<span>kg</span>
        </div>
        <div class="latest-date">
          <v-icon icon="mdi-clock-outline" size="16"></v-icon>
          {{
            latestEntry
              ? formatMeasuredAt(latestEntry.measured_at)
              : weightLogs.isFetchLoading.value
                ? 'Loading measurements…'
                : weightLogs.fetchError.value
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
      <div class="journal-note">
        <span class="note-icon"><v-icon icon="mdi-chart-timeline-variant" size="25"></v-icon></span>
        <h2>Measurement details</h2>
        <p>Each entry contains your weight and the date and time it was measured.</p>
      </div>
    </div>

    <div class="history-card">
      <div class="history-heading">
        <div>
          <h2>Measurement history</h2>
          <p>Use the row actions to edit or delete a measurement.</p>
        </div>
        <span
          v-if="!weightLogs.isFetchLoading.value && !weightLogs.fetchError.value"
          class="entry-count"
        >
          {{ weightLogs.weightEntries.value.length }}
          {{ weightLogs.weightEntries.value.length === 1 ? 'entry' : 'entries' }}
        </span>
      </div>
      <v-data-table
        class="weight-table"
        :headers="headers"
        :items="weightLogs.weightEntries.value"
        :loading="weightLogs.isFetchLoading.value"
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
              :disabled="isBusy"
              @click="edit(item.id)"
            ></v-btn>
            <v-btn
              class="delete-entry-button"
              icon="mdi-trash-can-outline"
              color="secondary"
              variant="text"
              size="small"
              :aria-label="`Delete measurement from ${formatMeasuredAt(item.measured_at)}`"
              title="Delete measurement"
              :disabled="isBusy"
              @click="toggleRemove(item.id)"
            ></v-btn>
          </div>
        </template>
        <template #no-data>
          <div class="empty-state">
            <span class="empty-icon"><v-icon icon="mdi-scale-bathroom" size="30"></v-icon></span>
            <h3>
              {{
                weightLogs.fetchError.value
                  ? 'Unable to load measurements'
                  : 'No measurements recorded'
              }}
            </h3>
            <p>
              {{
                weightLogs.fetchError.value
                  ? 'Select Try again above to reload the measurements.'
                  : 'Add a measurement to record your weight, date and time.'
              }}
            </p>
            <v-btn
              v-if="!weightLogs.fetchError.value"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-plus"
              :disabled="isBusy"
              @click="add"
              >Add measurement</v-btn
            >
          </div>
        </template>
      </v-data-table>
    </div>
  </section>

  <v-dialog
    v-model="dialogIsOpen"
    :persistent="isBusy"
    max-width="480"
    aria-labelledby="weight-entry-dialog-title"
    @after-leave="resetTargetAfterLeave"
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon"><v-icon icon="mdi-scale-bathroom" size="24"></v-icon></span>
        <div>
          <h2 id="weight-entry-dialog-title">
            {{ dialogModeLabel === 'Add' ? 'Add measurement' : 'Edit measurement' }}
          </h2>
        </div>
      </div>
      <v-card-text>
        <v-alert
          v-if="formError || weightLogs.mutationError.value"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ formError || weightLogs.mutationError.value }}
        </v-alert>
        <v-form ref="weightEntryForm" :disabled="isBusy" @submit.prevent="save">
          <v-date-input
            v-model="formModel.date"
            input-format="dd-mm-yyyy"
            label="Date"
            variant="outlined"
            color="primary"
            :rules="[dateRule]"
            hide-actions
            class="my-5"
            @input="dateInputText = $event.target.value"
            @save="dateInputText = null"
          ></v-date-input>

          <div class="d-flex ga-2 mb-5">
            <v-number-input
              v-model="formModel.hour"
              prepend-icon="mdi-clock-outline"
              control-variant="stacked"
              :min="0"
              :max="23"
              :step="1"
              label="Hour"
              variant="outlined"
              color="primary"
              :rules="[required, validHour]"
            ></v-number-input>
            <v-number-input
              v-model="formModel.minute"
              control-variant="stacked"
              :min="0"
              :max="59"
              :step="1"
              label="Minute"
              variant="outlined"
              color="primary"
              :rules="[required, validMinute]"
            ></v-number-input>
          </div>

          <v-number-input
            v-model="formModel.weight_kg"
            :precision="2"
            :min="0"
            label="Weight (kg)"
            variant="outlined"
            color="primary"
            :rules="[required, positiveNumber]"
          ></v-number-input>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="dialog-actions">
        <v-btn
          text="Cancel"
          variant="plain"
          :disabled="isBusy"
          @click="dialogIsOpen = false"
        ></v-btn>

        <v-spacer></v-spacer>

        <v-btn
          text="Save measurement"
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="isBusy"
          :disabled="isBusy"
          @click="save"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="deleteDialogIsOpen"
    :persistent="isBusy"
    max-width="440"
    aria-labelledby="delete-measurement-title"
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon delete-dialog-icon"
          ><v-icon icon="mdi-trash-can-outline" size="24"></v-icon
        ></span>
        <div>
          <h2 id="delete-measurement-title">Delete measurement?</h2>
          <p>This action cannot be undone.</p>
        </div>
      </div>
      <v-card-text>
        <p v-if="entryToDelete" class="delete-summary">
          <strong>{{ formatWeight(entryToDelete.weight_kg) }} kg</strong>
          <span>{{ formatMeasuredAt(entryToDelete.measured_at) }}</span>
        </p>
        <v-alert v-if="weightLogs.mutationError.value" type="error" variant="tonal" class="mt-4">{{
          weightLogs.mutationError.value
        }}</v-alert>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-btn
          text="Keep measurement"
          variant="text"
          :disabled="isBusy"
          @click="deleteDialogIsOpen = false"
        ></v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text="Delete"
          color="error"
          variant="flat"
          rounded="lg"
          :loading="isBusy"
          :disabled="isBusy"
          @click="remove(deletingItemId)"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.weight-page {
  color: rgb(var(--v-theme-on-surface));
  max-width: 1060px;
  margin: 28px auto 48px;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

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
  width: 22px;
  height: 2px;
  background: currentColor;
}

.page-heading h1 {
  margin: 8px 0;
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 1.2;
}

.page-heading h1 > span {
  color: rgb(var(--v-theme-primary));
}

.page-description,
.history-heading p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 14px;
  line-height: 1.6;
}

.add-entry-button {
  flex-shrink: 0;
  padding-inline: 22px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.journal-overview {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.latest-measurement {
  position: relative;
  overflow: hidden;
  min-height: 212px;
  padding: 28px 32px;
  border-radius: 20px;
  background: linear-gradient(
    115deg,
    rgb(var(--v-theme-measurement)),
    rgb(var(--v-theme-measurement-end))
  );
  color: rgb(var(--v-theme-on-measurement));
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-measurement-highlight));
}

.latest-weight {
  position: relative;
  z-index: 1;
  margin: 12px 0 6px;
  font-size: 58px;
  font-weight: 600;
  letter-spacing: -0.055em;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.latest-weight > span {
  margin-left: 8px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0;
}

.latest-date {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 12px;
}

.summary-watermark {
  position: absolute;
  right: 22px;
  top: 60px;
  color: rgb(var(--v-theme-on-measurement-muted));
  opacity: 0.1;
  transform: rotate(-12deg);
}

.journal-note {
  padding: 24px 28px;
  border: 1px solid rgb(var(--v-theme-note-outline));
  border-radius: 20px;
  background: rgb(var(--v-theme-note));
}

.note-icon {
  color: rgb(var(--v-theme-note-accent));
}

.journal-note h2 {
  margin: 8px 0 6px;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.journal-note p {
  max-width: 340px;
  color: rgb(var(--v-theme-on-note));
  font-size: 13px;
  line-height: 1.6;
}

.note-caption {
  display: block;
  margin-top: 12px;
  color: rgb(var(--v-theme-note-accent));
  font-size: 11px;
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

.weight-table :deep(th:first-child),
.weight-table :deep(td:first-child) {
  padding-left: 28px;
}

.weight-table :deep(th:last-child),
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

.empty-state .v-btn,
.dialog-actions .v-btn {
  text-transform: none;
  letter-spacing: 0;
}

.entry-dialog {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.dialog-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 28px 24px 4px;
}

.dialog-icon {
  display: inline-flex;
  padding: 12px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface-accent));
  color: rgb(var(--v-theme-primary));
}

.dialog-heading h2 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.dialog-heading p {
  margin-top: 3px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
}

.dialog-actions {
  padding: 16px 24px;
}

.delete-dialog-icon {
  background: rgb(var(--v-theme-error-container));
  color: rgb(var(--v-theme-on-error-container));
}

.delete-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding: 16px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  font-size: 14px;
}

.delete-summary > span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
}

@media (max-width: 600px) {
  .weight-page {
    margin-top: 16px;
  }

  .page-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    margin-bottom: 24px;
  }

  .journal-overview {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }

  .journal-note {
    padding: 20px 24px;
  }

  .latest-measurement {
    padding: 24px;
  }

  .history-heading {
    padding: 20px 16px;
  }

  .history-heading h2 {
    font-size: 17px;
  }

  .weight-table :deep(th:first-child),
  .weight-table :deep(td:first-child) {
    padding-left: 16px;
  }

  .weight-table :deep(th:last-child),
  .weight-table :deep(td:last-child) {
    padding-right: 8px;
  }

  .weight-table :deep(th),
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

  .dialog-actions {
    flex-wrap: wrap;
    padding-inline: 16px;
  }
}
</style>
