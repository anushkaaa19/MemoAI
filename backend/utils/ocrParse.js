import Tesseract from 'tesseract.js';
import { fromPath } from 'pdf-to-img';
import fs from 'fs';
import path from 'path';

export const extractTextFromScannedPDF = async (filePath) => {
    try {
        console.log('OCR processing started for scanned PDF...');
        
        // Convert PDF pages to images
        const pdfToImg = await fromPath(filePath);
        let fullText = '';
        let pageNum = 1;
        
        // Process each page
        for await (const image of pdfToImg) {
            console.log(`Processing page ${pageNum}...`);
            
            // Run OCR on the image
            const { data: { text } } = await Tesseract.recognize(image, 'eng', {
                logger: (m) => console.log(m) // Optional: see progress
            });
            
            fullText += `\n--- Page ${pageNum} ---\n${text}\n`;
            pageNum++;
        }
        
        console.log(`OCR completed. Extracted ${fullText.length} characters`);
        
        return {
            text: fullText,
            numPages: pageNum - 1
        };
    } catch (error) {
        console.error('OCR error:', error);
        throw new Error('Failed to extract text from scanned PDF');
    }
};