<script setup>
import { computed, onMounted, ref } from 'vue'
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
import MealEntryDialog from '@/components/MealEntryDialog.vue'
import DailyNutritionDialog from '@/components/DailyNutritionDialog.vue'
import DeleteEntryDialog from '@/components/DeleteEntryDialog.vue'

const summaryMacros = [
  { key: 'protein_g', label: 'protein' },
  { key: 'carbs_g', label: 'carbs' },
  { key: 'fats_g', label: 'fats' },
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
      <div>
        <div class="eyebrow"><span></span> NUTRITION JOURNAL</div>
        <h1 id="meals-page-title">Meals<span>.</span></h1>
        <p>Record individual meals or enter your nutrition for the whole day.</p>
      </div>
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

    <section
      class="daily-summary"
      aria-labelledby="daily-summary-title"
      :aria-busy="loading"
      aria-live="polite"
    >
      <div class="summary-heading">
        <h2 id="daily-summary-title" class="summary-label">
          <span class="status-dot"></span> DAILY NUTRITION
        </h2>
        <v-btn
          v-if="!dailyTotal"
          color="on-measurement"
          prepend-icon="mdi-plus"
          variant="tonal"
          rounded="lg"
          :disabled="isBusy || !ready"
          @click="openDaily"
          >Add daily total</v-btn
        >
        <div v-else class="row-actions">
          <v-btn
            icon="mdi-pencil-outline"
            color="on-measurement-muted"
            variant="text"
            size="small"
            aria-label="Edit daily total"
            title="Edit daily total"
            :disabled="isBusy || !ready"
            @click="openDaily"
          ></v-btn>
          <v-btn
            class="delete-entry-button"
            icon="mdi-trash-can-outline"
            color="on-measurement-muted"
            variant="text"
            size="small"
            aria-label="Delete daily total"
            title="Delete daily total"
            :disabled="isBusy || !ready"
            @click="confirmDeleteDaily"
          ></v-btn>
        </div>
      </div>
      <div class="summary-nutrition">
        <v-skeleton-loader
          v-if="loading && calendarDate"
          type="heading"
          color="transparent"
          width="180"
        ></v-skeleton-loader>
        <div v-else class="calorie-value">
          {{ summary ? formatNutrition(summary.values.calories_kcal) : '—' }}<span>kcal</span>
        </div>
        <div class="summary-macros">
          <div v-for="field in summaryMacros" :key="field.key" class="summary-macro">
            <v-skeleton-loader
              v-if="loading && calendarDate"
              type="text"
              color="transparent"
              width="100"
            ></v-skeleton-loader>
            <template v-else>
              <span class="macro-value"
                >{{ summary ? formatNutrition(summary.values[field.key]) : '—' }}g</span
              >
              <span>{{ field.label }}</span>
            </template>
          </div>
        </div>
      </div>
      <div class="summary-date">
        <v-icon icon="mdi-calendar-blank-outline" size="16" aria-hidden="true"></v-icon>
        {{ formatCalendarDate(calendarDate) }}
        <span v-if="summary" class="summary-source">
          · {{ summary.source === 'manual' ? 'Manual daily total' : 'Calculated from meals' }}
        </span>
      </div>
      <p v-if="ready && dailyTotal?.notes" class="summary-notes entry-description">
        {{ dailyTotal.notes }}
      </p>
      <p v-if="!calendarDate" class="summary-caption">Select a valid date to view nutrition.</p>
      <p v-else-if="loading" class="summary-caption">Loading nutrition…</p>
      <p v-else-if="fetchError" class="summary-caption">
        Daily nutrition unavailable. Reload both registration methods to see a reliable total.
      </p>
      <p v-else-if="!summary" class="summary-caption">
        No nutrition recorded for this date. Add a meal or a manual daily total.
      </p>
      <p v-else-if="summary.source === 'manual'" class="summary-caption">
        This manual daily total replaces the sum of your meals. Your meals remain saved.
      </p>
      <v-icon
        class="summary-watermark"
        icon="mdi-silverware-fork-knife"
        size="116"
        aria-hidden="true"
      ></v-icon>
    </section>

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
  <MealEntryDialog
    v-model="mealDialogIsOpen"
    :entry="editingMeal"
    :date="calendarDate || ''"
    :busy="isBusy"
    :error="formError || meals.mutationError.value"
    @save="saveMeal"
  />
  <DailyNutritionDialog
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
.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
}
.eyebrow > span {
  width: 22px;
  height: 2px;
  background: currentColor;
}
h1 {
  margin: 8px 0;
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 1.2;
}
h1 > span {
  color: rgb(var(--v-theme-primary));
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
.daily-summary {
  position: relative;
  overflow: hidden;
  min-height: 212px;
  padding: 28px 32px;
  margin-bottom: 32px;
  border-radius: 20px;
  background: linear-gradient(
    115deg,
    rgb(var(--v-theme-measurement)),
    rgb(var(--v-theme-measurement-end))
  );
  color: rgb(var(--v-theme-on-measurement));
}
.summary-heading {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.summary-label {
  position: relative;
  z-index: 1;
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
.meal-nutrition {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.summary-nutrition {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 32px;
  margin: 12px 0 16px;
}
.calorie-value {
  margin: 0;
  font-size: 58px;
  font-weight: 600;
  letter-spacing: -0.055em;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.calorie-value > span {
  margin-left: 8px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0;
}
.summary-macros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
}
.summary-macro {
  display: flex;
  align-items: baseline;
  gap: 5px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 12px;
}
.macro-value {
  color: rgb(var(--v-theme-on-measurement));
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.summary-date {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 12px;
}
.summary-caption {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 12px;
}
.summary-notes {
  position: relative;
  z-index: 1;
  color: rgb(var(--v-theme-on-measurement-muted));
}
.meal-summary-note {
  margin-bottom: 16px;
}
.summary-watermark {
  position: absolute;
  right: 22px;
  top: 60px;
  color: rgb(var(--v-theme-on-measurement-muted));
  opacity: 0.1;
  transform: rotate(-12deg);
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
  .daily-summary {
    padding: 24px;
    margin-bottom: 24px;
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
