SET local check_function_bodies = off;

CREATE TABLE "public"."body_profiles" (
  "user_id"       uuid                     NOT NULL,
  "height_cm"     numeric(5,1),
  "date_of_birth" date,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "body_profiles_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."body_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."exercises" (
  "id"          integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  "name"        character varying        NOT NULL,
  "description" text,
  "is_active"   boolean                  NOT NULL DEFAULT true,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "exercises_name_key" UNIQUE (name),
  CONSTRAINT "exercises_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."exercises"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."meals" (
  "id"            integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"       uuid                     NOT NULL,
  "name"          character varying        NOT NULL,
  "calories_kcal" numeric(6,1)             NOT NULL DEFAULT 0,
  "protein_g"     numeric(6,1)             NOT NULL DEFAULT 0,
  "carbs_g"       numeric(6,1)             NOT NULL DEFAULT 0,
  "fats_g"        numeric(6,1)             NOT NULL DEFAULT 0,
  "consumed_at"   timestamp with time zone NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "meals_calories_kcal_check" CHECK ((calories_kcal >= (0)::numeric)),
  CONSTRAINT "meals_carbs_g_check" CHECK ((carbs_g >= (0)::numeric)),
  CONSTRAINT "meals_fats_g_check" CHECK ((fats_g >= (0)::numeric)),
  CONSTRAINT "meals_pkey" PRIMARY KEY (id),
  CONSTRAINT "meals_protein_g_check" CHECK ((protein_g >= (0)::numeric))
);

ALTER TABLE "public"."meals"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."routine_exercises" (
  "id"             integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  "routine_id"     integer NOT NULL,
  "exercise_id"    integer NOT NULL,
  "exercise_order" integer NOT NULL,
  CONSTRAINT "routine_exercises_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."routine_exercises"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."routines" (
  "id"         integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "name"       character varying        NOT NULL,
  "notes"      text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "routines_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."routines"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sets" (
  "id"                  integer      GENERATED ALWAYS AS IDENTITY NOT NULL,
  "workout_exercise_id" integer      NOT NULL,
  "set_number"          integer      NOT NULL,
  "reps"                integer      NOT NULL,
  "weight_kg"           numeric(5,1) NOT NULL DEFAULT 0,
  CONSTRAINT "sets_pkey" PRIMARY KEY (id),
  CONSTRAINT "sets_reps_check" CHECK ((reps > 0)),
  CONSTRAINT "sets_set_number_check" CHECK ((set_number > 0)),
  CONSTRAINT "sets_weight_kg_check" CHECK ((weight_kg >= (0)::numeric))
);

ALTER TABLE "public"."sets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."users" (
  "id"         uuid                     NOT NULL,
  "username"   character varying        NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_username_key" UNIQUE (username)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."weight_logs" (
  "id"          integer                     GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"     uuid                        NOT NULL,
  "weight_kg"   numeric(5,2)                NOT NULL,
  "measured_at" timestamp without time zone NOT NULL,
  "created_at"  timestamp with time zone    NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone    NOT NULL DEFAULT now(),
  CONSTRAINT "weight_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "weight_logs_weight_kg_check" CHECK ((weight_kg > (0)::numeric))
);

ALTER TABLE "public"."weight_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."workout_exercises" (
  "id"             integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  "workout_id"     integer NOT NULL,
  "exercise_id"    integer NOT NULL,
  "exercise_order" integer NOT NULL,
  CONSTRAINT "workout_exercises_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."workout_exercises"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."workouts" (
  "id"           integer                  GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"      uuid                     NOT NULL,
  "routine_id"   integer,
  "started_at"   timestamp with time zone,
  "completed_at" timestamp with time zone,
  "notes"        text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "workouts_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."workouts"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
  INSERT INTO public.users (
    id,
    username
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username'
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

ALTER TABLE "public"."routine_exercises"
  ADD CONSTRAINT "routine_exercises_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE RESTRICT;

ALTER TABLE "public"."routine_exercises"
  ADD CONSTRAINT "routine_exercises_routine_id_fkey" FOREIGN KEY (routine_id) REFERENCES public.routines(id) ON DELETE CASCADE;

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."body_profiles"
  ADD CONSTRAINT "body_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."meals"
  ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."routines"
  ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."weight_logs"
  ADD CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."workout_exercises"
  ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE RESTRICT;

ALTER TABLE "public"."sets"
  ADD CONSTRAINT "sets_workout_exercise_id_fkey" FOREIGN KEY (workout_exercise_id) REFERENCES public.workout_exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."workout_exercises"
  ADD CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;

ALTER TABLE "public"."workouts"
  ADD CONSTRAINT "workouts_routine_id_fkey" FOREIGN KEY (routine_id) REFERENCES public.routines(id) ON DELETE SET NULL;

ALTER TABLE "public"."workouts"
  ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX meals_user_id_consumed_at_idx ON public.meals USING btree (user_id, consumed_at);

CREATE INDEX routine_exercises_routine_id_exercise_order_idx ON public.routine_exercises USING btree (routine_id, exercise_order);

CREATE UNIQUE INDEX sets_workout_exercise_id_set_number_idx ON public.sets USING btree (workout_exercise_id, set_number);

CREATE INDEX weight_logs_user_id_measured_at_idx ON public.weight_logs USING btree (user_id, measured_at);

CREATE INDEX workout_exercises_workout_id_exercise_order_idx ON public.workout_exercises USING btree (workout_id, exercise_order);

CREATE INDEX workouts_user_id_started_at_idx ON public.workouts USING btree (user_id, started_at);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_body_profiles_updated
  BEFORE UPDATE ON public.body_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_exercises_updated
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_meals_updated
  BEFORE UPDATE ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_routines_updated
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_weight_logs_updated
  BEFORE UPDATE ON public.weight_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_workouts_updated
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users can create their own body profile" ON "public"."body_profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete their own body profile" ON "public"."body_profiles"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can update their own body profile" ON "public"."body_profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view their own body profile" ON "public"."body_profiles"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Authenticated users can view exercises" ON "public"."exercises"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Users can create their own meals" ON "public"."meals"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete their own meals" ON "public"."meals"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can update their own meals" ON "public"."meals"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view their own meals" ON "public"."meals"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can add exercises to their own routines" ON "public"."routine_exercises"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.routines
  WHERE ((routines.id = routine_exercises.routine_id) AND (routines.user_id = auth.uid())))));

