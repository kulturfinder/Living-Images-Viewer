import Vue from 'vue'
import Vuex from 'vuex'
import api from './modules/api'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    api
  }
})

export default store
