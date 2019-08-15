import Vue from 'vue';
import Router from 'vue-router';
// import Home from './views/Home.vue';
//import Page404 from './views/404Page.vue';
import Index from './views/Index.vue'
Vue.use(Router);
export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'index',
      component: Index,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue'),
    },
    {
      path:'/test',
      name:'test',
      component:res=>require(['./components/background/testBack.vue'],(comp)=>{res(comp)})
    }
    ,
    {
      path: '*',
      name: '404',
      component: res=>require(['./views/404Page.vue'],(comp)=>{res(comp)}),
    },
  ],
});
