<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWeightLogs } from '../composables/useWeightLogs.js'
import { formatMeasuredAt } from '@/utils/measuredAtFormatting.js'
import { formatWeight } from '@/utils/weightFormatting.js'
import { useAuthStore } from '@/stores/auth.js'
import WeightEntryDialog from '@/components/WeightEntryDialog.vue'
import DeleteWeightDialog from '@/components/DeleteWeightDialog.vue'
import WeightHistoryTable from '@/components/WeightHistoryTable.vue'

const authStore = useAuthStore()
const weightLogs = useWeightLogs()
const dialogTarget = ref(false) // false | 'new' | <id>
const dialogIsOpen = ref(false)
const editingEntry = ref(null)
const deletingItemId = ref(null)
const formError = ref(null)
const isSaving = ref(false)
const isBusy = computed(() => isSaving.value || weightLogs.isMutationLoading.value)
const latestEntry = computed(() => weightLogs.weightEntries.value[0] ?? null)
const entryToDelete = computed(
  () => weightLogs.weightEntries.value.find((entry) => entry.id === deletingItemId.value) ?? null,
)
const deleteDialogIsOpen = computed({
  get: () => deletingItemId.value !== null,
  set: (value) => {
    if (!value && !isBusy.value) deletingItemId.value = null
  },
})

const openDialog = (target, entry = null) => {
  if (isBusy.value) return
  formError.value = null
  weightLogs.mutationError.value = null
  editingEntry.value = entry
  dialogTarget.value = target
  dialogIsOpen.value = true
}

const resetTargetAfterLeave = () => {
  dialogTarget.value = false
  editingEntry.value = null
}

const add = () => openDialog('new')

const edit = (id) => {
  if (isBusy.value) return
  const found = weightLogs.weightEntries.value.find((entry) => entry.id === id)
  if (!found) {
    weightLogs.mutationError.value = 'This weight entry is no longer available. Reload the entries.'
    return
  }
  openDialog(id, found)
}

const save = async (values) => {
  if (isBusy.value) return
  isSaving.value = true
  formError.value = null
  weightLogs.mutationError.value = null
  try {
    if (!authStore.user) {
      formError.value = 'Please log in again before saving a weight entry.'
      return
    }
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

    <WeightHistoryTable
      :entries="weightLogs.weightEntries.value"
      :loading="weightLogs.isFetchLoading.value"
      :busy="isBusy"
      :fetch-error="weightLogs.fetchError.value"
      @add="add"
      @edit="edit"
      @delete="toggleRemove"
    />
  </section>

  <WeightEntryDialog
    v-model="dialogIsOpen"
    :entry="editingEntry"
    :busy="isBusy"
    :error="formError || weightLogs.mutationError.value"
    @save="save"
    @after-leave="resetTargetAfterLeave"
  />
  <DeleteWeightDialog
    v-model="deleteDialogIsOpen"
    :entry="entryToDelete"
    :busy="isBusy"
    :error="weightLogs.mutationError.value"
    @confirm="remove"
  />
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

.page-description {
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
}
</style>
