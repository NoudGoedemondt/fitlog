<script setup>
import { formatMeasuredAt } from '@/utils/measuredAtFormatting.js'
import { formatWeight } from '@/utils/weightFormatting.js'

const isOpen = defineModel({ type: Boolean, required: true })
const props = defineProps({
  entry: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['confirm'])
const updateOpen = (open) => {
  if (!props.busy) isOpen.value = open
}
const confirm = () => {
  if (!props.busy && props.entry) emit('confirm', props.entry.id)
}
</script>

<template>
  <v-dialog
    :model-value="isOpen"
    @update:model-value="updateOpen"
    :persistent="busy"
    max-width="440"
    aria-labelledby="delete-measurement-title"
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon delete-dialog-icon"
          ><v-icon icon="mdi-trash-can-outline" size="24"></v-icon
        ></span>
        <div>
          <h2 id="delete-measurement-title">Delete measurement?</h2>
          <p>This action cannot be undone.</p>
        </div>
      </div>
      <v-card-text>
        <p v-if="entry" class="delete-summary">
          <strong>{{ formatWeight(entry.weight_kg) }} kg</strong>
          <span>{{ formatMeasuredAt(entry.measured_at) }}</span>
        </p>
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-btn
          text="Keep measurement"
          variant="text"
          :disabled="busy"
          @click="updateOpen(false)"
        ></v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text="Delete"
          color="error"
          variant="flat"
          rounded="lg"
          :loading="busy"
          :disabled="busy || !entry"
          @click="confirm"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped src="../assets/weight-dialog.css"></style>

<style scoped>
.delete-dialog-icon {
  background: rgb(var(--v-theme-error-container));
  color: rgb(var(--v-theme-on-error-container));
}

.delete-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding: 16px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  font-size: 14px;
}

.delete-summary > span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
}
</style>
