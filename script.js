let generatedQuiz = [];
let userAnswers = {};
let selectedFile = null;

const generateBtn = document.getElementById("generateBtn");
const submitBtn = document.getElementById("submitBtn");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
// Yeni input elementləri
const pagesInput = document.getElementById("pagesInput");
const questionsInput = document.getElementById("questionsInput");

const loading = document.getElementById("loading");
const quizContainer = document.getElementById("quizContainer");
const questionsDiv = document.getElementById("questions");
const resultDiv = document.getElementById("result");

// Modal elementləri
const previewModal = document.getElementById("previewModal");
const modalImage = document.getElementById("modalImage");
const modalPdf = document.getElementById("modalPdf");
const pdfDownloadLink = document.getElementById("pdfDownloadLink");
const closeModal = document.querySelector(".modal__close");

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

// --- DROP ZONE VƏ FAYL İDARƏSİ ---
dropZone.addEventListener("click", (e) => {
  // Əgər thumb elementinə kliklənibsə, file inputu açmırıq
  if (e.target.classList.contains('drop-zone__thumb')) return;
  fileInput.click();
});

fileInput.addEventListener("change", () => fileInput.files.length && updateThumbnail(dropZone, fileInput.files[0]));

["dragover", "dragleave", "dragend"].forEach(type => {
  dropZone.addEventListener(type, e => {
    e.preventDefault();
    type === "dragover" ? dropZone.classList.add("drop-zone--over") : dropZone.classList.remove("drop-zone--over");
  });
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drop-zone--over");
  if (e.dataTransfer.files.length) {
    const file = e.dataTransfer.files[0];
    if (["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
      fileInput.files = e.dataTransfer.files;
      updateThumbnail(dropZone, file);
    } else {
      alert("Yalnız PDF, PNG və JPG qəbul edilir.");
    }
  }
});

function updateThumbnail(dropZoneElement, file) {
  let thumb = dropZoneElement.querySelector(".drop-zone__thumb");
  if (dropZoneElement.querySelector(".drop-zone__prompt")) dropZoneElement.querySelector(".drop-zone__prompt").remove();
  if (!thumb) {
    thumb = document.createElement("div");
    thumb.className = "drop-zone__thumb";
    
    // YENİ: Thumb elementinə kliklənəndə modalı açırıq
    thumb.addEventListener("click", (e) => {
      e.stopPropagation(); // Drop-zonanın öz kliklənmə hadisəsini dayandırır
      openPreviewModal(file);
    });
    
    dropZoneElement.appendChild(thumb);
  }
  thumb.dataset.label = file.name;
  selectedFile = file;
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => thumb.style.backgroundImage = `url('${reader.result}')`;
  } else {
    thumb.style.backgroundImage = null;
    thumb.innerHTML = '<div style="font-size:40px;">📄</div>';
  }
}

// YENİ: Önizləmə modalını açan funksiya
function openPreviewModal(file) {
  previewModal.classList.remove("hidden");
  
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      modalImage.src = reader.result;
      modalImage.classList.remove("hidden");
      modalPdf.classList.add("hidden");
    };
  } else if (file.type === "application/pdf") {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      pdfDownloadLink.href = reader.result;
      modalImage.classList.add("hidden");
      modalPdf.classList.remove("hidden");
    };
  }
}

// Modal pəncərəsini bağlayan funksiyalar
closeModal.addEventListener("click", () => {
  previewModal.classList.add("hidden");
  modalImage.src = "";
});

window.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    previewModal.classList.add("hidden");
    modalImage.src = "";
  }
});

// --- KVİZ GENERASİYASI VƏ MATHJAX İNTEQRASİYASI ---
generateBtn.addEventListener("click", async () => {
  if (!selectedFile) return alert("Fayl seçin!");

  // İstifadəçinin daxil etdiyi parametrlər
  const selectedPages = pagesInput.value.trim();
  const selectedQuestions = questionsInput.value.trim();

  loading.classList.remove("hidden");
  quizContainer.classList.add("hidden");
  questionsDiv.innerHTML = "";
  resultDiv.innerHTML = "";
  userAnswers = {};

  try {
    const base64Data = await fileToBase64(selectedFile);
    
    // Vercel Serverless API-yə sorğu
    const response = await fetch('/api/generate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Data,
        mimeType: selectedFile.type,
        // Parametrləri API-yə göndəririk
        pages: selectedPages,
        questions: selectedQuestions
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Xəta baş verdi");

    // JSON təmizlənməsi
    let textRes = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
    generatedQuiz = JSON.parse(textRes);

    renderQuiz(generatedQuiz);
  } catch (error) {
    alert("Xəta: " + error.message);
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
    // Sual mətni LaTeX-də olacağı üçün h3 daxilinə qoyulur
    qBox.innerHTML = `<h3>${qIndex + 1}. ${q.question}</h3>`;
    
    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      // Variant mətni LaTeX-də olacağı üçün innerText olaraq təyin edilir
      btn.innerText = opt;
      btn.onclick = () => selectOption(qIndex, optIndex, btn);
      qBox.appendChild(btn);
    });
    questionsDiv.appendChild(qBox);
  });

  // VACİB: Suallar yükləndikdən sonra MathJax-ı yenidən işə salırıq ki, LaTeX-i düsturlara çevirsin
  if (window.MathJax) {
    MathJax.typesetPromise([questionsDiv]).catch((err) => console.log("MathJax Typeset Xətası:", err.message));
  }
}

function selectOption(qIndex, optIndex, btn) {
  userAnswers[qIndex] = optIndex;
  const parent = btn.parentElement;
  parent.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

submitBtn.addEventListener("click", () => {
  let score = 0;
  const qBoxes = questionsDiv.querySelectorAll(".question-box");
  generatedQuiz.forEach((q, qIndex) => {
    const selected = userAnswers[qIndex];
    const buttons = qBoxes[qIndex].querySelectorAll(".option-btn");
    
    buttons.forEach((btn, optIndex) => {
      if (optIndex === q.correctAnswer) btn.classList.add("correct");
      if (selected === optIndex && selected !== q.correctAnswer) btn.classList.add("wrong");
    });
    if (selected === q.correctAnswer) score++;
  });
  resultDiv.innerText = `Nəticə: ${score}/${generatedQuiz.length}`;
  
  // Nəticə hissəsində MathJax varsa yeniləyirik
  if (window.MathJax) MathJax.typesetPromise([resultDiv]);
});
