import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js"
import ChatHistory from '../models/ChatHistory.js'
import * as geminiService from '../utils/geminiService.js'
import { findRelevantChunks } from "../utils/textChunker.js";
export const generateFlashcards=async(req,res,next)=>{
    try{
        const {documentId,count=10} = req.body;
          
        const document=await Document.findOne({_id:documentId,userId:req.user._id});
        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found',
                statusCode:404
            });
        }
        const cards=await geminiService.generateFlashcards(document.extractedText,parseInt(count));
        const flashcardSet=await Flashcard.create({
            userId:req.user._id,
            documentId:document._id,
            cards:cards.map(card=>({
                question:card.question,
                answer:card.answer,
                difficulty:card.difficulty,
                reviewCount:0,
                isStarred:false
            }))
        });
        res.status(201).json({
            success:true,
            data:flashcardSet,
            message:'Flashcards generated successfully',
            statusCode:200      
        });
    }
        catch(error){   
        console.error('Error in generateFlashcards:',error);
        next(error);
    }
};
export const generateQuiz=async(req,res,next)=>{
    try{
        const {documentId,numQuestions=5,title}=req.body;
        if(!documentId){
            return res.status(400).json({
                success:false,
                error:'Document ID is required',
                statusCode:400
            });
        }
        const document=await Document.findOne({_id:documentId,userId:req.user._id,status:'ready'});
        if(!document){      
            return res.status(404).json({
                success:false,
                error:'Document not found or not ready',
                statusCode:404
            });
        }
        const questions=await geminiService.generateQuiz(document.extractedText,parseInt(numQuestions));
        
    }     catch(error){
        console.error('Error in generateQuiz:',error);
        next(error);
    }
};
export const generateSummary=async(req,res,next)=>{
    try{
        const documentId=req.params.documentId;
    }     catch(error){
        console.error('Error in generateSummary:',error);
        next(error);
    }   
};
export const chat= async(req,res,next)=>{
    try{
        const {message,documentId}=req.body;
        const document = await Document.findOne({_id: documentId, userId: req.user._id});
    }
    catch(error){
        console.error('Error in chat:',error);
        next(error);
    }
};
export const explainConcept= async(req,res,next)=>{
    try{

    }   catch(error){
        console.error('Error in explainConcept:',error);
        next(error);
    }   
};
export const getChatHistory= async(req,res,next)=>{
    try{

    }
    catch(error){
        console.error('Error in getChatHistory:',error);
        next(error);
    }
};