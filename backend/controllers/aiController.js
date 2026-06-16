import Document from "../models/Document.js";
import mongoose from 'mongoose'; 
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js"; 
import ChatHistory from '../models/ChatHistory.js';
import * as geminiService from '../utils/geminiService.js';

/**
 * Internal helper to find document and handle "not found" responses
 */
const findDocOrErr = async (documentId, userId, res, checkReady = true) => {
    const query = { _id: documentId, userId };
    if (checkReady) query.status = 'ready';
    
    const document = await Document.findOne(query);
    if (!document) {
        res.status(404).json({
            success: false,
            error: checkReady ? 'Document not found or not ready' : 'Document not found',
            statusCode: 404
        });
        return null;
    }
    return document;
};

export const generateFlashcards = async (req, res, next) => {
    try {
        const { documentId, count = 10 } = req.body;
        const document = await findDocOrErr(documentId, req.user._id, res, false);
        if (!document) return;

        const cards = await geminiService.generateFlashcards(document.extractedText, parseInt(count));
        
        const flashcardSet = await Flashcard.create({
            userId: req.user._id,
            documentId: document._id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty || 'medium',
                reviewCount: 0,
                isStarred: false
            }))
        });

        res.status(201).json({
            success: true,
            data: flashcardSet,
            message: 'Flashcards generated successfully',
            statusCode: 201
        });
    } catch (error) {
        console.error('Error in generateFlashcards:', error);
        next(error);
    }
};

export const generateQuiz = async (req, res, next) => {
    try {
        const { documentId, numQuestions = 5, title } = req.body;
        if (!documentId) return res.status(400).json({ success: false, error: 'Document ID is required', statusCode: 400 });

        const document = await findDocOrErr(documentId, req.user._id, res);
        if (!document) return;

        const questions = await geminiService.generateQuiz(document.extractedText, parseInt(numQuestions));
        
        const quiz = await Quiz.create({
            userId: req.user._id,
            documentId: document._id,
            title: title || `Quiz for ${document.fileName || 'Document'}-Quiz`, 
            questions,
            totalQuestions: questions.length,
            userAnswers: [],
            score: 0
        });

        res.status(201).json({
            success: true,
            data: quiz,
            message: 'Quiz generated successfully',
            statusCode: 201
        });
    } catch (error) {
        console.error('Error in generateQuiz:', error);
        next(error);
    }
};

