import path from 'path';  // Add this line
import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';

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
        const {title} = req.body;
        if(!title){
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
            status:'processing',
        });
        processPDF(document._id, req.file.path).catch(err=>{
            console.error('Error processing PDF:', err);
        }) ;
        
        res.status(201).json({
            success: true,
            data:document,
            message: 'Document uploaded and processed successfully',
            statusCode: 201
        });
        
    } catch (error) {
        // Clean up file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        
        next(error);
    }
};
const processPDF = async (documentId, filePath) => {
    try {
        const {text} = await extractTextFromPDF(filePath);
        const chunks = chunkText(text,500,50);
        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status:"ready",
        });
        console.log(`Document ${documentId} processed with ${chunks.length} chunks.`);
    } catch (error) {
        console.error(`Error processing document ${documentId}:`, error);
        await Document.findByIdAndUpdate(documentId, {
            status:"error",
        });
    } 
};
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
                    as: 'flashcardData',  // Changed from 'flashcards'
                }
            },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'quizData',  // Changed from 'quizzes'
                }
            },
            {
                $addFields: {
                    flashcardCount: { $size: '$flashcardData' },  // Use the 'as' name
                    quizCount: { $size: '$quizData' },  // Use the 'as' name
                }
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcardData: 0,  // Remove the lookup data
                    quizData: 0,       // Remove the lookup data
                }
            },
          {
    $sort: { createdAt: -1 }  // Or uploadDate: -1 depending on your schema
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
            userId: req.user._id  // ✅ Fixed: use 'userId' not 'user'
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            });
        }
        
        // Get associated flashcards and quizzes
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
        
        // Convert to object and add counts
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
// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id  // ✅ Fixed: use 'userId' not 'user'
        });
        
        if (!document) {
            return res.status(404).json({           
                success: false,
                error: 'Document not found',
                statusCode: 404
            });
        }
        
        // ✅ FIX: Extract filename from URL to delete physical file
        if (document.filePath) {
            try {
                // Get the filename from the URL
                const filename = document.filePath.split('/uploads/documents/')[1];
                if (filename) {
                    const filePath = path.join(process.cwd(), 'uploads', 'documents', filename);
                    await fs.unlink(filePath).catch(() => {});
                    console.log(`Deleted file: ${filePath}`);
                }
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
            }
        }
        
        // Delete associated flashcards and quizzes
        await Flashcard.deleteMany({ 
            documentId: document._id, 
            userId: req.user._id 
        });
        
        await Quiz.deleteMany({ 
            documentId: document._id, 
            userId: req.user._id 
        });
        
        // Delete document
        await document.deleteOne(); 
        
        res.status(200).json({
            success: true,
            message: 'Document and all associated content deleted successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in deleteDocument:', error);
        next(error);
    }   
};