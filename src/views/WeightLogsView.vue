<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import { useWeightLogs } from '@/composables/useWeightLogs.js'
import { formatMeasuredAt } from '@/utils/measuredAtFormatting.js'
import { formatWeight } from '@/utils/weightFormatting.js'
import { useAuthStore } from '@/stores/auth.js'
import WeightMeasurementFormDialog from '@/components/WeightMeasurementFormDialog.vue'
import DeleteEntryDialog from '@/components/DeleteEntryDialog.vue'
import LatestWeightMeasurement from '@/components/LatestWeightMeasurement.vue'
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
      <PageHeading
        id="weight-page-title"
        eyebrow="BODY MEASUREMENTS"
        title="Weight logs"
        description="Record and manage your weight measurements."
      />
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
      <LatestWeightMeasurement
        :entry="latestEntry"
        :loading="weightLogs.isFetchLoading.value"
        :fetch-error="weightLogs.fetchError.value"
      />
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

  <WeightMeasurementFormDialog
    v-model="weightDialogIsOpen"
    :entry="editingWeight"
    :busy="isBusy"
    :error="formError || weightLogs.mutationError.value"
    @save="saveWeight"
  />
  <DeleteEntryDialog
    v-model="deleteWeightIsOpen"
    :entry="deletingWeight"
    :busy="isBusy"
    :error="weightLogs.mutationError.value"
    title="Delete measurement?"
    cancel-text="Keep measurement"
    :summary="deletingWeight ? `${formatWeight(deletingWeight.weight_kg)} kg` : ''"
    :detail="deletingWeight ? formatMeasuredAt(deletingWeight.measured_at) : ''"
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
}
</style>
