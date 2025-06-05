const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');

router.post('/', feedbackController.submitFeedback);
router.get('/my-feedback', feedbackController.getUserFeedback);
router.get('/all', feedbackController.getAllFeedback);
router.put('/:id/status', feedbackController.updateFeedbackStatus);

module.exports = router;