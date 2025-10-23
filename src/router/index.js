import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/metrics',
    name: 'metrics',
    component: () => import('../views/BodyMetricsView.vue'),
  },
  {
    path: '/nutrition',
    name: 'nutrition',
    component: () => import('../views/NutritionView.vue'),
  },
  {
    path: '/routines/add',
    name: 'routines-add',
    component: () => import('../views/RoutinesAddView.vue'),
  },
  {
    path: '/routines/log',
    name: 'routines-log',
    component: () => import('../views/RoutinesLogView.vue'),
  },
];

const router = createRouter({ history: createWebHistory(), routes });
export default router;
