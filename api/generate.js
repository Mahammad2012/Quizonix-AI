export default async function handler(req, res) {
  // Yalnız POST sorğularını qəbul edirik
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğuları dəstəklənir' });
  }

  try {
    const { base64Data, mimeType, pages, questions } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Fayl məlumatı çatışmır' });
    }

    // API Key yoxlanışı (Vercel Environment Variable və ya kod daxilindən)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("XƏTA: GEMINI_API_KEY Vercel Environment Variables hissəsində tapılmadı.");
      return res.status(500).json({ error: 'API Açarı (GEMINI_API_KEY) Vercel tənzimləmələrində təyin olunmayıb.' });
    }

    // Təlimat promptunun hazırlanması
    let promptText = "Bu sənəddəki riyazi sualları analiz et və çoxseçimli kviz yarat. ";
    if (pages) promptText += `Yalnız bu səhifələri analiz et: ${pages}. `;
    if (questions) promptText += `Yalnız bu sual nömrələrini analiz et: ${questions}. `;

    promptText += `
Nəticəni DƏQİQ aşağıdakı JSON formatında qaytar. Başqa heç bir əlavə mətn və ya şərh yazma:
[
  {
    "question": "Sualın mətni (LaTeX düsturlarını $düstur$ formatında yaz)",
    "options": ["A variantı", "B variantı", "C variantı", "D variantı"],
    "correctAnswer": 0
  }
]
QEYD: "correctAnswer" doğru cavabın 0-dan başlayan indeksidir (0=A, 1=B, 2=C, 3=D).
`;

    // Google Gemini API-yə müraciət
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Gemini API Xətası:", JSON.stringify(data));
      return res.status(apiResponse.status).json({ 
        error: data.error?.message || 'Gemini API cavab vermədi.' 
      });
    }

    // Gemini-dən gələn cavabı götürürük
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return res.status(500).json({ error: 'Gemini-dən boş cavab gəldi' });
    }

    return res.status(200).json({ text: generatedText });

  } catch (err) {
    console.error("Serverless Function Xətası:", err);
    return res.status(500).json({ error: 'Daxili server xətası: ' + err.message });
  }
}
