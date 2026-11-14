<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import FormDialog from '@/components/FormDialog.vue'
import NutritionFields from '@/components/NutritionFields.vue'
import { emptyNutrition, nutritionValues, formatCalendarDate } from '@/utils/nutrition.js'

const isOpen = defineModel({ type: Boolean, required: true })
const props = defineProps({
  entry: { type: Object, default: null },
  date: { type: String, required: true },
  hasMeals: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['save'])
const form = ref(null)
const values = ref({})
const validating = ref(false)
const validationError = ref(null)
const isBusy = computed(() => props.busy || validating.value)
watch(isOpen, async (open) => {
  if (!open) return
  values.value = props.entry ? { ...props.entry } : { ...emptyNutrition(), notes: '' }
  validationError.value = null
  await nextTick()
  form.value?.resetValidation()
})
const submit = async () => {
  if (isBusy.value || !form.value) return
  validating.value = true
  validationError.value = null
  try {
    if (!(await form.value.validate()).valid) return
    emit('save', {
      ...nutritionValues(values.value),
      log_date: props.date,
      notes: values.value.notes?.trim() || null,
    })
  } catch (error) {
    validationError.value =
      error?.message || 'Unable to validate the daily total. Please try again.'
  } finally {
    validating.value = false
  }
}
</script>

<template>
  <FormDialog
    v-model="isOpen"
    :title="entry ? 'Edit daily total' : 'Add daily total'"
    icon="mdi-notebook-outline"
    save-text="Save daily total"
    :busy="isBusy"
    :error="validationError || error"
    :subtitle="formatCalendarDate(date)"
    scrollable
    @save="submit"
  >
    <v-form
      ref="form"
      validate-on="blur"
      :disabled="isBusy"
      class="entry-form"
      @submit.prevent="submit"
    >
      <NutritionFields v-model="values" />
      <v-textarea
        v-model="values.notes"
        label="Notes (optional)"
        variant="outlined"
        color="primary"
        rows="3"
        auto-grow
      ></v-textarea>
    </v-form>
    <v-alert v-if="hasMeals" type="info" variant="tonal"
      >This manual total replaces the calculated meal total for this date. Your individual meals
      remain visible and are not added to it.</v-alert
    >
  </FormDialog>
</template>
