export async function analyzeReceiptImage(base64Image) {
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured.');
  }
  const prompt = `Analyze this receipt and extract the details.
Return ONLY a JSON object with these exact keys:
{
  "type": "expense" or "income",
  "category": One of (Expense: Seeds, Fertilizer, Pesticides, Labor, Machinery, Irrigation, Other) OR (Income: Crop Sale, Byproduct Sale, Subsidy, Other),
  "amount": "numeric amount only without currency symbols",
  "transaction_date": "YYYY-MM-DD",
  "description": "brief summary"
}
If any field cannot be found, leave it empty or null.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    },
  );
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Image analysis failed: ${errText}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text returned from analysis');
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Analysis returned invalid JSON');
  }
}
