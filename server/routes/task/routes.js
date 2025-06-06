const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, tasksController.getAllTasks);
router.get('/stats', tasksController.getTaskStats);
router.get('/search', tasksController.searchTasks);
router.get('/:id', authenticate, tasksController.getTaskById);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;