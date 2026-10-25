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
  { title: 'Id', key: 'id' },
  { title: 'User Id', key: 'user_id' },
  { title: 'Weight (kg)', key: 'weight_kg' },
  { title: 'Measured at', key: 'measured_at' },
  { title: 'Created at', key: 'created_at' },
  { title: 'Updated at', key: 'updated_at' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false, width: '110px' },
]

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
  <v-alert v-if="weightLogs.fetchError.value" type="error" variant="tonal" class="mb-4">
    {{ weightLogs.fetchError.value }}
    <v-btn
      text="Retry"
      variant="text"
      :disabled="isBusy"
      :loading="weightLogs.isFetchLoading.value"
      @click="weightLogs.fetchAllWeights"
    ></v-btn>
  </v-alert>
  <v-alert
    v-if="weightLogs.mutationError.value && !dialogIsOpen"
    type="error"
    variant="tonal"
    class="mb-4"
  >
    {{ weightLogs.mutationError.value }}
  </v-alert>
  <v-data-table
    :headers="headers"
    :items="weightLogs.weightEntries.value"
    :loading="weightLogs.isFetchLoading.value"
  >
    <template v-slot:top>
      <v-toolbar>
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-scale-bathroom" size="x-small" start></v-icon>

          Weight Entries
        </v-toolbar-title>

        <v-btn
          class="me-2"
          prepend-icon="mdi-plus"
          text="Add"
          :disabled="isBusy"
          @click="add"
        ></v-btn>
      </v-toolbar>
    </template>

    <!-- using dynamic slot-syntax because
    eslint complains about: v-slot:item.actions="{ item }"
    -->
    <template #[`item.actions`]="{ item }">
      <div class="d-flex ga-2 justify-end">
        <v-icon
          color="medium-emphasis"
          icon="mdi-pencil"
          size="small"
          :disabled="isBusy"
          @click="edit(item.id)"
        ></v-icon>

        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          :disabled="isBusy"
          @click="toggleRemove(item.id)"
        ></v-icon>

        <v-slide-x-reverse-transition>
          <v-icon
            v-if="deletingItemId === item.id"
            color="red"
            icon="mdi-close"
            :disabled="isBusy"
            @click="remove(item.id)"
          ></v-icon>
        </v-slide-x-reverse-transition>
      </div>
    </template>
  </v-data-table>

  <v-dialog
    v-model="dialogIsOpen"
    :persistent="isBusy"
    max-width="400"
    @after-leave="resetTargetAfterLeave"
  >
    <v-card prepend-icon="mdi-update" :title="`${dialogModeLabel} Weight Entry`">
      <template v-slot:text>
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
              :rules="[required, validHour]"
            ></v-number-input>
            <v-number-input
              v-model="formModel.minute"
              control-variant="stacked"
              :min="0"
              :max="59"
              :step="1"
              label="Minute"
              :rules="[required, validMinute]"
            ></v-number-input>
          </div>

          <v-number-input
            v-model="formModel.weight_kg"
            :precision="2"
            :min="0"
            label="Weight (kg)"
            :rules="[required, positiveNumber]"
          ></v-number-input>
        </v-form>
      </template>

      <v-divider></v-divider>

      <v-card-actions class="bg-surface-light">
        <v-btn
          text="Cancel"
          variant="plain"
          :disabled="isBusy"
          @click="dialogIsOpen = false"
        ></v-btn>

        <v-spacer></v-spacer>

        <v-btn text="Save" :loading="isBusy" :disabled="isBusy" @click="save"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
