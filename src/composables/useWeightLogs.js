import { ref } from 'vue'
import { supabase } from '../plugins/supabase'

// Mutates the entries array in place.
const sortDescending = (entries) => {
  entries.sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
}

const errorMessage = (error, fallback) => error?.message || fallback

export function useWeightLogs() {
  const weightEntries = ref([])
  const isFetchLoading = ref(false)
  const isMutationLoading = ref(false)
  const fetchError = ref(null)
  const mutationError = ref(null)

  const fetchAllWeights = async () => {
    if (isFetchLoading.value) return
    isFetchLoading.value = true
    fetchError.value = null

    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .order('measured_at', { ascending: false })

      if (error) throw error
      weightEntries.value = data
    } catch (error) {
      fetchError.value = errorMessage(error, 'Unable to load weight entries. Please try again.')
    } finally {
      isFetchLoading.value = false
    }
  }

  const createWeightEntry = async ({
    user_id: userId,
    weight_kg: weightKg,
    measured_at: measuredAt,
  }) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .insert({ user_id: userId, weight_kg: weightKg, measured_at: measuredAt })
        .select()
        .single()

      if (error) throw error
      weightEntries.value.push(data)
      sortDescending(weightEntries.value)
      return true
    } catch (error) {
      mutationError.value = errorMessage(error, 'Unable to add the weight entry. Please try again.')
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  const updateWeightEntry = async (id, { weight_kg: weightKg, measured_at: measuredAt }) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .update({ weight_kg: weightKg, measured_at: measuredAt })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const index = weightEntries.value.findIndex((entry) => entry.id === id)
      if (index !== -1) weightEntries.value[index] = data
      sortDescending(weightEntries.value)
      return true
    } catch (error) {
      mutationError.value = errorMessage(
        error,
        'Unable to update the weight entry. Please try again.',
      )
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  const deleteWeightEntry = async (id) => {
    if (isMutationLoading.value) return false
    isMutationLoading.value = true
    mutationError.value = null

    try {
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', id)
        .select('id')
        .single()

      if (error) throw error
      weightEntries.value = weightEntries.value.filter((entry) => entry.id !== id)
      return true
    } catch (error) {
      mutationError.value = errorMessage(
        error,
        'Unable to delete the weight entry. Please try again.',
      )
      return false
    } finally {
      isMutationLoading.value = false
    }
  }

  return {
    weightEntries,
    isFetchLoading,
    isMutationLoading,
    fetchError,
    mutationError,
    fetchAllWeights,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
  }
}
