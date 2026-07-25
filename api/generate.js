export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğuları dəstəklənir' });
  }

  try {
    const { base64Data, mimeType, pages, questions } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Fayl məlumatı çatışmır' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY Vercel tənzimləmələrində tapılmadı.' });
    }

    let promptText = "Bu sənəddəki riyazi sualları analiz et və çoxseçimli kviz yarat. ";
    if (pages) promptText += `Yalnız bu səhifələri analiz et: ${pages}. `;
    if (questions) promptText += `Yalnız bu sual nömrələrini analiz et: ${questions}. `;

    promptText += `
Nəticəni DƏQİQ aşağıdakı JSON formatında qaytar. Başqa heç bir əlavə mətn, izahat və ya markdown işarəsi (məsələn ```json) yazma, birbaşa array ilə başla:
[
  {
    "question": "Sualın mətni (LaTeX düsturlarını $düstur$ formatında yaz)",
    "options": ["A variantı", "B variantı", "C variantı", "D variantı"],
    "correctAnswer": 0
  }
]
QEYD: "correctAnswer" doğru cavabın 0-dan başlayan indeksidir (0=A, 1=B, 2=C, 3=D).
`;

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

    const url = `[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$){apiKey}`;
    
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Gemini API Xətası:", data);
      const errorMessage = data.error?.message || 'Gemini API cavab vermədi.';
      
      if (apiResponse.status === 429) {
        return res.status(429).json({ error: 'Çox sayda sorğu göndərildi (Limit aşımı). Zəhmət olmasa 1-2 dəqiqə gözləyin.' });
      }

      return res.status(apiResponse.status).json({ error: errorMessage });
    }

    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return res.status(500).json({ error: 'Gemini-dən cavab alınmadı.' });
    }

    // Əgər cavab blok içində gələrsə təmizləyirik
    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json({ text: generatedText });

  } catch (err) {
    console.error("Server Xətası:", err);
    return res.status(500).json({ error: 'Daxili server xətası: ' + err.message });
  }
}
