<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/plugins/supabase.js'
import { getAuthRedirect } from '@/router/authRedirect.js'
import { getEmailConfirmationUrl } from '@/utils/emailVerification.js'
import { required, isEmail } from '@/utils/validationRules.js'
import AuthFormCard from '@/components/AuthFormCard.vue'

const router = useRouter()
const route = useRoute()
// Keep the email in browser history state, rather than in the URL.
const historyState = window.history.state
const email = ref(
  typeof historyState?.verificationEmail === 'string' ? historyState.verificationEmail : '',
)
const verificationForm = ref(null)
const isResending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const now = ref(Date.now())
const sentAt = historyState?.verificationSentAt
const nextResendAt = ref(Number.isFinite(sentAt) && sentAt <= now.value ? sentAt + 60_000 : 0)
const resendIn = computed(() => Math.max(0, Math.ceil((nextResendAt.value - now.value) / 1000)))
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
  nextResendAt.value = now.value + 60_000
  window.history.replaceState(
    {
      ...window.history.state,
      verificationEmail: email.value.trim(),
      verificationSentAt: now.value,
    },
    '',
  )
}

const resendEmail = async () => {
  if (isResending.value || resendIn.value > 0 || !verificationForm.value) return
  isResending.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const { valid } = await verificationForm.value.validate()
    if (!valid) return
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.value.trim(),
      options: {
        emailRedirectTo: getEmailConfirmationUrl(
          router,
          route.query.redirect,
          window.location.origin,
        ),
      },
    })
    if (error) {
      if (error.status === 429) startCooldown()
      errorMessage.value =
        error.status === 429
          ? 'Too many requests. Wait before requesting another email.'
          : 'Unable to resend the verification email. Please try again.'
      return
    }
    startCooldown()
    // Use the same response for unknown, confirmed and unconfirmed addresses.
    successMessage.value =
      'If this address has an unconfirmed account, a verification link has been sent. Check your inbox and spam folder.'
  } catch {
    errorMessage.value =
      'Unable to resend the verification email. Check your connection and try again.'
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <AuthFormCard
    title="Check your email"
    description="Open the confirmation link in your email to activate your FitLog account."
    icon="mdi-email-check-outline"
  >
    <v-form
      ref="verificationForm"
      validate-on="blur"
      :disabled="isResending"
      :aria-busy="isResending"
      aria-labelledby="auth-page-title"
      @submit.prevent="resendEmail"
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
      <p class="verification-help">
        Didn't receive an email? Check your spam folder or request a new link below.
      </p>
      <v-alert v-if="errorMessage" class="auth-error" type="error" variant="tonal">{{
        errorMessage
      }}</v-alert>
      <v-alert v-if="successMessage" class="verification-success" type="success" variant="tonal">{{
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
        :loading="isResending"
        :disabled="isResending || resendIn > 0"
        >{{ resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend verification email' }}</v-btn
      >
    </v-form>
    <template #footer>
      <p>Already verified? <RouterLink :to="loginLocation">Log in</RouterLink></p>
    </template>
  </AuthFormCard>
</template>

<style scoped>
.verification-help {
  margin-bottom: 16px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  line-height: 1.7;
}

.verification-success {
  margin-block: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
}
</style>