export const generateSummary = async (req, res, next) => {
    try {
        const { documentId } = req.body;
        if (!documentId) return res.status(400).json({ success: false, error: 'Document ID is required', statusCode: 400 });

        const document = await findDocOrErr(documentId, req.user._id, res);
        if (!document) return;

        const summary = await geminiService.generateSummary(document.extractedText);
        
        res.status(200).json({
            success: true,
            data: { documentId: document._id, title: document.title, summary },
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
            return res.status(400).json({ success: false, error: 'Invalid request body', statusCode: 400 });
        }

        // 1. Fetch the parent document directly
        const document = await Document.findOne({ _id: documentId, userId: req.user._id });
        if (!document || !document.chunks || document.chunks.length === 0) {
            return res.status(404).json({ success: false, error: 'Document or text chunks not found', statusCode: 404 });
        }

        console.log(`📡 Incoming Chat Query: "${question}"`);
        
        // 2. Generate the query embedding vector
        const queryVector = await geminiService.generateEmbedding(question);

        console.log(`⚡ Running In-Memory Vector Proximity Match...`);

        // Cosine Similarity Formula helper
        const calculateSimilarity = (vecA, vecB) => {
            if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
            let dotProduct = 0, normA = 0, normB = 0;
            for (let i = 0; i < vecA.length; i++) {
                dotProduct += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
            }
            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        };

        // 3. Score every chunk locally via JS using your Mongoose schema keys
        const scoredChunks = document.chunks.map(chunk => {
            const similarity = calculateSimilarity(queryVector, chunk.embedding);
            return {
                index: chunk.chunkIndex,
                text: chunk.content,
                score: similarity
            };
        });

        // 4. Sort and isolate top 3 target context elements
        const precisionResults = scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        console.log("📡 Highly Specific Chunks Found (Chat Fix):", JSON.stringify(precisionResults, null, 2));

        if (!precisionResults || precisionResults.length === 0 || !precisionResults[0].text) {
            return res.status(200).json({
                success: true,
                data: { 
                    question, 
                    answer: "I don't have enough information to answer that question based on the document." 
                }
            });
        }

        // 5. Build prompt payload structure and send to Gemini
        const answer = await geminiService.chatWithContext(question, precisionResults);
        const chunkIndices = precisionResults.map(chunk => chunk.index ?? 0);

        // 6. Update conversational histories
        const chatHistory = await ChatHistory.findOneAndUpdate(
            { userId: req.user._id, documentId: documentId },
            { 
                $push: { 
                    messages: [
                        { role: 'user', content: question, timestamp: new Date(), relevantChunkIndices: [] },
                        { role: 'assistant', content: answer, timestamp: new Date(), relevantChunkIndices: chunkIndices }
                    ] 
                } 
            },
            { returnDocument: 'after', upsert: true } 
        );

        res.status(200).json({
            success: true,
            data: { question, answer, relevantChunks: chunkIndices, chatHistory: chatHistory._id },
            message: 'Chat response generated successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('❌ Error in fallback chat pipeline:', error);
        next(error);
    }
};

export const explainConcept = async (req, res, next) => {
    try {
        const { concept, documentId } = req.body;
        if (!documentId || !concept) {
            return res.status(400).json({ success: false, error: 'Invalid request body', statusCode: 400 });
        }

        const document = await Document.findOne({ _id: documentId, userId: req.user._id }).lean();
        if (!document || !document.chunks || document.chunks.length === 0) {
            return res.status(404).json({ success: false, error: 'Document not found', statusCode: 404 });
        }

        console.log(`🔄 Encoding concept vector lookup for: "${concept}"`);
        const queryVector = await geminiService.generateEmbedding(concept);

        const calculateSimilarity = (vecA, vecB) => {
            if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
            let dotProduct = 0, normA = 0, normB = 0;
            for (let i = 0; i < vecA.length; i++) {
                dotProduct += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
            }
            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        };

        const scoredChunks = document.chunks.map(chunk => {
    const similarity = calculateSimilarity(queryVector, chunk.embedding);
    return {
        // Safe fallbacks to handle either naming structure
        index: chunk.chunkIndex !== undefined ? chunk.chunkIndex : chunk.index,
        text: chunk.content || chunk.text || "",
        score: similarity
    };
});


        const precisionResults = scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);

        console.log("📡 Highly Specific Chunks Found (Concept Fix):", JSON.stringify(precisionResults, null, 2));

        let context = "";
        let finalIndices = [];
        
        if (precisionResults && precisionResults.length > 0 && precisionResults[0].text) {
            context = precisionResults.map(chunk => chunk.text).join('\n\n');
            finalIndices = precisionResults.map(chunk => chunk.index ?? 0);
        } else {
            context = "No specific reference text found inside the document context components.";
        }

        const explanation = await geminiService.explainConceptWithContext(concept, context);

        res.status(200).json({
            success: true,
            data: { concept, explanation, relevantChunks: finalIndices },
            message: 'Concept explanation generated successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('❌ Error in vector explainConcept pipeline:', error);
        next(error);
    }
};
export const getChatHistory = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        if (!documentId) return res.status(400).json({ success: false, error: 'Document ID is required', statusCode: 400 });

        const chatHistory = await ChatHistory.findOne({ userId: req.user._id, documentId }).select('messages');
        
        res.status(200).json({
            success: true,
            data: chatHistory ? chatHistory.messages : [],
            message: 'Chat history retrieved successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in getChatHistory:', error);
        next(error);
    }
};