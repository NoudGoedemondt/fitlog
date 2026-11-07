<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/plugins/supabase.js'
import { getAuthRedirect } from '@/router/authRedirect.js'
import { getPasswordResetUrl } from '@/utils/passwordRecovery.js'
import { required, isEmail } from '@/utils/validationRules.js'
import AuthFormCard from '@/components/AuthFormCard.vue'

const router = useRouter()
const route = useRoute()
const historyState = window.history.state
const email = ref(typeof historyState?.recoveryEmail === 'string' ? historyState.recoveryEmail : '')
const recoveryForm = ref(null)
const isSending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const now = ref(Date.now())
const sentAt = historyState?.recoverySentAt
const nextRequestAt = ref(Number.isFinite(sentAt) && sentAt <= now.value ? sentAt + 60_000 : 0)
const resendIn = computed(() => Math.max(0, Math.ceil((nextRequestAt.value - now.value) / 1000)))
const loginLocation = computed(() => ({
  name: 'login',
  query: { redirect: router.resolve(getAuthRedirect(router, route.query.redirect)).fullPath },
}))
let timer
let isActive = true
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  isActive = false
  clearInterval(timer)
})

const startCooldown = () => {
  if (!isActive) return
  now.value = Date.now()
  nextRequestAt.value = now.value + 60_000
  window.history.replaceState(
    {
      ...window.history.state,
      recoveryEmail: email.value.trim(),
      recoverySentAt: now.value,
    },
    '',
  )
}

const sendResetEmail = async () => {
  if (isSending.value || resendIn.value > 0 || !recoveryForm.value) return
  isSending.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { valid } = await recoveryForm.value.validate()
    if (!valid) return
    const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: getPasswordResetUrl(router, route.query.redirect, window.location.origin),
    })
    if (error) {
      if (error.status === 429) startCooldown()
      errorMessage.value =
        error.status === 429
          ? 'Too many requests. Wait before requesting another email.'
          : 'Unable to send the password reset email. Please try again.'
      return
    }
    startCooldown()
    successMessage.value =
      'If an account exists for this email address, a password reset link has been sent. Check your inbox and spam folder.'
  } catch {
    errorMessage.value =
      'Unable to send the password reset email. Check your connection and try again.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <AuthFormCard
    title="Reset your password"
    description="Enter your email address to request a password reset link."
    icon="mdi-lock-reset"
  >
    <v-form
      ref="recoveryForm"
      validate-on="blur"
      :disabled="isSending"
      :aria-busy="isSending"
      aria-labelledby="auth-page-title"
      @submit.prevent="sendResetEmail"
    >
      <v-text-field
        v-model="email"
        label="Email"
        name="email"
        type="email"
        autocomplete="email"
        variant="outlined"
        density="comfortable"
        color="primary"
        prepend-inner-icon="mdi-email-outline"
        :rules="[required, isEmail]"
      ></v-text-field>
      <v-alert v-if="errorMessage" class="auth-error" type="error" variant="tonal">{{
        errorMessage
      }}</v-alert>
      <v-alert v-if="successMessage" class="recovery-success" type="success" variant="tonal">{{
        successMessage
      }}</v-alert>
      <v-btn
        class="auth-submit"
        block
        type="submit"
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        :loading="isSending"
        :disabled="isSending || resendIn > 0"
        >{{ resendIn > 0 ? `Send again in ${resendIn}s` : 'Send reset link' }}</v-btn
      >
    </v-form>
    <template #footer
      ><p>Remember your password? <RouterLink :to="loginLocation">Log in</RouterLink></p></template
    >
  </AuthFormCard>
</template>

<style scoped>
.recovery-success {
  margin-block: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
}
</style>
