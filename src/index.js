const express = require('express');
require('./db/mongoose');  // Connect to DB
// const User = require('./models/user');
// const Task = require('./models/task');
const routerUsers = require('./routers/user');
const routerTasks = require('./routers/task');

// Setup & configure express server
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(routerUsers);
app.use(routerTasks);

// Listen on port for requests
app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
})