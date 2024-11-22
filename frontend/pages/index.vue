<template>
  <div class="container">
    <h1>To-Do List</h1>
    <form @submit.prevent="addTodo">
      <input v-model="newTodo.title" type="text" placeholder="Enter a task" required />
      <button type="submit">Add</button>
    </form>
    <ul v-if="todos.length > 0">
      <li v-for="todo in todos" :key="todo.id">
        <span>{{ todo.title }}</span>
        <button @click="deleteTodo(todo.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      newTodo: {
        title: '',
      },
      todos: [],
      endpoints: {
        addTodo: 'https://ouwzrf2wfpbttusclikwn7klyu0mpllr.lambda-url.us-east-1.on.aws/',
        deleteTodo: 'https://nwkhlle5l3sbdmhqp5hmfuf7fi0fxgph.lambda-url.us-east-1.on.aws/',
        getTodo: 'https://glnivc4i6ajtqatahnfonewj2a0mfzny.lambda-url.us-east-1.on.aws/',
      },
    }
  },
  async mounted() {
    await this.fetchTodos()
  },
  methods: {
    async fetchTodos() {
      const response = await axios.get(this.endpoints.getTodo)
      this.todos = response.data
    },
    async addTodo() {
      if (!this.newTodo.title.trim()) {
        return
      }
      const response = await axios.post(this.endpoints.addTodo, this.newTodo, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      this.todos.push(response.data)
      this.newTodo.title = ''
    },
    async deleteTodo(id) {
      await axios.delete(`${this.endpoints.deleteTodo}?id=${id}`)
      this.todos = this.todos.filter((todo) => todo.id !== id)
    },
  },
}
</script>