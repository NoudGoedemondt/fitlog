<template>
  <v-card elevation="2" class="pa-6">
    <h1 class="text-h5 mb-4">Welcome to FitLog</h1>
    <p>Track workouts, meals, and body metrics. Get insights over time.</p>
    <div class="mt-6 d-flex ga-3">
      <v-btn color="primary" to="/dashboard">Go to Dashboard</v-btn>
      <v-btn variant="tonal" to="/routines/log">Log a Workout</v-btn>
    </div>
  </v-card>
</template>

<script setup></script>
