import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğuları dəstəklənir' });
  }

  try {
    const { base64Data, mimeType, pages, questions, fileName } = req.body;

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
Vacib: Cavabı YALNIZ və YALNIZ təmiz JSON formatında array şəklində qaytar. Heç bir izahat, şərh və ya əlavə mətn yazma.
Format dəqiq belə olmalıdır:
[
  {
    "question": "Sualın mətni",
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
        responseMimeType: "application/json",
        temperature: 0.2
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const errorMessage = data.error?.message || 'Gemini API cavab vermədi.';
      return res.status(apiResponse.status).json({ error: errorMessage });
    }

    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return res.status(500).json({ error: 'Gemini-dən cavab alınmadı.' });
    }

    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const firstBracket = generatedText.indexOf('[');
    const lastBracket = generatedText.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      generatedText = generatedText.substring(firstBracket, lastBracket + 1);
    }

    const parsedJson = JSON.parse(generatedText);

    // Testi Supabase bazasına qeyd edirik
    const { error: dbError } = await supabase
      .from('quizzes')
      .insert([
        { 
          title: fileName || "Adsız Test", 
          questions_data: parsedJson 
        }
      ]);

    if (dbError) {
      console.error("Supabase yazılma xətası:", dbError);
    }

    return res.status(200).json({ text: generatedText });

  } catch (err) {
    return res.status(500).json({ error: 'Daxili server xətası: ' + err.message });
  }
}
