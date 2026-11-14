import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import { createRenderer, h, nextTick, reactive } from 'vue'

const hooks = registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('/EntryHistoryTable.vue')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: compileScript(parse(readFileSync(new URL(url), 'utf8')).descriptor, {
          id: 'entry-history-test',
          inlineTemplate: true,
        }).content,
      }
    }
    return nextLoad(url, context)
  },
})
let EntryHistoryTable
try {
  ;({ default: EntryHistoryTable } = await import('../src/components/EntryHistoryTable.vue'))
} finally {
  hooks.deregister()
}

function mountTable(t, initialProps = {}) {
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
  const detach = (node) => {
    if (node.parent) {
      const siblings = node.parent.children
      siblings.splice(siblings.indexOf(node), 1)
      node.parent = null
    }
  }
  const renderer = createRenderer({
    createElement: node,
    createText: (text) => node('text', text),
    createComment: () => node('comment'),
    setText: (node, text) => {
      node.text = text
    },
    setElementText: (node, text) => {
      node.text = text
    },
    patchProp: (node, key, previous, value) => {
      node.props[key] = value
    },
    insert: (node, parent, anchor) => {
      detach(node)
      node.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      if (index < 0) parent.children.push(node)
      else parent.children.splice(index, 0, node)
    },
    remove: detach,
    parentNode: (node) => node.parent,
    nextSibling: (node) => {
      const siblings = node.parent?.children || []
      return siblings[siblings.indexOf(node) + 1] || null
    },
  })
  const props = reactive({
    title: 'History',
    description: 'Manage entries.',
    headers: [{ title: 'Name', key: 'name' }],
    entries: [],
    entryLabel: (entry) => entry.name,
    ...initialProps,
  })
  const events = []
  const tableProps = {}
  const app = renderer.createApp({
    render: () =>
      h(
        EntryHistoryTable,
        {
          ...props,
          onAdd: () => events.push(['add']),
          onEdit: (entry) => events.push(['edit', entry]),
          onDelete: (entry) => events.push(['delete', entry]),
        },
        {
          'item.name': ({ item }) => h('strong', `Meal: ${item.name}`),
        },
      ),
  })
  app.component('VBtn', {
    props: ['disabled'],
    setup:
      (props, { attrs, slots }) =>
      () =>
        h('button', { ...attrs, disabled: props.disabled }, slots.default?.()),
  })
  app.component('VIcon', { render: () => h('i') })
  app.component('VDataTable', {
    props: ['headers', 'items', 'loading', 'loadingText', 'itemsPerPage', 'itemsPerPageOptions'],
    setup:
      (props, { slots }) =>
      () => {
        Object.assign(tableProps, props)
        return h(
          'div',
          props.items.length
            ? props.items.flatMap((item) =>
                props.headers.map((header) => slots[`item.${header.key}`]?.({ item })),
              )
            : slots['no-data']?.(),
        )
      },
  })
  const root = node('root')
  app.mount(root)
  t.after(() => app.unmount())
  const all = (node) => [node, ...node.children.flatMap(all)]
  return {
    props,
    events,
    tableProps,
    text: () =>
      all(root)
        .map((node) => node.text)
        .join(' '),
    buttons: () => all(root).filter((node) => node.type === 'button'),
  }
}

test('table renders custom cells, preserves pagination and emits the selected entry', (t) => {
  const entry = { id: 1, name: 'Lunch' }
  const mounted = mountTable(t, { entries: [entry] })
  assert.match(mounted.text(), /Meal: Lunch/)
  assert.match(mounted.text(), /1 entry/)
  assert.equal(mounted.tableProps.itemsPerPage, 10)
  assert.deepEqual(mounted.tableProps.itemsPerPageOptions, [10, 25, 50])
  for (const [label, event] of [
    ['Edit Lunch', 'edit'],
    ['Delete Lunch', 'delete'],
  ]) {
    const button = mounted.buttons().find((button) => button.props['aria-label'] === label)
    button.props.onClick()
    assert.deepEqual(mounted.events.at(-1), [event, entry])
  }
})

test('busy tables disable actions and block emitted mutations', (t) => {
  const mounted = mountTable(t, {
    entries: [{ id: 1, name: 'Lunch' }],
    busy: true,
    showAddButton: true,
  })
  for (const button of mounted.buttons()) {
    assert.equal(button.props.disabled, true)
    button.props.onClick()
  }
  assert.deepEqual(mounted.events, [])
})

test('empty tables offer adding, while fetch errors and invalid selection suppress empty-state adding', async (t) => {
  const mounted = mountTable(t, {
    emptyTitle: 'No meals recorded',
    errorTitle: 'Meals unavailable',
  })
  assert.match(mounted.text(), /No meals recorded/)
  mounted.buttons()[0].props.onClick()
  assert.deepEqual(mounted.events, [['add']])
  mounted.props.fetchError = 'Fetch failed'
  await nextTick()
  assert.match(mounted.text(), /Meals unavailable/)
  assert.equal(mounted.buttons().length, 0)
  mounted.props.fetchError = null
  mounted.props.unavailableMessage = 'Select a valid date.'
  await nextTick()
  assert.match(mounted.text(), /Select a valid date/)
  assert.equal(mounted.buttons().length, 0)
})
