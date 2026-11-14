<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { onMounted, computed, ref, watch } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import { supabase } from './plugins/supabase.js'
import { useAuthStore } from './stores/auth.js'
import iconFitlog from '@/components/icons/IconFitlog.vue'
import { getAuthRouteRedirect } from '@/router/authRedirect.js'
import { saveThemePreference } from '@/utils/themePreference.js'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { smAndDown } = useDisplay()
const theme = useTheme()
const themeOptions = [
  { title: 'Light', value: 'light', icon: 'mdi-weather-sunny' },
  { title: 'Dark', value: 'dark', icon: 'mdi-weather-night' },
  { title: 'System', value: 'system', icon: 'mdi-theme-light-dark' },
]
const themePreference = computed(() => (theme.isSystem.value ? 'system' : theme.name.value))

const selectTheme = (preference) => {
  void theme.change(preference)
  saveThemePreference(preference)
}

const mobileNavigationIsOpen = ref(false)
const navigationItems = [
  { title: 'Workouts', to: '/workouts', icon: 'mdi-dumbbell' },
  { title: 'Routines', to: '/routines', icon: 'mdi-clipboard-text-outline' },
  { title: 'Nutrition', to: '/nutrition', icon: 'mdi-food-apple-outline' },
  { title: 'Weight', to: '/weight', icon: 'mdi-scale-bathroom' },
  { title: 'Body profile', to: '/body-profile', icon: 'mdi-account-outline' },
]
const navigationIsDisabled = computed(() => authStore.isLoading || !authStore.user)
const accountLabel = computed(() => authStore.user?.user_metadata?.username || 'Account')

watch([() => route.fullPath, smAndDown], () => {
  mobileNavigationIsOpen.value = false
})

watch(
  [() => authStore.isLoading, () => authStore.user, () => route.fullPath],
  ([isLoading, user]) => {
    if (isLoading) return
    const redirect = getAuthRouteRedirect(router, route, user)
    if (redirect) void router.replace(redirect)
  },
  { immediate: true },
)

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
    <v-app-bar class="app-bar" color="surface" :height="smAndDown ? 64 : 80" :elevation="0">
      <v-container class="app-bar-container">
        <div class="app-bar-inner">
          <v-btn
            v-if="smAndDown"
            class="mobile-menu-button"
            icon="mdi-menu"
            variant="text"
            size="small"
            aria-label="Open navigation menu"
            aria-controls="mobile-navigation"
            :aria-expanded="mobileNavigationIsOpen"
            @click="mobileNavigationIsOpen = !mobileNavigationIsOpen"
          ></v-btn>

          <RouterLink to="/" class="app-bar-logo-link" aria-label="FitLog home">
            <iconFitlog
              class="fitlog-logo"
              primary="rgb(var(--v-theme-primary))"
              secondary="rgb(var(--v-theme-on-primary))"
              aria-hidden="true"
            />
            <span class="brand-name">FitLog</span>
          </RouterLink>

          <nav v-if="!smAndDown" class="app-bar-nav" aria-label="Primary navigation">
            <v-btn
              v-for="item in navigationItems"
              :key="item.to"
              class="navigation-link"
              :disabled="navigationIsDisabled"
              :to="item.to"
              :active="route.path === item.to"
              variant="text"
              rounded="lg"
              >{{ item.title }}</v-btn
            >
          </nav>

          <div class="app-bar-account">
            <v-menu location="bottom end" :offset="10" rounded="lg">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  class="account-button"
                  variant="text"
                  rounded="lg"
                  :aria-label="`Account menu: ${accountLabel}`"
                >
                  <v-icon icon="mdi-account-circle-outline" size="24"></v-icon>
                  <span class="account-label">{{ accountLabel }}</span>
                  <v-icon class="account-chevron" icon="mdi-chevron-down" size="16"></v-icon>
                </v-btn>
              </template>
              <v-list
                class="account-menu"
                density="comfortable"
                min-width="200"
                aria-label="Account"
              >
                <v-list-item
                  v-if="showSignedOutButtons"
                  to="/register"
                  prepend-icon="mdi-account-plus-outline"
                  title="Register"
                ></v-list-item>
                <v-list-item
                  v-if="showSignedOutButtons"
                  to="/login"
                  prepend-icon="mdi-login"
                  title="Log in"
                ></v-list-item>
                <v-list-item
                  v-if="showSignedInButtons"
                  prepend-icon="mdi-logout"
                  title="Log out"
                  @click="handleLogout"
                ></v-list-item>
                <v-divider v-if="showSignedOutButtons || showSignedInButtons" class="my-2" />
                <v-list-subheader>Theme</v-list-subheader>
                <v-list-item
                  v-for="option in themeOptions"
                  :key="option.value"
                  :title="option.title"
                  :prepend-icon="option.icon"
                  :append-icon="themePreference === option.value ? 'mdi-check' : undefined"
                  :active="themePreference === option.value"
                  :aria-label="`${option.title} theme`"
                  :aria-pressed="themePreference === option.value"
                  role="button"
                  color="primary"
                  @click="selectTheme(option.value)"
                ></v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer
      v-if="smAndDown"
      id="mobile-navigation"
      v-model="mobileNavigationIsOpen"
      class="mobile-navigation"
      temporary
      color="surface"
      :width="288"
      aria-label="Primary navigation"
      tag="nav"
    >
      <div class="mobile-navigation-heading">
        <h2>Navigation</h2>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Close navigation menu"
          @click="mobileNavigationIsOpen = false"
        ></v-btn>
      </div>
      <div v-if="showSignedOutButtons" class="mobile-navigation-sign-in">
        <p id="mobile-navigation-sign-in-description">
          Log in to access your workouts, routines and other modules.
        </p>
        <v-btn
          to="/login"
          color="primary"
          variant="flat"
          rounded="lg"
          block
          @click="mobileNavigationIsOpen = false"
        >
          Log in
        </v-btn>
      </div>
      <v-list class="mobile-navigation-list" nav>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          :title="item.title"
          :prepend-icon="item.icon"
          :append-icon="showSignedOutButtons ? 'mdi-lock-outline' : undefined"
          :class="{ 'mobile-navigation-item-locked': showSignedOutButtons }"
          :aria-describedby="
            showSignedOutButtons ? 'mobile-navigation-sign-in-description' : undefined
          "
          :disabled="navigationIsDisabled"
          :active="route.path === item.to"
          color="primary"
          rounded="lg"
          @click="mobileNavigationIsOpen = false"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-bar {
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.app-bar-container {
  padding-block: 0;
}

.app-bar-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 1060px;
  margin-inline: auto;
}

