<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { parseWeight } from '@/utils/weightFormatting.js'
import {
  splitMeasuredAt,
  combineToMeasuredAt,
  parseDateInput,
} from '@/utils/measuredAtFormatting.js'
import {
  required,
  positiveNumber,
  validWeight,
  validDate,
  validHour,
  validMinute,
} from '@/utils/validationRules.js'

const isOpen = defineModel({ type: Boolean, required: true })
const props = defineProps({
  entry: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['save'])
const createNewEntry = () => {
  const now = new Date()
  return { weight_kg: null, date: now, hour: now.getHours(), minute: now.getMinutes() }
}
const formModel = ref(createNewEntry())
const weightEntryForm = ref(null)
// VDateInput can retain or normalize its model when typed input is invalid.
const dateInputText = ref(null)
const validationError = ref(null)
const isValidating = ref(false)
const isBusy = computed(() => props.busy || isValidating.value)
const formDate = computed(() =>
  dateInputText.value === null ? formModel.value.date : parseDateInput(dateInputText.value),
)
const dateRule = () => validDate(formDate.value)
const weightRule = (value) => {
  const weight = parseWeight(value)
  const result = validWeight(weight)
  return result === true ? positiveNumber(weight) : result
}

watch(
  [isOpen, () => props.entry],
  async ([open]) => {
    if (!open) return
    formModel.value = props.entry
      ? { weight_kg: props.entry.weight_kg, ...splitMeasuredAt(props.entry.measured_at) }
      : createNewEntry()
    dateInputText.value = null
    validationError.value = null
    await nextTick()
    weightEntryForm.value?.resetValidation()
  },
  { immediate: true },
)

const updateOpen = (open) => {
  if (!isBusy.value) isOpen.value = open
}

const updateDate = (date) => {
  if (date?.toDateString() !== formModel.value.date?.toDateString()) {
    formModel.value.hour = null
    formModel.value.minute = null
  }
  formModel.value.date = date
}

const submit = async () => {
  if (isBusy.value || !weightEntryForm.value) return
  isValidating.value = true
  validationError.value = null
  try {
    const { valid } = await weightEntryForm.value.validate()
    if (!valid) return
    const measuredAt = combineToMeasuredAt(
      formDate.value,
      formModel.value.hour,
      formModel.value.minute,
    )
    if (!measuredAt) {
      validationError.value = 'Enter a valid date and time.'
      return
    }
    emit('save', { weight_kg: parseWeight(formModel.value.weight_kg), measured_at: measuredAt })
  } catch (error) {
    validationError.value =
      error?.message || 'Unable to validate the measurement. Please try again.'
  } finally {
    isValidating.value = false
  }
}
</script>

<template>
  <v-dialog
    :model-value="isOpen"
    @update:model-value="updateOpen"
    :persistent="isBusy"
    max-width="480"
    aria-labelledby="weight-entry-dialog-title"
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon"><v-icon icon="mdi-scale-bathroom" size="24"></v-icon></span>
        <div>
          <h2 id="weight-entry-dialog-title">
            {{ !entry ? 'Add measurement' : 'Edit measurement' }}
          </h2>
        </div>
      </div>
      <v-card-text>
        <v-alert v-if="validationError || error" type="error" variant="tonal" class="mb-4">
          {{ validationError || error }}
        </v-alert>
        <v-form
          ref="weightEntryForm"
          validate-on="blur"
          :disabled="isBusy"
          @submit.prevent="submit"
        >
          <v-date-input
            :model-value="formModel.date"
            @update:model-value="updateDate"
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

          <v-text-field
            v-model="formModel.weight_kg"
            type="text"
            inputmode="decimal"
            label="Weight (kg)"
            variant="outlined"
            color="primary"
            :rules="[required, weightRule]"
          ></v-text-field>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="dialog-actions">
        <v-btn text="Cancel" variant="plain" :disabled="isBusy" @click="updateOpen(false)"></v-btn>

        <v-spacer></v-spacer>

        <v-btn
          text="Save measurement"
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="isBusy"
          :disabled="isBusy"
          @click="submit"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped src="../assets/weight-dialog.css"></style>
