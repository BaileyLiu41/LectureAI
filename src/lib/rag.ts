// RAG utilities for chunking and embedding documents

const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

/**
 * Split text into overlapping chunks for embedding
 */
export function chunkText(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + CHUNK_SIZE;

    // Try to break at a sentence or paragraph boundary
    if (endIndex < text.length) {
      const searchText = text.slice(startIndex, endIndex + 100);
      const lastPeriod = searchText.lastIndexOf('. ');
      const lastNewline = searchText.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > CHUNK_SIZE * 0.5) {
        endIndex = startIndex + breakPoint + 1;
      }
    }

    const content = text.slice(startIndex, endIndex).trim();

    if (content.length > 0) {
      chunks.push({
        content,
        chunkIndex,
        tokenCount: estimateTokens(content),
      });
      chunkIndex++;
    }

    // Move start index with overlap
    startIndex = endIndex - CHUNK_OVERLAP;
    if (startIndex < 0) startIndex = endIndex;
  }

  return chunks;
}

/**
 * Rough token estimation (4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Format retrieved chunks for context
 */
export function formatChunksAsContext(
  chunks: Array<{ content: string; chunk_index: number; similarity: number }>
): string {
  if (chunks.length === 0) {
    return '';
  }

  // Sort by chunk index for coherent reading order
  const sorted = [...chunks].sort((a, b) => a.chunk_index - b.chunk_index);

  const contextParts = sorted.map(
    (chunk) => `[Section ${chunk.chunk_index + 1}]:\n${chunk.content}`
  );

  return `--- RELEVANT DOCUMENT SECTIONS ---\n\n${contextParts.join('\n\n---\n\n')}`;
}
