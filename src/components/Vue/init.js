import Vue from 'vue';
import VueComponent from '@/components/Vue/component.vue';

document.addEventListener('DOMContentLoaded', () => {
  const el = document.body.querySelector('#vue');
  new Vue({
    el,
    render: (h) => h(VueComponent),
  });
});
