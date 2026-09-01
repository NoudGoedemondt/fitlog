import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/plugins/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const isLoading = ref(true)
  const user = computed(() => session.value?.user ?? null)

  async function init() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    isLoading.value = false

    supabase.auth.onAuthStateChange((event, newSession) => {
      session.value = newSession
      //console.log('Auth state changed event:', event)
    })
  }

  return { session, user, isLoading, init }
})
