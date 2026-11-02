<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
})
</script>

<template>
  <section class="auth-page" aria-labelledby="auth-page-title">
    <div class="auth-card">
      <header class="auth-heading">
        <span class="auth-icon"><v-icon :icon="icon" size="26" aria-hidden="true"></v-icon></span>
        <div class="eyebrow"><span class="eyebrow-line"></span> FITLOG ACCOUNT</div>
        <h1 id="auth-page-title">{{ title }}<span>.</span></h1>
        <p>{{ description }}</p>
      </header>
      <div class="auth-form"><slot></slot></div>
      <footer class="auth-footer"><slot name="footer"></slot></footer>
    </div>
    <RouterLink class="home-link" to="/">
      <v-icon icon="mdi-arrow-left" size="16" aria-hidden="true"></v-icon>
      Back to FitLog
    </RouterLink>
  </section>
</template>

<style scoped>
.auth-page {
  width: 100%;
  max-width: 480px;
  margin: 36px auto 48px;
  color: rgb(var(--v-theme-on-surface));
}

.auth-card {
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 24px rgb(var(--v-theme-shadow) / 3%);
}

.auth-heading {
  padding: 32px 32px 0;
}

.auth-icon {
  display: inline-flex;
  padding: 13px;
  margin-bottom: 24px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface-accent));
  color: rgb(var(--v-theme-primary));
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgb(var(--v-theme-primary));
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.eyebrow-line {
  width: 22px;
  height: 2px;
  background: currentColor;
}

.auth-heading h1 {
  margin: 8px 0 10px;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1.2;
}

.auth-heading h1 > span {
  color: rgb(var(--v-theme-primary));
}

.auth-heading p {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  line-height: 1.7;
}

.auth-form {
  padding: 28px 32px 32px;
}

.auth-form :deep(.v-text-field) {
  margin-bottom: 12px;
}

.auth-form :deep(.auth-error) {
  margin-block: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
}

.auth-form :deep(.auth-submit) {
  margin-top: 8px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.auth-footer {
  padding: 20px 24px;
  border-top: 1px solid rgb(var(--v-theme-outline));
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  line-height: 1.8;
  text-align: center;
}

.auth-footer :deep(a) {
  display: inline-block;
  margin-left: 4px;
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-underline-offset: 3px;
}

.home-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  margin: 20px auto 0;
  padding: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
  text-decoration: none;
}

.home-link:hover {
  color: rgb(var(--v-theme-primary));
}

.home-link:focus-visible,
.auth-footer :deep(a:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
  border-radius: 4px;
}

@media (max-width: 600px) {
  .auth-page {
    margin-top: 20px;
  }

  .auth-heading {
    padding: 24px 20px 0;
  }

  .auth-heading h1 {
    font-size: 30px;
  }

  .auth-icon {
    margin-bottom: 20px;
  }

  .auth-form {
    padding: 24px 20px;
  }

  .auth-footer {
    padding: 16px 20px;
  }
}
</style>
