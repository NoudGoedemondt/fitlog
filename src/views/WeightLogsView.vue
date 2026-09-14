<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWeightLogs } from '../composables/useWeightLogs.js'

const weightLogs = useWeightLogs()

const dialogTarget = ref(false) // false | 'new' | <id> — single source of truth
const dialogIsOpen = ref(false) // controls dialog *visibility*

const openDialog = (target) => {
  dialogTarget.value = target
  dialogIsOpen.value = true
}

const resetTargetAfterLeave = () => {
  dialogTarget.value = false
}

const dialogModeLabel = computed(() => {
  if (dialogTarget.value === 'new') return 'Add'
  if (typeof dialogTarget.value === 'number') return 'Update'
  return ''
})

onMounted(async () => {
  await weightLogs.fetchAllWeights()
})
</script>

<template>
  <div class="text-center pa-4">
    <v-btn @click="openDialog('new')" prepend-icon="mdi-plus"> Add </v-btn>
    <v-btn @click="openDialog(7)" prepend-icon="mdi-pencil-outline"> Update </v-btn>

    <v-data-table
      :items="weightLogs.weightEntries.value"
      :loading="weightLogs.isFetchLoading.value"
    ></v-data-table>

    <v-dialog v-model="dialogIsOpen" width="auto" @after-leave="resetTargetAfterLeave">
      <v-card max-width="400" prepend-icon="mdi-update">
        <v-card-title>{{ dialogModeLabel }} Weight Entry</v-card-title>

        <v-card-text
          >Lorem ipsum dolor sit amet, consectetur adipisicing elit. Exercitationem,
          ullam.</v-card-text
        >

        <template v-slot:actions>
          <v-btn class="ms-auto" @click="dialogIsOpen = false">
            {{ dialogModeLabel }}
          </v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>
