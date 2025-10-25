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

    <v-row class="align-center">
      <v-col>
        <v-date-picker
          show-adjacent-months
          hide-header
          v-model="weightInput.date"
        >
          <!-- decorate days that are in loggedDates -->
          <template #day="{ date, props }">
            <v-badge v-if="isLogged(date)" dot color="primary">
              <v-btn v-bind="props" />
            </v-badge>
            <v-btn v-else v-bind="props" />
          </template>
        </v-date-picker>
      </v-col>
    </v-row>

    <v-row class="align-center mb-2">
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="weightInput.weight"
          :label="'Add your weight for ' + toYMD(weightInput.date) + ' (kg)'"
          type="number"
          min="0"
        />
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

const today = new Date().toISOString().slice(0, 10);
const weightInput = ref({ date: today, weight: null });

function toYMD(val) {
  // accepts 'YYYY-MM-DD' or Date and returns 'YYYY-MM-DD'
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  const d = new Date(val);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addWeight() {
  const date = toYMD(weightInput.value.date);
  const weight = Number(weightInput.value.weight);

  if (!date || !Number.isFinite(weight)) return;

  weights.value.unshift({ date, weight });
  weightInput.value = { date: '', weight: null };
}
</script>
