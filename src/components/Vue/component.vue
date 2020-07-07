<template>
  <div id="vue" @click="runTest">I'm Vue component!</div>
</template>

<script>
export default {
  name: 'vue-component',
  data() {
    return {
      test1: 'Vue load',
      test2: 'Vue click',
    };
  },
  created() {
    console.log(this.test1);
  },
  methods: {
    runTest(event) {
      console.log(this.test2);
    },
  },
};
</script>

<style scoped>
h3 {
  font-size: 20px;
  text-transform: uppercase;
  font-weight: bold;
}
</style>
