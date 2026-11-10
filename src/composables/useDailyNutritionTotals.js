import { ref } from 'vue'
import { supabase } from '../plugins/supabase'
import { sortDescending, errorMessage } from '../utils/composableHelpers.js'

export function useDailyNutritionTotals() {
  const dailyNutritionTotals = ref([])
  const isFetchLoading = ref(false)
  const isMutationLoading = ref(false)
  const fetchError = ref(null)
  const mutationError = ref(null)

  const fetchAllDailyNutritionTotals = async () => {
    if (isFetchLoading.value) return
    isFetchLoading.value = true
    fetchError.value = null

    try {
      const { data, error } = await supabase
        .from('daily_nutrition_totals')
        .select('*')
        .order('log_date', { ascending: false })

      if (error) throw error
      dailyNutritionTotals.value = data
    } catch (error) {
      fetchError.value = errorMessage(
        error,
        'Unable to load daily nutrition totals. Please try again.',
      )
    } finally {
      isFetchLoading.value = false
    }
  }

  const createDailyNutritionTotal = async ({
    user_id: userId,
    calories_kcal,
    protein_g,
    carbs_g,
    fats_g,
    log_date,
    notes,
  }) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { data, error } = await supabase
        .from('daily_nutrition_totals')
        .insert({ user_id: userId, calories_kcal, protein_g, carbs_g, fats_g, log_date, notes })
        .select()
        .single()

      if (error) throw error
      dailyNutritionTotals.value.push(data)
      sortDescending(dailyNutritionTotals.value, 'log_date')
      return true
    } catch (error) {
      mutationError.value = errorMessage(
        error,
        'Unable to add the daily nutrition total. Please try again.',
      )
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  const updateDailyNutritionTotal = async (
    id,
    { calories_kcal, protein_g, carbs_g, fats_g, log_date, notes },
  ) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { data, error } = await supabase
        .from('daily_nutrition_totals')
        .update({ calories_kcal, protein_g, carbs_g, fats_g, log_date, notes })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const index = dailyNutritionTotals.value.findIndex((entry) => entry.id === id)
      if (index !== -1) dailyNutritionTotals.value[index] = data
      sortDescending(dailyNutritionTotals.value, 'log_date')
      return true
    } catch (error) {
      mutationError.value = errorMessage(
        error,
        'Unable to update the daily nutrition total. Please try again.',
      )
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  const deleteDailyNutritionTotal = async (id) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { error } = await supabase
        .from('daily_nutrition_totals')
        .delete()
        .eq('id', id)
        .select('id')
        .single()

      if (error) throw error
      dailyNutritionTotals.value = dailyNutritionTotals.value.filter((entry) => entry.id !== id)
      return true
    } catch (error) {
      mutationError.value = errorMessage(
        error,
        'Unable to delete the daily nutrition total. Please try again.',
      )
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  return {
    dailyNutritionTotals,
    isFetchLoading,
    isMutationLoading,
    fetchError,
    mutationError,
    fetchAllDailyNutritionTotals,
    createDailyNutritionTotal,
    updateDailyNutritionTotal,
    deleteDailyNutritionTotal,
  }
}
