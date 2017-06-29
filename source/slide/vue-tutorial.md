footer: © Glow Inc. 2017
slidenumbers: true

# VueJs Tutorial

---

# Prepare the code environment
```
git clone https://github.com/elvis-macak/vue-tutorial
cd vue-tutorial && npm i
```

---

# File Structure <sub>branch: step-1</sub>

```
- build
- config
- src
    - main.js
    - App.vue
    - components
    - ...
- index.html
```

--- 

# Component Style <sub>branch: step-2</sub>

```
<template lang="pug">
  div hello world
</template>

<script>
// Other code
export default {
    name: 'component-name',
    data() {
        return {}
    }
    props: [...],
    computed: { ... },
    methods: { ... },
};
</script>

<style scoped lang='scss'>
</style>
```

---

# Component Style <sub>branch: step-2</sub>

- export object
- export Vue.extend
- regitser by Vue.component

---

# ES6 Object Literals <sub>branch: step-3</sub>

A short hand for writing object[^1]

```
{ func(){ } } ---> { func: function(){ } }
```


[^1]: [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Enhanced_Object_literals)

---

# Component Scope <sub>branch: step-4</sub>

- JavaScript prototype chain[^2]

1. any variable is an object
2. any object has a `__proto__`, and point to its type's `prototype`[^3]
3. object looks for its attribute by `__proto__` and its `__proto__`'s `__proto__`



[^2]: [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain#With_a_constructor)

[^3]: [ChainPng](http://thinkingincrowd.u.qiniudn.com/JS_prototype_chain.png)

---

# Component Scope <sub>branch: step-4</sub>

```
function Mold () {this.name = 'mold';this.color='red';}
Mold.prototype.sayHello = function () {return 'hello'}
var instance = new Mold();

---

var instance = {}  // instance.__proto__ == Object.prototype
Mold.bind(instance)()
instance.__proto__ = Mold.prototype
```

---

# Component Scope <sub>branch: step-4</sub>

- ES6 arrow function (sometimes doesn't work in vuejs)

`() => {}` bind `this` when compiling

---

# Component Scope <sub>branch: step-4</sub>

- scope/this in vue component
    - VueComponent 
    - plugin
    - attr data/props/methods

---

# Two-Way Bind <sub>branch: step-5</sub>

- Object.defineProperty[^4]

> Vuejs only build watchers during instance initialization[^5]

So change `undefined` data won't update the ui.

    - obj = Object.assign({}, obj);
    - this.$forceUpdate();


[^4]: [MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)

[^5]: [VueJs docs](https://vuejs.org/v2/guide/reactivity.html#Change-Detection-Caveats).

---

# Component LifeCircle <sub>branch: step-6</sub>

1. created *
2. beforeMount *
3. mounted *
4. beforeUpdate
5. updated
6. beforeDestroy *
7. destroyed *

---

# Q & A ?

---

# Component Communication <sub>step-7</sub>

1. props ( primitive read-only, parent -> child )
2. callback ( child -> parent )
3. $emit ( child -> parent )

```
<child-component :items="data"/>
<child-component :callback="onChange"/>
<child-component @change='onChange'/>
```

---

# Component Communication <sub>step-7</sub>

4,  Vuex[^6]

<sub>Centralize all the data into a `web database tier`. Convert the mass state into data flow:</sub>

![inline](https://www.skyronic.com/user/pages/01.blog/vuex-basics-tutorial/todo.dot.png) ![inline](https://raw.githubusercontent.com/vuejs/vuex/dev/docs/en/images/vuex.png)

[^6]: [vuex-basics-tutorial](https://www.skyronic.com/blog/vuex-basics-tutorial)

---

# Vux <sub>branch: step-7</sub>

state: database
getters: read-only api
mutations: write-only api
actions: group of mutations(can be async)

---

# Vux <sub>branch: step-7</sub>

- pros:
  - make your component data flow clear

- cons:
  - introduce an extra data store

>
  data: internal state
  props: external state, but more like a style 
  vuex: external state, component logic data

---

# Q & A ?