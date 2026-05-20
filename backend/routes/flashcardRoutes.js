import express from 'express';
import {
    getFlashcards,
    getAllFlashcardSets,
    reviewFlashcard,
    toggleStarFlashcard,
    deleteFlashcardSet,
    deleteSingleFlashcard
} from '../controllers/flashcardController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ========== GET ROUTES ==========
// Get all flashcard sets for the user
router.get('/', getAllFlashcardSets);

// Get flashcards for a specific document (by DOCUMENT ID)
router.get('/document/:documentId', getFlashcards);  // ✅ Changed: added 'document/' prefix

// ========== PUT ROUTES (better than POST for updates) ==========
// Review a flashcard (by CARD ID)
router.put('/card/:cardId/review', reviewFlashcard);  // ✅ Changed: POST to PUT

// Star/unstar a flashcard (by CARD ID)
router.put('/card/:cardId/star', toggleStarFlashcard);  // ✅ Changed: POST to PUT

// ========== DELETE ROUTES ==========
// Delete entire flashcard set (by SET ID)
router.delete('/set/:id', deleteFlashcardSet);

// Delete a single flashcard (needs SET ID to find the set, and CARD ID to delete)
router.delete('/:setId/card/:cardId', deleteSingleFlashcard);  // ✅ Changed: needs both IDs

export default router;  // ✅ Fixed: was 'route', now 'router'