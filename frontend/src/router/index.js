import { createRouter, createWebHistory } from 'vue-router'
import Landing from '../pages/Landing.vue'
import Home from '../pages/Home.vue'
import History from '../pages/History.vue'
import Community from '../pages/Community.vue'
import CommunityPostDetail from '../pages/CommunityPostDetail.vue'
import Profile from '../pages/Profile.vue'
import UserLogin from '../pages/UserLogin.vue'
import AdminLogin from '../pages/admin/AdminLogin.vue'
import AdminDashboard from '../pages/admin/AdminDashboard.vue'
import { adminTokenStorageKey, userTokenStorageKey } from '../api/request'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: Landing },
    { path: '/login', name: 'user-login', component: UserLogin },
    { path: '/create', name: 'home', component: Home },
    { path: '/history', name: 'history', component: History },
    { path: '/community', name: 'community', component: Community },
    { path: '/community/:id', name: 'community-detail', component: CommunityPostDetail },
    { path: '/profile', name: 'profile', component: Profile },
    { path: '/admin/login', name: 'admin-login', component: AdminLogin },
    { path: '/admin', name: 'admin-dashboard', component: AdminDashboard },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  if (to.name === 'admin-dashboard') {
    const token = localStorage.getItem(adminTokenStorageKey)
    if (!token) {
      return '/admin/login'
    }
  }

  if (to.name === 'admin-login' && localStorage.getItem(adminTokenStorageKey)) {
    return '/admin'
  }

  if ((to.name === 'user-login') && localStorage.getItem(userTokenStorageKey)) {
    return '/create'
  }

  return true
})

export default router
