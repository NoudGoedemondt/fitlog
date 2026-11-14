<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import { useAuthStore } from '@/stores/auth.js'
import { useMeals } from '@/composables/useMeals.js'
import { useDailyNutritionTotals } from '@/composables/useDailyNutritionTotals.js'
import {
  formatMeasuredAt,
  formatMeasuredTime,
  parseDateInput,
} from '@/utils/measuredAtFormatting.js'
import { validDate } from '@/utils/validationRules.js'
import {
  dailyNutritionSummary,
  mealsForDate,
  nutritionFields,
  formatNutrition,
  toCalendarDate,
  formatCalendarDate,
} from '@/utils/nutrition.js'
import EntryHistoryTable from '@/components/EntryHistoryTable.vue'
import DailyNutritionSummary from '@/components/DailyNutritionSummary.vue'
import MealFormDialog from '@/components/MealFormDialog.vue'
import DailyNutritionFormDialog from '@/components/DailyNutritionFormDialog.vue'
import DeleteEntryDialog from '@/components/DeleteEntryDialog.vue'

const mealHeaders = [
  { title: 'Meal', key: 'name', minWidth: '180px' },
  {
    title: 'Time',
    key: 'consumed_at',
    headerProps: { class: 'd-none d-sm-table-cell' },
    cellProps: { class: 'd-none d-sm-table-cell' },
  },
  ...nutritionFields.map((field) => {
    const visibility =
      field.key === 'calories_kcal' ? undefined : { class: 'd-none d-sm-table-cell' }
    return {
      title: `${field.label} (${field.unit})`,
      key: field.key,
      headerProps: visibility,
      cellProps: visibility,
    }
  }),
]

const authStore = useAuthStore()
const meals = useMeals()
const dailyTotals = useDailyNutritionTotals()
const selectedDate = ref(new Date())
const dateInputText = ref(null)
const calendarDate = computed(() =>
  toCalendarDate(
    dateInputText.value === null ? selectedDate.value : parseDateInput(dateInputText.value),
  ),
)
const dateRule = () =>
  validDate(dateInputText.value === null ? selectedDate.value : parseDateInput(dateInputText.value))
const isBusy = computed(() => meals.isMutationLoading.value || dailyTotals.isMutationLoading.value)
const loading = computed(() => meals.isFetchLoading.value || dailyTotals.isFetchLoading.value)
const fetchError = computed(() => meals.fetchError.value || dailyTotals.fetchError.value)
const ready = computed(() => calendarDate.value !== null && !loading.value && !fetchError.value)
const dayMeals = computed(() => mealsForDate(meals.mealEntries.value, calendarDate.value))
const dailyTotal = computed(
  () =>
    dailyTotals.dailyNutritionTotals.value.find((entry) => entry.log_date === calendarDate.value) ??
    null,
)
const summary = computed(() =>
  ready.value
    ? dailyNutritionSummary(
        calendarDate.value,
        meals.mealEntries.value,
        dailyTotals.dailyNutritionTotals.value,
      )
    : null,
)
const mealDialogIsOpen = ref(false)
const dailyDialogIsOpen = ref(false)
const editingMeal = ref(null)
const editingDailyTotal = ref(null)
const deletingMeal = ref(null)
const deletingDailyTotal = ref(null)
const formError = ref(null)
const deleteMealIsOpen = computed({
  get: () => deletingMeal.value !== null,
  set: (open) => {
    if (!open && !isBusy.value) deletingMeal.value = null
  },
})
const deleteDailyIsOpen = computed({
  get: () => deletingDailyTotal.value !== null,
  set: (open) => {
    if (!open && !isBusy.value) deletingDailyTotal.value = null
  },
})
const clearErrors = () => {
  formError.value = null
  meals.mutationError.value = null
  dailyTotals.mutationError.value = null
}
const openMeal = (entry = null) => {
  if (isBusy.value || !ready.value) return
  clearErrors()
  editingMeal.value = entry
  mealDialogIsOpen.value = true
}
const openDaily = () => {
  if (isBusy.value || !ready.value) return
  clearErrors()
  editingDailyTotal.value = dailyTotal.value
  dailyDialogIsOpen.value = true
}
const confirmDeleteMeal = (entry) => {
  if (isBusy.value || !ready.value) return
  clearErrors()
  deletingMeal.value = entry
}
const confirmDeleteDaily = () => {
  if (isBusy.value || !ready.value || !dailyTotal.value) return
  clearErrors()
  deletingDailyTotal.value = dailyTotal.value
}
const saveMeal = async (values) => {
  if (isBusy.value || !mealDialogIsOpen.value) return
  clearErrors()
  if (!authStore.user) {
    formError.value = 'Please log in again before saving a meal.'
    return
  }
  const success = editingMeal.value
    ? await meals.updateMealEntry(editingMeal.value.id, values)
    : await meals.createMealEntry({ user_id: authStore.user.id, ...values })
  if (success) mealDialogIsOpen.value = false
}
const saveDaily = async (values) => {
  if (isBusy.value || !dailyDialogIsOpen.value) return
  clearErrors()
  if (!authStore.user) {
    formError.value = 'Please log in again before saving a daily total.'
    return
  }
  const success = editingDailyTotal.value
    ? await dailyTotals.updateDailyNutritionTotal(editingDailyTotal.value.id, values)
    : await dailyTotals.createDailyNutritionTotal({ user_id: authStore.user.id, ...values })
  if (success) dailyDialogIsOpen.value = false
}
const removeMeal = async (id) => {
  if (isBusy.value || deletingMeal.value?.id !== id) return
  if (await meals.deleteMealEntry(id)) deletingMeal.value = null
}
const removeDaily = async (id) => {
  if (isBusy.value || deletingDailyTotal.value?.id !== id) return
  if (await dailyTotals.deleteDailyNutritionTotal(id)) deletingDailyTotal.value = null
}
const reload = async () => {
  if (isBusy.value) return
  await Promise.all([meals.fetchAllMeals(), dailyTotals.fetchAllDailyNutritionTotals()])
}
onMounted(reload)
</script>

