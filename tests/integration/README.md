# Database integration tests

These tests use the existing Node.js test runner and Supabase client. No new
packages, SQL functions, migrations, or database configuration changes are needed.
Repository migration inspection is not a live schema inspection: only an enabled
integration run exercises the deployed database through Auth and PostgREST.

## Configuration

Use **FitlogDB-test** (`yfupaojunwlqjnthxrlc`) with both Meals migrations applied.
Provide these dedicated variables through your shell, CI secret store, or an
ignored `.env.integration.local` file:

- `FITLOG_TEST_URL`: exactly `https://yfupaojunwlqjnthxrlc.supabase.co`
- `FITLOG_TEST_ANON_KEY`: that project's public anon JWT or publishable key
- `FITLOG_TEST_SERVICE_ROLE_KEY`: that project's service-role or secret key,
  exclusively for fixture provisioning, teardown, and FK/cascade checks

Do not copy credentials into tracked files, logs, or commands saved in shell
history. Frontend `VITE_*` configuration is intentionally not used. No preexisting
user credentials are required. Each suite creates two confirmed temporary Auth
users with random passwords and unique `nutrition-test-<run UUID>-<suffix>` or
`weight-test-<run UUID>-<suffix>` usernames, relying on the existing profile creation trigger.

With variables already exported (runs both Meals and WeightLogs):

```sh
npm run test:db
```

Alternatively, with the ignored environment file (Node 24):

```sh
FITLOG_TEST_RUN=1 node --env-file=.env.integration.local --test tests/integration/nutrition.test.js
```

`npm test` skips the remote suite unless `FITLOG_TEST_RUN=1` is explicitly set.
`npm run test:db` fails on missing or invalid configuration. The guard rejects
production and any other URL before creating a client; requests are also checked
against the fixed test origin and redirects are refused. User clients reject
service-role JWTs and secret keys. Never enable this suite in production jobs.

## Coverage and safety

The Meals suite covers these database behaviors:

- RLS prevents users from reading, inserting, updating, deleting, or taking over
  another user's records in either table. Tests use ordinary signed-in clients.
- The `updated_at` trigger updates the timestamp in both tables, including when an
  update supplies an old timestamp explicitly.
- UNIQUE rejects duplicate daily totals on insert and update, while allowing
  different users to use the same date.
- `consumed_at` preserves the supplied date and time, using winter and summer
  dates near midnight to detect unwanted shifts.
- Foreign keys reject nonexistent users, and deleting a fixture Auth user
  cascades through its profile to both nutrition tables. These checks use the
  admin client so RLS does not mask constraint behavior.

The WeightLogs suite covers exactly five scenarios: cross-user RLS isolation for
SELECT/INSERT/UPDATE/DELETE and ownership changes, the `updated_at` trigger,
unchanged `measured_at` dates and times in winter and summer, foreign-key rejection
of nonexistent users, and cascading deletion while another user's measurements
remain intact. RLS checks use ordinary user sessions; FK/cascade checks use admin.

Both suites use `tests/helpers/database.js`. The local
`tests/databaseGuard.test.js` tests the shared configuration guard without network
requests. Credentials and configuration stay the same for both suites.

Teardown is registered before user creation and attempts to delete every created
Auth user even after setup or assertion failures. Nutrition records are cleaned
by their run tag; weight logs are cleaned by the temporary user IDs, including
the deliberately nonexistent foreign-key test ID.
Errors report database error codes rather than responses that may contain tokens.
Concurrent runs have separate users and random run identifiers. The suite never
resets a database or changes schema, policies, or existing users.

A killed process, network outage, or broken cascade can prevent complete cleanup.
On cleanup failure, inspect the reported username prefix in **FitlogDB-test** and
remove only that run's fixture users/records. Do not reset the database.

These tests verify observable database behavior through the API, not exact catalog
definitions or index structure. They do not prove behavior for database-owner or
service-role sessions (which bypass RLS), nor cover frontend precedence between
manual totals and meals. Live integration results require the configuration above;
a skipped suite or static migration review is not database validation.
