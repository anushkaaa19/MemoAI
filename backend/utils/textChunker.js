 /**
 * Split text into chunks for better AI processing
 * @param {string} text - Full text to chunk
 * @param {number} chunkSize - Target size per chunk (in words)
 * @param {number} overlap - Number of words to overlap between chunks
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number}>}
 */
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
    if (!text || !text.trim().length === 0) {
        return [];
    }

    // Clean the text - replace all newlines with spaces
    const cleanedText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Split into words
    const words = cleanedText.split(' ');
    
    console.log(`📝 Total words: ${words.length}, Chunk size: ${chunkSize}, Overlap: ${overlap}`);
    
    // If document is smaller than chunk size, return single chunk
    if (words.length <= chunkSize) {
        return [{
            content: cleanedText,
            chunkIndex: 0,
            pageNumber: 0
        }];
    }
    
    // Create chunks with overlap
    const chunks = [];
    let startIndex = 0;
    let chunkIndex = 0;
    
    while (startIndex < words.length) {
        const endIndex = Math.min(startIndex + chunkSize, words.length);
        const chunkWords = words.slice(startIndex, endIndex);
        
        chunks.push({
            content: chunkWords.join(' '),
            chunkIndex: chunkIndex++,
            pageNumber: 0
        });
        
        // Move start index forward, accounting for overlap
        startIndex += (chunkSize - overlap);
        
        console.log(`✅ Created chunk ${chunkIndex - 1}: words ${startIndex - (chunkSize - overlap)} to ${endIndex}`);
    }
    
    console.log(`📦 Total chunks created: ${chunks.length}`);
    return chunks;
};

/**
 * Find relevant chunks based on keyword matching
 * @param {Array<Object>} chunks - Array of chunks
 * @param {string} query - Search query
 * @param {number} maxChunks - Maximum chunks to return
 * @returns {Array<Object>}
 */
export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
    if (!chunks || chunks.length === 0 || !query) {
        return [];
    }

    // Common stop words to exclude
    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that', 'it',
        'from', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
        'had', 'having', 'do', 'does', 'did', 'doing', 'not'
    ]);

    // Extract and clean query words
    const queryWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    // If no meaningful query words, return first chunks
    if (queryWords.length === 0) {
        return chunks.slice(0, maxChunks).map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber || 0,
            _id: chunk._id
        }));
    }

    // Score each chunk
    const scoredChunks = chunks.map((chunk, index) => {
        const content = chunk.content.toLowerCase();
        const contentWords = content.split(/\s+/).length;
        let score = 0;

        // Score each query word
        for (const word of queryWords) {
            // Exact word match (higher score)
            const exactMatches = (content.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
            score += exactMatches* 3;

            // Partial match (lower score)
            const partialMatches = (content.match(new RegExp(word, 'g')) || []).length;
            score += Math.max(0, partialMatches - exactMatches) * 1.5;
        }

        // Bonus: Multiple query words found in the same chunk
        const uniqueWordsFound = queryWords.filter(word => 
            content.includes(word)
        ).length;
        
        if (uniqueWordsFound > 1) {
            score += uniqueWordsFound * 2;
        }

        // Normalize by content length to avoid bias towards longer chunks
        const normalizedScore = score / Math.sqrt(contentWords);
        
        // Small bonus for earlier chunks (position bias)
        const positionBonus = 1 - (index / chunks.length) * 0.1;

        return {
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber || 0,
            _id: chunk._id,
            score: normalizedScore * positionBonus,
            rawScore: score,
            matchedWords: uniqueWordsFound,
        };
    });

    // Filter, sort, and return top chunks
    return scoredChunks
        .filter(chunk => chunk.score > 0)
        .sort((a, b) => {
            // Sort by score (highest first)
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // If scores are equal, sort by matched words count
            if (b.matchedWords !== a.matchedWords) {
                return b.matchedWords - a.matchedWords;
            }
            // Finally, sort by chunk index
            return a.chunkIndex - b.chunkIndex;
        })
        .slice(0, maxChunks);
};
