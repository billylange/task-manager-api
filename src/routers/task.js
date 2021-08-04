const express = require('express');
const Task = require('../models/task');
const router = express.Router();
const auth = require('../middleware/auth');

// Add new task to database
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({...req.body, owner: req.user._id});
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
})

// List all tasks
router.get('/tasks', auth, async (req, res) => {
  // GET /tasks/competed=true/false
  const match = {};
  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  };

  // Sorting ==> GET /tasks?sortBy=createdAt:asc/desc
  const sort = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }
  
  // Pagnaition ==> GET /tasks?limit=2&skip=2
  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send(error);
  }
})

// Find task by ID
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id});
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
})

// Update tasks by ID
router.patch('/tasks/:id', auth, async (req, res) => {
  // Ensure only valid fields are updated
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!"});
  }

  // Update task on DB
  try {
    // Find task to update
    //const task = await Task.findById(req.params.id);
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return res.status(404).send({ error: "Task not found!"});
    }
    // Apply changes and save
    updates.forEach((update) => task[update] = req.body[update]);
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
})

// Remove task by ID
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return res.status(404).send({ error: "Task not found on DB!"});
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
})

module.exports = router;