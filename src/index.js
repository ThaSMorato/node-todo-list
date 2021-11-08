const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

const checkIfUsernameIsAlreadyInUse = (username) => {
  const usernameIsAlreadyInUse = users.some(
    (user) => user.username === username
  );

  return usernameIsAlreadyInUse;
};

const checkIfTodoExistsInUser = (user, todoId) => {
  const todoExistisInUser = user.todos.some((todo) => todo.id === todoId);

  return todoExistisInUser;
};

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (!checkIfUsernameIsAlreadyInUse(username)) {
    return response.status(400).json({ error: "User not found" });
  }

  const user = users.find((user) => user.username === username);

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const { username, name } = request.body;

  if (checkIfUsernameIsAlreadyInUse(username)) {
    return response.status(400).json({ error: "Username already in use" });
  }

  const newUser = {
    username,
    name,
    todos: [],
    id: uuidv4(),
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTodo = {
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date(),
    id: uuidv4(),
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const { title, deadline } = request.body;

  if (!checkIfTodoExistsInUser(user, id)) {
    return response.status(404).json({ error: "Todo not found" });
  }

  const todo = user.todos.find((todo) => todo.id === id);
  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(201).json(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const { id } = request.params;

  if (!checkIfTodoExistsInUser(user, id)) {
    return response.status(404).json({ error: "Todo not found" });
  }

  const todo = user.todos.find((todo) => todo.id === id);

  todo.done = true;

  return response.status(201).json(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const { id } = request.params;

  if (!checkIfTodoExistsInUser(user, id)) {
    return response.status(404).json({ error: "Todo not found" });
  }

  user.todos = user.todos.filter((todo) => todo.id !== id);

  return response.status(204).json(user.todos);
});

module.exports = app;
