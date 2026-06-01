// src/services/flashcardService.js
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getAllFlashcardsSets = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.FLASHCARDS.GET_ALL_FLASHCARD_SETS);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch flashcard sets' };
    }
};

const getFlashcardsForDocument = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.FLASHCARDS.GET_FLASHCARDS_FOR_DOC(documentId));
        console.log("getFlashcardsForDocument response:", response);
        return response.data;
    } catch (error) {
        console.error("getFlashcardsForDocument error:", error);
        throw error.response?.data || { message: 'Failed to fetch flashcards' };
    }
};

// Change from POST to PUT
const reviewFlashcard = async (cardId) => {
    try {
        const response = await axiosInstance.put(API_PATHS.FLASHCARDS.REVIEW_FLASHCARD(cardId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to review flashcard' };
    }
};
const toggleStar = async (cardId) => {
    try {
        const response = await axiosInstance.put(API_PATHS.FLASHCARDS.TOGGLE_STAR(cardId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update star status' };
    }
};

const deleteFlashcardSet = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.FLASHCARDS.DELETE_FLASHCARD_SET(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete flashcard set' };
    }
};

const flashcardService = {
    getAllFlashcardsSets,
    getFlashcardsForDocument,
    reviewFlashcard,
    toggleStar,
    deleteFlashcardSet,
};

export default flashcardService;