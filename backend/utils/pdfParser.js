import fs from 'fs';
import pdf from 'pdf-parse-fixed';

export const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        // Check if text was actually extracted
        const extractedText = data.text || '';
        
        // If less than 100 characters extracted, it's likely a scanned PDF
        if (extractedText.trim().length < 100) {
            console.warn('⚠️ Low text extraction - PDF may be scanned. Trying OCR...');
            
            // Dynamic import OCR only when needed
            try {
                const { extractTextFromScannedPDF } = await import('./ocrParser.js');
                const ocrResult = await extractTextFromScannedPDF(filePath);
                
                return {
                    text: ocrResult.text,
                    numPages: ocrResult.numPages,
                    info: data.info,
                    isScanned: true
                };
            } catch (ocrError) {
                console.error('OCR failed:', ocrError);
                return {
                    text: extractedText,
                    numPages: data.numpages,
                    info: data.info,
                    isScanned: false,
                    warning: 'PDF may be scanned - low text extraction'
                };
            }
        }
        
        console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
        
        return {
            text: extractedText,
            numPages: data.numpages,
            info: data.info,
            isScanned: false
        };
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};