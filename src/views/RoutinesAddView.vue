<template>
  <v-card class="pa-6" elevation="2">
    <h2 class="text-h6 mb-4">Add Routine</h2>

    <v-text-field
      v-model="routineName"
      label="Routine name (e.g. Push, Pull, Legs)"
      class="mb-4"
    />

    <v-row class="align-center mb-2" v-for="(ex, i) in exercises" :key="i">
      <v-col cols="8">
        <v-text-field v-model="ex.exerciseName" label="Exercise name" />
      </v-col>
      <v-col cols="4" class="d-flex justify-end">
        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          @click="removeExercise(i)"
        />
      </v-col>
    </v-row>

    <v-btn
      prepend-icon="mdi-plus"
      variant="tonal"
      color="primary"
      class="mb-4"
      @click="addExercise"
      >Add exercise</v-btn
    >

    <v-divider class="my-4" />

    <v-btn color="success" @click="saveRoutine">Save Routine</v-btn>
    <div class="text-caption mt-2">
      (In skeleton mode, this just logs to console)
    </div>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
const routineName = ref('');
const exercises = ref([
  { exerciseId: 1, exerciseName: 'Barbell Bench Press' },
  { exerciseId: 2, exerciseName: 'Weighted Pull-ups' },
]);
function addExercise() {
  exercises.value.push({ exerciseId: Date.now(), exerciseName: '' });
}
function removeExercise(i) {
  exercises.value.splice(i, 1);
}
function saveRoutine() {
  console.log('Routine saved:', {
    routineName: routineName.value,
    exercises: exercises.value,
  });
}
</script>
