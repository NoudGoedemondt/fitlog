<template>
  <div
    class="d-grid"
    style="
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    "
  >
    <v-card class="pa-4">
      <div class="text-subtitle-1 mb-2">Recent Body Weight</div>
      <div class="text-h6">
        {{ latestWeight ? `${latestWeight.weight} kg` : '—' }}
      </div>
      <div class="text-caption">
        {{ latestWeight ? latestWeight.date : 'No entries yet' }}
      </div>
    </v-card>

    <v-card class="pa-4">
      <div class="text-subtitle-1 mb-2">This Week Workouts</div>
      <div class="text-h6">{{ workoutsThisWeek }}</div>
      <div class="text-caption">Keep the streak going!</div>
    </v-card>

    <v-card class="pa-4">
      <div class="text-subtitle-1 mb-2">Today’s Protein</div>
      <div class="text-h6">{{ todayProtein }} g</div>
      <div class="text-caption">Target: {{ proteinTarget }} g</div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// Placeholder reactive data
const latestWeight = ref(null); // { date: '2025-10-23', weight: 78 }
const workoutsThisWeek = ref(0);
const todayProtein = ref(0);
const proteinTarget = ref(160);
</script>
