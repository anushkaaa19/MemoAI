import express from 'express';
import {
    getQuizzes,
    getQuizzesByDocumentId,  // Rename for clarity
    getSingleQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from '../controllers/quizController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET routes
router.get('/', getQuizzes);                              // GET /api/quizzes - all quizzes for user
router.get('/:docId', getQuizzesByDocumentId);            // GET /api/quizzes/:docId - quizzes by DOCUMENT ID
router.get('/quiz/:id', getSingleQuizById);               // GET /api/quizzes/quiz/:id - single quiz by QUIZ ID
router.get('/:id/results', getQuizResults);               // GET /api/quizzes/:id/results

// POST routes
router.post('/:id/submit', submitQuiz);                   // POST /api/quizzes/:id/submit

// DELETE routes
router.delete('/:id', deleteQuiz);                        // DELETE /api/quizzes/:id

export default router;