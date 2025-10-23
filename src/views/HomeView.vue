<template>
  <v-container class="py-6">
    <exercise-set-tracker v-model="workoutSets" :exercises="exerciseList" />

    <div class="mt-6 d-flex gap-3">
      <v-btn color="success" @click="saveWorkout">Save Workout</v-btn>
      <v-btn variant="tonal" @click="resetSets">Reset</v-btn>
    </div>

    <pre class="mt-4">{{ workoutSets }}</pre>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import ExerciseSetTracker from '@/components/ExerciseSetTracker.vue';

const exerciseList = ref([
  { exerciseId: 1, exerciseName: 'Barbell Benchpress' },
  { exerciseId: 2, exerciseName: 'Weighted Pullups' },
  { exerciseId: 3, exerciseName: 'Dumbbell Curl' },
  { exerciseId: 4, exerciseName: 'Tricep Pushdown' },
]);

const workoutSets = ref({});

function saveWorkout() {
  console.log('Workout data:', workoutSets.value);
}

function resetSets() {
  workoutSets.value = {};
}
</script>
