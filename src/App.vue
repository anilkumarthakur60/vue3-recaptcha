<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="nav-brand">Vue3 Recaptcha Demo</div>
      <div class="nav-links">
        <RouterLink to="/" class="nav-link" active-class="active">
          <i class="fa fa-shield"></i>
          reCAPTCHA v3
        </RouterLink>
        <RouterLink to="/v2" class="nav-link" active-class="active">
          <i class="fa fa-check-square"></i>
          reCAPTCHA v2
        </RouterLink>
      </div>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-brand {
  font-size: 1.3em;
  font-weight: 700;
  color: #1a1a1a;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #666;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.95em;

  i {
    font-size: 1rem;
  }

  &:hover {
    color: #2c3e50;
    background: #f5f7fa;
  }

  &.active {
    color: #2c3e50;
    background: #f5f7fa;
    border-bottom: 2px solid #2c3e50;
  }
}

.main-content {
  flex: 1;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .nav-brand {
    font-size: 1.1em;
  }

  .nav-links {
    width: 100%;
    gap: 0.5rem;
  }

  .nav-link {
    flex: 1;
    justify-content: center;
    padding: 0.6rem 0.8rem;
    font-size: 0.9em;
  }
}
</style>
