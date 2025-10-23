<template>
  <v-card class="pa-6" elevation="2">
    <h2 class="text-h6 mb-4">Log Workout</h2>

    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <v-text-field v-model="workoutDate" type="date" label="Date" />
      </v-col>
    </v-row>

    <exercise-set-tracker v-model="workoutSets" :exercises="exerciseList" />

    <v-divider class="my-4" />

    <v-btn color="success" @click="saveWorkout">Save Workout</v-btn>
    <div class="text-caption mt-2">
      (In skeleton mode, this just logs to console)
    </div>

    <pre class="mt-4">{{ workoutSets }}</pre>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import ExerciseSetTracker from '@/components/ExerciseSetTracker.vue';

const workoutDate = ref('');
const exerciseList = ref([
  { exerciseId: 1, exerciseName: 'Barbell Bench Press' },
  { exerciseId: 2, exerciseName: 'Weighted Pull-ups' },
  { exerciseId: 3, exerciseName: 'Dumbbell Curl' },
]);
const workoutSets = ref({});

function saveWorkout() {
  console.log('Workout:', { date: workoutDate.value, sets: workoutSets.value });
}
</script>
