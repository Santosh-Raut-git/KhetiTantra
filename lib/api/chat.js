import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini({ apiKey, systemPrompt, history, message }) {
  const contents = [
    ...history
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    { role: 'user', parts: [{ text: message.trim() }] },
  ];

  const response = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from assistant');
  }
  return text;
}

export function useChatHistory() {
  return useQuery({
    queryKey: ['chat_history'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let { data: conversations, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (convError) throw new Error(convError.message);

      let conversationId = '';
      if (!conversations || conversations.length === 0) {
        const { data: newConv, error: newConvError } = await supabase
          .from('ai_conversations')
          .insert({ user_id: user.id, title: 'Main Chat' })
          .select()
          .single();
        if (newConvError) throw new Error(newConvError.message);
        if (newConv) conversationId = newConv.id;
      } else {
        conversationId = conversations[0].id;
      }

      if (!conversationId) return { conversationId: '', messages: [] };

      const { data: messages, error: msgError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (msgError) throw new Error(msgError.message);

      return {
        conversationId,
        messages: messages || [],
      };
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ message, conversationId, history }) => {
      const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
      if (!geminiApiKey) {
        throw new Error(
          'Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.',
        );
      }

      const { error: insertError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
        });
      if (insertError) {
        throw new Error(`Failed to save message: ${insertError.message}`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: crops } = await supabase
        .from('crops')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const isRetailer = profile?.role === 'retailer';

      let systemPrompt = '';
      if (isRetailer) {
        systemPrompt = `You are the KhetiTantra AI Assistant, an expert business analyst and agricultural supply chain advisor for Indian crop retailers.
User Profile (Retailer):
- Name: ${profile?.full_name || 'Retailer'}
- Location: ${profile?.village || 'Unknown Village'}, ${profile?.district || 'Unknown District'}

Rules:
1. Always be polite, professional, and focus on market trends, crop pricing, and supply chain logistics.
2. Provide practical, actionable business advice to help them source crops efficiently.
3. Use markdown formatting to make your responses readable (e.g., bullet points, bold text).
4. Do not offer financial or legal advice.
5. Keep responses concise but informative.
6. Language Matching: Reply in the EXACT language and script the user uses. If they use English, reply in English. If they use Hindi (Devanagari), reply in Hindi. CRITICALLY: If the user types in "Hinglish" (Hindi words written in the English alphabet/Roman script), you MUST reply in Hinglish. NEVER reply in Devanagari script if the user used Hinglish.`;
      } else {
        systemPrompt = `You are the KhetiTantra AI Assistant, an expert agronomist for Indian farmers.
User Profile:
- Name: ${profile?.full_name || 'Farmer'}
- Location: ${profile?.village || 'Unknown Village'}, ${profile?.district || 'Unknown District'}
- Total Land: ${profile?.land_area_acres || 'Unknown'} acres

Active Crops:
${
  crops
    ?.map(
      (c) =>
        `- ${c.crop_name} (${c.variety || 'Unknown variety'}) - ${c.area_acres} acres sown on ${c.sowing_date}`,
    )
    .join('\n') || 'No active crops.'
}`;

        systemPrompt += `\n\nRules:
1. Always be polite, encouraging, and highly specific to their location and active crops.
2. Provide practical, actionable farming advice.
3. Use markdown formatting to make your responses readable (e.g., bullet points, bold text).
4. Do not offer financial or legal advice.
5. Keep responses concise but informative.
6. Language Matching: Reply in the EXACT language and script the user uses. If they use English, reply in English. If they use Hindi (Devanagari), reply in Hindi. CRITICALLY: If the user types in "Hinglish" (Hindi words written in the English alphabet/Roman script), you MUST reply in Hinglish. NEVER reply in Devanagari script if the user used Hinglish.`;
      }

      const aiResponse = await callGemini({
        apiKey: geminiApiKey,
        systemPrompt,
        history,
        message,
      });

      const { error: aiInsertError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
        });
      if (aiInsertError) {
        console.warn('Failed to save assistant response:', aiInsertError.message);
      }

      return aiResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_history'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_history'] });
    },
  });
}
