import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const listModels = async () => {
    try {
        console.log('🔍 Fetching available models...\n');
        const response = await ai.models.list();
        
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response));
        
        // The models are likely in response.models or response.result
        const models = response.models || response.result || response;
        
        if (Array.isArray(models)) {
            console.log(`\n✅ Found ${models.length} models:\n`);
            
            models.forEach(model => {
                if (model.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`📌 ${model.name}`);
                }
            });
        } else {
            console.log('Full response:', JSON.stringify(response, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

listModels();