
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import * as geminiService from '../utils/geminiService.js'; // 🧠 FIX 1: Added missing service import

// @desc    Upload PDF document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res, next) => {   
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF file',
                statusCode: 400
            });
        }
        const { title } = req.body;
        if (!title) {
            await fs.unlink(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Title is required',
                statusCode: 400
            });
        }
        const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
        const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;
        const document = await Document.create({
            userId: req.user._id,
            title,
            filePath: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            status: 'processing',
        });
        
        processPDF(document._id, req.file.path).catch(err => {
            console.error('Error processing PDF background routine:', err);
        }); 
        
        res.status(201).json({
            success: true,
            data: document,
            message: 'Document uploaded and processing started in background',
            statusCode: 201
        });
        
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        next(error);
    }
};

// Background worker function to parse and embed text
const processPDF = async (documentId, filePath) => {
    try {
        const { text } = await extractTextFromPDF(filePath);
        const basicChunks = chunkText(text, 500, 50);
        
        console.log(`🌀 Generating Gemini embeddings for ${basicChunks.length} chunks...`);
        const chunksWithEmbeddings = [];

        for (const chunk of basicChunks) {
            try {
                // 🧠 FIX 2: Swapped chunk.content to chunk.text to match textChunker keys
                const textToEmbed = chunk.text || chunk.content; 
                
                const embeddingVector = await geminiService.generateEmbedding(textToEmbed);
                
                chunksWithEmbeddings.push({
                    content: textToEmbed, // Matches your document collection schema field
                    index: chunk.chunkIndex ?? chunk.index,
                    pageNumber: chunk.pageNumber || 0,
                    embedding: embeddingVector 
                });
            } catch (embedError) {
                console.error(`⚠️ Failed to generate embedding for chunk index ${chunk.chunkIndex}:`, embedError.message);
                chunksWithEmbeddings.push({
                    content: chunk.text || chunk.content,
                    chunkIndex: chunk.chunkIndex ?? chunk.index,
                    pageNumber: chunk.pageNumber || 0,
                    embedding: [] 
                });
            }
        }

        // Save updated chunks with true vector payloads
        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunksWithEmbeddings,
            status: "ready",
        });
        
        console.log(`✅ Document ${documentId} processed successfully with ${chunksWithEmbeddings.length} semantic vectors.`);
    } catch (error) {
        console.error(`❌ Fatal error processing document ${documentId}:`, error);
        await Document.findByIdAndUpdate(documentId, {
            status: "error",
        });
    } 
};

// @desc    Get all documents for logged-in user
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.aggregate([
            { 
                $match: { userId: new mongoose.Types.ObjectId(req.user._id) } 
            },
            {
                $lookup: {
                    from: 'flashcards',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'flashcardData',
                }
            },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'quizData',
                }
            },
            {
                $addFields: {
                    flashcardCount: { $size: '$flashcardData' },
                    quizCount: { $size: '$quizData' },
                }
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcardData: 0,
                    quizData: 0,
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);
        
        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents,
            statusCode: 200
        });
        
    } catch (error) {
        console.error('Error in getDocuments:', error);
        next(error);
    }
};

// @desc    Get single document with chunks
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            });
        }
        
        const flashcardDoc = await Flashcard.findOne({ 
            documentId: document._id,
            userId: req.user._id
        });
        
        const quizzes = await Quiz.find({ 
            documentId: document._id,
            userId: req.user._id
        });
        
        const flashcardCount = flashcardDoc ? flashcardDoc.cards.length : 0;
        const quizCount = quizzes.length;
        
        const documentData = document.toObject();
        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;
        
        res.status(200).json({
            success: true,
            data: documentData,
            statusCode: 200
        });
        
    } catch (error) {
        console.error('Error in getDocument:', error);
        next(error);
    }
};

// @desc    Delete document and assets
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!document) {
            return res.status(404).json({           
                success: false,
                error: 'Document not found',
                statusCode: 404
            });
        }
        
        if (document.filePath) {
            try {
                const filename = document.filePath.split('/uploads/documents/')[1];
                if (filename) {
                    const filePath = path.join(process.cwd(), 'uploads', 'documents', filename);
                    await fs.unlink(filePath).catch(() => {});
                    console.log(`Deleted file: ${filePath}`);
                }
            } catch (fileError) {
                console.error('Error deleting physical file:', fileError);
            }
        }
        
        await Flashcard.deleteMany({ 
            documentId: document._id, 
            userId: req.user._id 
        });
        
        await Quiz.deleteMany({ 
            documentId: document._id, 
            userId: req.user._id 
        });
        
        await document.deleteOne(); 
        
        res.status(200).json({
            success: true,
            message: 'Document and all associated assets deleted successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in deleteDocument:', error);
        next(error);
    }   
};

