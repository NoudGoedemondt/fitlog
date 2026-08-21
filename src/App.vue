<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { supabase } from './plugins/supabase.js'

onMounted(async () => {
  const { data, error } = await supabase.from('exercises').select('*')
  console.log('Mounted!')
  console.log(data, error)
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
    </v-app-bar>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>
