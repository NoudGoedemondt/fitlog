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
  { title: 'Actions', key: 'actions', align: 'end', sortable: false, width: '110px' },
]

const createNewRecord = () => {
  return {
    weight_kg: 0,
    measured_at: '',
  }
}

const dialogTarget = ref(false) // false | 'new' | <id> — single source of truth
const dialogIsOpen = ref(false) // controls dialog *visibility*
const formModel = ref(createNewRecord())

const deletingItemId = ref(null)

const openDialog = (target) => {
  dialogTarget.value = target
  dialogIsOpen.value = true
}

const resetTargetAfterLeave = () => {
  dialogTarget.value = false
}

const add = () => {
  formModel.value = createNewRecord()
  openDialog('new')
}

const edit = (id) => {
  const found = weightLogs.weightEntries.value.find((entry) => entry.id === id)

  formModel.value = {
    id: found.id,
    weight_kg: found.weight_kg,
    measured_at: found.measured_at,
  }

  openDialog(id)
}

const save = () => {
  if (dialogTarget.value === 'new') {
    console.log('Adding entry:', formModel.value)
  } else if (typeof dialogTarget.value === 'number') {
    console.log(`updating entry, ${dialogTarget.value} with value:`, formModel.value)
  } else {
    console.error('Can not save entry, when dialogtarget is false')
  }

  dialogIsOpen.value = false
}

const remove = (id) => {
  console.log('remove item id:', id)
}

const toggleRemove = (id) => {
  deletingItemId.value = deletingItemId.value === id ? null : id
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

        <v-btn class="me-2" prepend-icon="mdi-plus" text="Add" @click="add"></v-btn>
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
          @click="edit(item.id)"
        ></v-icon>

        <v-icon
          color="medium-emphasis"
          icon="mdi-delete"
          size="small"
          @click="toggleRemove(item.id)"
        ></v-icon>

        <v-slide-x-reverse-transition>
          <v-icon
            v-if="deletingItemId === item.id"
            color="red"
            icon="mdi-close"
            @click="remove(item.id)"
          ></v-icon>
        </v-slide-x-reverse-transition>
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

        <v-time-picker></v-time-picker>

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

        <v-btn text="Save" @click="save"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
