<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import NutritionFields from '@/components/NutritionFields.vue'
import { emptyNutrition, nutritionValues, fromCalendarDate } from '@/utils/nutrition.js'
import {
  splitMeasuredAt,
  combineToMeasuredAt,
  parseDateInput,
} from '@/utils/measuredAtFormatting.js'
import { required, validDate, validHour, validMinute } from '@/utils/validationRules.js'

const isOpen = defineModel({ type: Boolean, required: true })
const props = defineProps({
  entry: { type: Object, default: null },
  date: { type: String, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['save'])
const form = ref(null)
const values = ref({})
const dateInputText = ref(null)
const validationError = ref(null)
const validating = ref(false)
const isBusy = computed(() => props.busy || validating.value)
const formDate = computed(() =>
  dateInputText.value === null ? values.value.date : parseDateInput(dateInputText.value),
)
const nameRule = (value) => Boolean(value?.trim()) || 'Enter a meal name.'

watch(isOpen, async (open) => {
  if (!open) return
  const now = new Date()
  values.value = props.entry
    ? { ...props.entry, ...splitMeasuredAt(props.entry.consumed_at) }
    : {
        ...emptyNutrition(),
        name: '',
        description: '',
        date: fromCalendarDate(props.date),
        hour: now.getHours(),
        minute: now.getMinutes(),
      }
  dateInputText.value = null
  validationError.value = null
  await nextTick()
  form.value?.resetValidation()
})

const updateOpen = (open) => {
  if (!isBusy.value) isOpen.value = open
}
const updateDate = (date) => {
  if (date?.toDateString() !== values.value.date?.toDateString()) {
    values.value.hour = null
    values.value.minute = null
  }
  values.value.date = date
}
const submit = async () => {
  if (isBusy.value || !form.value) return
  validating.value = true
  validationError.value = null
  try {
    if (!(await form.value.validate()).valid) return
    const consumedAt = combineToMeasuredAt(formDate.value, values.value.hour, values.value.minute)
    if (!consumedAt) {
      validationError.value = 'Enter a valid date and time.'
      return
    }
    emit('save', {
      ...nutritionValues(values.value),
      name: values.value.name.trim(),
      description: values.value.description?.trim() || null,
      consumed_at: consumedAt,
    })
  } catch (error) {
    validationError.value = error?.message || 'Unable to validate the meal. Please try again.'
  } finally {
    validating.value = false
  }
}
</script>

<template>
  <v-dialog
    :model-value="isOpen"
    @update:model-value="updateOpen"
    :persistent="isBusy"
    max-width="560"
    aria-labelledby="meal-entry-title"
    scrollable
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon"
          ><v-icon icon="mdi-silverware-fork-knife" size="24"></v-icon
        ></span>
        <h2 id="meal-entry-title">{{ entry ? 'Edit meal' : 'Add meal' }}</h2>
      </div>
      <v-card-text>
        <v-alert v-if="validationError || error" type="error" variant="tonal" class="mb-4">{{
          validationError || error
        }}</v-alert>
        <v-form ref="form" validate-on="blur" :disabled="isBusy" @submit.prevent="submit">
          <v-text-field
            v-model="values.name"
            label="Name"
            :rules="[nameRule]"
            variant="outlined"
            color="primary"
            class="mt-4"
          ></v-text-field>
          <v-textarea
            v-model="values.description"
            label="Description (optional)"
            variant="outlined"
            color="primary"
            rows="2"
            auto-grow
          ></v-textarea>
          <v-date-input
            :model-value="values.date"
            @update:model-value="updateDate"
            input-format="dd-mm-yyyy"
            label="Consumption date"
            variant="outlined"
            color="primary"
            :rules="[() => validDate(formDate)]"
            hide-actions
            class="mb-4"
            @input="dateInputText = $event.target.value"
            @save="dateInputText = null"
          ></v-date-input>
          <div class="d-flex ga-2 mb-4">
            <v-number-input
              v-model="values.hour"
              label="Hour"
              prepend-icon="mdi-clock-outline"
              control-variant="stacked"
              :min="0"
              :max="23"
              :step="1"
              :rules="[required, validHour]"
              variant="outlined"
              color="primary"
            ></v-number-input>
            <v-number-input
              v-model="values.minute"
              label="Minute"
              control-variant="stacked"
              :min="0"
              :max="59"
              :step="1"
              :rules="[required, validMinute]"
              variant="outlined"
              color="primary"
            ></v-number-input>
          </div>
          <NutritionFields v-model="values" />
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="dialog-actions">
        <v-btn text="Cancel" variant="plain" :disabled="isBusy" @click="updateOpen(false)"></v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text="Save meal"
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

<style scoped src="../assets/entry-dialog.css"></style>
