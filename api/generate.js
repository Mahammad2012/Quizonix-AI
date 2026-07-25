export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST sorğusu qəbul edilir' });
  }

  const { base64Data, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API açarı təyin edilməyib!' });
  }

  const promptText = `Aşağıdakı faylı təhlil et və onun məzmununa uyğun 3 ədəd çoxseçimli sual yarat. 
  CAVABI MÜTLƏQ YALNIZ aşağıdakı JSON formatında ver, başqa heç bir söz və ya markdown yazma:
  [
    {
      "id": 0,
      "question": "Sual mətni",
      "options": ["A variantı", "B variantı", "C variantı", "D variantı"],
      "correctAnswer": 0
    }
  ]`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
