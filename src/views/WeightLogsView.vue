<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWeightLogs } from '../composables/useWeightLogs.js'

const weightLogs = useWeightLogs()

const headers = [
  { title: 'Id', key: 'id' },
  { title: 'User Id', key: 'user_id' },
  { title: 'Weight (kg)', key: 'weight_kg' },
  { title: 'Measured at', key: 'measured_at' },
  { title: 'Created at', key: 'created_at' },
  { title: 'Updated at', key: 'updated_at' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

function createNewRecord() {
  return {
    weight_kg: '',
    measured_at: '',
  }
}

const dialogTarget = ref(false) // false | 'new' | <id> — single source of truth
const dialogIsOpen = ref(false) // controls dialog *visibility*
const formModel = ref(createNewRecord())

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
  <v-data-table
    :headers="headers"
    :items="weightLogs.weightEntries.value"
    :loading="weightLogs.isFetchLoading.value"
  >
    <template v-slot:top>
      <v-toolbar>
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-scale-bathroom" size="x-small" start></v-icon>

          Weight Entries
        </v-toolbar-title>

        <v-btn class="me-2" prepend-icon="mdi-plus" text="Add" @click="openDialog('new')"></v-btn>
      </v-toolbar>
    </template>

    <!-- using dynamic slot-syntax because
    eslint complains about: v-slot:item.actions="{ item }"
    -->
    <template #[`item.actions`]="{ item }">
      <div class="d-flex ga-2 justify-end">
        <v-icon
          color="medium-emphasis"
          icon="mdi-pencil"
          size="small"
          @click="openDialog(item.id)"
        ></v-icon>

        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          @click="remove(item.id)"
        ></v-icon>
      </div>
    </template>
  </v-data-table>

  <v-dialog v-model="dialogIsOpen" max-width="400" @after-leave="resetTargetAfterLeave">
    <v-card prepend-icon="mdi-update" :title="`${dialogModeLabel} Weight Entry`">
      <template v-slot:text>
        <v-date-input
          v-model="formModel.measured_at"
          input-format="dd-mm-yyyy"
          label="Date"
          class="mt-5"
        ></v-date-input>

        <v-number-input
          v-model="formModel.weight_kg"
          :precision="2"
          :min="0"
          label="Weight (kg)"
        ></v-number-input>
      </template>

      <v-divider></v-divider>

      <v-card-actions class="bg-surface-light">
        <v-btn text="Cancel" variant="plain" @click="dialogIsOpen = false"></v-btn>

        <v-spacer></v-spacer>

        <v-btn :text="dialogModeLabel"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
