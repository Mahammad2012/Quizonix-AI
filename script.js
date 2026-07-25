import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';

const supabase = createClient(supabaseUrl, supabaseKey);

const fetchQuizListBtn = document.getElementById("fetchQuizListBtn");
const quizListContainer = document.getElementById("quizListContainer");
const loadQuizByIdBtn = document.getElementById("loadQuizByIdBtn");
const quizIdInput = document.getElementById("quizIdInput");
const quizContainer = document.getElementById("quizContainer");
const loading = document.getElementById("loading");
const quizTitle = document.getElementById("quizTitle");
const questionBox = document.getElementById("questionBox");
const prevQuestionBtn = document.getElementById("prevQuestionBtn");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");

let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};

fetchQuizListBtn.addEventListener("click", async () => {
    quizListContainer.innerHTML = "<p class='loading'>Siyahı yüklənir...</p>";
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('id, title, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        quizListContainer.innerHTML = "";
        if (!data || data.length === 0) {
            quizListContainer.innerHTML = "<p style='color: #94a3b8; font-size: 13px;'>Hələ ki heç bir test yoxdur.</p>";
            return;
        }

        data.forEach(q => {
            const item = document.createElement("div");
            item.className = "quiz-list-item";
            item.innerHTML = `<span><b>#${q.id}</b> - ${q.title}</span> <span style="font-size: 11px; color: #94a3b8;">${new Date(q.created_at).toLocaleDateString()}</span>`;
            item.onclick = () => loadQuizFromDatabase(q.id);
            quizListContainer.appendChild(item);
        });
    } catch (err) {
        quizListContainer.innerHTML = `<p style='color: #ef4444; font-size: 13px;'>Xəta: ${err.message}</p>`;
    }
});

loadQuizByIdBtn.addEventListener("click", () => {
    const id = quizIdInput.value.trim();
    if (!id) return alert("Zəhmət olmasa Test ID daxil edin!");
    loadQuizFromDatabase(id);
});

async function loadQuizFromDatabase(quizId) {
    loading.classList.remove("hidden");
    quizContainer.classList.add("hidden");

    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('title, questions_data')
            .eq('id', quizId)
            .single();

        if (error || !data) throw new Error("Test tapılmadı.");

        quizTitle.textContent = data.title || `Test #${quizId}`;
        currentQuizData = data.questions_data;
        currentQuestionIndex = 0;
        userAnswers = {};

        renderQuestion();
        quizContainer.classList.remove("hidden");
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

    q.options.forEach((opt, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index ? "selected" : "";
        optionsHtml += `<button class="option-btn ${isSelected}" onclick="selectOption(${index})">${opt}</button>`;
    });

    questionBox.innerHTML = `
        <p style="margin-bottom: 10px; font-weight: 600; font-size: 14px; color: #a5b4fc;">Sual ${currentQuestionIndex + 1} / ${currentQuizData.length}</p>
        <p style="margin-bottom: 14px;">${q.question}</p>
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
    let correctCount = 0;
    currentQuizData.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctAnswer) {
            correctCount++;
        }
    });

    questionBox.innerHTML = `
        <div style="text-align: center; padding: 15px;">
            <h3>🎉 Test Tamamlandı!</h3>
            <p style="font-size: 16px; margin: 12px 0;">Nəticəniz: <b>${correctCount}</b> / ${currentQuizData.length}</p>
            <button class="btn primary-btn" onclick="location.reload()">Yeni Test Seç</button>
        </div>
    `;
    prevQuestionBtn.style.display = "none";
    nextQuestionBtn.style.display = "none";
}
