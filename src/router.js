import Vue from 'vue'
import Router from 'vue-router'
import ARViewer from './views/ARViewer.vue'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/:locale/:actId',
      name: 'arViewer',
      component: ARViewer,
      props: true
    },
    {
      path: '/?livingImageIdList=:livingImageIdList',
      name: 'arViewer',
      component: ARViewer,
      props: true
    },
    {
      name: '404',
      path: '*',
      redirect: '/de/act0002156'
    }
  ]
})

export default router
