<template>
  <v-card class="pa-6" elevation="2">
    <h2 class="text-h6 mb-4">Nutrition</h2>

    <v-row class="mb-2">
      <v-col cols="12" sm="3">
        <v-text-field v-model="meal.name" label="Meal name (e.g. Breakfast)" />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          v-model.number="meal.protein"
          label="Protein (g)"
          type="number"
          min="0"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          v-model.number="meal.carbs"
          label="Carbs (g)"
          type="number"
          min="0"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          v-model.number="meal.fats"
          label="Fats (g)"
          type="number"
          min="0"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="meal.datetime"
          label="Date/Time"
          type="datetime-local"
        />
      </v-col>
      <v-col cols="12" sm="6" class="d-flex align-end">
        <v-btn color="primary" @click="addMeal">Log meal</v-btn>
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <v-list density="compact" v-if="meals.length">
      <v-list-item v-for="(m, i) in meals" :key="i">
        <v-list-item-title
          >{{ m.name }} — P: {{ m.protein }}g C: {{ m.carbs }}g F:
          {{ m.fats }}g</v-list-item-title
        >
        <v-list-item-subtitle>{{ m.datetime }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <div v-else class="text-medium-emphasis">No meals logged yet.</div>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
const meal = ref({ name: '', protein: 0, carbs: 0, fats: 0, datetime: '' });
const meals = ref([]);
function addMeal() {
  if (!meal.value.name || !meal.value.datetime) return;
  meals.value.unshift({ ...meal.value });
  meal.value = { name: '', protein: 0, carbs: 0, fats: 0, datetime: '' };
}
</script>
