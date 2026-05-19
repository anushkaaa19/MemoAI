import mongoose from "mongoose";
const quizSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,     
    },
    documentId: {
        type: String,
        ref: 'Document',
        required: true,
    },
    title:{
        type: String,
        required: true, 
        trim: true,
    },
    questions:[{
        question:{
            type: String,
            required: true,
        },
        options:{
            type: [String],
            required: true, 
            validate:[array=>array.length===4,'Exactly 4 options are required'],
        },
        correctAnswer:{
            type: String,
            required: true,
        },
        explanation:{
            type: String,
            default:'',
        },
        difficulty:{
            type: String,
            enum:['easy','medium','hard'],
            default:'medium',
        },
    }],
    userAnswers:[{
        questionIndex:{
            type: Number,
            required: true,
        },
        selectedAnswer:{
            type: String,
            required: true,

        },
        isCorrect:{
            type: Boolean,
            default: false,
        },
        answeredAt:{
            type: Date,
            default: Date.now,
        },

    }],

    score:{
        type: Number,   
        default: 0,
    },
    totalQuestions:{    
        type: Number,
        required: true,
    },
    completedAt:{
        type: Date,
            default: null
    },
}, { timestamps: true });

quizSchema.index({ userId: 1, documentId: 1 }, { unique: true });
const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

