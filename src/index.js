const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

let users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const searchedUser = users.find(user => user.username == username);
  if(!searchedUser) {
    return response.status(404).json({ error: "User not found" })
  }

  request.user = searchedUser;
  return next();
}

function checkExistsTodoUserAccount(request, response, next) {
  const { user } = request;
  const { id } = request.params;
  const searchedTodo = user.todos.find(todo => todo.id === id);
  if(!searchedTodo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  request.todo = searchedTodo;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const exists = users.find(user => user.username == username);
  if(exists) {
    return response.status(400).json({ error: "User already exists" });
  }
  const user = { 
    id: uuidv4(),
    name, 
    username, 
    todos: []
  };
  users = [ ...users, user ];

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  
  return response.json(todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const { todos } = user;
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };
  user.todos = [ ...todos, todo ];

  return response.status(201).json({ ...todo, deadline: todo.deadline.toISOString() });
});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodoUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const todo = { ...request.todo, title, deadline: new Date(deadline) };
  
  return response.json({ 
    ...todo, 
    deadline: todo.deadline.toISOString(),
    created_at: todo.created_at.toISOString(),
  });
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodoUserAccount, (request, response) => {
  const todo = { ...request.todo, done: true };

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodoUserAccount, (request, response) => {
  const { user, todo } = request;
  const { id } = todo;
  const index = user.todos.indexOf(todo => todo.id == id);
  user.todos.splice(index, 1);

  return response.status(204).send();
});

module.exports = app;