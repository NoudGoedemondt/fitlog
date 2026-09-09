import { ref } from 'vue'
import { supabase } from '../plugins/supabase'

//mutates the entries array in place
const sortDescending = (entries) => {
  entries.sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
}

export function useWeightLogs() {
  const weightEntries = ref([])
  const isFetchLoading = ref(false)
  const isMutationLoading = ref(false)
  const fetchError = ref(null)
  const mutationError = ref(null)

  const fetchAllWeights = async () => {
    isFetchLoading.value = true
    fetchError.value = null

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .order('measured_at', { ascending: false })

    if (error) {
      fetchError.value = error.message
    } else {
      weightEntries.value = data
    }

    isFetchLoading.value = false
  }

  const createWeightEntry = async ({
    user_id: userId,
    weight_kg: weightKg,
    measured_at: measuredAt,
  }) => {
    isMutationLoading.value = true
    mutationError.value = null

    const { data, error } = await supabase
      .from('weight_logs')
      .insert({ user_id: userId, weight_kg: weightKg, measured_at: measuredAt })
      .select()

    if (error) {
      mutationError.value = error.message
    } else {
      weightEntries.value.push(data[0])
      sortDescending(weightEntries.value)
    }

    isMutationLoading.value = false
  }

  const updateWeightEntry = async (id, { weight_kg: weightKg, measured_at: measuredAt }) => {
    isMutationLoading.value = true
    mutationError.value = null

    const { error } = await supabase
      .from('weight_logs')
      .update({ weight_kg: weightKg, measured_at: measuredAt })
      .eq('id', id)

    if (error) {
      mutationError.value = error.message
    } else {
      const index = weightEntries.value.findIndex((entry) => entry.id === id)

      weightEntries.value[index] = {
        ...weightEntries.value[index],
        weight_kg: weightKg,
        measured_at: measuredAt,
      }
      sortDescending(weightEntries.value)
    }

    isMutationLoading.value = false
  }

  const deleteWeightEntry = async (id) => {
    isMutationLoading.value = true
    mutationError.value = null

    const { error } = await supabase.from('weight_logs').delete().eq('id', id)

    if (error) {
      mutationError.value = error.message
    } else {
      weightEntries.value = weightEntries.value.filter((entry) => entry.id !== id)
    }

    isMutationLoading.value = false
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
