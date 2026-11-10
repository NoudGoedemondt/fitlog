<script setup>
import { nutritionFields, validNutrition } from '@/utils/nutrition.js'

const model = defineModel({ type: Object, required: true })
</script>

<template>
  <v-row dense>
    <v-col v-for="field in nutritionFields" :key="field.key" cols="12" sm="6">
      <v-text-field
        v-model="model[field.key]"
        type="text"
        inputmode="decimal"
        :label="`${field.label} (${field.unit})`"
        :rules="[validNutrition]"
        variant="outlined"
        color="primary"
      ></v-text-field>
    </v-col>
  </v-row>
</template>
