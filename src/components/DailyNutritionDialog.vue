<script setup>
import { computed, nextTick, ref, watch } from 'vue'
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
const updateOpen = (open) => {
  if (!isBusy.value) isOpen.value = open
}
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
  <v-dialog
    :model-value="isOpen"
    @update:model-value="updateOpen"
    :persistent="isBusy"
    max-width="560"
    aria-labelledby="daily-nutrition-title"
    scrollable
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon"><v-icon icon="mdi-notebook-outline" size="24"></v-icon></span>
        <div>
          <h2 id="daily-nutrition-title">{{ entry ? 'Edit daily total' : 'Add daily total' }}</h2>
          <p>{{ formatCalendarDate(date) }}</p>
        </div>
      </div>
      <v-card-text>
        <v-alert v-if="validationError || error" type="error" variant="tonal" class="mb-4">{{
          validationError || error
        }}</v-alert>
        <v-alert v-if="hasMeals" type="info" variant="tonal" class="my-4"
          >This manual total replaces the calculated meal total for this date. Your individual meals
          remain visible and are not added to it.</v-alert
        >
        <v-form
          ref="form"
          validate-on="blur"
          :disabled="isBusy"
          class="mt-4"
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
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="dialog-actions">
        <v-btn text="Cancel" variant="plain" :disabled="isBusy" @click="updateOpen(false)"></v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text="Save daily total"
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
