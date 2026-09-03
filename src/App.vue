<script setup>
import { RouterView } from 'vue-router'
import { onMounted, computed } from 'vue'
import { supabase } from './plugins/supabase.js'
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error logging out:', error)
  }
}

const showSignedOutButtons = computed(() => {
  return !authStore.isLoading && !authStore.user
})

const showSignedInButtons = computed(() => {
  return !authStore.isLoading && authStore.user
})

onMounted(async () => {
  await authStore.init()
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <div class="app-bar-inner">
        <div class="app-bar-title">
          <RouterLink to="/" class="app-bar-logo-link">
            <v-img
              src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.svg"
              alt="FitLog"
              width="36"
              height="36"
            />
          </RouterLink>
        </div>

        <div class="app-bar-nav">
          <v-btn :disabled="showSignedOutButtons" variant="text" to="/workouts">Workouts</v-btn>
          <v-btn :disabled="showSignedOutButtons" variant="text" to="/routines">Routines</v-btn>
          <v-btn :disabled="showSignedOutButtons" variant="text" to="/meals">Meals</v-btn>
          <v-btn :disabled="showSignedOutButtons" variant="text" to="/weight-logs"
            >Weight Logs</v-btn
          >
          <v-btn :disabled="showSignedOutButtons" variant="text" to="/body-profile"
            >Body Profile</v-btn
          >
        </div>

        <div class="app-bar-account">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" prepend-icon="mdi-account-circle">
                {{ authStore.user?.user_metadata?.username || 'Account' }}
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-if="showSignedOutButtons"
                to="/register"
                prepend-icon="mdi-account-plus"
                >Register</v-list-item
              >
              <v-list-item v-if="showSignedOutButtons" to="/login" prepend-icon="mdi-account"
                >Log In</v-list-item
              >
              <v-list-item
                v-if="showSignedInButtons"
                @click="handleLogout"
                prepend-icon="mdi-logout"
                >Log Out</v-list-item
              >
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-app-bar>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-bar-inner {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 16px;
}
.app-bar-title {
  flex: 0 0 auto;
}
.app-bar-nav {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}
.app-bar-account {
  flex: 0 0 auto;
}
.app-bar-logo-link {
  display: flex;
  align-items: center;
}
</style>
