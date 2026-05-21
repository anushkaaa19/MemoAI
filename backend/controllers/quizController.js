import Quiz from "../models/Quiz.js";
import mongoose from 'mongoose';

// @desc    Get all quizzes for the user (no document filter)
// @route   GET /api/quizzes
// @access  Private
export const getQuizzes = async (req, res, next) => {
    try {
        const quizzes = await Quiz.find({ userId: req.user._id })
            .populate('documentId', 'title fileName')
            .sort({ createdAt: -1 });
        
        res.status(200).json({      
            success: true,
            count: quizzes.length,
            data: quizzes,
            statusCode: 200
        });
    } catch (error) {       
        console.error('Error in getQuizzes:', error);
        next(error);
    }   
};

// @desc    Get ALL quizzes by DOCUMENT ID (returns array)
// @route   GET /api/quizzes/:docId
// @access  Private
export const getQuizzesByDocumentId = async (req, res, next) => {
    try {
        const documentId = new mongoose.Types.ObjectId(req.params.docId);
        
        console.log('Looking for quizzes with documentId:', documentId);
        console.log('For userId:', req.user._id);
        
        const quizzes = await Quiz.find({ 
            documentId: documentId,
            userId: req.user._id 
        }).populate('documentId', 'title fileName').sort({ createdAt: -1 });
        
        console.log(`Found ${quizzes.length} quizzes for this document`);
        
        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No quizzes found for document: ${req.params.docId}`,
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes,
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in getQuizzesByDocumentId:', error);
        
        if (error instanceof mongoose.Error.CastError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid document ID format',
                statusCode: 400
            });
        }
        
        next(error);
    }
};

// @desc    Get SINGLE quiz by QUIZ ID (returns one object)
// @route   GET /api/quizzes/quiz/:id
// @access  Private
export const getSingleQuizById = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({ 
            _id: req.params.id,
            userId: req.user._id 
        }).populate('documentId', 'title fileName');
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: quiz,
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in getSingleQuizById:', error);
        next(error);
    }
};// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private
export const submitQuiz = async (req, res, next) => {
    try {
        const { answers } = req.body;    
        
        if (!Array.isArray(answers)) {
            return res.status(400).json({   
                success: false,
                error: 'Please provide answers array',
                statusCode: 400
            });
        }
        
        const quiz = await Quiz.findOne({ 
            _id: req.params.id,
            userId: req.user._id 
        });
        
        if (!quiz) {
            return res.status(404).json({   
                success: false,
                error: 'Quiz not found',
                statusCode: 400
            });
        }       
        
        if (quiz.completedAt) {
            return res.status(400).json({   
                success: false,
                error: 'Quiz already completed',
                statusCode: 400
            });
        }
        
        let correctCount = 0;
        const userAnswers = [];
        
        answers.forEach(answer => {
            const { questionIndex, selectedAnswer } = answer;
            if (questionIndex < quiz.questions.length) {
                const question = quiz.questions[questionIndex];
                
                // ✅ FIX: Get the correct answer text from options
                let correctAnswerText = "";
                if (question.correctAnswer === "Q1") correctAnswerText = question.options[0];
                else if (question.correctAnswer === "Q2") correctAnswerText = question.options[1];
                else if (question.correctAnswer === "Q3") correctAnswerText = question.options[2];
                else if (question.correctAnswer === "Q4") correctAnswerText = question.options[3];
                
                // Compare the selected answer text with the correct answer text
                const isCorrect = selectedAnswer === correctAnswerText;
                
                if (isCorrect) correctCount++;
                
                userAnswers.push({
                    questionIndex,
                    selectedAnswer,
                    isCorrect,
                    answeredAt: new Date()
                });
            }
        });
        
        const score = Math.round((correctCount / quiz.totalQuestions) * 100);
        
        quiz.userAnswers = userAnswers;
        quiz.score = score;
        quiz.completedAt = new Date();
        await quiz.save();
        
        res.status(200).json({
            success: true,
            data: {
                quizId: quiz._id,
                score,
                correctCount,
                totalQuestions: quiz.totalQuestions,
                percentage: score,
                userAnswers
            },
            message: 'Quiz submitted successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in submitQuiz:', error);
        next(error);
    }
};

// @desc    Get quiz results
// @route   GET /api/quizzes/:id/results
// @access  Private
export const getQuizResults = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({ 
            _id: req.params.id,  // Using QUIZ ID, not document ID
            userId: req.user._id 
        }).populate('documentId', 'title');
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            });
        }
        
        if (!quiz.completedAt) {
            return res.status(400).json({
                success: false,
                error: 'Quiz not completed yet',
                statusCode: 400
            });
        }
        
        const detailedResults = quiz.questions.map((question, index) => {
            const userAnswer = quiz.userAnswers.find(a => a.questionIndex === index);

            return {
                questionIndex: index,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                selectedAnswer: userAnswer?.selectedAnswer || null,
                isCorrect: userAnswer?.isCorrect || false,
                explanation: question.explanation
            };
        });

        res.status(200).json({
            success: true,
            data: {
                quiz: {
                    id: quiz._id,
                    title: quiz.title,
                    document: quiz.documentId,
                    score: quiz.score,
                    totalQuestions: quiz.totalQuestions,
                    completedAt: quiz.completedAt
                },
                results: detailedResults,
            },
            message: 'Quiz results retrieved successfully',
            statusCode: 200
        });
        
    } catch (error) {
        console.error('Error in getQuizResults:', error);
        next(error);
    }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
export const deleteQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOneAndDelete({
            _id: req.params.id,  // Using QUIZ ID, not document ID
            userId: req.user._id
        });
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error('Error in deleteQuiz:', error);
        next(error);
    }
};