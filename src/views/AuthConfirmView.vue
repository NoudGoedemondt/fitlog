<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/plugins/supabase.js'
import { getAuthRedirect } from '@/router/authRedirect.js'
import { confirmEmailSession } from '@/utils/emailVerification.js'
import AuthFormCard from '@/components/AuthFormCard.vue'

const router = useRouter()
const route = useRoute()
const destination = getAuthRedirect(router, route.query.redirect)
const returnPath = router.resolve(destination).fullPath
const isChecking = ref(true)
const isVerified = ref(false)
const errorMessage = ref('')
const title = computed(() =>
  isChecking.value
    ? 'Verifying email'
    : isVerified.value
      ? 'Email verified'
      : 'Verification failed',
)
const description = computed(() =>
  isChecking.value
    ? 'Checking your confirmation link. Please wait.'
    : isVerified.value
      ? 'Your email is confirmed and you are logged in. Continue to FitLog.'
      : 'Request a new confirmation link or log in if your email is already verified.',
)

onMounted(async () => {
  try {
    await confirmEmailSession(supabase.auth)
    isVerified.value = true
  } catch (error) {
    errorMessage.value =
      error?.message || 'Unable to verify your email. Please try again or request a new link.'
  } finally {
    isChecking.value = false
    // Remove session tokens and provider errors from the callback URL.
    if (router.currentRoute.value.name === 'auth-confirm') {
      await router.replace({ name: 'auth-confirm', query: { redirect: returnPath } })
    }
  }
})
</script>

<template>
  <AuthFormCard
    :title="title"
    :description="description"
    :icon="isVerified ? 'mdi-email-check-outline' : 'mdi-email-outline'"
  >
    <div v-if="isChecking" class="verification-status" role="status" aria-live="polite">
      <v-progress-circular indeterminate color="primary" size="28" width="3"></v-progress-circular>
      <span>Verifying confirmation link…</span>
    </div>
    <template v-else>
      <v-alert v-if="errorMessage" class="auth-error" type="error" variant="tonal">{{
        errorMessage
      }}</v-alert>
      <v-btn
        v-if="isVerified"
        class="auth-submit"
        block
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        :to="destination"
        replace
        >Continue to FitLog</v-btn
      >
      <v-btn
        v-else
        class="auth-submit"
        block
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        :to="{ name: 'verify-email', query: { redirect: returnPath } }"
        replace
        >Request a new link</v-btn
      >
    </template>
    <template #footer>
      <p>
        Already verified?
        <RouterLink :to="{ name: 'login', query: { redirect: returnPath } }">Log in</RouterLink>
      </p>
    </template>
  </AuthFormCard>
</template>

<style scoped>
.verification-status {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
}
</style>
