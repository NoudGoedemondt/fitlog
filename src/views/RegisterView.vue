<script setup>
import { supabase } from '../plugins/supabase.js'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { required, isEmail, matchOther, minLength } from '../utils/validationRules.js'
import AuthFormCard from '@/components/AuthFormCard.vue'

const router = useRouter()
const userName = ref('')
const userEmail1 = ref('')
const userEmail2 = ref('')
const userPassword1 = ref('')
const userPassword2 = ref('')
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)
const registerForm = ref(null)

const registerUser = async () => {
  if (isLoading.value || !registerForm.value) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { valid } = await registerForm.value.validate()
    if (!valid) return

    const { error } = await supabase.auth.signUp({
      email: userEmail2.value,
      password: userPassword2.value,
      options: { data: { username: userName.value } },
    })
    if (error) {
      errorMessage.value = error.message
      return
    }
    await router.push('/')
  } catch (error) {
    errorMessage.value = error?.message || 'Unable to create your account. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthFormCard
    title="Create an account"
    description="Set up your FitLog account with a username, email and password."
    icon="mdi-account-plus-outline"
  >
    <v-form
      ref="registerForm"
      :disabled="isLoading"
      :aria-busy="isLoading"
      aria-labelledby="auth-page-title"
      @submit.prevent="registerUser"
    >
      <v-text-field
        v-model="userName"
        :rules="[required, minLength(4)]"
        label="Username"
        name="username"
        autocomplete="username"
        prepend-inner-icon="mdi-account-outline"
        type="text"
        variant="outlined"
        density="comfortable"
        color="primary"
      ></v-text-field>
      <v-text-field
        v-model="userEmail1"
        :rules="[required, isEmail]"
        label="Email"
        name="email"
        autocomplete="email"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
        density="comfortable"
        color="primary"
      ></v-text-field>
      <v-text-field
        v-model="userEmail2"
        :rules="[required, isEmail, matchOther(userEmail1, 'Emails')]"
        label="Confirm email"
        name="email-confirmation"
        autocomplete="email"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
        density="comfortable"
        color="primary"
      ></v-text-field>
      <v-text-field
        v-model="userPassword1"
        :rules="[required, minLength(6)]"
        label="Password"
        name="password"
        autocomplete="new-password"
        hint="At least 6 characters."
        persistent-hint
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
      <v-text-field
        v-model="userPassword2"
        :rules="[required, minLength(6), matchOther(userPassword1, 'Passwords')]"
        label="Confirm password"
        name="password-confirmation"
        autocomplete="new-password"
        prepend-inner-icon="mdi-lock-outline"
        :type="showPasswordConfirmation ? 'text' : 'password'"
        variant="outlined"
        density="comfortable"
        color="primary"
      >
        <template #append-inner>
          <v-btn
            :icon="showPasswordConfirmation ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            :aria-label="
              showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'
            "
            :aria-pressed="showPasswordConfirmation"
            :disabled="isLoading"
            type="button"
            variant="text"
            size="small"
            density="comfortable"
            @mousedown.prevent
            @click="showPasswordConfirmation = !showPasswordConfirmation"
          ></v-btn>
        </template>
      </v-text-field>
      <v-alert v-if="errorMessage" class="auth-error" variant="tonal" type="error">{{
        errorMessage
      }}</v-alert>
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
        >Create account</v-btn
      >
    </v-form>
    <template #footer>
      <p>Already have an account? <RouterLink to="/login">Log in</RouterLink></p>
    </template>
  </AuthFormCard>
</template>
