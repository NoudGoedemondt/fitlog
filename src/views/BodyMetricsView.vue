<template>
  <v-card class="pa-6" elevation="2">
    <h2 class="text-h6 mb-4">Body Metrics</h2>

    <v-row class="mb-2">
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="height"
          label="Height (cm)"
          type="number"
          min="0"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model.number="age" label="Age" type="number" min="0" />
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <h3 class="text-subtitle-1 mb-2">Weight Log</h3>
    <v-row class="align-center mb-2">
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="weightInput.weight"
          label="Weight (kg)"
          type="number"
          min="0"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="weightInput.date" label="Date" type="date" />
      </v-col>
      <v-col cols="12" sm="4" class="d-flex align-end">
        <v-btn color="primary" @click="addWeight">Add</v-btn>
      </v-col>
    </v-row>

    <v-list density="compact" lines="two" v-if="weights.length">
      <v-list-item v-for="(w, i) in weights" :key="i">
        <v-list-item-title>{{ w.weight }} kg</v-list-item-title>
        <v-list-item-subtitle>{{ w.date }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <div v-else class="text-medium-emphasis">No weight entries yet.</div>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
const height = ref(null);
const age = ref(null);
const weights = ref([]);
const weightInput = ref({ date: '', weight: null });

function addWeight() {
  if (!weightInput.value.date || weightInput.value.weight == null) return;
  weights.value.unshift({ ...weightInput.value });
  weightInput.value = { date: '', weight: null };
}
</script>
