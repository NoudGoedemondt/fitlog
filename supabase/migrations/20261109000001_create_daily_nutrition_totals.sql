CREATE TABLE "public"."daily_nutrition_totals" (
  "id"            integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"       uuid                     NOT NULL,
  "log_date"      date                     NOT NULL,
  "calories_kcal" numeric(6,1)             NOT NULL,
  "protein_g"     numeric(6,1)             NOT NULL,
  "carbs_g"       numeric(6,1)             NOT NULL,
  "fats_g"        numeric(6,1)             NOT NULL,
  "notes"         text,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "daily_nutrition_totals_calories_kcal_check" CHECK ((calories_kcal >= (0)::numeric)),
  CONSTRAINT "daily_nutrition_totals_carbs_g_check" CHECK ((carbs_g >= (0)::numeric)),
  CONSTRAINT "daily_nutrition_totals_fats_g_check" CHECK ((fats_g >= (0)::numeric)),
  CONSTRAINT "daily_nutrition_totals_pkey" PRIMARY KEY (id),
  CONSTRAINT "daily_nutrition_totals_protein_g_check" CHECK ((protein_g >= (0)::numeric)),
  CONSTRAINT "daily_nutrition_totals_user_id_log_date_key" UNIQUE (user_id, log_date)
);

ALTER TABLE "public"."daily_nutrition_totals"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."daily_nutrition_totals"
  ADD CONSTRAINT "daily_nutrition_totals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE TRIGGER on_daily_nutrition_totals_updated
  BEFORE UPDATE ON public.daily_nutrition_totals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users can create their own daily nutrition totals" ON "public"."daily_nutrition_totals"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete their own daily nutrition totals" ON "public"."daily_nutrition_totals"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can update their own daily nutrition totals" ON "public"."daily_nutrition_totals"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view their own daily nutrition totals" ON "public"."daily_nutrition_totals"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."daily_nutrition_totals" TO "anon", "authenticated", "postgres", "service_role";
