<script setup>
import { useId } from 'vue'

const isOpen = defineModel({ type: Boolean, required: true })
const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  subtitle: { type: String, default: '' },
  saveText: { type: String, required: true },
  maxWidth: { type: [String, Number], default: 560 },
  scrollable: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['save'])
const titleId = useId()
const updateOpen = (open) => {
  if (!props.busy) isOpen.value = open
}
const save = () => {
  if (isOpen.value && !props.busy) emit('save')
}
</script>

<template>
  <v-dialog
    :model-value="isOpen"
    @update:model-value="updateOpen"
    :persistent="busy"
    :max-width="maxWidth"
    :aria-labelledby="titleId"
    :scrollable="scrollable"
  >
    <v-card class="entry-dialog" rounded="xl">
      <div class="dialog-heading">
        <span class="dialog-icon"><v-icon :icon="icon" size="24"></v-icon></span>
        <div>
          <h2 :id="titleId">{{ title }}</h2>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
        <slot />
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="dialog-actions">
        <v-btn text="Cancel" variant="plain" :disabled="busy" @click="updateOpen(false)"></v-btn>
        <v-spacer></v-spacer>
        <v-btn
          :text="saveText"
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="busy"
          :disabled="busy"
          @click="save"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped src="../assets/entry-dialog.css"></style>

<style scoped>
:deep(.entry-form) {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}
</style>
