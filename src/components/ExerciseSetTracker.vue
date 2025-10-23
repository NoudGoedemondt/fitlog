<template>
  <div class="space-y-6">
    <v-card
      v-for="ex in exercises"
      :key="ex.exerciseId"
      class="pa-4"
      elevation="2"
    >
      <v-card-title class="text-h6">{{ ex.exerciseName }}</v-card-title>

      <v-card-text>
        <v-row
          v-for="(set, idx) in value[ex.exerciseId]"
          :key="`${ex.exerciseId}-${idx}`"
          class="align-center mb-2"
        >
          <v-col cols="5" sm="4">
            <v-text-field
              :model-value="set.reps"
              label="Reps"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              density="compact"
              hide-details
              @update:model-value="
                (val) => updateSet(ex.exerciseId, idx, 'reps', val)
              "
            />
          </v-col>

          <v-col cols="5" sm="4">
            <v-text-field
              :model-value="set.weight"
              label="Weight (kg)"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.5"
              density="compact"
              hide-details
              @update:model-value="
                (val) => updateSet(ex.exerciseId, idx, 'weight', val)
              "
            />
          </v-col>

          <v-col cols="2" sm="4" class="d-flex justify-end">
            <v-btn
              icon="mdi-delete"
              color="error"
              variant="text"
              :aria-label="`Remove set ${idx + 1} for ${ex.exerciseName}`"
              @click="removeSet(ex.exerciseId, idx)"
              v-if="value[ex.exerciseId].length > 1"
            />
          </v-col>
        </v-row>

        <v-btn
          prepend-icon="mdi-plus"
          color="primary"
          variant="tonal"
          @click="addSet(ex.exerciseId)"
        >
          Add Set
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';

/**
 * Props
 * - exercises: [{ exerciseId, exerciseName }, ...]
 * - v-model: an object like { [exerciseId]: [{ reps, weight }, ...] }
 */
const props = defineProps({
  exercises: { type: Array, required: true },
  modelValue: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:modelValue']);

/**
 * Make a writable computed so we can treat v-model like local state.
 */
const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

/**
 * Ensure each exerciseId exists and has at least one set.
 * Runs once on mount; if you dynamically change exercises later, you can call init() again.
 */
function init() {
  const next = { ...value.value };
  for (const ex of props.exercises) {
    if (!next[ex.exerciseId] || next[ex.exerciseId].length === 0) {
      next[ex.exerciseId] = [{ reps: 0, weight: 0 }];
    } else {
      // shallow clone rows to avoid mutating parent references
      next[ex.exerciseId] = next[ex.exerciseId].map((s) => ({ ...s }));
    }
  }
  value.value = next;
}
onMounted(init);

/**
 * Helpers
 */
function addSet(exerciseId) {
  const next = { ...value.value };
  next[exerciseId] = [...(next[exerciseId] || []), { reps: 0, weight: 0 }];
  value.value = next;
}

function removeSet(exerciseId, index) {
  const next = { ...value.value };
  const arr = [...next[exerciseId]];
  if (arr.length > 1) {
    arr.splice(index, 1);
    next[exerciseId] = arr;
    value.value = next;
  }
}

/**
 * Coerce and write back a single cell.
 * We avoid `.number` and normalize here to keep state consistent.
 */
function updateSet(exerciseId, index, field, raw) {
  const next = { ...value.value };
  const arr = [...next[exerciseId]];
  const row = { ...arr[index] };

  // Normalize numbers; keep empty string while typing, but coerce on blur-like cases
  // If you want *strict numbers only*, drop the empty-string branch and default to 0.
  let v = raw;
  if (v === '' || v === null || v === undefined) {
    v = ''; // allow temporary empties while typing
  } else {
    const n = Number(v);
    v = Number.isFinite(n) ? n : 0;
    if (v < 0) v = 0;
  }

  row[field] = v;
  arr[index] = row;
  next[exerciseId] = arr;
  value.value = next;
}
</script>

<style scoped>
.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>
