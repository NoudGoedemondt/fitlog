<script setup>
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const sections = [
  { title: 'Training', description: 'Workouts and routines', icon: 'mdi-dumbbell' },
  {
    title: 'Nutrition',
    description: 'Meals, calories and macronutrients',
    icon: 'mdi-food-apple-outline',
  },
  {
    title: 'Body measurements',
    description: 'Weight logs and body profile',
    icon: 'mdi-account-outline',
  },
]

const features = [
  {
    title: 'Training',
    icon: 'mdi-dumbbell',
    description: 'Record workouts, sets and repetitions, and organize exercises into routines.',
    available: false,
  },
  {
    title: 'Meals',
    icon: 'mdi-food-apple-outline',
    description: 'Keep a record of meals, calories and macronutrients.',
    available: false,
  },
  {
    title: 'Weight logs',
    icon: 'mdi-scale-bathroom',
    description: 'Record your weight and review, edit or remove previous measurements.',
    available: true,
  },
  {
    title: 'Body profile',
    icon: 'mdi-account-outline',
    description: 'Maintain your body profile alongside your training and nutrition records.',
    available: false,
  },
]
</script>

<template>
  <div class="home-page">
    <section class="hero" aria-labelledby="home-title">
      <div class="hero-content">
        <div class="eyebrow"><span class="eyebrow-line"></span> FITNESS TRACKING</div>
        <h1 id="home-title">Your fitness,<br /><span>in one place.</span></h1>
        <p class="hero-description">
          Manage your workouts, plan routines, log meals and keep track of body measurements with
          FitLog.
        </p>

        <div class="hero-actions" :aria-busy="authStore.isLoading">
          <span v-if="authStore.isLoading" class="account-loading" role="status">
            <v-progress-circular
              indeterminate
              size="18"
              width="2"
              color="primary"
            ></v-progress-circular>
            Loading account…
          </span>
          <template v-else-if="!authStore.user">
            <v-btn
              to="/register"
              color="primary"
              size="large"
              rounded="lg"
              elevation="0"
              append-icon="mdi-arrow-right"
              >Create account</v-btn
            >
            <v-btn to="/login" color="secondary" variant="outlined" size="large" rounded="lg"
              >Log in</v-btn
            >
          </template>
          <v-btn
            v-else
            href="#features"
            color="primary"
            size="large"
            rounded="lg"
            elevation="0"
            append-icon="mdi-arrow-right"
            >Explore FitLog</v-btn
          >
        </div>
        <a class="features-link" href="#features">
          Explore the features <v-icon icon="mdi-arrow-down" size="16" aria-hidden="true"></v-icon>
        </a>
      </div>

      <section class="app-preview" aria-labelledby="preview-title">
        <div class="preview-heading">
          <h2 id="preview-title">FitLog overview</h2>
          <span class="overview-badge">App sections</span>
        </div>
        <div class="overview-highlight">
          <div class="overview-label"><span class="status-dot"></span> FITNESS TRACKING</div>
          <h3 class="overview-title">Training, nutrition<br />and measurements.</h3>
          <p class="overview-description">Organize your fitness records with FitLog.</p>
          <v-icon
            class="overview-watermark"
            icon="mdi-dumbbell"
            size="105"
            aria-hidden="true"
          ></v-icon>
        </div>
        <div class="overview-sections">
          <h3>Your app sections</h3>
          <ul>
            <li v-for="section in sections" :key="section.title">
              <span class="section-icon"
                ><v-icon :icon="section.icon" size="21" aria-hidden="true"></v-icon
              ></span>
              <div>
                <h4>{{ section.title }}</h4>
                <p>{{ section.description }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </section>

    <section id="features" class="features-section" aria-labelledby="features-title">
      <div class="section-heading">
        <div>
          <div class="eyebrow"><span class="eyebrow-line"></span> FEATURES</div>
          <h2 id="features-title">Tools in FitLog</h2>
        </div>
      </div>
      <div class="feature-grid">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="feature-card"
          :class="{ 'feature-card-available': feature.available }"
        >
          <div class="feature-card-heading">
            <span class="feature-icon"
              ><v-icon :icon="feature.icon" size="23" aria-hidden="true"></v-icon
            ></span>
            <span
              class="feature-status"
              :class="{ 'feature-status-available': feature.available }"
              >{{ feature.available ? 'Available' : 'In development' }}</span
            >
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </article>
      </div>
    </section>

    <aside class="getting-started" aria-labelledby="getting-started-title">
      <span class="getting-started-icon"
        ><v-icon icon="mdi-view-grid-outline" size="26" aria-hidden="true"></v-icon
      ></span>
      <div>
        <h2 id="getting-started-title">Choose a section</h2>
        <p>
          Use the navigation to open workouts, routines, meals, weight logs or your body profile.
        </p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1060px;
  margin: 28px auto 48px;
  color: rgb(var(--v-theme-on-surface));
}

.hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 56px;
  padding-block: 24px 48px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.eyebrow-line {
  width: 22px;
  height: 2px;
  background: currentColor;
}

.hero h1 {
  margin: 18px 0 22px;
  font-size: clamp(36px, 4.4vw, 56px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 1.12;
}

.hero h1 > span {
  color: rgb(var(--v-theme-primary));
}

.hero-description {
  max-width: 410px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  margin-top: 28px;
}

.hero-actions .v-btn {
  padding-inline: 22px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.account-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
}

.features-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding-block: 4px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  text-decoration: none;
}

.features-link:hover {
  color: rgb(var(--v-theme-primary));
}

.features-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
  border-radius: 4px;
}

.app-preview {
  min-width: 0;
  padding: 18px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 24px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 12px 48px rgb(var(--v-theme-shadow) / 5%);
}

.preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 2px 16px;
}

.preview-heading h2 {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.overview-badge {
  padding: 4px 8px;
  border-radius: 6px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 10px;
  white-space: nowrap;
}

.overview-highlight {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(
    115deg,
    rgb(var(--v-theme-measurement)),
    rgb(var(--v-theme-measurement-end))
  );
  color: rgb(var(--v-theme-on-measurement));
}

.overview-label {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-measurement-highlight));
}

.overview-title {
  position: relative;
  z-index: 1;
  margin: 12px 0 6px;
  font-size: clamp(26px, 2.5vw, 34px);
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.overview-description {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgb(var(--v-theme-on-measurement-muted));
  font-size: 12px;
}

.overview-watermark {
  position: absolute;
  top: 46px;
  right: 15px;
  color: rgb(var(--v-theme-on-measurement-muted));
  opacity: 0.1;
  transform: rotate(-12deg);
}

.overview-sections {
  padding: 20px 6px 0;
}

.overview-sections h3 {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
}

.overview-sections ul {
  list-style: none;
  padding: 0;
}

.overview-sections li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-block: 13px;
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.overview-sections li:last-child {
  border-bottom: 0;
}

.section-icon {
  display: inline-flex;
  flex-shrink: 0;
  padding: 10px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-accent));
  color: rgb(var(--v-theme-primary));
}

.overview-sections h4 {
  margin-bottom: 3px;
  font-size: 13px;
  font-weight: 600;
}

.overview-sections li p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
  line-height: 1.6;
}

.features-section {
  margin-top: 12px;
  padding-top: 36px;
  border-top: 1px solid rgb(var(--v-theme-outline));
  scroll-margin-top: 100px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 8px;
}

.section-heading h2 {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.04em;
}

.section-heading > p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  line-height: 1.8;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.feature-card {
  padding: 22px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
}

.feature-card-available {
  background: rgb(var(--v-theme-surface-variant));
}

.feature-card-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
}

.feature-icon {
  display: inline-flex;
  color: rgb(var(--v-theme-secondary));
}

.feature-card-available .feature-icon {
  color: rgb(var(--v-theme-primary));
}

.feature-status {
  padding: 4px 6px;
  border-radius: 5px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.feature-status-available {
  background: rgb(var(--v-theme-surface-accent));
  color: rgb(var(--v-theme-primary));
}

.feature-card h3 {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.feature-card > p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  line-height: 1.8;
}

.getting-started {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 24px;
  padding: 24px;
  border: 1px solid rgb(var(--v-theme-note-outline));
  border-radius: 18px;
  background: rgb(var(--v-theme-note));
}

.getting-started-icon {
  display: inline-flex;
  flex-shrink: 0;
  color: rgb(var(--v-theme-note-accent));
}

.getting-started h2 {
  margin-bottom: 5px;
  font-size: 15px;
  font-weight: 600;
}

.getting-started p {
  color: rgb(var(--v-theme-on-note));
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 959px) {
  .hero {
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }

  .hero h1 {
    font-size: 38px;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .home-page {
    margin-top: 16px;
  }

  .hero {
    grid-template-columns: 1fr;
    gap: 32px;
    padding-block: 12px 32px;
  }

  .hero h1 {
    font-size: clamp(32px, 8.8vw, 42px);
  }

  .hero-description {
    font-size: 14px;
  }

  .hero-actions .v-btn {
    flex: 1 1 auto;
  }

  .app-preview {
    padding: 14px;
  }

  .section-heading {
    flex-direction: column;
    align-items: start;
    gap: 12px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .feature-card {
    padding: 20px;
  }

  .feature-card-heading {
    margin-bottom: 14px;
  }

  .getting-started {
    align-items: start;
    gap: 12px;
    padding: 20px;
  }
}
</style>
