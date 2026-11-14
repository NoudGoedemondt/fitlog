<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
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
  <FormDialog
    v-model="isOpen"
    :title="entry ? 'Edit measurement' : 'Add measurement'"
    icon="mdi-scale-bathroom"
    save-text="Save measurement"
    :busy="isBusy"
    :error="validationError || error"
    max-width="480"
    @save="submit"
  >
    <v-form
      class="entry-form"
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
        @input="dateInputText = $event.target.value"
        @save="dateInputText = null"
      ></v-date-input>

      <div class="d-flex ga-4">
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
  </FormDialog>
</template>