CREATE POLICY "Users can delete exercises from their own routines" ON "public"."routine_exercises"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.routines
  WHERE ((routines.id = routine_exercises.routine_id) AND (routines.user_id = auth.uid())))));

CREATE POLICY "Users can update exercises in their own routines" ON "public"."routine_exercises"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.routines
  WHERE ((routines.id = routine_exercises.routine_id) AND (routines.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.routines
  WHERE ((routines.id = routine_exercises.routine_id) AND (routines.user_id = auth.uid())))));

CREATE POLICY "Users can view exercises in their own routines" ON "public"."routine_exercises"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.routines
  WHERE ((routines.id = routine_exercises.routine_id) AND (routines.user_id = auth.uid())))));

CREATE POLICY "Users can create their own routines" ON "public"."routines"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete their own routines" ON "public"."routines"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can update their own routines" ON "public"."routines"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view their own routines" ON "public"."routines"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can create their own sets" ON "public"."sets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.workout_exercises
     JOIN public.workouts ON ((workouts.id = workout_exercises.workout_id)))
  WHERE ((workout_exercises.id = sets.workout_exercise_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can delete their own sets" ON "public"."sets"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.workout_exercises
     JOIN public.workouts ON ((workouts.id = workout_exercises.workout_id)))
  WHERE ((workout_exercises.id = sets.workout_exercise_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can update their own sets" ON "public"."sets"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.workout_exercises
     JOIN public.workouts ON ((workouts.id = workout_exercises.workout_id)))
  WHERE ((workout_exercises.id = sets.workout_exercise_id) AND (workouts.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.workout_exercises
     JOIN public.workouts ON ((workouts.id = workout_exercises.workout_id)))
  WHERE ((workout_exercises.id = sets.workout_exercise_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can view their own sets" ON "public"."sets"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.workout_exercises
     JOIN public.workouts ON ((workouts.id = workout_exercises.workout_id)))
  WHERE ((workout_exercises.id = sets.workout_exercise_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can update their own profile" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "Users can view their own profile" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING ((id = auth.uid()));

CREATE POLICY "Users can create their own weight logs" ON "public"."weight_logs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete their own weight logs" ON "public"."weight_logs"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can update their own weight logs" ON "public"."weight_logs"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view their own weight logs" ON "public"."weight_logs"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can create their own workout exercises" ON "public"."workout_exercises"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.workouts
  WHERE ((workouts.id = workout_exercises.workout_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can delete their own workout exercises" ON "public"."workout_exercises"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.workouts
  WHERE ((workouts.id = workout_exercises.workout_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can update their own workout exercises" ON "public"."workout_exercises"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.workouts
  WHERE ((workouts.id = workout_exercises.workout_id) AND (workouts.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.workouts
  WHERE ((workouts.id = workout_exercises.workout_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can view their own workout exercises" ON "public"."workout_exercises"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.workouts
  WHERE ((workouts.id = workout_exercises.workout_id) AND (workouts.user_id = auth.uid())))));

CREATE POLICY "Users can create their own workouts" ON "public"."workouts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete their own workouts" ON "public"."workouts"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can update their own workouts" ON "public"."workouts"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can view their own workouts" ON "public"."workouts"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."body_profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercises" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."meals" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routine_exercises" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."routines" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sets" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."weight_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."workout_exercises" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."workouts" TO "anon", "authenticated", "postgres", "service_role";

