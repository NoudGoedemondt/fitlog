<script setup>
import { formatCalendarDate } from '@/utils/nutrition.js'

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
    aria-labelledby="delete-daily-title"
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon"><v-icon icon="mdi-trash-can-outline" size="24"></v-icon></span>
        <div>
          <h2 id="delete-daily-title">Delete daily total?</h2>
          <p>This action cannot be undone.</p>
        </div>
      </div>
      <v-card-text>
        <strong v-if="entry">{{ formatCalendarDate(entry.log_date) }}</strong>
        <p class="mt-3">
          The daily summary will use your individual meals again. If there are no meals, no
          nutrition will be recorded for this date.
        </p>
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-btn
          text="Keep daily total"
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
