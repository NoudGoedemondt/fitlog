ALTER TABLE "public"."meals"
  ALTER COLUMN "consumed_at" TYPE timestamp without time zone
    USING ("consumed_at" AT TIME ZONE 'UTC'),
  ADD COLUMN "description" text,
  ALTER COLUMN "calories_kcal" DROP DEFAULT,
  ALTER COLUMN "protein_g" DROP DEFAULT,
  ALTER COLUMN "carbs_g" DROP DEFAULT,
  ALTER COLUMN "fats_g" DROP DEFAULT;
