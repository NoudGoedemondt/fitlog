<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { supabase } from './plugins/supabase.js'
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error logging out:', error)
  }
}

onMounted(async () => {
  await authStore.init()
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <v-toolbar-title>FitLog</v-toolbar-title>

      <v-btn variant="text" to="/">Home</v-btn>
      <v-btn variant="text" to="/workouts">Workouts</v-btn>
      <v-btn variant="text" to="/routines">Routines</v-btn>
      <v-btn variant="text" to="/meals">Meals</v-btn>
      <v-btn variant="text" to="/weight-logs">Weight Logs</v-btn>
      <v-btn variant="text" to="/body-profile">Body Profile</v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            {{ authStore.user?.user_metadata?.username }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleLogout">Log Out</v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>
