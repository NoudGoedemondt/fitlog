<template>
  <v-card class="pa-6">
    <!-- <h2 class="text-h6 mb-4">Body Metrics</h2>
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

    <v-divider class="my-4" /> -->

    <v-row class="align-center">
      <v-col>
        <v-date-picker
          show-adjacent-months
          hide-header
          v-model="weightInput.date"
        >
          <template #day="{ item, props }">
            <v-badge v-if="isLogged(item.date)" dot color="green">
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
          :label="'Enter weight for: ' + toYMD(weightInput.date) + ' (kg)'"
          type="number"
          min="0"
          step="0.1"
        />
      </v-col>
    </v-row>

    <v-row class="align-center mb-2">
      <v-btn color="primary" @click="addWeight">Add</v-btn>
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
import { ref, computed } from 'vue';

const height = ref(null);
const age = ref(null);

const weights = ref([]);

const today = new Date().toISOString().slice(0, 10);
const weightInput = ref({ date: today, weight: null });

const loggedDates = computed(() => new Set(weights.value.map((w) => w.date)));

function isLogged(dateStr) {
  const key =
    typeof dateStr === 'string' ? dateStr.slice(0, 10) : toYMD(dateStr);
  return loggedDates.value.has(key);
}

function toYMD(val) {
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

  // optional: round to 1 decimals
  const entry = { date, weight: Number(weight.toFixed(1)) };

  // optional: upsert by date to avoid duplicates
  const idx = weights.value.findIndex((x) => x.date === date);
  if (idx >= 0) weights.value.splice(idx, 1, entry);
  else weights.value.unshift(entry);

  // keep current date selected, clear weight
  weightInput.value = { date, weight: null };
}
</script>
