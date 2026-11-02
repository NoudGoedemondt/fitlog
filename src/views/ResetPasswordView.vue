<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/plugins/supabase.js'
import { getAuthRedirect } from '@/router/authRedirect.js'
import { getPasswordRecoveryUser, updateRecoveredPassword } from '@/utils/passwordRecovery.js'
import { required, minLength, matchOther } from '@/utils/validationRules.js'
import AuthFormCard from '@/components/AuthFormCard.vue'

const router = useRouter()
const route = useRoute()
const destination = getAuthRedirect(router, route.query.redirect)
const recoveryLocation = {
  name: 'forgot-password',
  query: { redirect: router.resolve(destination).fullPath },
}
const resetForm = ref(null)
const password = ref('')
const confirmation = ref('')
const showPassword = ref(false)
const showConfirmation = ref(false)
const userId = ref(null)
const accountEmail = ref('')
const isChecking = ref(true)
const isSaving = ref(false)
const isComplete = ref(false)
const errorMessage = ref('')
const isBusy = computed(() => isChecking.value || isSaving.value)
const title = computed(() => (isComplete.value ? 'Password updated' : 'Set a new password'))
const description = computed(() =>
  isComplete.value
    ? 'Your password has been updated. You are logged in and can continue to FitLog.'
    : 'Choose a new password and enter it again to confirm.',
)

onMounted(async () => {
  try {
    const user = await getPasswordRecoveryUser(supabase.auth)
    userId.value = user.id
    accountEmail.value = user.email || ''
  } catch (error) {
    errorMessage.value =
      error?.message || 'Unable to check your reset link. Request a new link or try again later.'
  } finally {
    isChecking.value = false
    // Do not retain recovery tokens or provider errors in browser history.
    if (router.currentRoute.value.name === 'reset-password') {
      await router.replace({ name: 'reset-password', query: recoveryLocation.query })
    }
  }
})

const savePassword = async () => {
  if (isBusy.value || isComplete.value || !userId.value || !resetForm.value) return
  isSaving.value = true
  errorMessage.value = ''
  try {
    const { valid } = await resetForm.value.validate()
    if (!valid) return
    await updateRecoveredPassword(supabase.auth, password.value, userId.value)
    password.value = ''
    confirmation.value = ''
    showPassword.value = false
    showConfirmation.value = false
    isComplete.value = true
  } catch (error) {
    errorMessage.value =
      error?.message || 'Unable to update your password. Check your connection and try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <AuthFormCard :title="title" :description="description" icon="mdi-lock-reset">
    <div v-if="isChecking" class="reset-status" role="status" aria-live="polite">
      <v-progress-circular indeterminate color="primary" size="28" width="3"></v-progress-circular>
      Checking reset link…
    </div>
    <template v-else-if="isComplete">
      <v-btn
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
    </template>
    <template v-else>
      <v-alert v-if="errorMessage" class="auth-error" type="error" variant="tonal">{{
        errorMessage
      }}</v-alert>
      <v-form
        v-if="userId"
        ref="resetForm"
        :disabled="isSaving"
        :aria-busy="isSaving"
        aria-labelledby="auth-page-title"
        @submit.prevent="savePassword"
      >
        <p v-if="accountEmail" class="reset-account">
          Updating password for <strong>{{ accountEmail }}</strong
          >.
        </p>
        <v-text-field
          v-model="password"
          label="New password"
          name="new-password"
          autocomplete="new-password"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          hint="At least 6 characters."
          persistent-hint
          :rules="[required, minLength(6)]"
        >
          <template #append-inner>
            <v-btn
              :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              :aria-label="showPassword ? 'Hide new password' : 'Show new password'"
              :aria-pressed="showPassword"
              :disabled="isSaving"
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
          v-model="confirmation"
          label="Confirm new password"
          name="password-confirmation"
          autocomplete="new-password"
          :type="showConfirmation ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          :rules="[required, minLength(6), matchOther(password, 'Passwords')]"
        >
          <template #append-inner>
            <v-btn
              :icon="showConfirmation ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              :aria-label="
                showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'
              "
              :aria-pressed="showConfirmation"
              :disabled="isSaving"
              type="button"
              variant="text"
              size="small"
              density="comfortable"
              @mousedown.prevent
              @click="showConfirmation = !showConfirmation"
            ></v-btn>
          </template>
        </v-text-field>
        <v-btn
          class="auth-submit"
          block
          type="submit"
          color="primary"
          variant="flat"
          rounded="lg"
          size="large"
          :loading="isSaving"
          :disabled="isSaving"
          >Save new password</v-btn
        >
      </v-form>
      <v-btn
        v-else
        class="auth-submit"
        block
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        :to="recoveryLocation"
        replace
        >Request a new reset link</v-btn
      >
    </template>
    <template #footer>
      <p v-if="!isComplete">
        Need another link? <RouterLink :to="recoveryLocation">Request a reset email</RouterLink>
      </p>
      <p v-else>Your password is ready to use.</p>
    </template>
  </AuthFormCard>
</template>

<style scoped>
.reset-status {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
}

.reset-account {
  margin-bottom: 20px;
  overflow-wrap: anywhere;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  line-height: 1.7;
}
</style>
