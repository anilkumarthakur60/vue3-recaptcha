import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecaptchaV2View from '../views/RecaptchaV2View.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'v3',
      component: HomeView
    },
    {
      path: '/v2',
      name: 'v2',
      component: RecaptchaV2View
    }
  ]
})

export default router
