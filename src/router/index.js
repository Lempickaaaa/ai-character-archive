import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/ProjectListView.vue') },
  {
    path: '/project/:id',
    component: () => import('../views/ProjectLayout.vue'),
    children: [
      { path: '', redirect: (to) => ({ name: 'characters', params: to.params }) },
      { path: 'characters', name: 'characters', component: () => import('../views/CharactersView.vue') },
      { path: 'world', name: 'world', component: () => import('../views/WorldView.vue') },
      { path: 'intro', name: 'intro', component: () => import('../views/IntroView.vue') },
      { path: 'export', name: 'export', component: () => import('../views/ExportView.vue') },
      { path: 'json', name: 'json', component: () => import('../views/JsonView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
