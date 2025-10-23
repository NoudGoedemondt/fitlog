<template>
  <v-app>
    <v-app-bar flat density="comfortable">
      <v-app-bar-title>FitLog</v-app-bar-title>
      <v-spacer />
      <v-btn variant="text" to="/">Landing</v-btn>
      <v-btn variant="text" to="/dashboard">Dashboard</v-btn>
      <v-btn variant="text" to="/metrics">Body Metrics</v-btn>
      <v-btn variant="text" to="/nutrition">Nutrition</v-btn>
      <v-btn variant="text" to="/routines/add">Add Routine</v-btn>
      <v-btn variant="text" to="/routines/log">Log Workout</v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="py-6">
        <RouterView />
      </v-container>
    </v-main>

    <v-bottom-navigation app grow class="d-md-none">
      <v-btn to="/dashboard" icon="mdi-chart-line" />
      <v-btn to="/metrics" icon="mdi-scale-bathroom" />
      <v-btn to="/nutrition" icon="mdi-silverware-fork-knife" />
      <v-btn to="/routines/log" icon="mdi-dumbbell" />
    </v-bottom-navigation>
  </v-app>
</template>

<script setup></script>