<template>
  <section class="meals-page" aria-labelledby="meals-page-title">
    <header class="page-heading">
      <PageHeading
        id="meals-page-title"
        eyebrow="NUTRITION JOURNAL"
        title="Nutrition"
        description="Record individual meals or enter your nutrition for the whole day."
      />
      <v-date-input
        v-model="selectedDate"
        input-format="dd-mm-yyyy"
        label="Selected date"
        variant="outlined"
        color="primary"
        :rules="[dateRule]"
        :disabled="
          isBusy || mealDialogIsOpen || dailyDialogIsOpen || deleteMealIsOpen || deleteDailyIsOpen
        "
        hide-actions
        class="date-selection"
        @input="dateInputText = $event.target.value"
        @save="dateInputText = null"
      ></v-date-input>
    </header>

    <v-alert v-if="fetchError" type="error" variant="tonal" class="mb-4">
      <p v-if="meals.fetchError.value">{{ meals.fetchError.value }}</p>
      <p v-if="dailyTotals.fetchError.value">{{ dailyTotals.fetchError.value }}</p>
      <v-btn
        text="Try again"
        variant="text"
        :disabled="isBusy"
        :loading="loading"
        @click="reload"
      ></v-btn>
    </v-alert>

    <DailyNutritionSummary
      :summary="summary"
      :daily-total="dailyTotal"
      :date="calendarDate"
      :loading="loading"
      :fetch-error="fetchError"
      :busy="isBusy"
      :ready="ready"
      @add="openDaily"
      @edit="openDaily"
      @delete="confirmDeleteDaily"
    />

    <EntryHistoryTable
      title="Individual meals"
      description="Use the row actions to edit or delete a meal."
      :headers="mealHeaders"
      :entries="meals.isFetchLoading.value || meals.fetchError.value ? [] : dayMeals"
      :loading="meals.isFetchLoading.value"
      :busy="isBusy || !ready"
      :fetch-error="meals.fetchError.value"
      :unavailable-message="calendarDate ? null : 'Select a valid date to view meals.'"
      :note="
        summary?.source === 'manual'
          ? 'These meals are not added to your manual daily total.'
          : null
      "
      show-add-button
      add-text="Add meal"
      loading-text="Loading meals…"
      empty-title="No meals recorded for this date"
      empty-description="Add a meal to record your nutrition for this date."
      error-title="Unable to load meals"
      empty-icon="mdi-silverware-fork-knife"
      :entry-label="(entry) => entry.name"
      @add="openMeal()"
      @edit="openMeal"
      @delete="confirmDeleteMeal"
    >
      <template #[`item.name`]="{ item }">
        <div class="entry-name">{{ item.name }}</div>
        <p v-if="item.description" class="entry-description">{{ item.description }}</p>
      </template>
      <template #[`item.consumed_at`]="{ item }">
        <span class="row-date">{{ formatMeasuredTime(item.consumed_at) }}</span>
      </template>
      <template v-for="field in nutritionFields" :key="field.key" #[`item.${field.key}`]="{ item }">
        <span class="row-value"
          >{{ formatNutrition(item[field.key]) }}<span>{{ field.unit }}</span></span
        >
      </template>
    </EntryHistoryTable>
  </section>
  <MealFormDialog
    v-model="mealDialogIsOpen"
    :entry="editingMeal"
    :date="calendarDate || ''"
    :busy="isBusy"
    :error="formError || meals.mutationError.value"
    @save="saveMeal"
  />
  <DailyNutritionFormDialog
    v-model="dailyDialogIsOpen"
    :entry="editingDailyTotal"
    :date="calendarDate || ''"
    :has-meals="dayMeals.length > 0"
    :busy="isBusy"
    :error="formError || dailyTotals.mutationError.value"
    @save="saveDaily"
  />
  <DeleteEntryDialog
    v-model="deleteMealIsOpen"
    :entry="deletingMeal"
    :busy="isBusy"
    :error="meals.mutationError.value"
    title="Delete meal?"
    cancel-text="Keep meal"
    :summary="deletingMeal?.name || ''"
    :detail="deletingMeal ? formatMeasuredAt(deletingMeal.consumed_at) : ''"
    @confirm="removeMeal"
  />
  <DeleteEntryDialog
    v-model="deleteDailyIsOpen"
    :entry="deletingDailyTotal"
    :busy="isBusy"
    :error="dailyTotals.mutationError.value"
    title="Delete daily total?"
    cancel-text="Keep daily total"
    :summary="deletingDailyTotal ? formatCalendarDate(deletingDailyTotal.log_date) : ''"
    description="The daily summary will use your individual meals again. If there are no meals, no nutrition will be recorded for this date."
    @confirm="removeDaily"
  />
</template>

<style scoped>
.meals-page {
  color: rgb(var(--v-theme-on-surface));
  max-width: 1060px;
  margin: 28px auto 48px;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  line-height: 1.6;
}

.date-selection {
  flex: 0 0 260px;
}

@media (max-width: 600px) {
  .meals-page {
    margin-top: 16px;
  }

  .page-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .date-selection {
    flex-basis: auto;
    width: 100%;
  }
}
</style>
