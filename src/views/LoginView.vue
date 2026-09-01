<script setup>
import { supabase } from '../plugins/supabase.js'
import router from '../router/index.js'
import { ref } from 'vue'
import { emailRules, passwordRules } from '../utils/validationRules.js'

const userEmail = ref('')
const userPassword = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const loginForm = ref(null)

const loginUser = async () => {
  const { valid } = await loginForm.value.validate()
  if (!valid) return

  isLoading.value = true
  errorMessage.value = ''
  const { error } = await supabase.auth.signInWithPassword({
    email: userEmail.value,
    password: userPassword.value,
  })

  isLoading.value = false

  if (error) {
    errorMessage.value = error.message
  } else {
    router.push('/')
  }
}
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="6" md="8" lg="4">
        <v-card class="elevation-12 pa-4" :loading="isLoading">
          <v-card-title class="text-h5 text-center font-weight-bold mb-6 text-medium-emphasis">
            Log into your account
          </v-card-title>
          <v-card-text>
            <v-form ref="loginForm" @submit.prevent="loginUser">
              <v-text-field
                v-model="userEmail"
                :rules="emailRules"
                label="Email"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="userPassword"
                :rules="passwordRules"
                label="Password"
                prepend-inner-icon="mdi-lock-outline"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              ></v-text-field>
              <v-alert v-if="errorMessage" variant="outlined" type="error" class="mb-8">
                {{ errorMessage }}
              </v-alert>
              <v-btn block color="primary" size="large" type="submit" class="mt-4"> Log In </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
