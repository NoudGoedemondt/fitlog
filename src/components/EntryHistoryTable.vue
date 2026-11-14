<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  headers: { type: Array, required: true },
  entries: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  fetchError: { type: String, default: null },
  unavailableMessage: { type: String, default: null },
  note: { type: String, default: null },
  showAddButton: { type: Boolean, default: false },
  addText: { type: String, default: 'Add entry' },
  loadingText: { type: String, default: 'Loading entries…' },
  emptyTitle: { type: String, default: 'No entries recorded' },
  emptyDescription: { type: String, default: 'Add an entry to get started.' },
  errorTitle: { type: String, default: 'Unable to load entries' },
  emptyIcon: { type: String, default: 'mdi-clipboard-text-outline' },
  entryLabel: { type: Function, required: true },
})
const emit = defineEmits(['add', 'edit', 'delete'])
const titleId = useId()
const tableHeaders = computed(() => [
  ...props.headers,
  { title: '', key: 'actions', align: 'end', sortable: false, width: '104px' },
])
const add = () => {
  if (!props.busy && !props.unavailableMessage) emit('add')
}
const edit = (entry) => {
  if (!props.busy && !props.unavailableMessage) emit('edit', entry)
}
const remove = (entry) => {
  if (!props.busy && !props.unavailableMessage) emit('delete', entry)
}
</script>

<template>
  <section class="history-card" :aria-labelledby="titleId" :aria-busy="loading">
    <div class="history-heading">
      <div>
        <h2 :id="titleId">{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <div class="history-heading-actions">
        <span v-if="!loading && !fetchError && !unavailableMessage" class="entry-count">
          {{ entries.length }} {{ entries.length === 1 ? 'entry' : 'entries' }}
        </span>
        <v-btn
          v-if="showAddButton"
          color="primary"
          prepend-icon="mdi-plus"
          rounded="lg"
          elevation="0"
          :disabled="busy || !!unavailableMessage"
          @click="add"
          >{{ addText }}</v-btn
        >
      </div>
    </div>
    <p v-if="note" class="history-note">{{ note }}</p>
    <v-data-table
      class="history-table"
      :headers="tableHeaders"
      :items="entries"
      :loading="loading"
      :items-per-page="10"
      :items-per-page-options="[10, 25, 50]"
      :loading-text="loadingText"
      hover
    >
      <template v-for="header in headers" :key="header.key" #[`item.${header.key}`]="{ item }">
        <slot :name="`item.${header.key}`" :item="item">{{ item[header.key] }}</slot>
      </template>
      <template #[`item.actions`]="{ item }">
        <div class="row-actions">
          <v-btn
            icon="mdi-pencil-outline"
            color="secondary"
            variant="text"
            size="small"
            :aria-label="`Edit ${entryLabel(item)}`"
            :title="`Edit ${entryLabel(item)}`"
            :disabled="busy || !!unavailableMessage"
            @click="edit(item)"
          ></v-btn>
          <v-btn
            class="delete-entry-button"
            icon="mdi-trash-can-outline"
            color="secondary"
            variant="text"
            size="small"
            :aria-label="`Delete ${entryLabel(item)}`"
            :title="`Delete ${entryLabel(item)}`"
            :disabled="busy || !!unavailableMessage"
            @click="remove(item)"
          ></v-btn>
        </div>
      </template>
      <template #no-data>
        <div class="empty-state">
          <span class="empty-icon"><v-icon :icon="emptyIcon" size="30"></v-icon></span>
          <h3>{{ fetchError ? errorTitle : unavailableMessage || emptyTitle }}</h3>
          <p v-if="!unavailableMessage || fetchError">
            {{ fetchError ? 'Select Try again above to reload the entries.' : emptyDescription }}
          </p>
          <v-btn
            v-if="!fetchError && !unavailableMessage"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            :disabled="busy"
            @click="add"
            >{{ addText }}</v-btn
          >
        </div>
      </template>
    </v-data-table>
  </section>
</template>

<style scoped>
.history-card {
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 24px rgb(var(--v-theme-shadow) / 3%);
}

.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
}

.history-heading h2 {
  margin-bottom: 3px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.history-heading p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  line-height: 1.6;
}

.history-heading-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.history-note {
  padding: 0 28px 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
}

:deep(.entry-name) {
  font-size: 15px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

:deep(.entry-description) {
  margin-top: 4px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.history-heading .v-btn {
  text-transform: none;
  letter-spacing: 0;
}

.entry-count {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 7px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
  font-weight: 500;
}

.history-table {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  --v-table-row-height: 76px;
  --v-table-header-height: 44px;
}

.history-table :deep(.v-data-table__th) {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.035em;
}

.history-table :deep(th:first-child) {
  padding-left: 28px;
}

.history-table :deep(td:first-child) {
  padding-left: 28px;
}

.history-table :deep(th:last-child) {
  padding-right: 20px;
}

.history-table :deep(td:last-child) {
  padding-right: 20px;
}

.history-table :deep(.v-data-table-footer) {
  padding: 14px 20px;
  border-top: 1px solid rgb(var(--v-theme-outline));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
}

:deep(.row-value) {
  white-space: nowrap;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

:deep(.row-value > span) {
  margin-left: 5px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0;
}

:deep(.row-date) {
  display: flex;
  align-items: center;
  gap: 9px;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

:deep(.row-date .v-icon) {
  color: rgb(var(--v-theme-on-surface-variant));
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  color: rgb(var(--v-theme-secondary));
}

.row-actions .v-btn {
  border-radius: 9px;
}

.delete-entry-button:hover {
  color: rgb(var(--v-theme-error)) !important;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  padding: 16px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface-accent));
  color: rgb(var(--v-theme-primary));
}

.empty-state h3 {
  margin: 18px 0 6px;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  margin-bottom: 20px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
}

.empty-state .v-btn {
  text-transform: none;
  letter-spacing: 0;
}

@media (max-width: 600px) {
  .history-heading {
    flex-wrap: wrap;
    padding: 20px 16px;
  }

  .history-heading-actions {
    flex-wrap: wrap;
  }

  .history-note {
    padding-inline: 16px;
  }

  .history-heading h2 {
    font-size: 17px;
  }

  .history-table :deep(th:first-child) {
    padding-left: 16px;
  }

  .history-table :deep(td:first-child) {
    padding-left: 16px;
  }

  .history-table :deep(th:last-child) {
    padding-right: 8px;
  }

  .history-table :deep(td:last-child) {
    padding-right: 8px;
  }

  .history-table :deep(th) {
    padding-inline: 8px;
  }

  .history-table :deep(td) {
    padding-inline: 8px;
  }

  :deep(.row-value) {
    font-size: 17px;
  }

  :deep(.row-date) {
    font-size: 11px;
  }

  :deep(.row-date .v-icon) {
    display: none;
  }
}
</style>
