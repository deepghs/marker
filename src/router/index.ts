import { createRouter, createWebHashHistory } from 'vue-router'
import MarkerView from '../views/marker/MarkerView.vue'
import HomeView from '../views/HomeView.vue'
import ToolBoxView from '../views/toolbox/ToolBoxView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/home',
      redirect: '/'
    },
    {
      path: '/marker',
      name: 'marker',
      component: MarkerView
    },
    {
      path: '/toolbox',
      name: 'toolbox',
      component: ToolBoxView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
