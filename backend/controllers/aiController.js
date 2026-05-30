import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js"
import ChatHistory from '../models/ChatHistory.js'
import * as geminiService from '../utils/geminiService.js'
import { findRelevantChunks } from "../utils/textChunker.js";
export const generateFlashcards = async (req, res, next) => {
    try {
        const { documentId, count = 10 } = req.body;

        const document = await Document.findOne({ _id: documentId, userId: req.user._id });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            });
        }
        const cards = await geminiService.generateFlashcards(document.extractedText, parseInt(count));
        const flashcardSet = await Flashcard.create({
            userId: req.user._id,
            documentId: document._id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount: 0,
                isStarred: false
            }))
        });
        res.status(201).json({
            success: true,
            data: flashcardSet,
            message: 'Flashcards generated successfully',
            statusCode: 200
        });
    }
    catch (error) {
        console.error('Error in generateFlashcards:', error);
        next(error);
    }
};
export const generateQuiz = async (req, res, next) => {
    try {
        const { documentId, numQuestions = 5, title } = req.body;
        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Document ID is required',
                statusCode: 400
            });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }
        const questions = await geminiService.generateQuiz(document.extractedText, parseInt(numQuestions));
        const quiz = await Quiz.create({
            userId: req.user._id,
            documentId: document._id,
            title: title || `Quiz for ${document.filename}-Quiz`,
            questions: questions,
            totalQuestions: questions.length,
            userAnswers: [],
            score: 0
        });
        res.status(201).json({
            success: true,
            data: quiz, message: 'Quiz generated successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in generateQuiz:', error);
        next(error);
    }
};
export const generateSummary = async (req, res, next) => {
    try {
        const { documentId } = req.body;
        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Document ID is required',
                statusCode: 400
            });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }
        const summary = await geminiService.generateSummary(document.extractedText);
        res.status(200).json({
            success: true,
            data: {
                documentId: document._id,
                title: document.title,
                summary
            },
            message: 'Summary generated successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in generateSummary:', error);
        next(error);
    }
};
export const chat = async (req, res, next) => {
    try {
        const { question, documentId } = req.body;
        if (!documentId || !question) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                statusCode: 400
            });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }
        const relevantChunks = findRelevantChunks(document.chunks, question, 3);
        const chunkIndices = relevantChunks.map(chunk => chunk.index);
        let chatHistory = await ChatHistory.findOne({ userId: req.user._id, documentId: document._id });
        if (!chatHistory) {
            chatHistory = await ChatHistory.create({ userId: req.user._id, documentId: document._id, messages: [] });
        }
        const answer = await geminiService.chatWithContext(question, relevantChunks);

        chatHistory.messages.push({ role: 'user', content: question, timestamp: new Date(), relevantChunkIndices: [] }, {
            role: 'assistant', content: answer, timestamp: new Date(), relevantChunkIndices: chunkIndices
        });
        await chatHistory.save();
        res.status(200).json({
            success: true,
            data: {
                question,
                answer,
                relevantChunks: chunkIndices,
                chatHistory: chatHistory._id
            },
            message: 'Chat response generated successfully',
            statusCode: 200
        });
    }
    catch (error) {
        console.error('Error in chat:', error);
        next(error);
    }
};
export const explainConcept = async (req, res, next) => {
    try {
        const { concept, documentId } = req.body;
        if (!documentId || !concept) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                statusCode: 400
            });
        }
        const document = await Document.findOne({ _id: documentId, userId: req.user._id, status: 'ready' });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }
        const relevantChunks = findRelevantChunks(document.chunks, concept, 3);
        const context = relevantChunks.map(chunk => chunk.text).join('\n');
        const explanation = await geminiService.explainConceptWithContext(concept, context);
        res.status(200).json({
            success: true,
            data: {
                concept,
                explanation,
                relevantChunks: relevantChunks.map(chunk => chunk.index)
            },
            message: 'Concept explanation generated successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in explainConcept:', error);
        next(error);
    }
};
export const getChatHistory = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Document ID is required',
                statusCode: 400
            });
        }
        const chatHistory = await ChatHistory.findOne({ userId: req.user._id, documentId }).select('messages');
        if (!chatHistory) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }
        res.status(200).json({
            success: true,
            data: chatHistory.messages,
            message: 'Chat history retrieved successfully',
            statusCode: 200
        });
    }
    catch (error) {
        console.error('Error in getChatHistory:', error);
        next(error);
    }
};