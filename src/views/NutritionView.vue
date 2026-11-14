<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import { useAuthStore } from '@/stores/auth.js'
import { useMeals } from '@/composables/useMeals.js'
import { useDailyNutritionTotals } from '@/composables/useDailyNutritionTotals.js'
import { formatMeasuredAt, parseDateInput } from '@/utils/measuredAtFormatting.js'
import { validDate } from '@/utils/validationRules.js'
import {
  dailyNutritionSummary,
  mealsForDate,
  nutritionFields,
  formatNutrition,
  toCalendarDate,
  formatCalendarDate,
} from '@/utils/nutrition.js'
import DailyNutritionSummary from '@/components/DailyNutritionSummary.vue'
import MealFormDialog from '@/components/MealFormDialog.vue'
import DailyNutritionFormDialog from '@/components/DailyNutritionFormDialog.vue'
import DeleteEntryDialog from '@/components/DeleteEntryDialog.vue'

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

    <section
      class="registration-card"
      aria-labelledby="individual-meals-title"
      :aria-busy="meals.isFetchLoading.value"
    >
      <div class="section-heading">
        <div>
          <h2 id="individual-meals-title">Individual meals</h2>
          <p>
            Most recent first · {{ dayMeals.length }} {{ dayMeals.length === 1 ? 'meal' : 'meals' }}
          </p>
        </div>
        <v-btn
          class="add-entry-button"
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          rounded="lg"
          elevation="0"
          :disabled="isBusy || !ready"
          @click="openMeal()"
          >Add meal</v-btn
        >
      </div>
      <p v-if="summary?.source === 'manual'" class="meal-summary-note">
        These meals are not added to your manual daily total.
      </p>
      <p v-if="meals.isFetchLoading.value">Loading meals…</p>
      <p v-else-if="meals.fetchError.value">Meals unavailable. Select Try again above.</p>
      <p v-else-if="!calendarDate">Select a valid date to view meals.</p>
      <p v-else-if="!dayMeals.length" class="empty-state">No meals recorded for this date.</p>
      <div v-else class="meal-list">
        <article v-for="meal in dayMeals" :key="meal.id" class="meal-entry">
          <div class="section-heading">
            <div class="meal-details">
              <h3>{{ meal.name }}</h3>
              <p v-if="meal.description" class="entry-description">{{ meal.description }}</p>
              <p class="row-date">
                <v-icon icon="mdi-calendar-blank-outline" size="17" aria-hidden="true"></v-icon>
                {{ formatMeasuredAt(meal.consumed_at) }}
              </p>
            </div>
            <div class="row-actions">
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                color="secondary"
                size="small"
                :aria-label="`Edit ${meal.name}`"
                title="Edit meal"
                :disabled="isBusy || !ready"
                @click="openMeal(meal)"
              ></v-btn>
              <v-btn
                class="delete-entry-button"
                icon="mdi-trash-can-outline"
                variant="text"
                color="secondary"
                size="small"
                :aria-label="`Delete ${meal.name}`"
                title="Delete meal"
                :disabled="isBusy || !ready"
                @click="confirmDeleteMeal(meal)"
              ></v-btn>
            </div>
          </div>
          <dl class="meal-nutrition">
            <div v-for="field in nutritionFields" :key="field.key">
              <dt>{{ field.label }}</dt>
              <dd>
                {{ formatNutrition(meal[field.key]) }}<span>{{ field.unit }}</span>
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
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
.page-heading,
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}
p,
dt {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  line-height: 1.6;
}
h2 {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.025em;
}
h3 {
  font-size: 17px;
  font-weight: 600;
}
.date-selection {
  flex: 0 0 260px;
}
.registration-card {
  padding: 24px 28px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 20px;
  margin-bottom: 24px;
  background: rgb(var(--v-theme-surface));
}
.meal-nutrition {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.meal-summary-note {
  margin-bottom: 16px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  color: rgb(var(--v-theme-secondary));
}
.row-actions .v-btn {
  border-radius: 9px;
}
.delete-entry-button:hover {
  color: rgb(var(--v-theme-error)) !important;
}
.v-btn {
  text-transform: none;
  letter-spacing: 0;
}
.add-entry-button {
  flex-shrink: 0;
  padding-inline: 22px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.meal-list {
  margin-inline: -28px;
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}
.meal-entry {
  border-top: 1px solid rgb(var(--v-theme-outline));
  padding: 20px 28px;
}
.meal-entry .section-heading {
  margin-bottom: 12px;
}
.meal-details {
  min-width: 0;
  overflow-wrap: anywhere;
}
.meal-details .entry-description {
  margin: 4px 0 6px;
}
.row-date {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 6px;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.row-date .v-icon {
  color: rgb(var(--v-theme-on-surface-variant));
}
.entry-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 12px 0;
}
.meal-nutrition dt,
.meal-nutrition dd > span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0;
}
.meal-nutrition dd {
  white-space: nowrap;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.meal-nutrition dd > span {
  margin-left: 5px;
}
.empty-state {
  padding: 20px 0;
  text-align: center;
}
@media (max-width: 600px) {
  .meals-page {
    margin-top: 16px;
  }
  .page-heading,
  .registration-card > .section-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .date-selection {
    flex-basis: auto;
    width: 100%;
  }
  .registration-card {
    padding: 20px 16px;
  }
  .row-date {
    font-size: 11px;
  }
  .meal-list {
    margin-inline: -16px;
  }
  .meal-entry {
    padding-inline: 16px;
  }
  .meal-nutrition {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .meal-nutrition dd {
    font-size: 17px;
  }
}
</style>
