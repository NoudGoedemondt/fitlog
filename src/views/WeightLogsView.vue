<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWeightLogs } from '../composables/useWeightLogs.js'
import { splitMeasuredAt, combineToMeasuredAt } from '@/utils/measuredAtFormatting.js'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
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
    date: null,
    hour: null,
    minute: null,
  }
}

const formModel = ref(createNewRecord())
const dialogTarget = ref(false) // false | 'new' | <id> — single source of truth
const dialogIsOpen = ref(false) // controls dialog *visibility*
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
  const { date, hour, minute } = splitMeasuredAt(found.measured_at)

  formModel.value = {
    id: found.id,
    weight_kg: found.weight_kg,
    date: date,
    hour: hour,
    minute: minute,
  }

  openDialog(id)
}

const save = async () => {
  const measuredAt = combineToMeasuredAt(
    formModel.value.date,
    formModel.value.hour,
    formModel.value.minute,
  )

  if (dialogTarget.value === 'new') {
    const userId = authStore.user.id

    await weightLogs.createWeightEntry({
      user_id: userId,
      weight_kg: formModel.value.weight_kg,
      measured_at: measuredAt,
    })
  } else if (typeof dialogTarget.value === 'number') {
    await weightLogs.updateWeightEntry(dialogTarget.value, {
      weight_kg: formModel.value.weight_kg,
      measured_at: measuredAt,
    })
  } else {
    console.error('Can not save entry, when dialogtarget is false')
  }

  dialogIsOpen.value = false
}

const remove = async (id) => {
  await weightLogs.deleteWeightEntry(id)
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
          v-model="formModel.date"
          input-format="dd-mm-yyyy"
          label="Date"
          class="mt-5"
        ></v-date-input>

        <div class="d-flex ga-2">
          <v-number-input
            v-model="formModel.hour"
            prepend-icon="mdi-clock-outline"
            control-variant="stacked"
            :min="0"
            :max="23"
            :step="1"
            label="Hour"
          ></v-number-input>
          <v-number-input
            v-model="formModel.minute"
            control-variant="stacked"
            :min="0"
            :max="59"
            :step="1"
            label="Minute"
          ></v-number-input>
        </div>

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

  <!-- <v-alert color="error" icon="$error" title="Alert Title" text="Alert subtext"></v-alert> -->
</template>
