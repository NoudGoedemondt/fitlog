<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="text-h6">Workout Sets</v-card-title>

    <v-card-text>
      <v-row
        v-for="(set, index) in sets"
        :key="index"
        class="align-center mb-2"
      >
        <v-col cols="4">
          <v-text-field
            v-model.number="set.reps"
            label="Reps"
            type="number"
            density="compact"
            hide-details
          />
        </v-col>

        <v-col cols="4">
          <v-text-field
            v-model.number="set.weight"
            label="Weight (kg)"
            type="number"
            density="compact"
            hide-details
          />
        </v-col>

        <v-col cols="4" class="d-flex justify-end">
          <v-btn
            icon="mdi-delete"
            color="error"
            variant="text"
            @click="removeSet(index)"
            v-if="sets.length > 1"
          />
        </v-col>
      </v-row>

      <v-btn
        prepend-icon="mdi-plus"
        color="primary"
        variant="tonal"
        @click="addSet"
      >
        Add Set
      </v-btn>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-btn color="success" @click="logWorkout"> Save Workout </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';

const sets = ref([{ reps: 0, weight: 0 }]);

function addSet() {
  sets.value.push({ reps: 0, weight: 0 });
}

function removeSet(index) {
  sets.value.splice(index, 1);
}

function logWorkout() {
  console.log('Workout logged:', sets.value);
  // Later: send to backend or save in localStorage
}
</script>
