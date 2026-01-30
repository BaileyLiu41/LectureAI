import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Get user's API keys from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('openai_api_key_encrypted, gemini_api_key_encrypted')
      .eq('id', user.id)
      .single();

    const profile = profileData as unknown as { openai_api_key_encrypted: string | null; gemini_api_key_encrypted: string | null } | null;

    const body = await req.json();
    const {
      messages,
      model_provider,
      model_name,
      selected_text,
      screenshot_base64,
      page_number,
      rag_context,
    } = body;

    // Build context message if there's selected content
    let contextMessage = '';
    if (selected_text) {
      contextMessage = `\n\n[User selected this text from page ${page_number || 'unknown'}]: "${selected_text}"`;
    }
    if (screenshot_base64) {
      contextMessage += '\n\n[User attached a screenshot from the document]';
    }

    // Build system prompt for educational assistance
    let systemPrompt = `You are a helpful AI tutor assisting a student with understanding their lecture materials.
Be clear, concise, and educational in your explanations.
If the student selects text or shares a screenshot, focus your explanation on that specific content.
Use analogies and examples when helpful.
If you're explaining math or technical concepts, break them down step by step.`;

    // Add RAG context (relevant document sections) if available
    if (rag_context) {
      systemPrompt += `\n\n${rag_context}`;
    }

    if (model_provider === 'openai') {
      const apiKey = profile?.openai_api_key_encrypted;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured. Please add your API key in Settings.' },
          { status: 400 }
        );
      }

      const openai = new OpenAI({ apiKey });

      // Build messages array
      const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ];

      // Add context to the last user message
      if (contextMessage && openaiMessages.length > 1) {
        const lastMessage = openaiMessages[openaiMessages.length - 1];
        if (lastMessage.role === 'user') {
          lastMessage.content = lastMessage.content + contextMessage;
        }
      }

      // Handle screenshot with vision model
      if (screenshot_base64) {
        const lastMessage = openaiMessages[openaiMessages.length - 1];
        if (lastMessage.role === 'user') {
          openaiMessages[openaiMessages.length - 1] = {
            role: 'user',
            content: [
              { type: 'text', text: lastMessage.content as string },
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${screenshot_base64}` },
              },
            ],
          };
        }
      }

      // Stream response
      const stream = await openai.chat.completions.create({
        model: model_name || 'gpt-4o',
        messages: openaiMessages,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (model_provider === 'gemini') {
      const apiKey = profile?.gemini_api_key_encrypted;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Gemini API key not configured. Please add your API key in Settings.' },
          { status: 400 }
        );
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: model_name || 'gemini-1.5-pro' });

      // Build chat history - handle system messages by treating them as user context
      const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Add base system prompt first
      history.push({
        role: 'user',
        parts: [{ text: 'Please act as my tutor.' }],
      });
      history.push({
        role: 'model',
        parts: [{ text: systemPrompt }],
      });

      // Add conversation history (excluding the last message which will be sent separately)
      for (const msg of messages.slice(0, -1)) {
        if (msg.role === 'system') {
          // System messages (like PDF context) are added as user context
          history.push({
            role: 'user',
            parts: [{ text: msg.content }],
          });
          history.push({
            role: 'model',
            parts: [{ text: 'I understand. I will use this document content to help answer your questions.' }],
          });
        } else {
          history.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }

      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1].content + contextMessage;

      // Build parts with potential image
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: lastMessage },
      ];
      if (screenshot_base64) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: screenshot_base64,
          },
        });
      }

      const result = await chat.sendMessageStream(parts);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid model provider' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
