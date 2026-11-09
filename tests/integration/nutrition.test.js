import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import process from 'node:process'
import test from 'node:test'
import { databaseClient, readDatabaseTestConfig, rejected, success } from '../helpers/database.js'

const tables = ['meals', 'daily_nutrition_totals']

test(
  'Meals database integration',
  {
    skip:
      process.env.FITLOG_TEST_RUN !== '1' &&
      'Opt in with npm run test:db; see tests/integration/README.md',
  },
  async (t) => {
    const config = readDatabaseTestConfig(process.env)
    const admin = databaseClient(config, config.adminKey)
    const runId = randomUUID()
    const users = []
    let day = 0

    // Register cleanup before provisioning, so partial setup failures are covered.
    t.after(async () => {
      // Also remove tagged rows if a failing constraint allowed an invalid user_id.
      const rowCleanup = await Promise.allSettled(
        tables.map(async (table) => {
          success(
            await admin
              .from(table)
              .delete()
              .eq(table === 'meals' ? 'name' : 'notes', `nutrition-test-${runId}`),
          )
        }),
      )
      const results = await Promise.allSettled(
        users.map(async ({ id }) => {
          success(await admin.auth.admin.deleteUser(id))
        }),
      )
      assert.equal(
        [...rowCleanup, ...results].filter((result) => result.status === 'rejected').length,
        0,
        `Fixture cleanup failed; inspect users with username prefix nutrition-test-${runId}`,
      )
    })

    for (const suffix of ['a', 'b']) {
      const password = `${randomUUID()}aA1!`
      const email = `nutrition-test-${runId}-${suffix}@example.invalid`
      const { user } = success(
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: `nutrition-test-${runId}-${suffix}` },
        }),
      )
      users.push({ id: user.id })
      const client = databaseClient(config)
      const session = success(await client.auth.signInWithPassword({ email, password }))
      assert.equal(session.user.id, user.id)
      users.at(-1).client = client
    }
    const [owner, other] = users

    function values(table, userId = owner.id) {
      day += 1
      return {
        user_id: userId,
        calories_kcal: 123.4,
        protein_g: 12.3,
        carbs_g: 23.4,
        fats_g: 3.4,
        ...(table === 'meals'
          ? { name: `nutrition-test-${runId}`, consumed_at: '2026-11-09T18:30:00' }
          : {
              log_date: new Date(Date.UTC(2090, 0, day)).toISOString().slice(0, 10),
              notes: `nutrition-test-${runId}`,
            }),
      }
    }

    async function insert(table, input, client = owner.client) {
      return success(await client.from(table).insert(input).select().single())
    }

    for (const table of tables) {
      await t.test(`${table}: updated_at changes after an update`, async () => {
        const row = await insert(table, values(table))
        const updated = success(
          await owner.client
            .from(table)
            .update({ calories_kcal: 456.7, updated_at: '2000-01-01T00:00:00Z' })
            .eq('id', row.id)
            .select()
            .single(),
        )
        assert.equal(updated.calories_kcal, 456.7)
        assert.equal(updated.created_at, row.created_at)
        assert.ok(Date.parse(updated.updated_at) > Date.parse(row.updated_at))
      })

      await t.test(`${table}: RLS prevents access to another user's records`, async () => {
        const row = await insert(table, values(table))
        const otherRow = await insert(table, values(table, other.id), other.client)
        for (const [actor, owned, target] of [
          [owner, row, otherRow],
          [other, otherRow, row],
        ]) {
          // First prove the session can see its own record.
          assert.deepEqual(
            success(await actor.client.from(table).select().eq('id', owned.id).single()),
            owned,
          )
          assert.deepEqual(success(await actor.client.from(table).select().eq('id', target.id)), [])
          assert.deepEqual(
            success(
              await actor.client
                .from(table)
                .update({ calories_kcal: 999 })
                .eq('id', target.id)
                .select(),
            ),
            [],
          )
          assert.deepEqual(
            success(await actor.client.from(table).delete().eq('id', target.id).select()),
            [],
          )
          rejected(await actor.client.from(table).insert(values(table, target.user_id)), '42501')
          rejected(
            await actor.client.from(table).update({ user_id: target.user_id }).eq('id', owned.id),
            '42501',
          )
        }
        // Denied writes must leave both records unchanged.
        assert.deepEqual(
          success(await owner.client.from(table).select().eq('id', row.id).single()),
          row,
        )
        assert.deepEqual(
          success(await other.client.from(table).select().eq('id', otherRow.id).single()),
          otherRow,
        )
      })

      await t.test(
        `${table}: foreign key rejects nonexistent users independently of RLS`,
        async () => {
          // Admin is needed here: an ordinary user would hit RLS before the foreign key.
          rejected(await admin.from(table).insert(values(table, randomUUID())), '23503')
        },
      )
    }

    await t.test(
      'daily totals: unique user/date on insert and update, independent dates and users',
      async () => {
        const input = values('daily_nutrition_totals')
        await insert('daily_nutrition_totals', input)
        rejected(await owner.client.from('daily_nutrition_totals').insert(input), '23505')
        const another = await insert('daily_nutrition_totals', values('daily_nutrition_totals'))
        rejected(
          await owner.client
            .from('daily_nutrition_totals')
            .update({ log_date: input.log_date })
            .eq('id', another.id),
          '23505',
        )
        const otherTotal = await insert(
          'daily_nutrition_totals',
          { ...input, user_id: other.id },
          other.client,
        )
        assert.equal(otherTotal.log_date, input.log_date)
        assert.equal(otherTotal.user_id, other.id)
      },
    )

    await t.test('meals: consumed_at preserves the supplied date and time', async () => {
      for (const consumedAt of ['2026-01-15T00:05:00', '2026-07-15T23:55:00']) {
        const row = await insert('meals', { ...values('meals'), consumed_at: consumedAt })
        const saved = success(
          await owner.client.from('meals').select('consumed_at').eq('id', row.id).single(),
        )
        assert.equal(saved.consumed_at, consumedAt)
      }
    })

    await t.test(
      'deleting a fixture user cascades to its profile and both nutrition tables',
      async () => {
        for (const table of tables) {
          await insert(table, values(table, other.id), other.client)
          assert.ok(
            success(await admin.from(table).select('id').eq('user_id', other.id)).length > 0,
          )
        }
        success(await admin.auth.admin.deleteUser(other.id))
        users.splice(users.indexOf(other), 1)
        assert.deepEqual(success(await admin.from('users').select('id').eq('id', other.id)), [])
        for (const table of tables) {
          assert.deepEqual(
            success(await admin.from(table).select('id').eq('user_id', other.id)),
            [],
          )
        }
      },
    )
  },
)
