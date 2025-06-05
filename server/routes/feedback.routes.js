const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

router.post('/', authMiddleware, feedbackController.submitFeedback);
router.get('/my-feedback', authMiddleware, feedbackController.getUserFeedback);

// Rutas de administrador
router.get('/all', authMiddleware, adminMiddleware, feedbackController.getAllFeedback);
router.put('/:id/status', authMiddleware, adminMiddleware, feedbackController.updateFeedbackStatus);

module.exports = router;