import { ref } from 'vue'
import { supabase } from '../plugins/supabase'
import { sortDescending, errorMessage } from '../utils/composableHelpers.js'

export function useMeals() {
  const mealEntries = ref([])
  const isFetchLoading = ref(false)
  const isMutationLoading = ref(false)
  const fetchError = ref(null)
  const mutationError = ref(null)

  const fetchAllMeals = async () => {
    if (isFetchLoading.value) return
    isFetchLoading.value = true
    fetchError.value = null

    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('consumed_at', { ascending: false })

      if (error) throw error
      mealEntries.value = data
    } catch (error) {
      fetchError.value = errorMessage(error, 'Unable to load meal entries. Please try again.')
    } finally {
      isFetchLoading.value = false
    }
  }

  const createMealEntry = async ({
    user_id: userId,
    name,
    description,
    calories_kcal,
    protein_g,
    carbs_g,
    fats_g,
    consumed_at,
  }) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          name,
          description,
          calories_kcal,
          protein_g,
          carbs_g,
          fats_g,
          consumed_at,
        })
        .select()
        .single()

      if (error) throw error
      mealEntries.value.push(data)
      sortDescending(mealEntries.value, 'consumed_at')
      return true
    } catch (error) {
      mutationError.value = errorMessage(error, 'Unable to add the meal entry. Please try again.')
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  const updateMealEntry = async (
    id,
    { name, description, calories_kcal, protein_g, carbs_g, fats_g, consumed_at },
  ) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { data, error } = await supabase
        .from('meals')
        .update({ name, description, calories_kcal, protein_g, carbs_g, fats_g, consumed_at })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const index = mealEntries.value.findIndex((entry) => entry.id === id)
      if (index !== -1) mealEntries.value[index] = data
      sortDescending(mealEntries.value, 'consumed_at')
      return true
    } catch (error) {
      mutationError.value = errorMessage(
        error,
        'Unable to update the meal entry. Please try again.',
      )
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  const deleteMealEntry = async (id) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { error } = await supabase.from('meals').delete().eq('id', id).select('id').single()

      if (error) throw error
      mealEntries.value = mealEntries.value.filter((entry) => entry.id !== id)
      return true
    } catch (error) {
      mutationError.value = errorMessage(
        error,
        'Unable to delete the meal entry. Please try again.',
      )
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  return {
    mealEntries,
    isFetchLoading,
    isMutationLoading,
    fetchError,
    mutationError,
    fetchAllMeals,
    createMealEntry,
    updateMealEntry,
    deleteMealEntry,
  }
}
