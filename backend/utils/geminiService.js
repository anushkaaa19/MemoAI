import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Check API key
if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error('❌ GOOGLE_GENAI_API_KEY is not set in .env file');
    console.error('Please get an API key from: https://aistudio.google.com/');
}

// Initialize AI client
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// CORRECT model names from your available models list
const MODELS = [
    'models/gemini-2.5-flash',           // Best balance of speed and quality
    'models/gemini-2.0-flash',           // Fast and versatile
    'models/gemini-2.5-flash-lite',      // Lightweight version
    'models/gemini-2.0-flash-lite',      // Fastest, most affordable
    'models/gemini-flash-latest',        // Latest flash model
];

// Retry helper function
const callWithRetry = async (prompt, maxRetries = 2) => {
    let lastError = null;
    
    for (const model of MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`🔄 Trying model: ${model} (attempt ${attempt + 1}/${maxRetries})`);
                
                const response = await ai.models.generateContent({
                    model: model,
                    contents: prompt,
                });
                
                console.log(`✅ Success with model: ${model}`);
                return response;
                
            } catch (error) {
                lastError = error;
                console.log(`❌ Failed with model ${model}: ${error.message?.substring(0, 100)}`);
                
                // Don't retry on 404 - model not found, try next model
                if (error.message?.includes('404') || error.message?.includes('not found')) {
                    break;
                }
                
                // Retry on rate limit
                if (error.message?.includes('429') && attempt < maxRetries - 1) {
                    const waitTime = 2000;
                    console.log(`⚠️ Rate limited, retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
            }
        }
    }
    
    throw new Error(`All models failed. Last error: ${lastError?.message}`);
};

export const generateFlashcards = async (text, count = 10) => {
    try {
        console.log(`📝 Generating ${count} flashcards...`);
        
        const prompt = `Generate exactly ${count} educational flashcards from the following text.
        Format each flashcard as:
        Q: [Clear, specific question]
        A: [Concise, accurate answer]
        D: [Difficulty level: easy, medium, or hard]
        Separate flashcards with "---"
        
        Text:
        ${text.substring(0, 8000)}`;
        
        const response = await callWithRetry(prompt);
        
        const generatedText = response.text;
        
        if (!generatedText) {
            throw new Error('No response text from Gemini');
        }
        
        const flashcards = [];
        const cards = generatedText.split('---').filter(c => c.trim());
        
        for (const card of cards) {
            const lines = card.trim().split('\n');
            let question = '', answer = '', difficulty = 'medium';
            
            for (const line of lines) {
                if (line.startsWith('Q:')) {
                    question = line.substring(2).trim();
                } else if (line.startsWith('A:')) {
                    answer = line.substring(2).trim();
                } else if (line.startsWith('D:')) {
                    const diff = line.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }
            
            if (question && answer) {
                flashcards.push({ question, answer, difficulty });
            }
        }
        
        if (flashcards.length === 0) {
            throw new Error('No valid flashcards generated');
        }
        
        console.log(`✅ Generated ${flashcards.length} flashcards`);
        return flashcards.slice(0, count);
        
    } catch (error) {
        console.error('❌ Error in generateFlashcards:', error.message);
        throw new Error(`Failed to generate flashcards: ${error.message}`);
    }
};

export const generateQuiz = async (text, numQuestions = 5) => {
    try {
        console.log(`📝 Generating ${numQuestions} quiz questions...`);
        
        const prompt = `Generate exactly ${numQuestions} multiple-choice questions from the following text.
        Format each question as:
        Q: [Question]
        Q1: [Option 1]
        Q2: [Option 2]
        Q3: [Option 3]
        Q4: [Option 4]
        C: [Correct option number - must be Q1, Q2, Q3, or Q4]
        E: [Brief explanation of the correct answer]
        D: [Difficulty level: easy, medium, or hard]
        Separate questions with "---"
        
        Text:
        ${text.substring(0, 8000)}`;
        
        const response = await callWithRetry(prompt);
        const generatedText = response.text;
        
        const quiz = [];
        const questionBlocks = generatedText.split('---').filter(q => q.trim());
        
        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');
            let question = '', options = [], correctAnswer = '', explanation = '', difficulty = 'medium';
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                } else if (trimmed.match(/^Q\d+:/)) {
                    const optionText = trimmed.substring(3).trim();
                    options.push(optionText);
                } else if (trimmed.startsWith('C:')) {
                    correctAnswer = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('E:')) {
                    explanation = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }
            
            if (question && options.length === 4 && correctAnswer) {
                quiz.push({ question, options, correctAnswer, explanation, difficulty });
            }
        }
        
        console.log(`✅ Generated ${quiz.length} quiz questions`);
        return quiz.slice(0, numQuestions);
        
    } catch (error) {
        console.error('❌ Error in generateQuiz:', error);
        throw new Error(`Failed to generate quiz: ${error.message}`);
    }
};

export const generateSummary = async (text) => {
    try {
        console.log('📝 Generating summary...');
        
        const prompt = `Provide a concise summary of the following text, highlighting the key concepts and main ideas. Keep the summary clear and structured.
        
        Text:
        ${text.substring(0, 8000)}`;
        
        const response = await callWithRetry(prompt);
        
        console.log('✅ Summary generated');
        return response.text;
        
    } catch (error) {
        console.error('❌ Error in generateSummary:', error);
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
};

export const chatWithContext = async (question, chunks) => {
    try {
        const context = chunks.map((c, i) => `[Chunk ${i + 1}]:\n${c.content}`).join('\n\n');
        
        const prompt = `Based on the following context from a document, answer the user's question. If the answer is not found in the context, say "I don't have enough information to answer that question based on the document."
        
        Context:
        ${context.substring(0, 12000)}
        
        Question: ${question}
        
        Answer:`;
        
        const response = await callWithRetry(prompt);
        
        return response.text.trim();
        
    } catch (error) {
        console.error('❌ Error in chatWithContext:', error);
        throw new Error(`Failed to generate answer: ${error.message}`);
    }
};

export const explainConceptWithContext = async (concept, context = '') => {
    try {
        console.log(`📝 Explaining concept: ${concept}`);
        
        let prompt = `Explain the concept of "${concept}" in simple terms.
        Provide a clear and concise explanation suitable for someone learning for the first time.
        Include examples if relevant.`;
        
        if (context) {
            prompt = `Based on the following context, explain the concept of "${concept}".
            
            Context:
            ${context.substring(0, 5000)}
            
            Explanation:`;
        }
        
        const response = await callWithRetry(prompt);
        
        console.log('✅ Concept explained');
        return response.text.trim();
        
    } catch (error) {
        console.error('❌ Error in explainConceptWithContext:', error);
        throw new Error(`Failed to explain concept: ${error.message}`);
    }
};

// Helper function to list available models (for debugging)
export const listAvailableModels = async () => {
    try {
        const response = await ai.models.list();
        const models = response.pageInternal || [];
        
        console.log('📋 Available models for generateContent:\n');
        models.forEach(model => {
            if (model.supportedActions?.includes('generateContent')) {
                console.log(`  ✅ ${model.name}`);
                console.log(`     ${model.description?.substring(0, 80)}...\n`);
            }
        });
        return models;
    } catch (error) {
        console.error('Error listing models:', error);
    }
};