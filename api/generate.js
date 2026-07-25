export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnız POST qəbul edilir' });
  }

  // Frontend-dən gələn parametrlər
  const { base64Data, mimeType, pages, questions } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API açarı tapılmadı (GEMINI_API_KEY env variable təyin edilməyib)' });
  }

  // İstifadıçinin daxil etdiyi parametrlərə əsasən prompt-u tənzimləyirik
  let constraintText = "";
  if (pages) {
    constraintText += `YALNIZ bu səhifələri analiz et: ${pages}. `;
  }
  if (questions) {
    constraintText += `YALNIZ bu nömrəli sualları tap və kviz halına gətir: ${questions}. `;
  }
  
  // Əgər heç bir parametr daxil edilməyibsə, avtomatik suallar yaradacaq
  if (!questions) {
    constraintText += "Fayldakı riyazi suallardan/mövzulardan avtomatik 3 ədəd maraqlı kviz sualı yarat. ";
  }

  // RİYAZİYYAT VƏ LATEX FOKUSLU PROMPT
  const promptText = `Sən peşəkar bir riyaziyyat müəllimisən.
Aşağıdakı faylı (mətn və ya şəkil) analiz et.
Təlimat: ${constraintText}

Tələblər:
1. Tapşırılan sualları və ya mövzunu əhatə edən çoxseçimli (A, B, C, D) kviz sualları yarat.
2. MÜTLƏQ: Bütün riyazi simvollar, düsturlar, fiqurların işarələri (inteqral, kəsr, kök, üçbucaq, kvadrat, pi, dərəcə və s.) LaTeX formatında yazılmalıdır (məsələn: $\int_0^1 x dx$, $\frac{a}{b}$, $\sqrt{x}$, $\triangle ABC$).
3. Suallar dəqiq və aydın olmalıdır.
4. Cavabı MÜTLƏQ YALNIZ aşağıdakı JSON formatında ver, başqa heç bir mətn yazma:
[
  {
    "id": 0,
    "question": "Sual mətni (riyazi düsturlar LaTeX-də $...$ arasında)",
    "options": ["LaTeX formatlı A", "LaTeX formatlı B", "LaTeX formatlı C", "LaTeX formatlı D"],
    "correctAnswer": 0
  }
]`;

  try {
    // Gemini API-yə müraciət
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

    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      console.error("Gemini API Xətası (Response daxilində mətn yoxdur):", data);
      return res.status(500).json({ error: "Gemini API cavab qaytarmadı." });
    }

    const text = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text });

  } catch (error) {
    console.error("Server Xətası:", error);
    return res.status(500).json({ error: "Serverdə daxili xəta baş verdi: " + error.message });
  }
}
