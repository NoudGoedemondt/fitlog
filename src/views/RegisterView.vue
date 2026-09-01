<script setup>
import { supabase } from '../plugins/supabase.js'
import router from '../router/index.js'
import { ref } from 'vue'
import { required, isEmail, matchOther, minLength } from '../utils/validationRules.js'

const userName = ref('')
const userEmail1 = ref('')
const userEmail2 = ref('')
const userPassword1 = ref('')
const userPassword2 = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const registerForm = ref(null)

const registerUser = async () => {
  const { valid } = await registerForm.value.validate()
  if (!valid) return

  isLoading.value = true
  errorMessage.value = ''

  const { error } = await supabase.auth.signUp({
    email: userEmail2.value,
    password: userPassword2.value,
    options: {
      data: {
        username: userName.value,
      },
    },
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
        <v-img
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.svg"
          alt="Vuetify Logo"
          width="50"
          class="mx-auto mb-4"
        />
        <v-card-title class="text-h5 text-center font-weight-bold mb-6 text-medium-emphasis">
          Create your account
        </v-card-title>
        <v-card class="elevation-12 pa-4 py-8" :loading="isLoading">
          <v-card-text>
            <v-form ref="registerForm" @submit.prevent="registerUser">
              <v-text-field
                v-model="userName"
                :rules="[required, minLength(4)]"
                label="Username"
                prepend-inner-icon="mdi-account-outline"
                type="text"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="userEmail1"
                :rules="[required, isEmail]"
                label="Email"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="userEmail2"
                :rules="[required, isEmail, matchOther(userEmail1, 'Emails')]"
                label="Confirm Email"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="userPassword1"
                :rules="[required, minLength(6)]"
                label="Password"
                prepend-inner-icon="mdi-lock-outline"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              ></v-text-field>
              <v-text-field
                v-model="userPassword2"
                :rules="[required, minLength(6), matchOther(userPassword1, 'Passwords')]"
                label="Confirm Password"
                prepend-inner-icon="mdi-lock-outline"
                type="password"
                variant="outlined"
                density="comfortable"
                class="mb-2"
              ></v-text-field>
              <v-alert v-if="errorMessage" variant="outlined" type="error" class="mb-8">
                {{ errorMessage }}
              </v-alert>
              <v-btn block color="primary" size="large" type="submit" class="mt-4">
                Register
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
