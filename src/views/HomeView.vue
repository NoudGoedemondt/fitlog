<script setup>
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const features = [
  {
    title: 'Workout Tracking',
    icon: 'mdi-dumbbell',
    description:
      'Log every set, rep, and weight as you train — see your history for any exercise at a glance.',
  },
  {
    title: 'Routine Building',
    icon: 'mdi-clipboard-list-outline',
    description: 'Design reusable routines once, then start a workout from a template in seconds.',
  },
  {
    title: 'Meal Tracking',
    icon: 'mdi-food-apple-outline',
    description:
      'Log meals with calories and macros to keep your nutrition aligned with your training.',
  },
  {
    title: 'Weight Tracking',
    icon: 'mdi-scale-bathroom',
    description: 'Record your weight over time and see the trend, not just the daily noise.',
  },
]
</script>

<template>
  <!-- Hero Section -->
  <v-container class="fill-height py-16 px-md-12">
    <v-row align="center" justify="center">
      <!-- Hero Text -->
      <v-col cols="12" md="6" class="text-left pr-md-8">
        <v-chip
          rounded="pill"
          color="primary"
          variant="outlined"
          class="mb-4 font-weight-medium"
          prepend-icon="mdi-star-four-points-outline"
        >
          Introducing Version 1.0
        </v-chip>

        <h1 class="text-h3 text-sm-h2 font-weight-black text-high-emphasis leading-tight mb-4">
          Training and nutrition, <span class="text-primary">in one place</span>
        </h1>

        <p class="text-body-1 text-medium-emphasis mb-8 max-width-600">
          Log workouts, plan routines, track meals, and monitor your weight — all in a single app
          built to keep you consistent, not overwhelmed.
        </p>

        <div class="d-flex flex-wrap align-center gap-4">
          <transition name="slide-fade">
            <v-btn
              v-if="!authStore.user"
              color="primary"
              size="large"
              elevation="2"
              class="text-capitalize rounded-lg px-6 font-weight-bold slide-fade-element"
              to="/register"
            >
              Register Now
            </v-btn>
          </transition>
          <transition name="slide-fade">
            <v-btn
              v-if="!authStore.user"
              variant="outlined"
              color="secondary"
              size="large"
              class="text-capitalize rounded-lg px-6 font-weight-bold ms-sm-4 mt-3 mt-sm-0 slide-fade-element"
              to="/login"
            >
              Log In
            </v-btn>
          </transition>
        </div>
      </v-col>

      <!-- Hero Image -->
      <v-col cols="12" md="6" class="mt-12 mt-md-0 position-relative">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            v-bind="props"
            :elevation="isHovering ? 12 : 0"
            class="border rounded-xl overflow-hidden transition-swing"
          >
            <v-img
              src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.svg"
              alt="Logo"
              width="50%"
              class="mx-auto my-4"
              cover
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-row>
              </template>
            </v-img>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>
  </v-container>

  <!-- Features Section preview -->
  <v-container id="features" class="py-16 fluid">
    <v-container class="px-md-12">
      <v-row justify="center" class="text-center mb-6">
        <v-col cols="12" md="8">
          <h2 class="text-h4 font-weight-bold mb-3">Everything you need to stay consistent</h2>
          <p class="text-body-1 text-medium-emphasis">
            No spreadsheets, no scattered notes. Just open the app and log it.
          </p>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-for="feature in features" :key="feature.title" cols="12" md="3">
          <v-card variant="flat" class="border p-4 rounded-xl text-center fill-height">
            <v-card-text>
              <v-avatar color="primary-lighten-5" size="56">
                <v-icon color="primary" size="28" :icon="feature.icon"></v-icon>
              </v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">{{ feature.title }}</h3>
              <p class="text-body-2 text-medium-emphasis">{{ feature.description }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style scoped>
.transition-swing {
  transition:
    transform 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out;
}
.transition-swing:hover {
  transform: translateY(-4px);
}
.leading-tight {
  line-height: 1.15;
}
.max-width-600 {
  max-width: 600px;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
