import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import process from 'node:process'
import test from 'node:test'
import { databaseClient, readDatabaseTestConfig, rejected, success } from '../helpers/database.js'

test(
  'Weight logs database integration',
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
    const nonexistentUserId = randomUUID()

    // Register cleanup before setup, including records left by a broken foreign key.
    t.after(async () => {
      const results = await Promise.allSettled(
        [nonexistentUserId, ...users.map((user) => user.id)].map(async (id) => {
          success(await admin.from('weight_logs').delete().eq('user_id', id))
        }),
      )
      const userResults = await Promise.allSettled(
        users.map(async ({ id }) => {
          success(await admin.auth.admin.deleteUser(id))
        }),
      )
      assert.equal(
        [...results, ...userResults].filter((result) => result.status === 'rejected').length,
        0,
        `Fixture cleanup failed; inspect users with username prefix weight-test-${runId}`,
      )
    })

    for (const suffix of ['a', 'b']) {
      const password = `${randomUUID()}aA1!`
      const email = `weight-test-${runId}-${suffix}@example.invalid`
      const { user } = success(
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: `weight-test-${runId}-${suffix}` },
        }),
      )
      users.push({ id: user.id })
      const client = databaseClient(config)
      const session = success(await client.auth.signInWithPassword({ email, password }))
      assert.equal(session.user.id, user.id)
      users.at(-1).client = client
    }
    const [owner, other] = users
    const values = (userId = owner.id) => ({
      user_id: userId,
      weight_kg: 78.25,
      measured_at: '2026-11-09T18:30:00',
    })
    const insert = async (input = values(), client = owner.client) =>
      success(await client.from('weight_logs').insert(input).select().single())

    await t.test("RLS prevents access to another user's weight logs", async () => {
      const row = await insert()
      const otherRow = await insert(values(other.id), other.client)
      for (const [actor, owned, target] of [
        [owner, row, otherRow],
        [other, otherRow, row],
      ]) {
        // Prove each ordinary session can read its own records before testing isolation.
        assert.deepEqual(
          success(await actor.client.from('weight_logs').select().eq('id', owned.id).single()),
          owned,
        )
        assert.deepEqual(
          success(await actor.client.from('weight_logs').select().eq('id', target.id)),
          [],
        )
        assert.deepEqual(
          success(
            await actor.client
              .from('weight_logs')
              .update({ weight_kg: 99 })
              .eq('id', target.id)
              .select(),
          ),
          [],
        )
        assert.deepEqual(
          success(await actor.client.from('weight_logs').delete().eq('id', target.id).select()),
          [],
        )
        rejected(await actor.client.from('weight_logs').insert(values(target.user_id)), '42501')
        rejected(
          await actor.client
            .from('weight_logs')
            .update({ user_id: target.user_id })
            .eq('id', owned.id),
          '42501',
        )
      }
      assert.deepEqual(
        success(await owner.client.from('weight_logs').select().eq('id', row.id).single()),
        row,
      )
      assert.deepEqual(
        success(await other.client.from('weight_logs').select().eq('id', otherRow.id).single()),
        otherRow,
      )
    })

    await t.test('updated_at changes after an update', async () => {
      const row = await insert()
      const updated = success(
        await owner.client
          .from('weight_logs')
          .update({ weight_kg: 77.5, updated_at: '2000-01-01T00:00:00Z' })
          .eq('id', row.id)
          .select()
          .single(),
      )
      assert.equal(updated.weight_kg, 77.5)
      assert.equal(updated.created_at, row.created_at)
      assert.ok(Date.parse(updated.updated_at) > Date.parse(row.updated_at))
    })

    await t.test('measured_at preserves the supplied date and time', async () => {
      for (const measuredAt of ['2026-01-15T00:05:00', '2026-07-15T23:55:00']) {
        const row = await insert({ ...values(), measured_at: measuredAt })
        const saved = success(
          await owner.client.from('weight_logs').select('measured_at').eq('id', row.id).single(),
        )
        assert.equal(saved.measured_at, measuredAt)
      }
    })

    await t.test('foreign key rejects nonexistent users independently of RLS', async () => {
      // RLS would reject this first with a regular user session, masking the foreign key.
      rejected(await admin.from('weight_logs').insert(values(nonexistentUserId)), '23503')
    })

    await t.test('deleting a fixture user cascades only their weight logs', async () => {
      const kept = await insert()
      const removed = await insert(values(other.id), other.client)
      assert.deepEqual(success(await admin.from('weight_logs').select('id').eq('id', removed.id)), [
        { id: removed.id },
      ])
      success(await admin.auth.admin.deleteUser(other.id))
      users.splice(users.indexOf(other), 1)
      assert.deepEqual(success(await admin.from('users').select('id').eq('id', other.id)), [])
      assert.deepEqual(
        success(await admin.from('weight_logs').select('id').eq('user_id', other.id)),
        [],
      )
      assert.deepEqual(
        success(await owner.client.from('weight_logs').select().eq('id', kept.id).single()),
        kept,
      )
    })
  },
)
