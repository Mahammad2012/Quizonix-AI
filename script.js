// 🔑 BURAYA MÜTLƏQ ÖZ GEMINI API AÇARINIZI DAXİL EDİN
const GEMINI_API_KEY = "";

let generatedQuiz = [];
let userAnswers = {};

const generateBtn = document.getElementById("generateBtn");
const submitBtn = document.getElementById("submitBtn");
const fileInput = document.getElementById("fileInput");
const loading = document.getElementById("loading");
const quizContainer = document.getElementById("quizContainer");
const questionsDiv = document.getElementById("questions");
const resultDiv = document.getElementById("result");

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

generateBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) return alert("Zəhmət olmasa bir fayl seçin!");

  loading.classList.remove("hidden");
  quizContainer.classList.add("hidden");
  questionsDiv.innerHTML = "";
  resultDiv.innerHTML = "";
  userAnswers = {};

  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || "image/png";

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
    let textResponse = data.candidates[0].content.parts[0].text;
    
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    generatedQuiz = JSON.parse(textResponse);

    renderQuiz(generatedQuiz);
  } catch (error) {
    alert("Xəta baş verdi: " + error.message);
  } finally {
    loading.classList.add("hidden");
  }
});

function renderQuiz(quiz) {
  quizContainer.classList.remove("hidden");
  questionsDiv.innerHTML = "";

  quiz.forEach((q, qIndex) => {
    const qBox = document.createElement("div");
    qBox.className = "question-box";
    qBox.innerHTML = `<h3>${qIndex + 1}. ${q.question}</h3>`;

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerText = opt;
      btn.onclick = () => selectOption(qIndex, optIndex, btn);
      qBox.appendChild(btn);
    });

    questionsDiv.appendChild(qBox);
  });
}

function selectOption(qIndex, optIndex, btn) {
  userAnswers[qIndex] = optIndex;
  const parent = btn.parentElement;
  const buttons = parent.querySelectorAll(".option-btn");
  buttons.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

submitBtn.addEventListener("click", () => {
  let score = 0;
  const qBoxes = questionsDiv.querySelectorAll(".question-box");

  generatedQuiz.forEach((q, qIndex) => {
    const selected = userAnswers[qIndex];
    const buttons = qBoxes[qIndex].querySelectorAll(".option-btn");

    buttons.forEach((btn, optIndex) => {
      if (optIndex === q.correctAnswer) {
        btn.classList.add("correct");
      }
      if (selected === optIndex && selected !== q.correctAnswer) {
        btn.classList.add("wrong");
      }
    });

    if (selected === q.correctAnswer) {
      score++;
    }
  });

  resultDiv.innerText = `Nəticə: ${generatedQuiz.length} sualdan ${score} doğru cavab!`;
});
