<script setup>
import { computed, onMounted, ref } from 'vue'
import { useWeightLogs } from '@/composables/useWeightLogs.js'
import { formatMeasuredAt } from '@/utils/measuredAtFormatting.js'
import { formatWeight } from '@/utils/weightFormatting.js'
import { useAuthStore } from '@/stores/auth.js'
import WeightEntryDialog from '@/components/WeightEntryDialog.vue'
import DeleteWeightDialog from '@/components/DeleteWeightDialog.vue'
import WeightHistoryTable from '@/components/WeightHistoryTable.vue'

const authStore = useAuthStore()
const weightLogs = useWeightLogs()
const isBusy = weightLogs.isMutationLoading
const latestEntry = computed(() => weightLogs.weightEntries.value[0] ?? null)
const weightDialogIsOpen = ref(false)
const editingWeight = ref(null)
const deletingWeight = ref(null)
const formError = ref(null)
const deleteWeightIsOpen = computed({
  get: () => deletingWeight.value !== null,
  set: (open) => {
    if (!open && !isBusy.value) deletingWeight.value = null
  },
})

const clearErrors = () => {
  formError.value = null
  weightLogs.mutationError.value = null
}

const openWeight = (entry = null) => {
  if (isBusy.value) return
  clearErrors()
  editingWeight.value = entry
  weightDialogIsOpen.value = true
}

const confirmDeleteWeight = (entry) => {
  if (isBusy.value) return
  clearErrors()
  deletingWeight.value = entry
}

const saveWeight = async (values) => {
  if (isBusy.value || !weightDialogIsOpen.value) return
  clearErrors()
  if (!authStore.user) {
    formError.value = 'Please log in again before saving a weight entry.'
    return
  }
  const success = editingWeight.value
    ? await weightLogs.updateWeightEntry(editingWeight.value.id, values)
    : await weightLogs.createWeightEntry({ user_id: authStore.user.id, ...values })
  if (success) weightDialogIsOpen.value = false
}

const removeWeight = async (id) => {
  if (isBusy.value || deletingWeight.value?.id !== id) return
  if (await weightLogs.deleteWeightEntry(id)) deletingWeight.value = null
}

const reload = async () => {
  if (isBusy.value) return
  await weightLogs.fetchAllWeights()
}

onMounted(reload)
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
        @click="openWeight()"
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
        @click="reload"
      ></v-btn>
    </v-alert>
    <v-alert
      v-if="weightLogs.mutationError.value && !weightDialogIsOpen && !deleteWeightIsOpen"
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
      @add="openWeight()"
      @edit="openWeight"
      @delete="confirmDeleteWeight"
    />
  </section>

  <WeightEntryDialog
    v-model="weightDialogIsOpen"
    :entry="editingWeight"
    :busy="isBusy"
    :error="formError || weightLogs.mutationError.value"
    @save="saveWeight"
  />
  <DeleteWeightDialog
    v-model="deleteWeightIsOpen"
    :entry="deletingWeight"
    :busy="isBusy"
    :error="weightLogs.mutationError.value"
    @confirm="removeWeight"
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
