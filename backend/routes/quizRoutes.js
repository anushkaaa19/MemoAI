import express from 'express';
import {
    getQuizzes,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from '../controllers/quizController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET routes - specific BEFORE dynamic
router.get('/', getQuizzes);                    // GET /api/quizzes
router.get('/quiz/:id', getQuizById);           // GET /api/quizzes/quiz/:id
router.get('/:id/results', getQuizResults);     // GET /api/quizzes/:id/results

// POST routes
router.post('/:id/submit', submitQuiz);         // POST /api/quizzes/:id/submit

// DELETE routes
router.delete('/:id', deleteQuiz);              // DELETE /api/quizzes/:id

export default router;