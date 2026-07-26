import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';

const supabase = createClient(supabaseUrl, supabaseKey);

const loadQuizByIdBtn = document.getElementById("loadQuizByIdBtn");
const quizIdInput = document.getElementById("quizIdInput");
const searchSection = document.getElementById("searchSection");
const quizContainer = document.getElementById("quizContainer");
const loading = document.getElementById("loading");
const quizTitle = document.getElementById("quizTitle");
const questionBox = document.getElementById("questionBox");
const prevQuestionBtn = document.getElementById("prevQuestionBtn");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");
const timerBox = document.getElementById("timerBox");
const timeLeftSpan = document.getElementById("timeLeft");

let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;

loadQuizByIdBtn.addEventListener("click", () => {
    const id = quizIdInput.value.trim();
    if (!id) return alert("Zəhmət olmasa Test ID daxil edin!");
    loadQuizFromDatabase(id);
});

async function loadQuizFromDatabase(quizId) {
    loading.classList.remove("hidden");

    try {
        // duration sütunundan asılılıq yaradılmaması üçün yalnız vacib sahələr çəkilir
        const { data, error } = await supabase
            .from('quizzes')
            .select('title, questions_data')
            .eq('id', quizId)
            .single();

        if (error || !data) throw new Error("Test tapılmadı.");

        quizTitle.textContent = data.title || `Test #${quizId}`;
        
        let parsedData = data.questions_data;
        if (typeof parsedData === 'string') {
            try { parsedData = JSON.parse(parsedData); } catch(e) {}
        }

        currentQuizData = Array.isArray(parsedData) ? parsedData : [];
        if (currentQuizData.length === 0) {
            throw new Error("Bu testdə suallar mövcud deyil.");
        }

        currentQuestionIndex = 0;
        userAnswers = {};

        // Axtarış panelini tamamilə gizlət, test ekranını aktivləşdir
        searchSection.classList.add("hidden");
        quizContainer.classList.remove("hidden");

        renderQuestion();
        timerBox.classList.add("hidden"); // Vaxt sütunu olmadığı üçün taymer gizli qalır

    } catch (err) {
        alert("Xəta: " + err.message);
    } finally {
        loading.classList.add("hidden");
    }
}

function renderQuestion() {
    if (!currentQuizData || currentQuizData.length === 0) return;

    const q = currentQuizData[currentQuestionIndex];
    let optionsHtml = "";

    const rawOptions = q.options || q.choices || q.variants || [];
    const options = Array.isArray(rawOptions) ? rawOptions : [];

    options.forEach((opt, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index ? "selected" : "";
        optionsHtml += `<button class="option-btn ${isSelected}" onclick="selectOption(${index})">${opt}</button>`;
    });

    const questionText = q.question || q.text || q.prompt || q.title || (typeof q === 'string' ? q : null);

    questionBox.innerHTML = `
        <p style="margin-bottom: 10px; font-weight: 600; font-size: 14px; color: #d8b4fe;">Sual ${currentQuestionIndex + 1} / ${currentQuizData.length}</p>
        <p style="margin-bottom: 14px;">${questionText || ""}</p>
        ${optionsHtml}
    `;

    prevQuestionBtn.style.display = currentQuestionIndex === 0 ? "none" : "block";
    nextQuestionBtn.textContent = currentQuestionIndex === currentQuizData.length - 1 ? "Bitir" : "Növbəti";
}

window.selectOption = function(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    renderQuestion();
};

nextQuestionBtn.addEventListener("click", () => {
    if (currentQuestionIndex < currentQuizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        showResults();
    }
});

prevQuestionBtn.addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
});

function showResults() {
    if (timerInterval) clearInterval(timerInterval);

    let correctCount = 0;
    let details = [];

    currentQuizData.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        const isCorrect = userAns === q.correctAnswer;
        if (isCorrect) correctCount++;

        details.push({
            questionIndex: idx + 1,
            userAnswer: userAns !== undefined ? q.options[userAns] : "Cavablanmayıb",
            isCorrect: isCorrect
        });
    });

    // Nəticələrin Android tətbiqə ötürülməsi
    const resultPayload = {
        score: correctCount,
        total: currentQuizData.length,
        details: details
    };

    if (window.AndroidBridge && typeof window.AndroidBridge.onQuizFinished === 'function') {
        window.AndroidBridge.onQuizFinished(JSON.stringify(resultPayload));
    }

    questionBox.innerHTML = `
        <div style="text-align: center; padding: 15px;">
            <h3>🎉 Test Tamamlandı!</h3>
            <p style="font-size: 16px; margin: 12px 0;">Nəticəniz: <b>${correctCount}</b> / ${currentQuizData.length}</p>
            <button class="btn primary-btn" onclick="location.reload()">Yeni Testə Başla</button>
        </div>
    `;
    prevQuestionBtn.style.display = "none";
    nextQuestionBtn.style.display = "none";
    timerBox.classList.add("hidden");
}
