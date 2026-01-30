import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { chunkText } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, pdf_text } = await req.json();

    if (!document_id || !pdf_text) {
      return NextResponse.json(
        { error: 'document_id and pdf_text are required' },
        { status: 400 }
      );
    }

    // Check if chunks already exist for this document
    const { data: existingChunks } = await supabase
      .from('document_chunks')
      .select('id')
      .eq('document_id', document_id)
      .limit(1);

    if (existingChunks && existingChunks.length > 0) {
      return NextResponse.json({ message: 'Chunks already exist', cached: true });
    }

    // Get user's OpenAI API key
    const { data: profileData } = await supabase
      .from('profiles')
      .select('openai_api_key_encrypted')
      .eq('id', user.id)
      .single();

    const profile = profileData as unknown as { openai_api_key_encrypted: string | null } | null;
    const apiKey = profile?.openai_api_key_encrypted;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your API key in Settings.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Chunk the PDF text
    const chunks = chunkText(pdf_text);

    // Generate embeddings in batches
    const BATCH_SIZE = 20;
    const chunksWithEmbeddings: Array<{
      document_id: string;
      user_id: string;
      chunk_index: number;
      content: string;
      embedding: number[];
      token_count: number;
    }> = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });

      for (let j = 0; j < batch.length; j++) {
        chunksWithEmbeddings.push({
          document_id,
          user_id: user.id,
          chunk_index: batch[j].chunkIndex,
          content: batch[j].content,
          embedding: embeddingResponse.data[j].embedding,
          token_count: batch[j].tokenCount,
        });
      }
    }

    // Insert chunks into database
    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(chunksWithEmbeddings as never[]);

    if (insertError) {
      console.error('Error inserting chunks:', insertError);
      return NextResponse.json(
        { error: 'Failed to store document chunks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Document indexed successfully',
      chunk_count: chunksWithEmbeddings.length,
    });
  } catch (error) {
    console.error('Embeddings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Search for relevant chunks
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, query, match_count = 5 } = await req.json();

    if (!document_id || !query) {
      return NextResponse.json(
        { error: 'document_id and query are required' },
        { status: 400 }
      );
    }

    // Get user's OpenAI API key
    const { data: profileData } = await supabase
      .from('profiles')
      .select('openai_api_key_encrypted')
      .eq('id', user.id)
      .single();

    const profile = profileData as unknown as { openai_api_key_encrypted: string | null } | null;
    const apiKey = profile?.openai_api_key_encrypted;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search for similar chunks using the database function
    const { data: chunks, error: searchError } = await supabase.rpc(
      'match_document_chunks' as never,
      {
        query_embedding: queryEmbedding,
        match_document_id: document_id,
        match_threshold: 0.5,
        match_count: match_count,
      } as never
    );

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ chunks: chunks || [] });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
