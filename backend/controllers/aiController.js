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

        const queryVector = await geminiService.generateEmbedding(question);

        // 1. Vector Search
        const searchResults = await Document.aggregate([
            {
                $vectorSearch: {
                    index: "autoembed_index",
                    path: "chunks.embedding",
                    queryVector: queryVector,
                    numCandidates: 100,
                    limit: 3
                }
            },
            {
                // This 'unwinds' the array so we get individual chunk objects
                $unwind: "$chunks"
            },
            {
                // This adds the score so we can see how relevant they are
                $addFields: {
                    score: { $meta: "vectorSearchScore" }
                }
            },
            {
                // Only project the fields we need
                $project: {
                    _id: 0,
                    content: "$chunks.content",
                    index: "$chunks.chunkIndex",
                    score: 1
                }
            }
        ]);

        console.log("🔍 Search Results (Raw):", JSON.stringify(searchResults, null, 2));

        // 2. Format results for geminiService
        // Your current service expects an array of objects with {text} or {content}
        if (!searchResults || searchResults.length === 0) {
            return res.status(200).json({
                success: true,
                data: { question, answer: "I don't have enough information." }
            });
        }

        // 3. Send to AI
        const answer = await geminiService.chatWithContext(question, searchResults);
        const chunkIndices = searchResults.map(c => c.index);
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

        // 1. Generate the query embedding
        const queryVector = await geminiService.generateEmbedding(concept);

        // 2. Use MongoDB Atlas Vector Search (Database-native retrieval)
        const precisionResults = await Document.aggregate([
            {
                $vectorSearch: {
                    index: "autoembed_index", // MUST match the index name in Atlas
                    path: "chunks.embedding",
                    queryVector: queryVector,
                    numCandidates: 100,
                    limit: 2
                }
            },
            {
                $project: {
                    _id: 0,
                    chunks: {
                        $map: {
                            input: "$chunks",
                            as: "chunk",
                            in: { content: "$$chunk.content", index: "$$chunk.chunkIndex" }
                        }
                    }
                }
            }
        ]);

        // 3. Format the context for the AI
        // Note: precisionResults is an array of documents returned by the pipeline
        const context = precisionResults.length > 0 
            ? precisionResults.map(doc => doc.chunks[0]?.content).join('\n\n')
            : "No specific reference text found.";

        const finalIndices = precisionResults.length > 0 
            ? precisionResults.map(doc => doc.chunks[0]?.index ?? 0) 
            : [];

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