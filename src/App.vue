<script setup>
import { RouterView } from 'vue-router'
import { onMounted, computed } from 'vue'
import { supabase } from './plugins/supabase.js'
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error logging out:', error)
  }
}

const showSignedOutButtons = computed(() => {
  return !authStore.isLoading && !authStore.user
})

const showSignedInButtons = computed(() => {
  return !authStore.isLoading && authStore.user
})

onMounted(async () => {
  await authStore.init()
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <v-spacer></v-spacer>

      <v-toolbar-title>FitLog</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn variant="text" to="/">Home</v-btn>
      <v-btn v-if="showSignedInButtons" variant="text" to="/workouts">Workouts</v-btn>
      <v-btn v-if="showSignedInButtons" variant="text" to="/routines">Routines</v-btn>
      <v-btn v-if="showSignedInButtons" variant="text" to="/meals">Meals</v-btn>
      <v-btn v-if="showSignedInButtons" variant="text" to="/weight-logs">Weight Logs</v-btn>
      <v-btn v-if="showSignedInButtons" variant="text" to="/body-profile">Body Profile</v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" prepend-icon="mdi-account-circle">
            {{ authStore.user?.user_metadata?.username || 'Account' }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-if="showSignedOutButtons" to="/register" prepend-icon="mdi-account-plus"
            >Register</v-list-item
          >
          <v-list-item v-if="showSignedOutButtons" to="/login" prepend-icon="mdi-account"
            >Log In</v-list-item
          >
          <v-list-item v-if="showSignedInButtons" @click="handleLogout" prepend-icon="mdi-logout"
            >Log Out</v-list-item
          >
        </v-list>
      </v-menu>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>
