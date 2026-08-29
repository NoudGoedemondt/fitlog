<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { supabase } from './plugins/supabase.js'

const registerUser = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'noudgoedemondt@gmail.com',
    password: 'noud123',
    options: {
      data: {
        username: 'noud',
      },
    },
  })

  console.log('registerUser', data, error)
  return { data, error }
}

const loginuser = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'noudgoedemondt@gmail.com',
    password: 'noud123',
  })

  console.log('loginuser', data, error)
  return { data, error }
}

const logoutUser = async () => {
  const { error } = await supabase.auth.signOut()

  console.log('logoutUser', error)
  return { error }
}

const getUser = async () => {
  const { data, error } = await supabase.auth.getUser()

  console.log('getUser', data, error)
  return { data, error }
}

onMounted(() => {
  window.registerUser = registerUser
  window.loginUser = loginuser
  window.logoutUser = logoutUser
  window.getUser = getUser
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
