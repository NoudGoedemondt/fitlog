<script setup>
import { nutritionFields, validNutrition } from '@/utils/nutrition.js'

const model = defineModel({ type: Object, required: true })
</script>

<template>
  <div class="nutrition-fields">
    <v-text-field
      v-for="field in nutritionFields"
      :key="field.key"
      v-model="model[field.key]"
      type="text"
      inputmode="decimal"
      :label="`${field.label} (${field.unit})`"
      :rules="[validNutrition]"
      variant="outlined"
      color="primary"
    ></v-text-field>
  </div>
</template>

<style scoped>
.nutrition-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 599px) {
  .nutrition-fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
