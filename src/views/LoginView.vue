<script setup>
import { supabase } from '../plugins/supabase.js'
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'
import { required, isEmail } from '../utils/validationRules.js'
import AuthFormCard from '@/components/AuthFormCard.vue'
import { getAuthRedirect } from '@/router/authRedirect.js'

const router = useRouter()
const route = useRoute()
const userEmail = ref('')
const userPassword = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)
const loginForm = ref(null)

const loginUser = async () => {
  if (isLoading.value || !loginForm.value) return
  // Capture the destination before auth changes can trigger the app watcher.
  const destination = getAuthRedirect(router, route.query.redirect)
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { valid } = await loginForm.value.validate()
    if (!valid) return

    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail.value,
      password: userPassword.value,
    })
    if (error) {
      errorMessage.value = error.message
      return
    }
    await router.replace(destination)
  } catch (error) {
    errorMessage.value = error?.message || 'Unable to log in. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthFormCard
    title="Log in"
    description="Enter your email and password to access your FitLog account."
    icon="mdi-login"
  >
    <v-form
      ref="loginForm"
      :disabled="isLoading"
      :aria-busy="isLoading"
      aria-labelledby="auth-page-title"
      @submit.prevent="loginUser"
    >
      <v-text-field
        v-model="userEmail"
        :rules="[required, isEmail]"
        label="Email"
        name="email"
        autocomplete="username"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
        density="comfortable"
        color="primary"
      ></v-text-field>
      <v-text-field
        v-model="userPassword"
        :rules="[required]"
        label="Password"
        name="password"
        autocomplete="current-password"
        prepend-inner-icon="mdi-lock-outline"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        density="comfortable"
        color="primary"
      >
        <template #append-inner>
          <v-btn
            :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showPassword"
            :disabled="isLoading"
            type="button"
            variant="text"
            size="small"
            density="comfortable"
            @mousedown.prevent
            @click="showPassword = !showPassword"
          ></v-btn>
        </template>
      </v-text-field>
      <v-alert v-if="errorMessage" class="auth-error" variant="tonal" type="error">
        {{ errorMessage }}
      </v-alert>
      <v-btn
        class="auth-submit"
        block
        color="primary"
        size="large"
        type="submit"
        variant="flat"
        rounded="lg"
        :loading="isLoading"
        :disabled="isLoading"
        >Log in</v-btn
      >
    </v-form>
    <template #footer>
      <p>
        Don't have an account?
        <RouterLink :to="{ name: 'register', query: { redirect: route.query.redirect } }"
          >Create an account</RouterLink
        >
      </p>
    </template>
  </AuthFormCard>
</template>
