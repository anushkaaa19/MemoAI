import Flashcard from "../models/Flashcard.js";

// @desc    Get flashcards for a specific document
// @route   GET /api/flashcards/:documentId
// @access  Private
export const getFlashcards = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.find({
            documentId: req.params.documentId,
            userId: req.user._id
        }).populate('documentId', 'title fileName');

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'No flashcards found for this document',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            count: flashcardSet.cards?.length || 0,
            data: flashcardSet,
        });
    } catch (error) {
        console.error('Error in getFlashcards:', error);
        next(error);
    }
};

// @desc    Get all flashcard sets for the user
// @route   GET /api/flashcards
// @access  Private
export const getAllFlashcardSets = async (req, res, next) => {
    try {
        const flashcardSets = await Flashcard.find({ 
            userId: req.user._id 
        }).populate('documentId', 'title fileName').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: flashcardSets.length,
            data: flashcardSets,
        });
    } catch (error) {
        console.error('Error in getAllFlashcardSets:', error);
        next(error);
    }
};

// @desc    Review a flashcard (update last reviewed and count)
// @route   PUT /api/flashcards/review/:cardId
// @access  Private
export const reviewFlashcard = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({
            'cards._id': req.params.cardId,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found',
                statusCode: 404
            });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

        if (cardIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found in set',
                statusCode: 404
            });
        }

        flashcardSet.cards[cardIndex].lastReviewed = new Date();
        flashcardSet.cards[cardIndex].reviewCount += 1;

        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: {
                card: flashcardSet.cards[cardIndex],
                set: {
                    _id: flashcardSet._id,
                    documentId: flashcardSet.documentId
                }
            },
            message: 'Flashcard reviewed successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in reviewFlashcard:', error);
        next(error);
    }
};

// @desc    Toggle star/unstar a flashcard
// @route   PUT /api/flashcards/star/:cardId
// @access  Private
export const toggleStarFlashcard = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({
            'cards._id': req.params.cardId,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found',
                statusCode: 404
            });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

        if (cardIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found in set',
                statusCode: 404
            });
        }

        flashcardSet.cards[cardIndex].isStarred = !flashcardSet.cards[cardIndex].isStarred;
        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: {
                card: flashcardSet.cards[cardIndex],
                isStarred: flashcardSet.cards[cardIndex].isStarred
            },
            message: `Flashcard ${flashcardSet.cards[cardIndex].isStarred ? 'starred' : 'unstarred'} successfully`,
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in toggleStarFlashcard:', error);
        next(error);
    }
};

// @desc    Delete an entire flashcard set
// @route   DELETE /api/flashcards/:id
// @access  Private
export const deleteFlashcardSet = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            message: 'Flashcard set deleted successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in deleteFlashcardSet:', error);
        next(error);
    }
};

// @desc    Delete a single flashcard from a set
// @route   DELETE /api/flashcards/:setId/card/:cardId
// @access  Private
export const deleteSingleFlashcard = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({
            _id: req.params.setId,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found',
                statusCode: 404
            });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

        if (cardIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found in set',
                statusCode: 404
            });
        }

        flashcardSet.cards.splice(cardIndex, 1);
        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: {
                remainingCards: flashcardSet.cards.length
            },
            message: 'Flashcard deleted successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in deleteSingleFlashcard:', error);
        next(error);
    }
};

// @desc    Update a specific flashcard
// @route   PUT /api/flashcards/:setId/card/:cardId
// @access  Private
export const updateFlashcard = async (req, res, next) => {
    try {
        const { question, answer, difficulty } = req.body;

        const flashcardSet = await Flashcard.findOne({
            _id: req.params.setId,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found',
                statusCode: 404
            });
        }

        const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

        if (cardIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found in set',
                statusCode: 404
            });
        }

        if (question) flashcardSet.cards[cardIndex].question = question;
        if (answer) flashcardSet.cards[cardIndex].answer = answer;
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
            flashcardSet.cards[cardIndex].difficulty = difficulty;
        }

        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: flashcardSet.cards[cardIndex],
            message: 'Flashcard updated successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in updateFlashcard:', error);
        next(error);
    }
};