.app-bar-logo-link {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  border-radius: 8px;
}

.app-bar-logo-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
}

.fitlog-logo {
  width: 44px;
  height: 44px;
}

.brand-name {
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.055em;
}

.app-bar-nav {
  display: flex;
  flex: 1 1 auto;
  justify-content: center;
  align-items: center;
  gap: 3px;
}

.navigation-link {
  min-width: 0;
  padding-inline: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}

.navigation-link.v-btn--active {
  background: rgb(var(--v-theme-surface-accent));
  color: rgb(var(--v-theme-primary));
}

.navigation-link :deep(.v-btn__overlay) {
  opacity: 0;
}

.navigation-link:hover :deep(.v-btn__overlay),
.navigation-link:focus-visible :deep(.v-btn__overlay) {
  opacity: var(--v-hover-opacity);
}

.app-bar-account {
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 20px;
  border-left: 1px solid rgb(var(--v-theme-outline));
}

.account-button {
  min-width: 0;
  padding-inline: 10px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: none;
  letter-spacing: 0;
}

.account-label {
  overflow: hidden;
  max-width: 120px;
  margin-inline: 9px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.account-menu {
  padding: 6px;
  border: 1px solid rgb(var(--v-theme-outline));
}

.account-menu :deep(.v-list-item) {
  border-radius: 6px;
}

.mobile-menu-button {
  color: rgb(var(--v-theme-on-surface-variant));
}

.mobile-navigation {
  border-right: 1px solid rgb(var(--v-theme-outline));
}

.mobile-navigation-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 12px 24px;
  color: rgb(var(--v-theme-on-surface));
}

.mobile-navigation-heading h2 {
  font-size: 16px;
  font-weight: 600;
}

.mobile-navigation-list {
  padding: 8px 16px;
}

.mobile-navigation-sign-in {
  margin: 4px 16px 12px;
  padding: 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-accent));
}

.mobile-navigation-sign-in p {
  margin-bottom: 12px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
  line-height: 1.5;
}

.mobile-navigation-list :deep(.mobile-navigation-item-locked) {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 1;
}

.mobile-navigation-list :deep(.v-list-item) {
  margin-bottom: 6px;
}

@media (max-width: 959px) {
  .app-bar-inner {
    gap: 8px;
  }

  .fitlog-logo {
    width: 38px;
    height: 38px;
  }

  .brand-name {
    font-size: 21px;
  }

  .app-bar-account {
    padding-left: 8px;
    border-left: 0;
  }

  .account-button {
    width: 40px;
    height: 40px;
    padding: 0;
  }

  .account-label,
  .account-chevron {
    display: none;
  }
}
</style>
