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
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

/**
 * AI Agronomist & Plant Pathologist Diagnosis
 * Analyzes crop leaf/stem/fruit photos using Gemini 2.5 Flash
 */
export async function diagnoseCropHealth({ base64Image, cropType = '', notes = '' }) {
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY.');
  }

  const prompt = `You are an expert agricultural scientist, agronomist, and plant pathologist specialized in Indian and South Asian agricultural ecosystems.
Carefully examine this photograph of a crop, plant leaf, stem, or fruit to diagnose health status, pathogen attacks (fungal, bacterial, viral), pest infestations, nutrient deficiencies, or physiological abiotic stress.

Farmer context:
- Suspected/Registered Crop: ${cropType ? cropType : 'Not specified (identify accurately from image)'}
- Farmer observations: ${notes ? notes : 'None provided'}

Inspect for:
- Chlorosis, necrosis, leaf curling, spots, concentric rings, mosaic patterns, blight, rust, wilting, powdery growth, mildew, lesions.
- Insect feeding holes, larvae, mites, webbing, borers, aphids, thrips, or whiteflies.
- If the plant is completely healthy, confirm with high confidence.

Return ONLY a valid JSON object matching this exact schema:
{
  "crop_name": "Identified or confirmed crop (e.g. Tomato, Wheat, Cotton, Paddy, Potato, Soybean)",
  "health_status": "healthy" | "infected" | "pest_attack" | "nutrient_deficiency" | "unknown",
  "confidence_score": 92, // Integer percentage between 40 and 99
  "diagnosis_title": "Clear diagnostic title (e.g., 'Early Blight (Alternaria solani)' or 'Spodoptera litura (Armyworm) Infestation' or 'Nitrogen Deficiency' or 'Healthy Foliage')",
  "scientific_name": "Scientific name of pathogen/pest (e.g. 'Alternaria solani'), or 'N/A' if healthy/deficiency",
  "severity": "none" | "low" | "medium" | "high" | "critical",
  "urgency_message": "Immediate 1-sentence action advisory (e.g. 'Initiate foliar spray within 48 hours to prevent spread to adjacent crops.')",
  "symptoms": [
    "Observable visual symptom 1",
    "Observable visual symptom 2",
    "Observable visual symptom 3"
  ],
  "cause": "Concise explanation of the pathogen lifecycle, vector, soil condition, or weather triggers promoting this issue.",
  "treatments": {
    "organic": [
      "Bio-control or organic remedy with exact preparation/dosage (e.g. 'Neem Oil 1500 ppm @ 5ml/L with mild surfactant')",
      "Cultural or biological agent application (e.g. 'Trichoderma harzianum @ 5g/L foliar wash')"
    ],
    "chemical": [
      "CIBRC-approved chemical fungicide/pesticide with dosage (e.g. 'Mancozeb 75% WP @ 2.5g/L of water')",
      "Alternate chemical rotation spray to prevent resistance buildup"
    ],
    "preventive": [
      "Field management practice (e.g. 'Improve furrow drainage and avoid evening overhead irrigation')",
      "Sanitation and crop rotation advisory"
    ]
  }
}`;

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
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Crop health diagnosis failed: ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No diagnostic data returned from Kheti Doctor.');
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}
